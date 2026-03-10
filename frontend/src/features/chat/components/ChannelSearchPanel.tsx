import { useSearchMessages } from '@/features/chat/hooks/useChatQueries'
import { Input } from '@/shared/components/ui/input'
import { Loader2, Search, X } from 'lucide-react'
import { useState } from 'react'

interface ChannelSearchPanelProps {
    channelId: string
    onClose: () => void
    onMessageClick?: (messageId: string) => void
}

/**
 * ChannelSearchPanel — チャンネル内メッセージ検索パネル
 *
 * ChatHeader の検索アイコンクリックで表示。
 * サーバーサイド ILIKE 検索 (GET /v1/channels/:id/messages/search?q=)
 */
export function ChannelSearchPanel({ channelId, onClose, onMessageClick }: ChannelSearchPanelProps) {
    const [query, setQuery] = useState('')
    const { data, isLoading, isFetching } = useSearchMessages(channelId, query)

    const messages = data?.messages ?? []
    const showResults = query.length >= 2

    return (
        <div className="border-b border-gray-200 bg-white">
            {/* 検索入力 */}
            <div className="flex items-center gap-2 px-4 py-2">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="メッセージを検索…"
                    className="h-8 border-0 bg-gray-100 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300"
                    autoFocus
                />
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    aria-label="検索を閉じる"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* 検索結果 */}
            {showResults && (
                <div className="max-h-64 overflow-y-auto border-t border-gray-100">
                    {isLoading || isFetching ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-6">
                            「{query}」に一致するメッセージはありません
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {messages.map((msg) => (
                                <li key={msg.id}>
                                    <button
                                        type="button"
                                        onClick={() => onMessageClick?.(msg.id)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                    >
                                        <p className="text-sm text-gray-800 line-clamp-2">
                                            {highlightMatch(msg.content, query)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(msg.createdAt).toLocaleString('ja-JP')}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

/** 検索キーワードをハイライト表示 */
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">
                {part}
            </mark>
        ) : (
            part
        ),
    )
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
