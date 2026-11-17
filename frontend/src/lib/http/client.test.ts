import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api-error'
import { api, http, onUnauthenticated } from './client'

function respond(status: number, body: unknown): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const response = { data: body, status, statusText: '', headers: {}, config } as AxiosResponse
    if (status >= 400) throw new AxiosError('failed', String(status), config, null, response)
    return response
  }
}

describe('api client', () => {
  const original = http.defaults.adapter
  afterEach(() => {
    http.defaults.adapter = original
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('unwraps the ApiResponse envelope', async () => {
    http.defaults.adapter = respond(200, {
      success: true,
      code: 'OK',
      message: 'Thành công',
      data: { hello: 'world' },
    })
    await expect(api.get('/api/anything')).resolves.toEqual({ hello: 'world' })
  })

  it('returns undefined for empty 204 responses', async () => {
    document.cookie = 'XSRF-TOKEN=abc'
    http.defaults.adapter = respond(204, '')
    await expect(api.post('/api/auth/logout')).resolves.toBeUndefined()
  })

  it('supports delete requests', async () => {
    document.cookie = 'XSRF-TOKEN=abc'
    http.defaults.adapter = respond(200, {
      success: true,
      code: 'OK',
      message: 'Đã xóa',
      data: null,
    })
    await expect(api.delete('/api/study/tasks/123')).resolves.toBeNull()
  })

  it('turns error envelopes into ApiError with field errors', async () => {
    http.defaults.adapter = respond(400, {
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Kiểm tra lại',
      errors: { months: 'sai' },
      requestId: 'r-1',
    })
    const error = await api.get('/api/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 400,
      fieldErrors: { months: 'sai' },
      requestId: 'r-1',
    })
  })

  it('maps connection failures to NETWORK_ERROR', async () => {
    http.defaults.adapter = async (config) => {
      throw new AxiosError('down', 'ERR_NETWORK', config)
    }
    await expect(api.get('/api/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('notifies listeners when a protected call returns 401 but not for the session probe', async () => {
    const listener = vi.fn()
    const off = onUnauthenticated(listener)
    http.defaults.adapter = respond(401, { success: false, code: 'UNAUTHENTICATED', message: 'hết hạn' })

    await api.get('/api/session').catch(() => undefined)
    expect(listener).not.toHaveBeenCalled()

    await api.get('/api/study/goal').catch(() => undefined)
    expect(listener).toHaveBeenCalledOnce()
    off()
  })

  it('fetches the CSRF cookie before the first write', async () => {
    const calls: string[] = []
    http.defaults.adapter = async (config) => {
      calls.push(`${config.method} ${config.url}`)
      if (config.url === '/api/session') document.cookie = 'XSRF-TOKEN=fresh'
      return {
        data: { success: true, code: 'OK', message: '', data: null },
        status: 200,
        statusText: '',
        headers: {},
        config,
      } as AxiosResponse
    }
    await api.post('/api/auth/login', {})
    expect(calls).toEqual(['get /api/session', 'post /api/auth/login'])
  })
})
