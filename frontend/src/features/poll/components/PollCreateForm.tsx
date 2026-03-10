import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCreatePoll } from '../hooks/usePollQueries'

interface PollCreateFormProps {
    communityId: string
    onSuccess?: () => void
}

/**
 * PollCreateForm — 投票作成フォーム（UBL-34）
 *
 * AnnouncementCreatePage のタブ「投票」で表示される。
 */
export function PollCreateForm({ communityId, onSuccess }: PollCreateFormProps) {
    const createPoll = useCreatePoll(communityId)

    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [isMultipleChoice, setIsMultipleChoice] = useState(false)
    const [deadline, setDeadline] = useState('')

    const handleAddOption = () => {
        if (options.length >= 20) return
        setOptions((prev) => [...prev, ''])
    }

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return
        setOptions((prev) => prev.filter((_, i) => i !== index))
    }

    const handleOptionChange = (index: number, value: string) => {
        setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)))
    }

    const canSubmit =
        question.trim().length > 0 &&
        options.filter((o) => o.trim().length > 0).length >= 2 &&
        !createPoll.isPending

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        const validOptions = options.filter((o) => o.trim().length > 0)

        createPoll.mutate(
            {
                question: question.trim(),
                isMultipleChoice,
                deadline: deadline || null,
                options: validOptions.map((o) => o.trim()),
            },
            {
                onSuccess: () => {
                    onSuccess?.()
                },
            },
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="p-4 space-y-4">
                {/* 質問 */}
                <div className="space-y-2">
                    <Label htmlFor="question">質問</Label>
                    <Input
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="投票の質問を入力..."
                        required
                    />
                </div>

                {/* 選択肢 */}
                <div className="space-y-2">
                    <Label>選択肢</Label>
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input
                                value={opt}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                placeholder={`選択肢 ${i + 1}`}
                            />
                            {options.length > 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveOption(i)}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {options.length < 20 && (
                        <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                            <Plus className="w-4 h-4 mr-1" />
                            選択肢を追加
                        </Button>
                    )}
                </div>

                {/* 複数選択 */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="multipleChoice"
                        checked={isMultipleChoice}
                        onChange={(e) => setIsMultipleChoice(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <Label htmlFor="multipleChoice" className="text-sm font-normal cursor-pointer">
                        複数選択を許可する
                    </Label>
                </div>

                {/* 締切 */}
                <div className="space-y-2">
                    <Label htmlFor="deadline">締切日時（任意）</Label>
                    <Input
                        id="deadline"
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                </div>
            </Card>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
                <Send className="w-4 h-4 mr-2" />
                {createPoll.isPending ? '作成中...' : '投票を作成'}
            </Button>
        </form>
    )
}
