'use strict';
// Tic-tac-toe engine for the profile README. Pure functions, no dependencies.

const REPO = 'nafisiqbalneloy/nafisiqbalneloy';
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function newState(stats) {
  return {
    board: Array(9).fill(''),
    status: 'playing', // playing | won | lost | draw  (from the visitor's point of view)
    stats: stats || { games: 0, visitorWins: 0, botWins: 0, draws: 0 },
    players: [],
    last: null,
  };
}

function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function parseCommand(title) {
  const m = /^ttt\|(?:(move)\|([0-8])|(new))$/.exec(String(title || '').trim());
  if (!m) return null;
  return m[1] ? { type: 'move', cell: Number(m[2]) } : { type: 'new' };
}

function empties(board) {
  return board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
}

// Bot (O): win if it can, block if it must, otherwise mostly centre/corners with some randomness,
// so a clever visitor can actually beat it.
function botMove(board, rng) {
  const free = empties(board);
  const completing = (mark) =>
    free.find((i) => {
      const t = board.slice();
      t[i] = mark;
      return winner(t) === mark;
    });
  const win = completing('O');
  if (win !== undefined) return win;
  const block = completing('X');
  if (block !== undefined) return block;
  if (rng() < 0.75) {
    const pref = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter((i) => free.includes(i));
    if (pref.length) return pref[0];
  }
  return free[Math.floor(rng() * free.length)];
}

function finish(state, outcome) {
  state.status = outcome;
  state.stats.games += 1;
  if (outcome === 'won') state.stats.visitorWins += 1;
  else if (outcome === 'lost') state.stats.botWins += 1;
  else state.stats.draws += 1;
}

function remember(state, login, text) {
  state.last = { player: login, text };
  if (login && !state.players.includes(login)) {
    state.players.unshift(login);
    state.players = state.players.slice(0, 5);
  }
}

// Returns { state, message, changed }.
function apply(state, cmd, login, rng) {
  if (!cmd) return { state, changed: false, message: 'That does not look like a game move. Please use the links in the README.' };
  if (cmd.type === 'new') {
    if (state.status === 'playing') {
      return { state, changed: false, message: 'A game is still in progress, so there is nothing to reset. Make your move!' };
    }
    const next = newState(state.stats);
    next.players = state.players;
    next.last = state.last;
    return { state: next, changed: true, message: 'New game started. You are ❌ and move first.' };
  }
  if (state.status !== 'playing') {
    return { state, changed: false, message: 'This game is over. Use the "Play again" link in the README.' };
  }
  if (state.board[cmd.cell]) {
    return { state, changed: false, message: 'That square is already taken. Pick an empty one from the README.' };
  }
  const s = JSON.parse(JSON.stringify(state));
  s.board[cmd.cell] = 'X';
  let text = `placed ❌ on square ${cmd.cell + 1}`;
  if (winner(s.board) === 'X') {
    finish(s, 'won');
    remember(s, login, `${text} and won the game`);
    return { state: s, changed: true, message: 'You won! 🎉 Nicely played.' };
  }
  if (!empties(s.board).length) {
    finish(s, 'draw');
    remember(s, login, `${text} and drew the game`);
    return { state: s, changed: true, message: 'A draw. 🤝' };
  }
  const reply = botMove(s.board, rng);
  s.board[reply] = 'O';
  if (winner(s.board) === 'O') {
    finish(s, 'lost');
    remember(s, login, `${text}, bot answered on ${reply + 1} and won`);
    return { state: s, changed: true, message: `I played ⭕ on square ${reply + 1} and won this one. Try again!` };
  }
  if (!empties(s.board).length) {
    finish(s, 'draw');
    remember(s, login, `${text}, bot answered on ${reply + 1}; draw`);
    return { state: s, changed: true, message: `I played ⭕ on square ${reply + 1}. It is a draw. 🤝` };
  }
  remember(s, login, `${text}, bot answered on ${reply + 1}`);
  return { state: s, changed: true, message: `Move accepted. I answered with ⭕ on square ${reply + 1}.` };
}

function issueLink(label, title) {
  const t = encodeURIComponent(title);
  const body = encodeURIComponent('Just press "Submit new issue". Please do not edit the title.');
  return `[${label}](https://github.com/${REPO}/issues/new?title=${t}&body=${body})`;
}

const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

function render(state) {
  const playing = state.status === 'playing';
  const cell = (i) => {
    if (state.board[i] === 'X') return '❌';
    if (state.board[i] === 'O') return '⭕';
    return playing ? issueLink(NUM[i], `ttt|move|${i}`) : '▫️';
  };
  const rows = [0, 3, 6].map((r) => `| ${cell(r)} | ${cell(r + 1)} | ${cell(r + 2)} |`);
  const table = ['| | | |', '|:-:|:-:|:-:|', ...rows].join('\n');
  const headline = {
    playing: 'Your move! You are ❌. Click a numbered square to play (it opens a pre-filled issue, just press **Submit new issue**).',
    won: '🎉 **A visitor won this round.**',
    lost: '🤖 **The bot won this round.**',
    draw: '🤝 **This round was a draw.**',
  }[state.status];
  const again = playing ? '' : `\n\n👉 ${issueLink('**Play again**', 'ttt|new')}`;
  const { games, visitorWins, botWins, draws } = state.stats;
  const last = state.last ? `\n\n<sub>Last move: [@${state.last.player}](https://github.com/${state.last.player}) ${state.last.text}.</sub>` : '';
  const who = state.players.length
    ? `\n\n<sub>Recent players: ${state.players.map((p) => `[@${p}](https://github.com/${p})`).join(', ')}</sub>`
    : '';
  return [
    '<div align="center">',
    '',
    '### 🎮 Play Tic-Tac-Toe with me',
    '',
    headline,
    '',
    table,
    again.trimStart() ? again : '',
    '',
    `<sub>Rounds played: **${games}** · Visitors won: **${visitorWins}** · Bot won: **${botWins}** · Draws: **${draws}**</sub>`,
    last.trim() ? last.trim() : '',
    who.trim() ? who.trim() : '',
    '',
    '<sub>Powered by GitHub Actions: every move is an issue that a workflow turns into a commit.</sub>',
    '',
    '</div>',
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

const START = '<!-- GAME:START -->';
const END = '<!-- GAME:END -->';

function inject(readme, state) {
  const a = readme.indexOf(START);
  const b = readme.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error('GAME markers not found in README');
  return `${readme.slice(0, a + START.length)}\n${render(state)}\n${readme.slice(b)}`;
}

module.exports = { newState, winner, parseCommand, botMove, apply, render, inject, START, END };
