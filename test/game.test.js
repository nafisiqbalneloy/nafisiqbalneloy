'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { newState, winner, parseCommand, apply, render, inject, START, END } = require('../game/engine');

const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };

test('parseCommand accepts only the exact formats', () => {
  assert.deepEqual(parseCommand('ttt|move|4'), { type: 'move', cell: 4 });
  assert.deepEqual(parseCommand('ttt|new'), { type: 'new' });
  for (const bad of ['ttt|move|9', 'ttt|move|-1', 'ttt|move|4;rm', 'TTT|move|1', 'hello', '', null, 'ttt|move|01']) {
    assert.equal(parseCommand(bad), null, String(bad));
  }
});

test('winner detects lines', () => {
  assert.equal(winner(['X', 'X', 'X', '', '', '', '', '', '']), 'X');
  assert.equal(winner(['O', '', '', '', 'O', '', '', '', 'O']), 'O');
  assert.equal(winner(Array(9).fill('')), null);
});

test('a move is accepted and the bot answers', () => {
  const r = apply(newState(), { type: 'move', cell: 0 }, 'alice', seq(0.1));
  assert.ok(r.changed);
  assert.equal(r.state.board[0], 'X');
  assert.equal(r.state.board.filter((c) => c === 'O').length, 1);
  assert.deepEqual(r.state.players, ['alice']);
});

test('taken squares and finished games are rejected', () => {
  const s = apply(newState(), { type: 'move', cell: 0 }, 'a', seq(0.1)).state;
  assert.equal(apply(s, { type: 'move', cell: 0 }, 'b', seq(0.1)).changed, false);
  const over = { ...s, status: 'won' };
  assert.equal(apply(over, { type: 'move', cell: 8 }, 'b', seq(0.1)).changed, false);
});

test('bot blocks an immediate visitor win', () => {
  const t = newState();
  t.board = ['X', '', '', '', 'O', '', '', '', ''];
  const r = apply(t, { type: 'move', cell: 1 }, 'a', seq(0.1));
  assert.equal(r.state.board[2], 'O');
});

test('visitor can win and stats update', () => {
  const s = newState();
  s.board = ['X', 'X', '', 'O', 'O', '', '', '', ''];
  const r = apply(s, { type: 'move', cell: 2 }, 'a', seq(0.1));
  assert.equal(r.state.status, 'won');
  assert.equal(r.state.stats.visitorWins, 1);
  assert.equal(r.state.stats.games, 1);
});

test('bot can win', () => {
  const s = newState();
  s.board = ['X', '', 'X', 'O', 'O', '', '', '', ''];
  const r = apply(s, { type: 'move', cell: 8 }, 'a', seq(0.1));
  assert.equal(r.state.status, 'lost');
  assert.equal(r.state.stats.botWins, 1);
});

test('new game only after the previous one ends and keeps stats', () => {
  const s = newState();
  assert.equal(apply(s, { type: 'new' }, 'a', seq(0.1)).changed, false);
  const done = { ...s, status: 'draw', stats: { games: 3, visitorWins: 1, botWins: 1, draws: 1 } };
  const r = apply(done, { type: 'new' }, 'a', seq(0.1));
  assert.ok(r.changed);
  assert.equal(r.state.status, 'playing');
  assert.equal(r.state.stats.games, 3);
});

test('render links empty squares only while playing', () => {
  const html = render(newState());
  assert.equal((html.match(/issues\/new\?title=ttt%7Cmove%7C/g) || []).length, 9);
  assert.equal((html.match(/assets\/game\/empty-\d\.svg/g) || []).length, 9);
  assert.match(html, /assets\/game\/banner\.svg/);
  const over = { ...newState(), status: 'draw' };
  assert.equal((render(over).match(/ttt%7Cmove/g) || []).length, 0);
  assert.match(render(over), /ttt%7Cnew/);
});

test('winning squares use the win animation', () => {
  const s = newState();
  s.board = ['X', 'X', 'X', 'O', 'O', '', '', '', ''];
  s.status = 'won';
  const html = render(s);
  assert.equal((html.match(/x-win\.svg/g) || []).length, 3);
  assert.equal((html.match(/assets\/game\/o\.svg/g) || []).length, 2);
});

test('inject replaces only the marked region', () => {
  const readme = `before\n${START}\nold\n${END}\nafter\n`;
  const out = inject(readme, newState());
  assert.ok(out.startsWith('before\n'));
  assert.ok(out.endsWith('\nafter\n'));
  assert.ok(!out.includes('old'));
  assert.throws(() => inject('nothing', newState()));
});
