import { Input } from '@/shared/components/ui/input'
import { Search } from 'lucide-react'

interface ChatSearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

/**
 * チャット一覧上部の検索バー（UI先行・ローカルフィルタリングのみ）
 */
export function ChatSearchBar({ value, onChange, placeholder = 'Search' }: ChatSearchBarProps) {
    return (
        <div className="relative px-4 py-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 h-9 bg-gray-100 border-0 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300"
            />
        </div>
    )
}
