interface CharacterCounterProps {
    current: number
    max: number
    className?: string
}

/**
 * CharacterCounter — テキスト入力フィールド用の文字数カウンター
 *
 * 残り文字数を表示し、上限に近づくと色が変わる。
 */
export function CharacterCounter({ current, max, className = '' }: CharacterCounterProps) {
    const remaining = max - current
    const color =
        remaining < 0 ? 'text-red-500' :
            remaining < max * 0.1 ? 'text-orange-500' :
                'text-gray-400'

    return (
        <span className={`text-xs ${color} ${className}`}>
            {current} / {max}
        </span>
    )
}
