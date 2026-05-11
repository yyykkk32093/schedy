#!/usr/bin/env node
// eslint-suppress.mjs
// Phase 0: 既存違反に file-level disable コメントを追加（Phase 2 で順次解消）
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const out = (() => {
    try {
        return execSync('pnpm -s lint --format=json', { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e) {
        return e.stdout?.toString() ?? '';
    }
})();
const data = JSON.parse(out);

const TAG = '/* eslint-disable no-restricted-imports -- TODO(Phase 2): DDD 違反矯正対象 */';

let touched = 0;
for (const file of data) {
    const errs = file.messages.filter((m) => m.severity === 2 && m.ruleId === 'no-restricted-imports');
    if (!errs.length) continue;
    const content = readFileSync(file.filePath, 'utf8');
    if (content.includes(TAG)) continue;
    writeFileSync(file.filePath, `${TAG}\n${content}`);
    touched++;
    console.log(`patched: ${file.filePath}`);
}
console.log(`done. patched=${touched}`);
