// Static hosts serve 404.html for unknown paths; making it the app shell lets deep links work.
import { copyFile } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '..', 'dist')
await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'))
console.log('[build] wrote dist/404.html for static-host deep links')
