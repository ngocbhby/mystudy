import { z } from 'zod'

const schema = z.object({
  VITE_APP_STAGE: z.enum(['development', 'staging', 'production']),
  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  VITE_ENABLE_DEVTOOLS: z.enum(['true', 'false']).default('false'),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(
    `Cấu hình môi trường không hợp lệ: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
  )
}

/** Cấu hình môi trường đã kiểm tra kiểu. Mọi nơi trong ứng dụng đọc từ đây, không dùng import.meta.env trực tiếp. */
export const env = {
  stage: parsed.data.VITE_APP_STAGE,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  apiTimeoutMs: parsed.data.VITE_API_TIMEOUT_MS,
  devtools: parsed.data.VITE_ENABLE_DEVTOOLS === 'true',
  isProduction: parsed.data.VITE_APP_STAGE === 'production',
} as const
