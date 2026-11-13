import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const frontend = new URL('../frontend/', import.meta.url)
const backend = new URL('../backend/', import.meta.url)
const require = createRequire(new URL('package.json', frontend))
const vitePackage = pathToFileURL(require.resolve('vite/package.json'))
const vite = fileURLToPath(new URL('bin/vite.js', vitePackage))

const children = []
let stopping = false

function stop(code, signal = 'SIGTERM') {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal)
  }
}

for (const [name, cwd, args] of [
  ['Backend', backend, ['--env-file-if-exists=.env.local', '--watch', 'src/index.js', '--dev']],
  ['Frontend', frontend, [vite]],
]) {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit' })
  children.push(child)
  child.once('error', (error) => {
    console.error(`Không thể chạy ${name}: ${error.message}`)
    stop(1)
  })
  child.once('exit', (code) => stop(code ?? 1))
}

process.once('SIGINT', () => stop(130, 'SIGINT'))
process.once('SIGTERM', () => stop(143))
