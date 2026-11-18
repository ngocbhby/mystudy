import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email.')
  .max(254, 'Email quá dài.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.').max(1024, 'Mật khẩu quá dài.'),
})

export const registerSchema = z
  .object({
    email,
    password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(256, 'Mật khẩu tối đa 256 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z
  .object({
    email,
    password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(256, 'Mật khẩu tối đa 256 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export interface CredentialsForm {
  email: string
  password: string
  confirmPassword?: string
}
