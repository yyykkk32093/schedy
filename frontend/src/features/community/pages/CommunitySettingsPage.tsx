import { useAuth } from '@/app/providers/AuthProvider'
import { communityApi } from '@/features/community/api/communityApi'
import { LocationSettings, type LocationEntry } from '@/features/community/components/LocationSettings'
import { useCommunity, useLeaveCommunity, useMembers, useUpdateCommunity } from '@/features/community/hooks/useCommunityQueries'
import { useAuditLogs, useChangeMemberRole, useRemoveMember } from '@/features/community/hooks/useCommunitySettingsQueries'
import { useConnectStatus, useOpenDashboard, useStartOnboarding } from '@/features/community/hooks/useConnectQueries'
import { UnsavedChangesDialog } from '@/shared/components/UnsavedChangesDialog'
import { CharacterCounter } from '@/shared/components/ui/CharacterCounter'
import { Button } from '@/shared/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog'
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
    LogOut,
    Shield,
    UserMinus,
    Users
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
    const leaveCommunity = useLeaveCommunity()
    const navigate = useNavigate()

    const [openSection, setOpenSection] = useState<Section | null>('settings')
    const [showLeaveDialog, setShowLeaveDialog] = useState(false)

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
    // 活動頻度——2段プルダウン用 state
    const [freqUnit, setFreqUnit] = useState<'週' | '月' | '年' | ''>('')
    const [freqCount, setFreqCount] = useState<string>('')
    const [freqCustom, setFreqCustom] = useState<string>('')
    // locations state（一括保存用）
    const [editedLocations, setEditedLocations] = useState<LocationEntry[] | null>(null)
    // tags state
    const [editedTags, setEditedTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')

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
            setEditedTags(community.tags ?? [])
            // 活動頻度をパース（例: "週1回" → unit='週', count='1'）
            const freq = community.activityFrequency ?? ''
            const freqMatch = freq.match(/^(週|月|年)(\d+)回$/)
            if (freqMatch) {
                setFreqUnit(freqMatch[1] as '週' | '月' | '年')
                setFreqCount(freqMatch[2])
                setFreqCustom('')
            } else if (freq) {
                // レガシー値（例: "毎週土曜日"）→ リセット
                setFreqUnit('')
                setFreqCount('')
                setFreqCustom('')
            } else {
                setFreqUnit('')
                setFreqCount('')
                setFreqCustom('')
            }
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
        buildFrequencyString(freqUnit, freqCount, freqCustom) !== (community.activityFrequency ?? '')
    )

    // location dirty判定
    const locationDirty = editedLocations !== null && (
        JSON.stringify(
            editedLocations.map((l) => ({ type: l.type, area: l.area.trim(), station: l.station.trim() })),
        ) !== JSON.stringify(
            (community?.locations ?? []).map((l) => ({ type: l.type, area: l.area, station: l.station ?? '' })),
        )
    )

    // tags dirty判定
    const tagsDirty = JSON.stringify([...editedTags].sort()) !== JSON.stringify([...(community?.tags ?? [])].sort())

    const isDirty = profileDirty || paymentDirty || joinDirty || locationDirty || tagsDirty

    // タグ上限（FEガード）
    const TAG_LIMIT_FREE = 5
    const isFreeGrade = community?.grade === 'FREE'
    const tagLimitReached = isFreeGrade && editedTags.length >= TAG_LIMIT_FREE

    /** タグ追加の共通処理（上限チェック付き） */
    const tryAddTag = () => {
        const trimmed = tagInput.trim().replace(/^#/, '')
        if (!trimmed || editedTags.includes(trimmed)) return
        if (isFreeGrade && editedTags.length >= TAG_LIMIT_FREE) {
            toast.error(`タグを${TAG_LIMIT_FREE + 1}件以上追加するには、プレミアムグレードへアップグレードしてください`)
            return
        }
        setEditedTags((prev) => [...prev, trimmed])
        setTagInput('')
    }

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

    /** #44: プロフィール+支払い+参加設定+活動拠点を一括保存 */
    const handleSaveAll = async () => {
        const frequencyStr = buildFrequencyString(freqUnit, freqCount, freqCustom)

        // コミュニティ本体の更新
        updateCommunity.mutate({
            name: name !== community.name ? name : undefined,
            description: description !== (community.description ?? '') ? description : undefined,
            logoUrl: logoUrl !== community.logoUrl ? logoUrl : undefined,
            coverUrl: coverUrl !== community.coverUrl ? coverUrl : undefined,
            payPayId: payPayId || null,
            enabledPaymentMethods: enabledMethods,
            joinMethod,
            isPublic,
            activityFrequency: frequencyStr || null,
        }, {
            onSuccess: () => toast.success('保存しました'),
        })

        // タグの保存（変更がある場合のみ）
        if (tagsDirty) {
            try {
                await communityApi.saveTags(communityId!, editedTags)
            } catch {
                toast.error('タグの保存に失敗しました')
            }
        }

        // 活動拠点の保存（変更がある場合のみ）
        if (locationDirty && editedLocations) {
            try {
                const payload = editedLocations
                    .filter((l) => l.area.trim())
                    .map((l) => ({
                        type: l.type,
                        area: l.area.trim(),
                        station: l.station.trim() || undefined,
                    }))
                await communityApi.saveLocations(communityId!, payload)
            } catch {
                toast.error('活動拠点の保存に失敗しました')
            }
        }
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
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="コミュニティ名" maxLength={50} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500">説明</label>
                        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="コミュニティの説明" maxLength={500} />
                        <CharacterCounter current={description.length} max={500} />
                    </div>

                    <Separator className="my-4" />

                    {/* 支払い設定セクション */}
                    <p className="text-xs font-semibold text-gray-500">支払い設定</p>
                    <div>
                        <label className="text-xs text-gray-500">PayPay ID</label>
                        <Input value={payPayId} onChange={e => {
                            const val = e.target.value
                            setPayPayId(val)
                            // PayPay IDが空になったらPAYPAYを自動で無効化
                            if (!val.trim()) {
                                setEnabledMethods(prev => prev.filter(m => m !== 'PAYPAY'))
                            }
                        }} placeholder="PayPay ID" />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-2">有効な支払い方法</label>
                        {([['CASH', '現金'], ['PAYPAY', 'PayPay'], ['STRIPE', 'クレジットカード']] as const).map(([method, label]) => {
                            const isPayPayDisabled = method === 'PAYPAY' && !payPayId.trim()
                            return (
                                <label key={method} className={`flex items-center gap-2 py-1.5 ${isPayPayDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        checked={enabledMethods.includes(method)}
                                        onChange={() => togglePaymentMethod(method)}
                                        disabled={isPayPayDisabled}
                                        className="rounded"
                                    />
                                    <span className="text-sm">{label}</span>
                                    {isPayPayDisabled && <span className="text-xs text-gray-400">（PayPay IDを入力してください）</span>}
                                </label>
                            )
                        })}
                    </div>

                    {/* Stripe Connect オンボーディング（OWNER のみ表示） */}
                    {isOwner && (
                        <StripeConnectSection communityId={communityId!} />
                    )}

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
                        <Label>活動頻度</Label>
                        <div className="flex items-center gap-2">
                            <Select value={freqUnit} onValueChange={(v) => { setFreqUnit(v as '週' | '月' | '年'); setFreqCount(''); setFreqCustom('') }}>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="単位" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="週">週</SelectItem>
                                    <SelectItem value="月">月</SelectItem>
                                    <SelectItem value="年">年</SelectItem>
                                </SelectContent>
                            </Select>
                            {freqUnit && (
                                <FrequencyCountSelect
                                    unit={freqUnit as '週' | '月' | '年'}
                                    value={freqCount}
                                    customValue={freqCustom}
                                    onChange={setFreqCount}
                                    onCustomChange={setFreqCustom}
                                />
                            )}
                            {freqUnit && freqCount && (
                                <span className="text-sm text-gray-600">回</span>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* タグ入力 */}
                    <div className="space-y-1.5">
                        <Label>タグ</Label>
                        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                            {editedTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => setEditedTags((prev) => prev.filter((t) => t !== tag))}
                                        className="text-blue-400 hover:text-blue-700 ml-0.5"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        tryAddTag()
                                    }
                                }}
                                placeholder="タグを入力してEnter（例: 初心者歓迎）"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!tagInput.trim() || editedTags.includes(tagInput.trim().replace(/^#/, ''))}
                                onClick={tryAddTag}
                            >
                                追加
                            </Button>
                        </div>
                        {tagLimitReached && (
                            <p className="text-xs text-orange-500">{TAG_LIMIT_FREE + 1}件以上追加するには、プレミアムグレードへアップグレードしてください</p>
                        )}
                    </div>

                    <Separator />

                    <LocationSettings
                        communityId={communityId!}
                        initialLocations={community.locations}
                        onLocationsChange={setEditedLocations}
                    />

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

            {/* ===== コミュニティ退出（OWNER以外） ===== */}
            {!isOwner && (
                <div className="px-4 pt-6 pb-4">
                    <Separator className="mb-6" />
                    <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => setShowLeaveDialog(true)}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        コミュニティを退出
                    </Button>
                </div>
            )}

            {/* コミュニティ退出確認ダイアログ */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>コミュニティを退出</DialogTitle>
                        <DialogDescription>
                            {community.name} から退出しますか？将来のスケジュール参加も自動的にキャンセルされます。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">キャンセル</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            disabled={leaveCommunity.isPending}
                            onClick={() => {
                                leaveCommunity.mutate({ communityId: communityId! }, {
                                    onSuccess: () => {
                                        setShowLeaveDialog(false)
                                        toast.success('コミュニティを退出しました')
                                        navigate('/communities', { replace: true })
                                    },
                                })
                            }}
                        >
                            {leaveCommunity.isPending ? '退出中...' : '退出する'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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

// ---- 活動頻度 ----

/** 単位に応じた数値選択肢を返す */
function getCountOptions(unit: '週' | '月' | '年'): number[] {
    switch (unit) {
        case '月': return [1, 2, 3]
        case '週': return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        case '年': return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }
}

/** freqUnit + freqCount → "週3回" 形式の文字列を生成 */
function buildFrequencyString(unit: string, count: string, custom: string): string {
    if (!unit) return ''
    const c = custom || count
    if (!c) return ''
    return `${unit}${c}回`
}

/** 数値プルダウン（週のみ手入力可能） */
function FrequencyCountSelect({
    unit,
    value,
    customValue,
    onChange,
    onCustomChange,
}: {
    unit: '週' | '月' | '年'
    value: string
    customValue: string
    onChange: (v: string) => void
    onCustomChange: (v: string) => void
}) {
    const options = getCountOptions(unit)
    const showCustomInput = unit === '週' && value === 'custom'

    return (
        <div className="flex items-center gap-1.5">
            <Select
                value={value}
                onValueChange={(v) => {
                    onChange(v)
                    if (v !== 'custom') onCustomChange('')
                }}
            >
                <SelectTrigger className="w-24">
                    <SelectValue placeholder="回数" />
                </SelectTrigger>
                <SelectContent>
                    {options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                            {n}
                        </SelectItem>
                    ))}
                    {unit === '週' && (
                        <SelectItem value="custom">その他</SelectItem>
                    )}
                </SelectContent>
            </Select>
            {showCustomInput && (
                <Input
                    type="number"
                    min={1}
                    value={customValue}
                    onChange={(e) => onCustomChange(e.target.value)}
                    placeholder="回数"
                    className="w-20 h-9"
                />
            )}
        </div>
    )
}

// ============================================================
// Stripe Connect Onboarding セクション（OWNER 専用）
// ============================================================
function StripeConnectSection({ communityId }: { communityId: string }) {
    const { data: status, isLoading } = useConnectStatus(communityId)
    const startOnboarding = useStartOnboarding(communityId)
    const openDashboard = useOpenDashboard(communityId)

    if (isLoading) {
        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400">Stripe Connect 読み込み中…</p>
            </div>
        )
    }

    // アカウント未作成
    if (!status?.hasAccount) {
        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-gray-600">💳 Stripe Connect（クレジットカード決済）</p>
                <p className="text-xs text-gray-500">
                    参加費のクレジットカード決済を有効にするには、Stripe アカウントの設定が必要です。
                </p>
                <Button
                    size="sm"
                    onClick={() => startOnboarding.mutate()}
                    disabled={startOnboarding.isPending}
                >
                    {startOnboarding.isPending ? '準備中...' : 'Stripe アカウントを設定'}
                </Button>
                {startOnboarding.isError && (
                    <p className="text-xs text-red-500">
                        {(startOnboarding.error as Error)?.message ?? 'エラーが発生しました'}
                    </p>
                )}
            </div>
        )
    }

    // アカウント作成済みだがオンボーディング未完了
    if (!status.chargesEnabled) {
        return (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-yellow-800">💳 Stripe Connect 設定中</p>
                <p className="text-xs text-yellow-700">
                    {status.detailsSubmitted
                        ? 'Stripe による審査中です。完了次第、カード決済が有効になります。'
                        : 'アカウント設定が未完了です。続きを完了してください。'}
                </p>
                {!status.detailsSubmitted && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startOnboarding.mutate()}
                        disabled={startOnboarding.isPending}
                    >
                        {startOnboarding.isPending ? '準備中...' : '設定を続ける'}
                    </Button>
                )}
            </div>
        )
    }

    // オンボーディング完了＆決済有効
    return (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-green-800">✅ Stripe Connect 有効</p>
            <p className="text-xs text-green-700">
                クレジットカード決済が利用可能です。
            </p>
            <Button
                size="sm"
                variant="outline"
                onClick={() => openDashboard.mutate()}
                disabled={openDashboard.isPending}
            >
                <ExternalLink className="w-3 h-3 mr-1" />
                {openDashboard.isPending ? '読み込み中...' : 'Stripe ダッシュボードを開く'}
            </Button>
        </div>
    )
}
