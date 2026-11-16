"""Builds assets/lego-banner.svg: the name assembled from LEGO-style bricks (python3 scripts/make-banner.py)."""
import random
font = {
'N':["10001","11001","10101","10011","10001","10001","10001"],
'A':["01110","10001","10001","11111","10001","10001","10001"],
'F':["11111","10000","11110","10000","10000","10000","10000"],
'I':["11111","00100","00100","00100","00100","00100","11111"],
'S':["01111","10000","10000","01110","00001","00001","11110"],
'E':["11111","10000","11110","10000","10000","10000","11111"],
'L':["10000","10000","10000","10000","10000","10000","11111"],
'O':["01110","10001","10001","10001","10001","10001","01110"],
'Y':["10001","10001","01010","00100","00100","00100","00100"],
'Q':["01110","10001","10001","10001","10101","10010","01101"],
'B':["11110","10001","10001","11110","10001","10001","11110"],
' ':["00000"]*7,
}
word = "NAFIS IQBAL NELOY"
cell, gap = 6, 1
W, H = 900, 150
widths = [3 if c == ' ' else 5 for c in word]
cols = sum(widths) + gap * (len(word) - 1)
x0 = (W - cols * cell) / 2
y0 = 30
rnd = random.Random(11)
tones = ["#f2b705", "#f2b705", "#f2b705", "#ffc933"]   # one family of yellows

o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Nafis Iqbal Neloy, built from LEGO-style bricks">']
o.append('''<style>
.b{animation:fly 9s cubic-bezier(.2,.9,.3,1.15) infinite both}
@keyframes fly{
 0%{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}
 4%{opacity:1}
 16%{transform:translate(0,0) rotate(0);opacity:1}
 88%{transform:translate(0,0) rotate(0);opacity:1}
 97%,100%{transform:translate(0,0) rotate(0);opacity:0}
}
.sh{animation:shine 9s linear infinite both;fill:#fff}
@keyframes shine{0%,22%{opacity:0}28%{opacity:.7}36%,100%{opacity:0}}
.sub{animation:fade 9s ease infinite both;font:600 12px "Courier New",monospace;fill:#9aa3b5;letter-spacing:3px}
@keyframes fade{0%,26%{opacity:0}36%,86%{opacity:1}96%,100%{opacity:0}}
.cur{animation:blink 1s steps(1) infinite;fill:#f2b705}
@keyframes blink{50%{opacity:0}}
</style>''')
o.append(f'<rect width="{W}" height="{H}" rx="12" fill="#161a23"/>')
o.append(f'<path d="M0 {H-12} H{W} V{H-12} a12 12 0 0 1 -12 12 H12 a12 12 0 0 1 -12 -12z" fill="#2b3140"/>')
for sx in range(18, W, 28):
    o.append(f'<ellipse cx="{sx}" cy="{H-7}" rx="6" ry="2.4" fill="#3a4152"/>')
cx = 0
for ci, ch in enumerate(word):
    g = font[ch]; w = widths[ci]
    if ch != ' ':
        for r, row in enumerate(g):
            for c, v in enumerate(row):
                if v == '1':
                    x = x0 + (cx + c) * cell; y = y0 + r * cell
                    s = cell - 1
                    dx = rnd.randint(-160, 160); dy = rnd.randint(-120, -40); rot = rnd.randint(-120, 120)
                    d = round(((cx + c) / cols) * 1.3 + r * 0.03, 2)
                    sd = round(((cx + c) / cols) * 0.6 + 0.0, 2)
                    t = rnd.choice(tones)
                    o.append(f'<g class="b" style="--dx:{dx}px;--dy:{dy}px;--r:{rot}deg;animation-delay:{d}s;transform-box:fill-box;transform-origin:center"><rect x="{x:.1f}" y="{y:.1f}" width="{s}" height="{s}" rx="1.2" fill="{t}"/><rect x="{x:.1f}" y="{y+s-1.6:.1f}" width="{s}" height="1.6" rx=".8" fill="#000" opacity=".22"/><ellipse cx="{x+s/2:.1f}" cy="{y+s/2-.6:.1f}" rx="{s*0.28:.1f}" ry="{s*0.18:.1f}" fill="#fff" opacity=".35"/><rect class="sh" style="animation-delay:{sd}s" x="{x:.1f}" y="{y:.1f}" width="{s}" height="{s}" rx="1.2"/></g>')
    cx += w + gap
sy = y0 + 7 * cell + 28
line = "CSE @ UIU  ·  AI AND DATA SCIENCE  ·  AI SECURITY"
adv = 7.2 + 3          # 12px monospace glyph + letter-spacing
o.append(f'<text class="sub" x="{W/2}" y="{sy}" text-anchor="middle" xml:space="preserve">{line}</text>')
o.append(f'<rect class="cur" x="{W/2 + len(line)*adv/2 + 2:.1f}" y="{sy-10}" width="7" height="12"/>')
o.append('</svg>')
open('assets/lego-banner.svg', 'w').write('\n'.join(o))
print(len('\n'.join(o)))
