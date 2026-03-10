import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible'
import { cn } from '@/shared/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface ChannelSectionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
    count?: number
}

/**
 * チャンネルセクション（アコーディオン）
 * Mockup の Community / Activity / DirectMessage セクション
 */
export function ChannelSection({ title, children, defaultOpen = false, count }: ChannelSectionProps) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{title}</span>
                    {count !== undefined && count > 0 && (
                        <span className="text-xs text-gray-400">({count})</span>
                    )}
                </div>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 text-gray-400 transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="border-l-2 border-gray-100 ml-4">{children}</div>
            </CollapsibleContent>
        </Collapsible>
    )
}
