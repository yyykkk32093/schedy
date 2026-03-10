import { useStamps } from '@/features/stamp/hooks/useStampQueries'

interface StampPickerModalProps {
    onSelect: (stampId: string) => void
    onClose: () => void
}

/**
 * StampPickerModal — スタンプ選択用のポップアップ
 *
 * ユーザーの持つスタンプ一覧を表示し、選択すると onSelect を呼ぶ。
 */
export function StampPickerModal({ onSelect, onClose }: StampPickerModalProps) {
    const { data, isLoading } = useStamps()
    const stamps = data?.stamps ?? []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-lg max-h-[50vh] overflow-y-auto p-4 animate-slide-up mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">スタンプを選択</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>

                {isLoading ? (
                    <p className="text-sm text-gray-400 text-center py-4">読み込み中...</p>
                ) : stamps.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">スタンプがありません</p>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {stamps.map((stamp) => (
                            <button
                                key={stamp.id}
                                onClick={() => {
                                    onSelect(stamp.id)
                                    onClose()
                                }}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title={stamp.name}
                            >
                                {stamp.imageUrl ? (
                                    <img src={stamp.imageUrl} alt={stamp.name} className="w-8 h-8 object-contain" />
                                ) : (
                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm">
                                        {stamp.name.slice(0, 2)}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-500 mt-0.5 truncate w-full text-center">
                                    {stamp.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
