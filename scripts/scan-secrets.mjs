#!/usr/bin/env node
/**
 * Scans the staged diff for common secret patterns.
 * Exits non-zero if any are found — blocks the commit.
 * Bypass with: git commit --no-verify  (use sparingly!)
 */
import { execSync } from 'node:child_process'

const PATTERNS = [
  { re: /\bghp_[A-Za-z0-9]{20,}\b/g,        label: 'GitHub Personal Access Token (ghp_)' },
  { re: /\bgho_[A-Za-z0-9]{20,}\b/g,        label: 'GitHub OAuth Token (gho_)' },
  { re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,label: 'GitHub fine-grained PAT' },
  { re: /\bsk-[A-Za-z0-9_-]{20,}\b/g,       label: 'OpenAI / Anthropic-style key (sk-)' },
  { re: /\bAKIA[0-9A-Z]{16}\b/g,            label: 'AWS Access Key ID' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,label: 'Slack token' },
  { re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, label: 'Private key block' },
  { re: /\b[A-Z0-9_]{0,15}(SECRET|TOKEN|PASSWORD|API_KEY)\s*=\s*["'][^"'\s]{8,}["']/g, label: 'Inline secret assignment' },
]

let staged = ''
try {
  staged = execSync('git diff --cached --no-color', { encoding: 'utf-8' })
} catch {
  // No staged changes — nothing to scan
  process.exit(0)
}

const hits = []
for (const { re, label } of PATTERNS) {
  const matches = [...staged.matchAll(re)]
  for (const m of matches) {
    hits.push({ label, match: m[0].slice(0, 16) + '…' })
  }
}

if (hits.length > 0) {
  console.error('\n✗ Secret pattern(s) detected in staged changes:\n')
  for (const h of hits) console.error(`  • ${h.label}: ${h.match}`)
  console.error('\n  Refusing to commit. Revoke the credential, remove it from the diff,')
  console.error('  and try again. To override (DO NOT do this for real secrets):')
  console.error('    git commit --no-verify\n')
  process.exit(1)
}
