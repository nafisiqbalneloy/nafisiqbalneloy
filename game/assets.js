'use strict';
// Generates the animated SVG pieces used by the README board. Run: node game/assets.js
// SVG animation (SMIL/CSS) keeps running inside <img> tags on GitHub, unlike JavaScript.
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets', 'game');
const S = 104; // cell size in px

const defs = `<defs>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1b2433"/><stop offset="1" stop-color="#0f1520"/>
  </linearGradient>
</defs>`;

const svg = (inner, w = S, h = S) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">\n${defs}\n${inner}\n</svg>\n`;

const tile = (stroke, extra = '') =>
  `<rect x="3" y="3" width="${S - 6}" height="${S - 6}" rx="16" fill="url(#tile)" stroke="${stroke}" stroke-width="2">${extra}</rect>`;

function empty(n) {
  return svg(`${tile('#3b4a63', '<animate attributeName="stroke" values="#3b4a63;#58a6ff;#3b4a63" dur="2.6s" repeatCount="indefinite"/>')}
  <text x="52" y="64" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#58a6ff" opacity="0.55">${n}
    <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.6s" repeatCount="indefinite"/>
  </text>`);
}

const draw = (len, begin, dur = '0.35s') =>
  `<animate attributeName="stroke-dashoffset" from="${len}" to="0" begin="${begin}" dur="${dur}" fill="freeze"/>`;

function x(win) {
  const c = '#ff4d6d';
  const pulse = win
    ? `<animateTransform attributeName="transform" type="scale" additive="sum" values="1;1.08;1" dur="1.2s" begin="0.8s" repeatCount="indefinite"/>`
    : '';
  return svg(`${tile(win ? '#3fb950' : '#5a2a3a', win ? '<animate attributeName="stroke" values="#3fb950;#a6ffb5;#3fb950" dur="1.2s" repeatCount="indefinite"/>' : '')}
  <g filter="url(#glow)" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none">
    <line x1="30" y1="30" x2="74" y2="74" stroke-dasharray="63" stroke-dashoffset="63">${draw(63, '0s')}</line>
    <line x1="74" y1="30" x2="30" y2="74" stroke-dasharray="63" stroke-dashoffset="63">${draw(63, '0.3s')}</line>
    ${pulse ? `<g>${pulse}</g>` : ''}
  </g>`);
}

function o(win) {
  const c = '#4cc9f0';
  const r = 24;
  const len = Math.round(2 * Math.PI * r);
  return svg(`${tile(win ? '#3fb950' : '#1f4a5c', win ? '<animate attributeName="stroke" values="#3fb950;#a6ffb5;#3fb950" dur="1.2s" repeatCount="indefinite"/>' : '')}
  <g filter="url(#glow)">
    <circle cx="52" cy="52" r="${r}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${len}" stroke-dashoffset="${len}" transform="rotate(-90 52 52)">${draw(len, '0s', '0.6s')}</circle>
  </g>`);
}

function banner() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="110" viewBox="0 0 640 110" role="img" aria-label="Tic-Tac-Toe">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0" stop-color="#ff4d6d"/><stop offset="0.5" stop-color="#58a6ff"/><stop offset="1" stop-color="#4cc9f0"/>
    <animate attributeName="x1" values="-1;0" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="x2" values="0;1" dur="3s" repeatCount="indefinite"/>
  </linearGradient>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<text x="320" y="64" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" fill="url(#g)" filter="url(#glow)">TIC · TAC · TOE
  <animate attributeName="opacity" values="0;1" dur="1s" fill="freeze"/>
</text>
<g stroke-linecap="round" stroke-width="6" fill="none" filter="url(#glow)">
  <g stroke="#ff4d6d"><line x1="40" y1="30" x2="64" y2="54"/><line x1="64" y1="30" x2="40" y2="54"/>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="2.4s" repeatCount="indefinite"/></g>
  <circle cx="588" cy="42" r="13" stroke="#4cc9f0">
    <animateTransform attributeName="transform" type="translate" values="0 0;0 6;0 0" dur="2.4s" repeatCount="indefinite"/></circle>
</g>
<text x="320" y="92" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="15" fill="#8b949e">you are ❌ · pick a square · the bot answers in seconds
  <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.5;1" dur="2s" fill="freeze"/>
</text>
</svg>
`;
}

function generate() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = { 'banner.svg': banner(), 'x.svg': x(false), 'o.svg': o(false), 'x-win.svg': x(true), 'o-win.svg': o(true) };
  files['blank.svg'] = svg(tile('#2a3345'));
  for (let i = 1; i <= 9; i += 1) files[`empty-${i}.svg`] = empty(i);
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), body);
  return Object.keys(files);
}

if (require.main === module) console.log(`wrote ${generate().length} files to assets/game`);
module.exports = { generate };
