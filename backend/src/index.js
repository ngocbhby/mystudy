import { createServer } from 'node:http'
import { createApi } from './api.js'
import { serveFrontend } from './http/static.js'

const dev = process.argv.includes('--dev')
const port = dev ? 3001 : Number(process.env.PORT || 3000)
const host = dev ? '127.0.0.1' : '0.0.0.0'
const api = createApi(process.env, dev ? 'http://localhost:5173' : `http://localhost:${port}`)

const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  if (url.pathname.startsWith('/api/')) return api.handle(request, response, url)
  if (!dev) return serveFrontend(request, response, url)
  response.writeHead(404)
  response.end()
})

server.once('close', () => void api.close())
server.listen(port, host, () => {
  console.log(dev ? `MyStudy API: http://${host}:${port}` : `MyStudy đang chạy tại cổng ${port}.`)
})
