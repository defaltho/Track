#!/usr/bin/env node
/**
 * Bumps the patch version in package.json + src/data/version.ts
 * and prepends a new entry to src/data/changelog.ts using the current
 * commit subject (read from .git/COMMIT_EDITMSG).
 *
 * Invoked from .git/hooks/pre-commit. Stages the modified files.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const PKG = path.join(ROOT, 'package.json')
const VER = path.join(ROOT, 'src/data/version.ts')
const CHG = path.join(ROOT, 'src/data/changelog.ts')
const MSG = path.join(ROOT, '.git/COMMIT_EDITMSG')

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')) }
function writeJson(p, v) { fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n') }

function bumpPatch(v) {
  const [maj, min, pat] = v.split('.').map(Number)
  return `${maj}.${min}.${(pat || 0) + 1}`
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readCommitSubject() {
  try {
    const raw = fs.readFileSync(MSG, 'utf-8')
    const first = raw.split('\n').find(l => l.trim() && !l.startsWith('#'))
    return (first || 'commit').trim()
  } catch { return 'commit' }
}

const pkg = readJson(PKG)
const next = bumpPatch(pkg.version || '0.1.0')
pkg.version = next
writeJson(PKG, pkg)

const verSrc = `// Auto-bumped by .git/hooks/pre-commit on every commit.\n// Format: MAJOR.MINOR.PATCH\nexport const VERSION = '${next}'\n`
fs.writeFileSync(VER, verSrc)

const summary = readCommitSubject().replace(/'/g, "\\'")
const chgRaw = fs.readFileSync(CHG, 'utf-8')
const newEntry = `  {\n    version: '${next}',\n    date: '${today()}',\n    summary: '${summary}',\n  },\n`
const updated = chgRaw.replace(/(export const CHANGELOG: ChangelogEntry\[\] = \[\s*\n)/, `$1${newEntry}`)
fs.writeFileSync(CHG, updated)

execSync(`git add "${PKG}" "${VER}" "${CHG}"`, { cwd: ROOT })

console.log(`[version] bumped to ${next} — ${summary}`)
