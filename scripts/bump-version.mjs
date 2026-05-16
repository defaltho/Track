#!/usr/bin/env node
/**
 * Bumps patch version (package.json + src/data/version.ts) and prepends
 * an entry to src/data/changelog.ts using the actual commit subject.
 *
 * Run as a `prepare-commit-msg` hook: receives the commit message file
 * path as argv[2] and the message source as argv[3].
 *   .git/hooks/prepare-commit-msg "$1" "$2" "$3"  → node scripts/bump-version.mjs "$1" "$2"
 *
 * Skips on merge / squash / amend so we don't double-bump.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const PKG = path.join(ROOT, 'package.json')
const VER = path.join(ROOT, 'src/data/version.ts')
const CHG = path.join(ROOT, 'src/data/changelog.ts')

const [,, msgFileArg, source] = process.argv

// Skip on merges / squashes / template / commit-amend (--amend uses 'commit')
if (source === 'merge' || source === 'squash' || source === 'commit') {
  process.exit(0)
}

const msgFile = msgFileArg || path.join(ROOT, '.git/COMMIT_EDITMSG')

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
    const raw = fs.readFileSync(msgFile, 'utf-8')
    const first = raw.split('\n').find(l => l.trim() && !l.startsWith('#'))
    return (first || 'commit').trim()
  } catch { return 'commit' }
}

const subject = readCommitSubject()

// Empty / no-message commits — nothing to log
if (!subject || subject === 'commit') {
  process.exit(0)
}

const pkg = readJson(PKG)
const next = bumpPatch(pkg.version || '0.1.0')
pkg.version = next
writeJson(PKG, pkg)

const verSrc = `// Auto-bumped by .git/hooks/prepare-commit-msg on every commit.\n// Format: MAJOR.MINOR.PATCH\nexport const VERSION = '${next}'\n`
fs.writeFileSync(VER, verSrc)

const summary = subject.replace(/'/g, "\\'")
const chgRaw = fs.readFileSync(CHG, 'utf-8')
const newEntry = `  {\n    version: '${next}',\n    date: '${today()}',\n    summary: '${summary}',\n  },\n`
const updated = chgRaw.replace(/(export const CHANGELOG: ChangelogEntry\[\] = \[\s*\n)/, `$1${newEntry}`)
fs.writeFileSync(CHG, updated)

execSync(`git add "${PKG}" "${VER}" "${CHG}"`, { cwd: ROOT })

console.log(`[version] bumped to ${next} — ${summary}`)
