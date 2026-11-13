import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

const dist = new URL('../../../frontend/dist/', import.meta.url)
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export async function serveFrontend(request, response, url) {
  const isIndex = ['/', '/thiet-lap-muc-tieu', '/lo-trinh', '/tong-quan', '/kho-de-thi', '/thi-thu'].includes(url.pathname)
    || /^\/thi-thu\/[a-f0-9-]{36}(?:\/(?:de|dap-an))?$/i.test(url.pathname)
  const isAsset = /^\/assets\/[\w.-]+$/.test(url.pathname)
  const isDocument = /^\/tai-lieu\/[a-z0-9-]+\.pdf$/.test(url.pathname)
  if (request.method !== 'GET' || (!isIndex && !isAsset && !isDocument)) {
    response.writeHead(404)
    return response.end()
  }

  const path = isIndex ? 'index.html' : url.pathname.slice(1)
  try {
    const body = await readFile(new URL(path, dist))
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(path)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    response.end(body)
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500)
    response.end()
  }
}
