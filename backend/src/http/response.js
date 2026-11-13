export function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(data))
}

export function redirect(response, location) {
  response.writeHead(303, { Location: location })
  response.end()
}

export async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') return null

  const chunks = []
  let size = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > 8192) {
      request.resume()
      return null
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}
