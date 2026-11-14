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

export const registerSchema = z.object({
  email,
  password: z.string().min(12, 'Mật khẩu cần ít nhất 12 ký tự.').max(256, 'Mật khẩu tối đa 256 ký tự.'),
})

export type CredentialsForm = z.infer<typeof loginSchema>
