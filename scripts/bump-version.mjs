#!/usr/bin/env node
/**
 * Manual version bump — run BEFORE committing the release commit.
 *
 *   npm run bump "feat: my release subject"
 *   git add package.json src/data/version.ts src/data/changelog.ts
 *   git commit
 *
 * Bumps patch in package.json + src/data/version.ts and prepends a new entry
 * to src/data/changelog.ts using the subject passed on argv[2] (or .git/COMMIT_EDITMSG
 * as fallback). Stages the modified files.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const PKG = path.join(ROOT, 'package.json')
const VER = path.join(ROOT, 'src/data/version.ts')
const CHG = path.join(ROOT, 'src/data/changelog.ts')

const [,, subjectArg] = process.argv
const msgFile = path.join(ROOT, '.git/COMMIT_EDITMSG')

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
  if (subjectArg) return subjectArg.trim()
  try {
    const raw = fs.readFileSync(msgFile, 'utf-8')
    const first = raw.split('\n').find(l => l.trim() && !l.startsWith('#'))
    return (first || 'release').trim()
  } catch { return 'release' }
}

const subject = readCommitSubject()

const pkg = readJson(PKG)
const next = bumpPatch(pkg.version || '0.1.0')
pkg.version = next
writeJson(PKG, pkg)

const verSrc = `// Bumped by scripts/bump-version.mjs (npm run bump).\n// Format: MAJOR.MINOR.PATCH\nexport const VERSION = '${next}'\n`
fs.writeFileSync(VER, verSrc)

const summary = subject.replace(/'/g, "\\'")
const chgRaw = fs.readFileSync(CHG, 'utf-8')
const newEntry = `  {\n    version: '${next}',\n    date: '${today()}',\n    summary: '${summary}',\n  },\n`
const updated = chgRaw.replace(/(export const CHANGELOG: ChangelogEntry\[\] = \[\s*\n)/, `$1${newEntry}`)
fs.writeFileSync(CHG, updated)

execSync(`git add "${PKG}" "${VER}" "${CHG}"`, { cwd: ROOT })

console.log(`[version] bumped to ${next} — ${summary}`)
