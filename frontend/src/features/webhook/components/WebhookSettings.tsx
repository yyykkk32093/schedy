import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ExternalLink, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteWebhook, useUpsertWebhook, useWebhookConfigs } from '../hooks/useWebhookQueries'

interface WebhookSettingsProps {
    communityId: string
}

/**
 * WebhookSettings — LINE Webhook 設定コンポーネント（UBL-29）
 *
 * コミュニティ設定画面内に配置。
 * OWNER / ADMIN のみ閲覧・編集可能（API 側でも権限チェック済み）。
 */
export function WebhookSettings({ communityId }: WebhookSettingsProps) {
    const { data: configs, isLoading } = useWebhookConfigs(communityId)
    const upsertWebhook = useUpsertWebhook(communityId)
    const deleteWebhook = useDeleteWebhook(communityId)

    const [webhookUrl, setWebhookUrl] = useState('')
    const [isEditing, setIsEditing] = useState(false)

    const lineConfig = configs?.find((c) => c.service === 'LINE')

    const handleSave = () => {
        if (!webhookUrl.trim()) return

        upsertWebhook.mutate(
            { service: 'LINE', webhookUrl: webhookUrl.trim(), enabled: true },
            {
                onSuccess: () => {
                    setIsEditing(false)
                    setWebhookUrl('')
                },
            },
        )
    }

    const handleToggle = () => {
        if (!lineConfig) return
        upsertWebhook.mutate({
            service: 'LINE',
            webhookUrl: lineConfig.webhookUrl,
            enabled: !lineConfig.enabled,
        })
    }

    const handleDelete = () => {
        if (!lineConfig) return
        deleteWebhook.mutate(lineConfig.id)
    }

    const handleStartEdit = () => {
        setWebhookUrl(lineConfig?.webhookUrl ?? '')
        setIsEditing(true)
    }

    if (isLoading) {
        return <div className="text-sm text-gray-400">読み込み中...</div>
    }

    return (
        <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-sm">LINE 通知連携</h3>
                </div>
                {lineConfig && (
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${lineConfig.enabled
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {lineConfig.enabled ? '有効' : '無効'}
                    </span>
                )}
            </div>

            <p className="text-xs text-gray-500">
                お知らせや投票の作成時に、LINE グループへ自動通知を送信します。
            </p>

            {lineConfig && !isEditing ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Link2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[240px]">
                            {lineConfig.webhookUrl}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleToggle}>
                            {lineConfig.enabled ? '無効にする' : '有効にする'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleStartEdit}>
                            URL変更
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleteWebhook.isPending}
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="webhookUrl">Webhook URL</Label>
                        <Input
                            id="webhookUrl"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://..."
                            type="url"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!webhookUrl.trim() || upsertWebhook.isPending}
                        >
                            {upsertWebhook.isPending ? '保存中...' : '保存'}
                        </Button>
                        {isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsEditing(false)
                                    setWebhookUrl('')
                                }}
                            >
                                キャンセル
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}
