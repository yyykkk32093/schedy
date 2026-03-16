import { useState } from 'react'

interface EmojiPickerModalProps {
    onSelect: (emoji: string) => void
    onClose: () => void
}

/** 絵文字カテゴリ定義 */
const EMOJI_CATEGORIES = [
    {
        name: '😊 顔',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
            '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗',
            '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝',
            '🤗', '🤭', '🫣', '🤫', '🤔', '🫡', '🤐', '🤨',
            '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬',
            '😮‍💨', '🤥', '🫠', '😌', '😔', '😪', '🤤', '😴',
            '😷', '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯',
            '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟',
            '🙁', '😮', '😯', '😲', '😳', '🥺', '🥹', '😦',
            '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
            '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
            '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
        ],
    },
    {
        name: '👋 手',
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳',
            '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟',
            '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
            '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏',
            '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
        ],
    },
    {
        name: '❤️ 感情',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
            '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓',
            '💗', '💖', '💘', '💝', '💟', '⭐', '🌟', '✨',
            '🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🎉',
            '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎵',
        ],
    },
    {
        name: '🍕 食べ物',
        emojis: [
            '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
            '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
            '🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥐', '🍞',
            '🍣', '🍱', '🍙', '🍚', '🍛', '🍜', '🍝', '🍰',
            '🍩', '🍪', '🍫', '🍬', '🍭', '☕', '🍵', '🍺',
        ],
    },
] as const

/**
 * EmojiPickerModal — カスタム絵文字ピッカー
 *
 * カテゴリごとにグリッド表示。StampPickerModal と同様のモーダルUI。
 */
export function EmojiPickerModal({ onSelect, onClose }: EmojiPickerModalProps) {
    const [activeCategory, setActiveCategory] = useState(0)

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
            <div
                className="bg-white rounded-t-2xl w-full max-w-lg max-h-[60vh] overflow-hidden animate-slide-up mx-0 sm:mx-4 sm:rounded-2xl sm:mb-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex justify-between items-center p-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">絵文字を選択</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>

                {/* カテゴリタブ */}
                <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto">
                    {EMOJI_CATEGORIES.map((cat, i) => (
                        <button
                            key={cat.name}
                            type="button"
                            onClick={() => setActiveCategory(i)}
                            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors ${i === activeCategory
                                    ? 'bg-blue-100 text-blue-600 font-medium'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* 絵文字グリッド */}
                <div className="overflow-y-auto p-3" style={{ maxHeight: 'calc(60vh - 100px)' }}>
                    <div className="grid grid-cols-8 gap-1">
                        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                    onSelect(emoji)
                                    onClose()
                                }}
                                className="text-2xl p-1 rounded-lg hover:bg-blue-50 transition-colors text-center"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
