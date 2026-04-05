/**
 * W4-05: サブコミュニティへのメンバーシップ自動伝播ヘルパー
 *
 * - 親コミュニティの join/leave/role 変更を子コミュニティへ自動的に反映する
 * - MAX_DEPTH=1 前提（1階層のみ）
 */
import { IIdGenerator } from '@/domains/_sharedDomains/domain/service/IIdGenerator.js'
import { UserId } from '@/domains/_sharedDomains/model/valueObject/UserId.js'
import { CommunityId } from '@/domains/community/domain/model/valueObject/CommunityId.js'
import type { ICommunityRepository } from '@/domains/community/domain/repository/ICommunityRepository.js'
import { CommunityMembership } from '@/domains/community/membership/domain/model/entity/CommunityMembership.js'
import { MembershipId } from '@/domains/community/membership/domain/model/valueObject/MembershipId.js'
import { MembershipRole } from '@/domains/community/membership/domain/model/valueObject/MembershipRole.js'
import type { ICommunityMembershipRepository } from '@/domains/community/membership/domain/repository/ICommunityMembershipRepository.js'

type PropagationRepos = {
    community: ICommunityRepository
    membership: ICommunityMembershipRepository
}

/**
 * 親コミュニティへの参加時、子コミュニティにもメンバーシップを自動作成する
 */
export async function propagateJoinToChildren(
    repos: PropagationRepos,
    idGenerator: IIdGenerator,
    parentCommunityId: string,
    userId: string,
    role: MembershipRole,
): Promise<void> {
    const childrenIds = await repos.community.findChildrenIds(parentCommunityId)
    for (const childId of childrenIds) {
        const existing = await repos.membership.findByCommunityAndUser(childId, userId)
        if (existing && existing.isActive()) continue // 既にアクティブなら skip
        const membership = CommunityMembership.create({
            id: MembershipId.create(idGenerator.generate()),
            communityId: CommunityId.create(childId),
            userId: UserId.create(userId),
            role,
        })
        await repos.membership.save(membership)
    }
}

/**
 * 親コミュニティからの脱退時、子コミュニティからも脱退させる
 * ※ 子コミュニティの OWNER は脱退させない（安全装置）
 */
export async function propagateLeaveToChildren(
    repos: PropagationRepos,
    parentCommunityId: string,
    userId: string,
): Promise<void> {
    const childrenIds = await repos.community.findChildrenIds(parentCommunityId)
    for (const childId of childrenIds) {
        const membership = await repos.membership.findByCommunityAndUser(childId, userId)
        if (membership && membership.isActive() && !membership.getRole().isOwner()) {
            membership.leave()
            await repos.membership.save(membership)
        }
    }
}

/**
 * OWNER 委譲を子コミュニティにも伝播する
 * - 旧 OWNER → ADMIN に降格
 * - 新 OWNER → OWNER に昇格（存在しなければ作成）
 */
export async function propagateOwnerTransferToChildren(
    repos: PropagationRepos,
    idGenerator: IIdGenerator,
    parentCommunityId: string,
    oldOwnerId: string,
    newOwnerId: string,
): Promise<void> {
    const childrenIds = await repos.community.findChildrenIds(parentCommunityId)
    for (const childId of childrenIds) {
        // 旧 OWNER → ADMIN
        const oldOwnerMembership = await repos.membership.findByCommunityAndUser(childId, oldOwnerId)
        if (oldOwnerMembership && oldOwnerMembership.isActive() && oldOwnerMembership.getRole().isOwner()) {
            oldOwnerMembership.changeRole(MembershipRole.admin())
            await repos.membership.save(oldOwnerMembership)
        }

        // 新 OWNER → OWNER（存在しなければ作成）
        const newOwnerMembership = await repos.membership.findByCommunityAndUser(childId, newOwnerId)
        if (newOwnerMembership && newOwnerMembership.isActive()) {
            newOwnerMembership.changeRole(MembershipRole.owner())
            await repos.membership.save(newOwnerMembership)
        } else {
            const membership = CommunityMembership.create({
                id: MembershipId.create(idGenerator.generate()),
                communityId: CommunityId.create(childId),
                userId: UserId.create(newOwnerId),
                role: MembershipRole.owner(),
            })
            await repos.membership.save(membership)
        }
    }
}

/**
 * ロール変更を子コミュニティにも伝播する（ADMIN 同期用）
 */
export async function propagateRoleChangeToChildren(
    repos: PropagationRepos,
    parentCommunityId: string,
    userId: string,
    newRole: MembershipRole,
): Promise<void> {
    const childrenIds = await repos.community.findChildrenIds(parentCommunityId)
    for (const childId of childrenIds) {
        const membership = await repos.membership.findByCommunityAndUser(childId, userId)
        if (membership && membership.isActive()) {
            membership.changeRole(newRole)
            await repos.membership.save(membership)
        }
    }
}

/**
 * サブコミュニティ作成時、指定された mode に基づいて親メンバーを子にコピーする
 *
 * - ALL: 親の全アクティブメンバーをコピー
 * - ADMIN_AND_ABOVE: OWNER/ADMIN のみコピー（デフォルト）
 * - OWNER_ONLY: コピーなし（作成者が既に OWNER として追加済み）
 * - SELECT: selectedMemberIds で指定されたメンバーのみコピー
 *
 * ※ 作成者（excludeUserId）は既に OWNER としてコピー済みなのでスキップ
 */
export type MemberInheritanceMode = 'ALL' | 'SELECT' | 'OWNER_ONLY' | 'ADMIN_AND_ABOVE'

export async function copyParentMembersToChild(
    repos: PropagationRepos,
    idGenerator: IIdGenerator,
    parentCommunityId: string,
    childCommunityId: string,
    excludeUserId: string,
    mode: MemberInheritanceMode = 'ADMIN_AND_ABOVE',
    selectedMemberIds?: string[],
): Promise<void> {
    // OWNER_ONLY: 作成者のみ（既に追加済み）→何もしない
    if (mode === 'OWNER_ONLY') return

    const parentMembers = await repos.membership.findsByCommunityId(parentCommunityId)
    const selectedSet = mode === 'SELECT' && selectedMemberIds
        ? new Set(selectedMemberIds)
        : null

    for (const pm of parentMembers) {
        if (!pm.isActive()) continue
        if (pm.getUserId().getValue() === excludeUserId) continue // 作成者は既に追加済み

        // mode に基づくフィルタリング
        if (mode === 'ADMIN_AND_ABOVE' && !pm.getRole().canManageMembers()) continue
        if (mode === 'SELECT' && selectedSet && !selectedSet.has(pm.getUserId().getValue())) continue

        // ロールの決定: OWNER→OWNER, ADMIN→ADMIN, MEMBER→MEMBER
        const role = pm.getRole().isOwner()
            ? MembershipRole.owner()
            : pm.getRole().isAdmin()
                ? MembershipRole.admin()
                : MembershipRole.member()

        const membership = CommunityMembership.create({
            id: MembershipId.create(idGenerator.generate()),
            communityId: CommunityId.create(childCommunityId),
            userId: pm.getUserId(),
            role,
        })
        await repos.membership.save(membership)
    }
}
