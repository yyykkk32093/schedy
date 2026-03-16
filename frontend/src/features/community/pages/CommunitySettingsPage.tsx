import { useAuth } from '@/app/providers/AuthProvider'
import { useCommunity, useMembers, useUpdateCommunity } from '@/features/community/hooks/useCommunityQueries'
import { useAuditLogs, useChangeMemberRole, useRemoveMember } from '@/features/community/hooks/useCommunitySettingsQueries'
import { UnsavedChangesDialog } from '@/shared/components/UnsavedChangesDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select'
import { Separator } from '@/shared/components/ui/separator'
import { Textarea } from '@/shared/components/ui/textarea'
import { uploadFile } from '@/shared/lib/uploadClient'
import { useUnsavedChangesWarning } from '@/shared/lib/useUnsavedChangesWarning'
import {
    Camera,
    ChevronDown,
    ChevronRight,
    Crown,
    ExternalLink,
    History,
    Shield,
    UserMinus,
    Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

type Section = 'settings' | 'members' | 'audit' | 'webhook'

export default function CommunitySettingsPage() {
    const { id: communityId } = useParams<{ id: string }>()
    const { user: authUser } = useAuth()
    const { data: community, isLoading } = useCommunity(communityId!)
    const { data: membersData } = useMembers(communityId!)
    const { data: auditData } = useAuditLogs(communityId!)
    const updateCommunity = useUpdateCommunity(communityId!)
    const changeRole = useChangeMemberRole(communityId!)
    const removeMember = useRemoveMember(communityId!)

    const [openSection, setOpenSection] = useState<Section | null>('settings')

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

    // ---- Join / visibility form state ----
    const [joinMethod, setJoinMethod] = useState<'FREE_JOIN' | 'APPROVAL' | 'INVITATION'>('FREE_JOIN')
    const [isPublic, setIsPublic] = useState(true)
    const [mainActivityArea, setMainActivityArea] = useState('')
    const [activityFrequency, setActivityFrequency] = useState('')

    useEffect(() => {
        if (community) {
            setName(community.name)
            setDescription(community.description ?? '')
            setLogoUrl(community.logoUrl)
            setCoverUrl(community.coverUrl)
            setPayPayId(community.payPayId ?? '')
            setEnabledMethods(community.enabledPaymentMethods ?? ['CASH'])
            setJoinMethod((community.joinMethod as 'FREE_JOIN' | 'APPROVAL' | 'INVITATION') ?? 'FREE_JOIN')
            setIsPublic(community.isPublic ?? true)
            setMainActivityArea(community.mainActivityArea ?? '')
            setActivityFrequency(community.activityFrequency ?? '')
        }
    }, [community])

    // #44: 統合dirty判定（Hooksのルール遵守のため早期returnより前で算出）
    const profileDirty = community != null && (
        name !== community.name ||
        description !== (community.description ?? '') ||
        logoUrl !== community.logoUrl ||
        coverUrl !== community.coverUrl
    )

    const paymentDirty = community != null && (
        payPayId !== (community.payPayId ?? '') ||
        JSON.stringify(enabledMethods) !== JSON.stringify(community.enabledPaymentMethods ?? ['CASH'])
    )

    const joinDirty = community != null && (
        joinMethod !== ((community.joinMethod as 'FREE_JOIN' | 'APPROVAL' | 'INVITATION') ?? 'FREE_JOIN') ||
        isPublic !== (community.isPublic ?? true) ||
        mainActivityArea !== (community.mainActivityArea ?? '') ||
        activityFrequency !== (community.activityFrequency ?? '')
    )

    const isDirty = profileDirty || paymentDirty || joinDirty

    // #47: 未保存時の離脱警告（早期returnより前に配置）
    const { isBlocked, proceed, cancel } = useUnsavedChangesWarning(isDirty)

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

    /** #44: プロフィール+支払い+参加設定を一括保存 */
    const handleSaveAll = () => {
        updateCommunity.mutate({
            name: name !== community.name ? name : undefined,
            description: description !== (community.description ?? '') ? description : undefined,
            logoUrl: logoUrl !== community.logoUrl ? logoUrl : undefined,
            coverUrl: coverUrl !== community.coverUrl ? coverUrl : undefined,
            payPayId: payPayId || null,
            enabledPaymentMethods: enabledMethods,
            joinMethod,
            isPublic,
            mainActivityArea: mainActivityArea.trim() || null,
            activityFrequency: activityFrequency.trim() || null,
        }, {
            onSuccess: () => toast.success('保存しました'),
        })
    }

    const togglePaymentMethod = (method: string) => {
        setEnabledMethods(prev =>
            prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
        )
    }

    // isPublic=false → 強制 INVITATION（バックエンドのビジネスルールと同期）
    const handlePublicChange = (pub: boolean) => {
        setIsPublic(pub)
        if (!pub) setJoinMethod('INVITATION')
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

    return (
        <div className="space-y-2 pb-24">
            {/* #47: 未保存警告ダイアログ */}
            <UnsavedChangesDialog open={isBlocked} onDiscard={proceed} onCancel={cancel} />

            {/* ===== #44: コミュニティ設定セクション（プロフィール+支払い統合） ===== */}
            <SectionHeader icon={<Users size={18} />} title="コミュニティ設定" section="settings" open={openSection === 'settings'} toggle={toggle} />
            {openSection === 'settings' && (
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

                    <Separator className="my-4" />

                    {/* 支払い設定セクション */}
                    <p className="text-xs font-semibold text-gray-500">支払い設定</p>
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

                    <Separator className="my-4" />

                    {/* 参加・公開設定 */}
                    <p className="text-xs font-semibold text-gray-500">参加・公開設定</p>
                    <div className="space-y-1.5">
                        <Label>公開設定</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant={isPublic ? 'default' : 'outline'} size="sm" onClick={() => handlePublicChange(true)}>公開</Button>
                            <Button type="button" variant={!isPublic ? 'default' : 'outline'} size="sm" onClick={() => handlePublicChange(false)}>非公開</Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>参加方式</Label>
                        <Select value={joinMethod} onValueChange={(v) => setJoinMethod(v as typeof joinMethod)} disabled={!isPublic}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FREE_JOIN">自由参加</SelectItem>
                                <SelectItem value="APPROVAL">承認制</SelectItem>
                                <SelectItem value="INVITATION">招待制</SelectItem>
                            </SelectContent>
                        </Select>
                        {!isPublic && (
                            <p className="text-xs text-gray-500">非公開コミュニティは招待制になります</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mainActivityArea">主な活動エリア</Label>
                        <Input id="mainActivityArea" value={mainActivityArea} onChange={e => setMainActivityArea(e.target.value)} placeholder="例: 渋谷区" />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="activityFrequency">活動頻度</Label>
                        <Input id="activityFrequency" value={activityFrequency} onChange={e => setActivityFrequency(e.target.value)} placeholder="例: 毎週土曜日" />
                    </div>

                    <Button onClick={handleSaveAll} disabled={!isDirty || updateCommunity.isPending} className="w-full">
                        {updateCommunity.isPending ? '保存中...' : '設定を保存'}
                    </Button>
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

            {/* ===== Audit Log Section (#45: コミュニティ設定変更履歴) ===== */}
            <SectionHeader icon={<History size={18} />} title="コミュニティ設定変更履歴" section="audit" open={openSection === 'audit'} toggle={toggle} />
            {openSection === 'audit' && (
                <div className="space-y-1 px-4 pb-4 max-h-96 overflow-y-auto">
                    {auditData?.logs.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">設定変更履歴はまだありません</p>
                    )}
                    {auditData?.logs.map(log => (
                        <div key={log.id} className="text-sm py-2 border-b border-gray-50 last:border-0">
                            <p className="text-gray-700">{formatAuditSummary(log)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {log.actorDisplayName ?? log.actorUserId.slice(0, 8)}
                                {' · '}
                                {new Date(log.createdAt).toLocaleString('ja-JP')}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== Webhook Section (#48: 準備中) ===== */}
            <SectionHeader icon={<ExternalLink size={18} />} title="外部連携" section="webhook" open={openSection === 'webhook'} toggle={toggle} />
            {openSection === 'webhook' && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-gray-400 text-center py-6">準備中です</p>
                </div>
            )}
        </div>
    )
}

// ---- Audit log helpers ----

/** 監査ログの物理フィールド名 → 日本語ラベル */
const AUDIT_FIELD_LABELS: Record<string, string> = {
    name: 'コミュニティ名',
    description: '説明',
    visibility: '公開設定',
    logoUrl: 'ロゴ画像',
    coverUrl: 'カバー画像',
    grade: 'グレード',
    enabledPaymentMethods: '支払い方法設定',
    payPayId: 'PayPay ID',
    reminderEnabled: 'リマインダー設定',
    role: 'ロール',
    joinMethod: '参加方式',
    isPublic: '公開設定',
    mainActivityArea: '活動エリア',
    activityFrequency: '活動頻度',
}

/** before / after の物理値 → 表示用ラベル */
const AUDIT_VALUE_LABELS: Record<string, string> = {
    // enabledPaymentMethods
    CASH: '現金',
    PAYPAY: 'PayPay',
    STRIPE: 'カード',
    // visibility / isPublic
    PUBLIC: '公開',
    PRIVATE: '非公開',
    true: 'はい',
    false: 'いいえ',
    // joinMethod
    OPEN: '自由参加',
    APPROVAL: '承認制',
    INVITE_ONLY: '招待のみ',
    // role
    OWNER: 'オーナー',
    ADMIN: '管理者',
    MEMBER: 'メンバー',
    // reminderEnabled
    ENABLED: '有効',
    DISABLED: '無効',
}

/** カンマ区切りの値も含め、物理値を論理名に変換 */
function humanizeValue(raw: string | null): string {
    if (raw == null || raw === '') return 'なし'
    // カンマ区切り（例: "CASH,PAYPAY"）
    if (raw.includes(',')) {
        return raw.split(',').map(v => AUDIT_VALUE_LABELS[v.trim()] ?? v.trim()).join(', ')
    }
    return AUDIT_VALUE_LABELS[raw] ?? raw
}

/** summary 内の物理フィールド名を論理名に置換し、before/after を付与 */
function formatAuditSummary(log: {
    summary: string
    actorDisplayName: string | null
    actorUserId: string
    field: string | null
    before: string | null
    after: string | null
}): string {
    let text = log.summary
    // 長いキーから先に置換（部分一致の誤置換を防止）
    const sorted = Object.entries(AUDIT_FIELD_LABELS)
        .sort(([a], [b]) => b.length - a.length)
    for (const [physical, logical] of sorted) {
        // 単語境界で囲まれた物理名を論理名に置換
        const regex = new RegExp(`\\b${physical}\\b`, 'g')
        text = text.replace(regex, logical)
    }
    // ユーザー関連アクション（ロール変更・退室・委譲）の (名前) → (ユーザ名：名前)
    const userActionPatterns = [
        /ロールを .+ に変更しました/,
        /退室させました/,
        /委譲しました/,
    ]
    if (userActionPatterns.some(p => p.test(text))) {
        text = text.replace(/\(([^)]+)\)/, '(ユーザ名：$1)')
    }
    // before / after がある場合、変更前後を付与（ロール変更等・画像系は除外）
    const skipBeforeAfterFields = new Set(['logoUrl', 'coverUrl'])
    const skipDiff = userActionPatterns.some(p => p.test(text))
        || (log.field != null && skipBeforeAfterFields.has(log.field))
    if (!skipDiff) {
        if (log.before != null && log.after != null) {
            text += `（${humanizeValue(log.before)} → ${humanizeValue(log.after)}）`
        } else if (log.before == null && log.after != null) {
            text += `（なし → ${humanizeValue(log.after)}）`
        } else if (log.before != null && log.after == null) {
            text += `（${humanizeValue(log.before)} → なし）`
        }
    }
    return text
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
