'use strict';
// Entry point used by the GitHub Actions workflow. Reads the issue title and author
// from environment variables (never from shell interpolation) and updates state + README.
const fs = require('node:fs');
const path = require('node:path');
const { newState, parseCommand, apply, inject } = require('./engine');

const root = path.join(__dirname, '..');
const statePath = path.join(__dirname, 'state.json');
const readmePath = path.join(root, 'README.md');
const resultPath = path.join(__dirname, 'result.txt');

const login = /^[A-Za-z0-9-]{1,39}$/.test(process.env.ISSUE_USER || '') ? process.env.ISSUE_USER : 'someone';
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : newState();
const cmd = parseCommand(process.env.ISSUE_TITLE);
const out = apply(state, cmd, login, Math.random);

if (out.changed) {
  fs.writeFileSync(statePath, JSON.stringify(out.state, null, 2) + '\n');
  fs.writeFileSync(readmePath, inject(fs.readFileSync(readmePath, 'utf8'), out.state));
}
fs.writeFileSync(resultPath, `Hi @${login}! ${out.message}\n`);
console.log(out.message);
