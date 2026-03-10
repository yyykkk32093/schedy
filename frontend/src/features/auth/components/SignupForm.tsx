import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const signupSchema = z
    .object({
        email: z
            .string()
            .min(1, 'メールアドレスを入力してください')
            .email('有効なメールアドレスを入力してください'),
        password: z
            .string()
            .min(1, 'パスワードを入力してください')
            .min(6, 'パスワードは6文字以上で入力してください'),
        confirmPassword: z.string().min(1, 'パスワードを再入力してください'),
        displayName: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'パスワードが一致しません',
        path: ['confirmPassword'],
    })

type SignupFormValues = z.infer<typeof signupSchema>

interface SignupFormProps {
    onSubmit: (data: SignupFormValues) => void | Promise<void>
    isLoading: boolean
}

export function SignupForm({ onSubmit, isLoading }: SignupFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
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
                <Label htmlFor="displayName">表示名（任意）</Label>
                <Input
                    id="displayName"
                    type="text"
                    placeholder="ニックネーム"
                    autoComplete="name"
                    {...register('displayName')}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="6文字以上"
                    autoComplete="new-password"
                    {...register('password')}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="パスワードを再入力"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登録中...' : 'アカウントを作成'}
            </Button>
        </form>
    )
}

export type { SignupFormValues }
