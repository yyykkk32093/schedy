import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'メールアドレスを入力してください')
        .email('有効なメールアドレスを入力してください'),
    password: z
        .string()
        .min(1, 'パスワードを入力してください')
        .min(6, 'パスワードは6文字以上で入力してください'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
    onSubmit: (data: LoginFormValues) => void | Promise<void>
    isLoading: boolean
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="mail@example.com"
                    autoComplete="email"
                    {...register('email')}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="6文字以上"
                    autoComplete="current-password"
                    {...register('password')}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
        </form>
    )
}

export type { LoginFormValues }
