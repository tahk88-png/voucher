#!/usr/bin/env node
/**
 * `npm run env:init`: create .env for local development from .env.example.
 *
 * .env.example's AUTH_SECRET is a placeholder, which lib/env.ts rejects at
 * boot, so a plain copy does not start. This copies the file and puts a fresh
 * random AUTH_SECRET in. An existing .env is never overwritten.
 */
const { randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

const ROOT = resolve(__dirname, '..');
const target = join(ROOT, '.env');
const example = join(ROOT, '.env.example');

if (existsSync(target)) {
  console.log('.env already exists; leaving it unchanged.');
  process.exit(0);
}

const template = readFileSync(example, 'utf8');
const secretLine = /^AUTH_SECRET=.*$/m;
if (!secretLine.test(template)) {
  console.error('[env:init] .env.example has no AUTH_SECRET line; update this script.');
  process.exit(1);
}
const content = template.replace(secretLine, `AUTH_SECRET=${randomBytes(32).toString('hex')}`);
writeFileSync(target, content, { mode: 0o600 });
console.log('Created .env from .env.example with a random AUTH_SECRET.');
