// Builds dist/tracker.svg: a small pixel bot that walks your contribution graph and eats the squares.
// Usage: GITHUB_TOKEN=... node scripts/make-tracker.mjs <login>      (or: node scripts/make-tracker.mjs --demo)
import { mkdirSync, writeFileSync } from "node:fs";

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const PALETTE = ["#232834", "#5c4a08", "#946f05", "#cf9b06", "#f2b705"];

async function load(login) {
  const q = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionLevel date}}}}}}`;
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "tracker" },
    body: JSON.stringify({ query: q, variables: { login } }),
  });
  const j = await r.json();
  const cal = j?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error("No calendar: " + JSON.stringify(j).slice(0, 300));
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => LEVELS[d.contributionLevel] ?? 0)),
  };
}

function demo() {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return { total: 412, weeks: Array.from({ length: 53 }, () => Array.from({ length: 7 }, () => (rnd() < 0.55 ? 0 : 1 + Math.floor(rnd() * 4)))) };
}

const arg = process.argv[2];
const { total, weeks } = arg === "--demo" ? demo() : await load(arg);

const CELL = 11, GAP = 3, P = CELL + GAP;
const PADX = 24, TOPY = 46;
const W = PADX * 2 + weeks.length * P - GAP;
const H = TOPY + 7 * P - GAP + 24;
const DT = 0.06;                       // seconds per square
const steps = weeks.reduce((n, w) => n + w.length, 0);
const T = +(steps * DT + 3).toFixed(2); // loop length

// walking order: down one column, up the next
const order = [];
weeks.forEach((w, c) => {
  const rows = w.map((_, r) => r);
  (c % 2 ? rows.reverse() : rows).forEach((r) => order.push([c, r]));
});
const when = new Map(order.map(([c, r], i) => [`${c},${r}`, i * DT]));

let css = `
.card{fill:#161a23}
.t{font:600 12px "Courier New",monospace;fill:#9aa3b5;letter-spacing:1px}
.walk{animation:walk ${T}s linear infinite}
.leg1{animation:l1 .24s steps(1) infinite}
.leg2{animation:l2 .24s steps(1) infinite}
.eye{animation:blink 3s steps(1) infinite}
@keyframes l1{0%{opacity:1}50%{opacity:0}}
@keyframes l2{0%{opacity:0}50%{opacity:1}}
@keyframes blink{0%,92%{opacity:1}96%{opacity:0}100%{opacity:1}}
`;

// bot position keyframes (centre of the bot sits on the square it is eating)
const cx = (c) => PADX + c * P + CELL / 2;
const cy = (r) => TOPY + r * P + CELL / 2;
let kf = "";
const pct = (t) => ((t / T) * 100).toFixed(3);
order.forEach(([c, r], i) => {
  const t = i * DT;
  const last = order[i + 1];
  const edge = !last || last[0] !== c || i === 0;
  if (edge || (order[i - 1] && order[i - 1][0] !== c)) {
    kf += `${pct(t)}%{transform:translate(${cx(c)}px,${cy(r)}px)}`;
  }
});
const lastCell = order[order.length - 1];
kf += `${pct(steps * DT)}%{transform:translate(${cx(lastCell[0])}px,${cy(lastCell[1])}px)}`;
kf += `${pct(steps * DT + 0.5)}%{transform:translate(${cx(lastCell[0]) + 40}px,${cy(lastCell[1])}px)}`;
kf += `100%{transform:translate(${cx(0) - 40}px,${cy(order[0][1])}px)}`;
css += `@keyframes walk{${kf}}`;
// the first keyframe must be 0%
css = css.replace(`@keyframes walk{${pct(0)}%`, `@keyframes walk{0%`);

let cells = "";
let n = 0;
weeks.forEach((w, c) => w.forEach((lvl, r) => {
  const x = PADX + c * P, y = TOPY + r * P;
  if (lvl === 0) {
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${PALETTE[0]}"/>`;
    return;
  }
  const t = when.get(`${c},${r}`);
  const k = `e${n}`;
  css += `@keyframes ${k}{0%,${pct(t)}%{fill:${PALETTE[lvl]}}${(+pct(t) + 0.01).toFixed(3)}%,99.9%{fill:${PALETTE[0]}}100%{fill:${PALETTE[lvl]}}}`;
  cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${PALETTE[lvl]}" style="animation:${k} ${T}s linear infinite"/>`;
  n++;
}));

// original pixel bot, 9 x 9 "pixels" of 2px, centred on (0,0)
const u = 2, o = -4.5 * u;
const px = (x, y, w, h, fill, cls = "") => `<rect ${cls ? `class="${cls}" ` : ""}x="${o + x * u}" y="${o + y * u}" width="${w * u}" height="${h * u}" fill="${fill}"/>`;
const bot = [
  px(4, 0, 1, 1, "#7dd3fc"),            // antenna tip
  px(4, 1, 1, 1, "#9aa3b5"),            // antenna
  px(1, 2, 7, 5, "#e7ecf5"),            // head / body
  px(2, 3, 5, 2, "#10131a"),            // visor
  px(3, 3, 1, 2, "#7dd3fc", "eye"),     // eyes
  px(5, 3, 1, 2, "#7dd3fc", "eye"),
  px(2, 7, 2, 2, "#9aa3b5", "leg1"),    // legs, two frames
  px(5, 7, 2, 2, "#9aa3b5", "leg1"),
  px(1, 7, 2, 2, "#9aa3b5", "leg2"),
  px(6, 7, 2, 2, "#9aa3b5", "leg2"),
].join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="A little pixel bot walking across my GitHub contribution graph">
<style>${css}</style>
<rect class="card" width="${W}" height="${H}" rx="12"/>
<text class="t" x="${PADX}" y="28">${total} CONTRIBUTIONS IN THE LAST YEAR</text>
${cells}
<g class="walk">${bot}</g>
</svg>`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/tracker.svg", svg);
console.log(`dist/tracker.svg ${W}x${H}, ${(svg.length / 1024).toFixed(0)} KB, loop ${T}s`);
