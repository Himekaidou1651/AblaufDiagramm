import { mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const testsDir = join(root, 'tests')
const outDir = join(root, '.tmp-tests')

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectTestFiles(fullPath))
    } else if (entry.name.endsWith('.test.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const testFiles = await collectTestFiles(testsDir)
if (testFiles.length === 0) {
  console.log('No test files found.')
  process.exit(0)
}

for (const testFile of testFiles) {
  const rel = relative(testsDir, testFile).replace(/\.ts$/, '.mjs')
  const outfile = join(outDir, rel)
  await mkdir(dirname(outfile), { recursive: true })

  await build({
    entryPoints: [testFile],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    sourcemap: 'inline',
    alias: {
      '@': join(root, 'src'),
    },
  })

  await import(pathToFileURL(outfile).href)
  console.log(`ok ${relative(root, testFile)}`)
}

console.log(`\n${testFiles.length} test file(s) passed.`)
