import { useAuth } from '@/app/providers/AuthProvider'
import { communityApi } from '@/features/community/api/communityApi'
import { useCommunity, useMembers, useUpdateCommunity } from '@/features/community/hooks/useCommunityQueries'
import { useAuditLogs, useChangeMemberRole, useRemoveMember } from '@/features/community/hooks/useCommunitySettingsQueries'
import { WebhookSettings } from '@/features/webhook/components/WebhookSettings'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { uploadFile } from '@/shared/lib/uploadClient'
import { useMutation } from '@tanstack/react-query'
import {
    Camera,
    ChevronDown,
    ChevronRight,
    Copy,
    CreditCard,
    Crown,
    ExternalLink,
    History,
    Link2,
    Shield,
    UserMinus,
    Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

type Section = 'profile' | 'payment' | 'invite' | 'members' | 'audit' | 'webhook'

export default function CommunitySettingsPage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { user: authUser } = useAuth()
    const { data: community, isLoading } = useCommunity(communityId!)
    const { data: membersData } = useMembers(communityId!)
    const { data: auditData } = useAuditLogs(communityId!)
    const updateCommunity = useUpdateCommunity(communityId!)
    const changeRole = useChangeMemberRole(communityId!)
    const removeMember = useRemoveMember(communityId!)

    const generateInvite = useMutation({
        mutationFn: () => communityApi.generateInviteToken(communityId!),
    })

    const [openSection, setOpenSection] = useState<Section | null>('profile')
    const [inviteLink, setInviteLink] = useState<string | null>(null)

    // ---- Profile form state ----
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    // ---- Payment form state ----
    const [payPayId, setPayPayId] = useState('')
    const [enabledMethods, setEnabledMethods] = useState<string[]>(['CASH'])

    useEffect(() => {
        if (community) {
            setName(community.name)
            setDescription(community.description ?? '')
            setLogoUrl(community.logoUrl)
            setCoverUrl(community.coverUrl)
            setPayPayId(community.payPayId ?? '')
            setEnabledMethods(community.enabledPaymentMethods ?? ['CASH'])
        }
    }, [community])

    if (isLoading || !community) {
        return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
    }

    // 権限チェック
    const currentMembership = membersData?.members.find(m => m.userId === authUser?.userId)
    const isOwner = currentMembership?.role === 'OWNER'
    const isAdmin = currentMembership?.role === 'ADMIN' || isOwner

    if (!isAdmin) {
        return <div className="flex items-center justify-center h-64 text-gray-400">管理者権限が必要です</div>
    }

    const toggle = (s: Section) => setOpenSection(prev => prev === s ? null : s)

    // ---- Handlers ----
    const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const result = await uploadFile(file)
        setLogoUrl(result.url)
    }

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const result = await uploadFile(file)
        setCoverUrl(result.url)
    }

    const handleSaveProfile = () => {
        updateCommunity.mutate({
            name: name !== community.name ? name : undefined,
            description: description !== (community.description ?? '') ? description : undefined,
            logoUrl: logoUrl !== community.logoUrl ? logoUrl : undefined,
            coverUrl: coverUrl !== community.coverUrl ? coverUrl : undefined,
        })
    }

    const handleSavePayment = () => {
        updateCommunity.mutate({
            payPayId: payPayId || null,
            enabledPaymentMethods: enabledMethods,
        })
    }

    const togglePaymentMethod = (method: string) => {
        setEnabledMethods(prev =>
            prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
        )
    }

    const handleChangeRole = (userId: string, role: string) => {
        if (confirm(role === 'OWNER' ? 'OWNER権限を委譲しますか？この操作は取り消せません。' : `ロールを ${role} に変更しますか？`)) {
            changeRole.mutate({ userId, role })
        }
    }

    const handleRemoveMember = (userId: string, displayName: string | null) => {
        if (confirm(`${displayName ?? userId} をコミュニティから退室させますか？`)) {
            removeMember.mutate(userId)
        }
    }

    const profileDirty =
        name !== community.name ||
        description !== (community.description ?? '') ||
        logoUrl !== community.logoUrl ||
        coverUrl !== community.coverUrl

    const paymentDirty =
        payPayId !== (community.payPayId ?? '') ||
        JSON.stringify(enabledMethods) !== JSON.stringify(community.enabledPaymentMethods ?? ['CASH'])

    return (
        <div className="space-y-2 pb-24">
            {/* ===== Profile Section ===== */}
            <SectionHeader icon={<Users size={18} />} title="プロフィール編集" section="profile" open={openSection === 'profile'} toggle={toggle} />
            {openSection === 'profile' && (
                <div className="space-y-4 px-4 pb-4">
                    {/* Cover */}
                    <div className="relative">
                        <div
                            className="h-32 rounded-lg bg-gray-100 bg-cover bg-center cursor-pointer"
                            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
                            onClick={() => coverInputRef.current?.click()}
                        >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <div
                            className="relative w-16 h-16 rounded-full bg-gray-200 bg-cover bg-center cursor-pointer flex-shrink-0"
                            style={logoUrl ? { backgroundImage: `url(${logoUrl})` } : {}}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={16} />
                            </div>
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">コミュニティ名</label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="コミュニティ名" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">説明</label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="コミュニティの説明" />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={!profileDirty || updateCommunity.isPending} className="w-full">
                        {updateCommunity.isPending ? '保存中...' : 'プロフィールを保存'}
                    </Button>
                </div>
            )}

            {/* ===== Payment Section ===== */}
            <SectionHeader icon={<CreditCard size={18} />} title="支払い設定" section="payment" open={openSection === 'payment'} toggle={toggle} />
            {openSection === 'payment' && (
                <div className="space-y-4 px-4 pb-4">
                    <div>
                        <label className="text-xs text-gray-500">PayPay ID</label>
                        <Input value={payPayId} onChange={e => setPayPayId(e.target.value)} placeholder="PayPay ID" />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-2">有効な支払い方法</label>
                        {([['CASH', '現金'], ['PAYPAY', 'PayPay'], ['STRIPE', 'クレジットカード']] as const).map(([method, label]) => (
                            <label key={method} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={enabledMethods.includes(method)}
                                    onChange={() => togglePaymentMethod(method)}
                                    className="rounded"
                                />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
                    </div>

                    <Button onClick={handleSavePayment} disabled={!paymentDirty || updateCommunity.isPending} className="w-full">
                        {updateCommunity.isPending ? '保存中...' : '支払い設定を保存'}
                    </Button>
                </div>
            )}

            {/* ===== Invite Section ===== */}
            <SectionHeader icon={<Link2 size={18} />} title="招待リンク" section="invite" open={openSection === 'invite'} toggle={toggle} />
            {openSection === 'invite' && (
                <div className="space-y-4 px-4 pb-4">
                    <p className="text-xs text-gray-500">招待リンクを生成してメンバーを招待できます（有効期限7日）</p>
                    <Button
                        onClick={async () => {
                            const result = await generateInvite.mutateAsync()
                            const link = `${window.location.origin}/invites/${result.token}/accept`
                            setInviteLink(link)
                        }}
                        disabled={generateInvite.isPending}
                        className="w-full"
                    >
                        {generateInvite.isPending ? '生成中...' : '招待リンクを生成'}
                    </Button>

                    {inviteLink && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 flex-1 break-all">{inviteLink}</p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteLink)
                                    alert('リンクをコピーしました')
                                }}
                                className="flex-shrink-0 text-blue-500 hover:bg-blue-50 p-2 rounded"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== Members Section ===== */}
            <SectionHeader icon={<Shield size={18} />} title="メンバー管理" section="members" open={openSection === 'members'} toggle={toggle} />
            {openSection === 'members' && (
                <div className="space-y-1 px-4 pb-4">
                    {membersData?.members
                        .sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
                        .map(member => (
                            <div key={member.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 bg-cover bg-center"
                                    style={member.avatarUrl ? { backgroundImage: `url(${member.avatarUrl})` } : {}} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{member.displayName ?? member.userId.slice(0, 8)}</p>
                                    <RoleBadge role={member.role} />
                                </div>

                                {/* ロール変更・退室ボタン (自分自身 or OWNER以外のメンバーのみ) */}
                                {isOwner && member.userId !== authUser?.userId && (
                                    <div className="flex items-center gap-1">
                                        {member.role !== 'OWNER' && (
                                            <>
                                                {member.role === 'MEMBER' && (
                                                    <button
                                                        onClick={() => handleChangeRole(member.userId, 'ADMIN')}
                                                        className="text-xs text-blue-500 px-2 py-1 rounded hover:bg-blue-50"
                                                        title="ADMINに昇格"
                                                    >
                                                        <Shield size={14} />
                                                    </button>
                                                )}
                                                {member.role === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleChangeRole(member.userId, 'MEMBER')}
                                                        className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-50"
                                                        title="MEMBERに降格"
                                                    >
                                                        <Users size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleChangeRole(member.userId, 'OWNER')}
                                                    className="text-xs text-amber-500 px-2 py-1 rounded hover:bg-amber-50"
                                                    title="OWNER委譲"
                                                >
                                                    <Crown size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member.userId, member.displayName)}
                                                    className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50"
                                                    title="退室させる"
                                                >
                                                    <UserMinus size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                {/* ADMIN は MEMBER のみ退室可能 */}
                                {!isOwner && isAdmin && member.role === 'MEMBER' && member.userId !== authUser?.userId && (
                                    <button
                                        onClick={() => handleRemoveMember(member.userId, member.displayName)}
                                        className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50"
                                        title="退室させる"
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            )}

            {/* ===== Audit Log Section ===== */}
            <SectionHeader icon={<History size={18} />} title="監査ログ" section="audit" open={openSection === 'audit'} toggle={toggle} />
            {openSection === 'audit' && (
                <div className="space-y-1 px-4 pb-4 max-h-96 overflow-y-auto">
                    {auditData?.logs.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">監査ログはまだありません</p>
                    )}
                    {auditData?.logs.map(log => (
                        <div key={log.id} className="text-sm py-2 border-b border-gray-50 last:border-0">
                            <p className="text-gray-700">{log.summary}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(log.createdAt).toLocaleString('ja-JP')}
                                {log.field && <span className="ml-2">({log.field})</span>}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== Webhook Section (UBL-29) ===== */}
            <SectionHeader icon={<ExternalLink size={18} />} title="外部連携" section="webhook" open={openSection === 'webhook'} toggle={toggle} />
            {openSection === 'webhook' && (
                <div className="px-4 pb-4">
                    <WebhookSettings communityId={communityId!} />
                </div>
            )}
        </div>
    )
}

// ---- Helper components ----

function SectionHeader({
    icon,
    title,
    section,
    open,
    toggle,
}: {
    icon: React.ReactNode
    title: string
    section: Section
    open: boolean
    toggle: (s: Section) => void
}) {
    return (
        <button
            onClick={() => toggle(section)}
            className="flex items-center gap-2 w-full px-4 py-3 bg-white hover:bg-gray-50 text-left"
        >
            {icon}
            <span className="flex-1 text-sm font-medium">{title}</span>
            {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </button>
    )
}

function RoleBadge({ role }: { role: string }) {
    const styles: Record<string, string> = {
        OWNER: 'bg-amber-100 text-amber-700',
        ADMIN: 'bg-blue-100 text-blue-700',
        MEMBER: 'bg-gray-100 text-gray-600',
    }
    return <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full ${styles[role] ?? styles.MEMBER}`}>{role}</span>
}

function roleOrder(role: string): number {
    return role === 'OWNER' ? 0 : role === 'ADMIN' ? 1 : 2
}
