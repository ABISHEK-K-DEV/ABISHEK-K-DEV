// Profile card generator — renders every README card as an animated SVG.
//
//   node scripts/cards.mjs static            -> writes hand-designed cards to assets/
//   node scripts/cards.mjs live [outDir]     -> fetches GitHub data, writes live cards (default: dist/)
//
// Live mode reads GITHUB_TOKEN (or GH_TOKEN). Set MOCK_DATA=path.json to render from a fixture instead.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const USER = process.env.PROFILE_USER || "ABISHEK-K-DEV";
const FEATURED = ["react-toaster", "CollabHub", "FinaceFlow", "Voice-Controlled-AI-Using-ChatGPT-And-Other-Software-Tools"];

// ───────────────────────────── design system ─────────────────────────────

const C = {
  bg0: "#070a14", bg1: "#11162c", text: "#f3f4f6", sub: "#9aa3b5", dim: "#5b6478",
  violet: "#a78bfa", cyan: "#22d3ee", pink: "#f472b6", green: "#34d399", amber: "#fbbf24",
};
const SANS = "'Segoe UI',Inter,Ubuntu,'Helvetica Neue',Arial,sans-serif";
const MONO = "'JetBrains Mono','Cascadia Code',Consolas,'SFMono-Regular',Menlo,monospace";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
const fmt = (n) => (n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : n.toLocaleString("en-US"));
const r2 = (n) => Math.round(n * 100) / 100;

const BASE_CSS = `
  .sans{font-family:${SANS}} .mono{font-family:${MONO}}
  .fu{opacity:0;animation:fu .8s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .6s cubic-bezier(.34,1.56,.64,1) forwards}
  @keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
  .orb{animation:float 16s ease-in-out infinite}
  .orb2{animation-duration:21s;animation-direction:reverse}
  @keyframes float{0%,100%{transform:translate(0,0)}33%{transform:translate(50px,-25px)}66%{transform:translate(-35px,30px)}}
  .shine{animation:shine 7s ease-in-out infinite}
  @keyframes shine{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
  .twinkle{animation:tw 3s ease-in-out infinite}
  @keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
  .pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.2s ease-out infinite}
  @keyframes pulse{0%{transform:scale(1);opacity:.75}100%{transform:scale(3.2);opacity:0}}
  .bob{animation:bob 4s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .blink{animation:blink 1s steps(1) infinite} @keyframes blink{50%{opacity:0}}
`;

const delay = (s) => `style="animation-delay:${r2(s)}s"`;

/** Glass card frame with animated gradient border, drifting glow orbs, grid texture and a light sweep. */
function frame({ w, h, title, label, body, css = "", orbs = [C.violet, C.cyan], accent = C.violet }) {
  const R = 22;
  const stars = Array.from({ length: Math.round((w * h) / 26000) }, (_, i) => {
    const x = (i * 9973) % w, y = (i * 7919) % h;
    return `<circle class="twinkle" cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.4}" fill="#fff" ${delay((i % 7) * 0.45)}/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || title || "card")}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.bg0}"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient>
  <linearGradient id="bd" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.violet}"/><stop offset=".35" stop-color="${C.cyan}" stop-opacity=".25"/>
    <stop offset=".65" stop-color="${C.pink}" stop-opacity=".25"/><stop offset="1" stop-color="${C.pink}"/>
    <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="8s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect">
    <stop offset="0" stop-color="${C.violet}"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.pink}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0" dur="6s" repeatCount="indefinite"/>
  </linearGradient>
  <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#fff" stroke-opacity=".04"/></pattern>
  <radialGradient id="vig" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
  <mask id="gm"><rect width="${w}" height="${h}" fill="url(#vig)"/></mask>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.max(40, Math.min(w, h) / 5)}"/></filter>
  <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <clipPath id="clip"><rect width="${w}" height="${h}" rx="${R}"/></clipPath>
  <style>${BASE_CSS}${css}</style>
</defs>
<g clip-path="url(#clip)">
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <g filter="url(#blur)" opacity=".5">
    <circle class="orb" cx="${w * 0.12}" cy="${h * 0.1}" r="${Math.min(w, h) * 0.45}" fill="${orbs[0]}"/>
    <circle class="orb orb2" cx="${w * 0.9}" cy="${h * 0.95}" r="${Math.min(w, h) * 0.45}" fill="${orbs[1]}"/>
  </g>
  <rect width="${w}" height="${h}" fill="url(#grid)" mask="url(#gm)"/>
  ${stars}
  <rect class="shine" x="0" y="0" width="${w}" height="${h}" fill="url(#sweep)" transform="skewX(-20)"/>
</g>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${R - 1}" fill="none" stroke="url(#bd)" stroke-width="1.6"/>
${title ? header(title, accent) : ""}
${body}
</svg>`;
}

function header(title, accent) {
  return `<g class="fu">
  <rect x="32" y="34" width="4" height="22" rx="2" fill="url(#grad)"/>
  <text x="48" y="52" class="sans" font-size="20" font-weight="700" fill="${C.text}" letter-spacing=".3">${esc(title)}</text>
  <circle cx="${48 + title.length * 9.8 + 20}" cy="45" r="3.5" fill="${accent}"/><circle class="pulse" cx="${48 + title.length * 9.8 + 20}" cy="45" r="3.5" fill="${accent}"/>
</g>`;
}

/** Simple line icons (24×24 viewbox) for stats rows. */
const ICON = {
  star: "M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z",
  commit: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM2 12h6M16 12h6",
  pr: "M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 3a3 3 0 1 0 0 .01M18 21V9a4 4 0 0 0-4-4h-3M18 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM13 2l-2 3 2 3",
  issue: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8v5M12 16v.5",
  repo: "M5 4a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0-2 2zM5 20a2 2 0 0 0 2 2h12v-4",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6",
  fork: "M6 3a3 3 0 1 0 0 .01M18 3a3 3 0 1 0 0 .01M12 21a3 3 0 1 0 0-.01M6 6v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V6M12 12v6",
  flame: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6 0 2 1 3.5 2.5 3.5C11 9 10 6 12 2z",
  calendar: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4zM4 10h16M9 2v4M15 2v4",
  trophy: "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
};
const icon = (name, x, y, color, size = 20) =>
  `<path d="${ICON[name]}" transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${(1.8 * 24) / size}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Animated progress ring. */
function ring({ cx, cy, r, p, width = 10, color = "url(#grad)", begin = 0.4, dur = 1.6 }) {
  const c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, p)));
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="${width}"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${width + 6}" stroke-linecap="round" opacity=".35" filter="url(#soft)"
  stroke-dasharray="${r2(c)}" stroke-dashoffset="${r2(c)}" transform="rotate(-90 ${cx} ${cy})">
  <animate attributeName="stroke-dashoffset" from="${r2(c)}" to="${r2(off)}" begin="${begin}s" dur="${dur}s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/></circle>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"
  stroke-dasharray="${r2(c)}" stroke-dashoffset="${r2(c)}" transform="rotate(-90 ${cx} ${cy})">
  <animate attributeName="stroke-dashoffset" from="${r2(c)}" to="${r2(off)}" begin="${begin}s" dur="${dur}s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/></circle>
<g transform="rotate(-90 ${cx} ${cy})"><circle cx="${cx + r}" cy="${cy}" r="${width / 2 + 2}" fill="#fff" opacity="0">
  <animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="${r2(360 * p)} ${cx} ${cy}" begin="${begin}s" dur="${dur}s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/>
  <animate attributeName="opacity" values="0;1" begin="${begin}s" dur=".2s" fill="freeze"/></circle></g>`;
}

/** Horizontal bar that grows in. */
const bar = ({ x, y, w, h = 8, p, color, begin }) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" fill-opacity=".06"/>
<rect x="${x}" y="${y}" width="0" height="${h}" rx="${h / 2}" fill="${color}">
  <animate attributeName="width" from="0" to="${r2(Math.max(h, w * p))}" begin="${begin}s" dur="1.2s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/></rect>`;

/** Wrap text into at most `max` lines of ~`chars` characters. */
function wrap(text, chars, max) {
  const words = String(text || "").split(/\s+/).filter(Boolean), lines = [];
  let line = "";
  for (const wd of words) {
    if ((line + " " + wd).trim().length > chars) { lines.push(line); line = wd; } else line = (line + " " + wd).trim();
    if (lines.length === max) break;
  }
  if (lines.length < max && line) lines.push(line);
  if (lines.length === max && words.join(" ").length > lines.join(" ").length) lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, "") + "…";
  return lines;
}

// ───────────────────────────── static cards ─────────────────────────────

function hero() {
  const w = 1200, h = 440;
  const chips = [["React", "#61dafb"], ["Node.js", "#8cc84b"], ["Express", "#e5e7eb"], ["MongoDB", "#6cc24a"], ["Flutter", "#42a5f5"], ["AWS", "#ffb347"]];
  let cx = 64;
  const chipSvg = chips.map(([t, col], i) => {
    const cw = t.length * 9 + 30, s = `<g class="pop" ${delay(1.1 + i * 0.12)}>
  <rect x="${cx}" y="318" width="${cw}" height="32" rx="10" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-opacity=".45"/>
  <circle cx="${cx + 14}" cy="334" r="3.5" fill="${col}"/>
  <text x="${cx + 24}" y="339" class="mono" font-size="13" font-weight="600" fill="${col}">${t}</text></g>`;
    cx += cw + 10;
    return s;
  }).join("");
  const term = [
    [`<tspan fill="${C.green}">❯</tspan><tspan fill="${C.text}"> whoami</tspan>`, 0],
    [`<tspan fill="${C.violet}">abishek-k · full-stack developer</tspan>`, 0],
    [`<tspan fill="${C.green}">❯</tspan><tspan fill="${C.text}"> cat stack.json</tspan>`, 0],
    [`<tspan fill="${C.sub}">{ </tspan><tspan fill="${C.pink}">"web"</tspan><tspan fill="${C.sub}">: </tspan><tspan fill="#fde68a">"MERN"</tspan><tspan fill="${C.sub}">,</tspan>`, 0],
    [`<tspan fill="${C.pink}">"mobile"</tspan><tspan fill="${C.sub}">: </tspan><tspan fill="#fde68a">"Flutter"</tspan><tspan fill="${C.sub}">,</tspan>`, 16],
    [`<tspan fill="${C.pink}">"cloud"</tspan><tspan fill="${C.sub}">: </tspan><tspan fill="#fde68a">"AWS"</tspan><tspan fill="${C.sub}"> }</tspan>`, 16],
    [`<tspan fill="${C.green}">❯</tspan><tspan fill="${C.text}"> npm i @abisheks238/react-toaster</tspan>`, 0],
    [`<tspan fill="${C.cyan}">✔ shipped to production</tspan><tspan class="blink" fill="${C.text}"> ▍</tspan>`, 0],
  ];
  const ys = [140, 164, 200, 224, 248, 272, 308, 332];
  // Each line is revealed left-to-right by a growing clip rect, like it is being typed.
  const termSvg = term.map(([t, dx], i) => {
    const b = r2(1.2 + i * 0.45);
    return `<clipPath id="tl${i}"><rect x="${734 + dx}" y="${ys[i] - 16}" width="0" height="22"><animate attributeName="width" from="0" to="${400 - dx}" begin="${b}s" dur="${r2(0.25 + t.length / 900)}s" fill="freeze"/></rect></clipPath>
<text x="${734 + dx}" y="${ys[i]}" class="mono" font-size="14.5" clip-path="url(#tl${i})">${t}</text>`;
  }).join("");
  const body = `
<g class="fu" ${delay(0.1)}>
  <rect x="64" y="84" width="226" height="34" rx="17" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".14"/>
  <circle cx="86" cy="101" r="5" fill="${C.green}"/><circle class="pulse" cx="86" cy="101" r="5" fill="${C.green}"/>
  <text x="102" y="106" class="sans" font-size="13" font-weight="700" letter-spacing="1.6" fill="#d1d5db">OPEN TO COLLABORATE</text>
</g>
<g class="fu" ${delay(0.3)}>
  <text x="60" y="198" class="sans" font-size="84" font-weight="800" letter-spacing="-2.5" fill="url(#grad)" filter="url(#glow)" opacity=".45">Abishek K</text>
  <text x="60" y="198" class="sans" font-size="84" font-weight="800" letter-spacing="-2.5" fill="url(#grad)">Abishek K</text>
</g>
<text x="64" y="246" class="sans fu" ${delay(0.55)} font-size="25" font-weight="650" fill="${C.text}">Full Stack MERN Developer · AWS &amp; SQL</text>
<text x="64" y="282" class="sans fu" ${delay(0.75)} font-size="17" fill="${C.sub}">Scalable web apps, admin dashboards &amp; APIs, shipped to the cloud.</text>
${chipSvg}
<g class="fu" ${delay(0.6)}>
  <g class="bob">
  <rect x="706" y="72" width="446" height="292" rx="16" fill="#060913" fill-opacity=".88" stroke="#fff" stroke-opacity=".12"/>
  <path d="M706 88a16 16 0 0 1 16-16h414a16 16 0 0 1 16 16v20H706z" fill="#fff" fill-opacity=".04"/>
  <circle cx="730" cy="90" r="6" fill="#ff5f57"/><circle cx="750" cy="90" r="6" fill="#febc2e"/><circle cx="770" cy="90" r="6" fill="#28c840"/>
  <text x="929" y="95" text-anchor="middle" class="mono" font-size="12" fill="${C.dim}">~/abishek — zsh</text>
  ${termSvg}
  </g>
</g>`;
  return frame({ w, h, label: "Abishek K — Full Stack MERN Developer", body, orbs: [C.violet, "#0891b2"],
  });
}

function about() {
  const w = 1200, h = 360;
  const points = [
    ["code", C.violet, "Building", "scalable web apps, admin dashboards & REST APIs"],
    ["trophy", C.cyan, "Leveling up", "in advanced backend & cloud architecture"],
    ["users", C.pink, "Ask me about", "React, Node.js, Flutter or AWS"],
    ["repo", C.amber, "Open source", "author of @abisheks238/react-toaster on npm"],
    ["star", C.green, "Off the clock", "designing in Figma & Photoshop"],
  ];
  const list = points.map(([ic, col, k, v], i) => {
    const y = 96 + i * 48;
    return `<g class="fu" ${delay(0.3 + i * 0.15)}>
  <rect x="40" y="${y - 22}" width="36" height="36" rx="10" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-opacity=".35"/>
  ${icon(ic, 48, y - 14, col, 20)}
  <text x="92" y="${y + 1}" class="sans" font-size="16.5"><tspan fill="${C.text}" font-weight="700">${esc(k)}</tspan><tspan fill="${C.sub}"> ${esc(v)}</tspan></text></g>`;
  }).join("");
  const kv = [["role", "Full Stack Developer"], ["focus", "Web · Mobile · Cloud"], ["stack", "MERN + Flutter + AWS"], ["learning", "Cloud-native backends"], ["status", "shipping daily"]];
  const card = kv.map(([k, v], i) => `<text x="800" y="${146 + i * 32}" class="mono fu" ${delay(0.6 + i * 0.12)} font-size="15"><tspan fill="${C.pink}">${k}</tspan><tspan fill="${C.sub}">:</tspan><tspan x="900" fill="#fde68a">"${esc(v)}"</tspan><tspan fill="${C.sub}">,</tspan></text>`).join("");
  const body = `${list}
<g class="fu" ${delay(0.4)}>
  <rect x="760" y="62" width="400" height="262" rx="16" fill="#060913" fill-opacity=".75" stroke="#fff" stroke-opacity=".1"/>
  <text x="784" y="92" class="mono" font-size="13" fill="${C.dim}">// abishek.config.ts</text>
  <text x="784" y="118" class="mono" font-size="15"><tspan fill="${C.violet}">export default</tspan><tspan fill="${C.sub}"> {</tspan></text>
</g>
${card}
<text x="784" y="${146 + 5 * 32}" class="mono fu" ${delay(1.3)} font-size="15" fill="${C.sub}">}<tspan class="blink" fill="${C.text}"> ▍</tspan></text>`;
  return frame({ w, h, title: "About Me", body, orbs: [C.pink, C.violet], accent: C.pink });
}

function stack() {
  const atom = (x, y) => `<g transform="translate(${x} ${y})" fill="none" stroke="#61dafb" stroke-width="1.8">
  <ellipse rx="15" ry="6"/><ellipse rx="15" ry="6" transform="rotate(60)"/><ellipse rx="15" ry="6" transform="rotate(120)"/><circle r="2.6" fill="#61dafb"/></g>`;
  const groups = [
    ["Languages", [["JS", "#f7df1e", "#000", "JavaScript"], ["TS", "#3178c6", "#fff", "TypeScript"], ["Dt", "#0175c2", "#fff", "Dart"], ["SQL", "#00758f", "#fff", "SQL"], ["Py", "#3776ab", "#ffd43b", "Python"]]],
    ["Frontend", [["H5", "#e34f26", "#fff", "HTML5"], ["C3", "#1572b6", "#fff", "CSS3"], ["@atom", "#20232a", "#61dafb", "React"]]],
    ["Backend", [["Nd", "#3c873a", "#fff", "Node.js"], ["ex", "#2b2b2b", "#e5e7eb", "Express"], ["Mg", "#13aa52", "#fff", "MongoDB"]]],
    ["Mobile", [["Fl", "#02569b", "#5fc9f8", "Flutter"]]],
    ["Cloud & Tools", [["aws", "#232f3e", "#ff9900", "AWS"], ["S3", "#569a31", "#fff", "Amazon S3"], ["git", "#f05032", "#fff", "Git"], ["GH", "#24292f", "#fff", "GitHub"], ["VS", "#007acc", "#fff", "VS Code"]]],
    ["Design", [["Fg", "#1e1e1e", "#f24e1e", "Figma"], ["Ps", "#001e36", "#31a8ff", "Photoshop"], ["Cv", "#00c4cc", "#fff", "Canva"]]],
  ];
  const w = 1200, colW = 560, T = 58, gap = 20, rowH = 150;
  let n = 0;
  const body = groups.map(([name, tiles], gi) => {
    const gx = 40 + (gi % 2) * (colW + 40), gy = 84 + Math.floor(gi / 2) * rowH;
    const head = `<g class="fu" ${delay(0.2 + gi * 0.1)}><text x="${gx}" y="${gy + 14}" class="sans" font-size="13" font-weight="700" letter-spacing="2" fill="${C.sub}">${esc(name.toUpperCase())}</text>
  <rect x="${gx + name.length * 10 + 14}" y="${gy + 9}" width="${colW - name.length * 10 - 14}" height="1" fill="#fff" fill-opacity=".08"/></g>`;
    const ts = tiles.map(([mono, bg, fg, label], ti) => {
      const x = gx + ti * (T + gap + 26), y = gy + 30, d = 0.4 + n++ * 0.07;
      const glyph = mono === "@atom" ? atom(x + T / 2, y + T / 2)
        : `<text x="${x + T / 2}" y="${y + T / 2 + 7}" text-anchor="middle" class="sans" font-size="${mono.length > 2 ? 17 : 21}" font-weight="800" fill="${fg}">${mono}</text>`;
      return `<g class="pop" ${delay(d)}><g class="bob" style="animation-delay:${r2((ti + gi) * 0.37)}s">
  <rect x="${x - 3}" y="${y - 3}" width="${T + 6}" height="${T + 6}" rx="17" fill="${bg === "#20232a" || bg.startsWith("#2") || bg.startsWith("#1") || bg.startsWith("#0") ? fg : bg}" opacity=".35" filter="url(#soft)"/>
  <rect x="${x}" y="${y}" width="${T}" height="${T}" rx="15" fill="${bg}"/>
  <rect x="${x}" y="${y}" width="${T}" height="${T / 2}" rx="15" fill="#fff" fill-opacity=".1"/>
  <rect x="${x + .5}" y="${y + .5}" width="${T - 1}" height="${T - 1}" rx="14.5" fill="none" stroke="#fff" stroke-opacity=".18"/>
  ${glyph}</g>
  <text x="${x + T / 2}" y="${y + T + 22}" text-anchor="middle" class="sans" font-size="12.5" font-weight="600" fill="${C.sub}">${esc(label)}</text></g>`;
    }).join("");
    return head + ts;
  }).join("");
  return frame({ w, h: 84 + 3 * rowH + 10, title: "Tech Stack", body, orbs: [C.cyan, C.violet], accent: C.cyan });
}

function button(kind) {
  const B = {
    linkedin: ["LinkedIn", "#0a66c2", (x, y) => `<rect x="${x}" y="${y}" width="22" height="22" rx="5" fill="#0a66c2"/><text x="${x + 11}" y="${y + 16.5}" text-anchor="middle" class="sans" font-size="13" font-weight="800" fill="#fff">in</text>`],
    email: ["Email Me", "#ea4335", (x, y) => icon("mail", x, y, "#f87171", 22)],
    npm: ["npm", "#cb3837", (x, y) => `<rect x="${x}" y="${y}" width="22" height="22" rx="4" fill="#cb3837"/><path d="M${x + 5} ${y + 17}V${y + 5}h12v12h-3V${y + 8}h-3v9z" fill="#fff"/>`],
    github: ["Repositories", "#a78bfa", (x, y) => icon("repo", x, y, C.violet, 22)],
  }[kind];
  const [label, col, glyph] = B, w = 64 + label.length * 10.5, h = 52;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
<defs><linearGradient id="bd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col}"/><stop offset=".5" stop-color="${col}" stop-opacity=".15"/><stop offset="1" stop-color="${C.cyan}"/>
<animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="5s" repeatCount="indefinite"/></linearGradient>
<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="c"><rect width="${w}" height="${h}" rx="14"/></clipPath>
<style>.sans{font-family:${SANS}}.s{animation:s 4s ease-in-out infinite}@keyframes s{0%,60%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.g{animation:g 3s ease-in-out infinite}@keyframes g{0%,100%{opacity:.25}50%{opacity:.55}}</style></defs>
<g clip-path="url(#c)"><rect width="${w}" height="${h}" fill="${C.bg0}"/><rect class="g" width="${w}" height="${h}" fill="${col}" opacity=".3"/>
<rect class="s" width="${w / 2}" height="${h}" fill="url(#sw)" transform="skewX(-20)"/></g>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="13" fill="none" stroke="url(#bd)" stroke-width="1.6"/>
${glyph(20, 15)}
<text x="52" y="31" class="sans" font-size="15" font-weight="700" fill="#fff">${label}</text></svg>`;
}

function footer() {
  const w = 1200, h = 170;
  const wave = (amp, y, col, op, dur, rev) => {
    const seg = (x) => `q75 ${-amp} 150 0t150 0`;
    let d = `M-1200 ${y}`;
    for (let i = 0; i < 8; i++) d += " " + seg();
    d += ` V${h} H-1200z`;
    return `<path d="${d}" fill="${col}" opacity="${op}"><animateTransform attributeName="transform" type="translate" values="${rev ? "-300 0;0 0" : "0 0;-300 0"}" dur="${dur}s" repeatCount="indefinite"/></path>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Thanks for visiting">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.violet}"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
<style>.sans{font-family:${SANS}}</style></defs>
<g transform="translate(1200 0)">${wave(18, 70, "url(#g)", 0.25, 9)}${wave(14, 90, "url(#g)", 0.4, 7, true)}${wave(10, 110, C.bg1, 1, 11)}</g>
<text x="600" y="150" text-anchor="middle" class="sans" font-size="16" font-weight="600" fill="${C.sub}" letter-spacing="1">Thanks for visiting  ·  Let's build something great together ✦</text></svg>`;
}

function divider() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="24" viewBox="0 0 1200 24">
<defs><linearGradient id="g" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse" spreadMethod="reflect">
<stop offset="0" stop-color="${C.violet}" stop-opacity="0"/><stop offset=".3" stop-color="${C.violet}"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset=".7" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/>
<animateTransform attributeName="gradientTransform" type="translate" values="-1200 0;1200 0" dur="6s" repeatCount="indefinite"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="3"/></filter></defs>
<rect y="10" width="1200" height="4" rx="2" fill="url(#g)" filter="url(#b)" opacity=".7"/><rect y="11" width="1200" height="2" rx="1" fill="url(#g)"/>
<circle r="3.5" cy="12" fill="#fff"><animate attributeName="cx" values="0;1200" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="6s" repeatCount="indefinite"/></circle></svg>`;
}


function sectionTitle(text, sub) {
  const w = 1200, h = 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}">
<defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="${C.violet}"/><stop offset=".5" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.pink}"/>
<animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0" dur="6s" repeatCount="indefinite"/></linearGradient>
<filter id="glow" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
<style>${BASE_CSS}</style></defs>
<g class="fu"><text x="600" y="50" text-anchor="middle" class="sans" font-size="34" font-weight="800" letter-spacing="-.5" fill="url(#grad)" filter="url(#glow)" opacity=".5">${esc(text)}</text>
<text x="600" y="50" text-anchor="middle" class="sans" font-size="34" font-weight="800" letter-spacing="-.5" fill="url(#grad)">${esc(text)}</text></g>
<text x="600" y="80" text-anchor="middle" class="sans fu" ${delay(0.25)} font-size="15" fill="#8b93a7">${esc(sub)}</text></svg>`;
}

// ───────────────────────────── live data ─────────────────────────────

async function gql(token, query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-cards" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors || json)}`);
  return json.data;
}

async function fetchData(token) {
  const base = await gql(token, `query($login:String!){ user(login:$login){
    name login createdAt followers{totalCount}
    pullRequests{totalCount} issues{totalCount}
    repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,REPOSITORY]){totalCount}
    contributionsCollection{contributionYears}
  }}`, { login: USER });
  const u = base.user;

  // Owned, non-fork repos: stars + language bytes
  let repos = [], after = null;
  do {
    const d = await gql(token, `query($login:String!,$after:String){ user(login:$login){ repositories(first:100,after:$after,ownerAffiliations:OWNER,isFork:false){
      totalCount pageInfo{hasNextPage endCursor}
      nodes{ name stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}} } }}}`, { login: USER, after });
    const r = d.user.repositories;
    repos = repos.concat(r.nodes);
    after = r.pageInfo.hasNextPage ? r.pageInfo.endCursor : null;
    u.repoCount = r.totalCount;
  } while (after);

  // Every contribution year: totals + calendar days
  let commits = 0, total = 0, days = [];
  for (const year of u.contributionsCollection.contributionYears) {
    const d = await gql(token, `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){
      totalCommitContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } }}}`,
      { login: USER, from: `${year}-01-01T00:00:00Z`, to: new Date(Math.min(Date.now(), Date.UTC(year, 11, 31, 23, 59, 59))).toISOString() });
    const cc = d.user.contributionsCollection;
    commits += cc.totalCommitContributions + cc.restrictedContributionsCount;
    total += cc.contributionCalendar.totalContributions;
    days = days.concat(cc.contributionCalendar.weeks.flatMap((wk) => wk.contributionDays));
  }

  // Rolling last-year calendar for the heatmap
  const lastYear = await gql(token, `query($login:String!){ user(login:$login){ contributionsCollection{
    contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } } }}}`, { login: USER });

  const featured = [];
  for (const name of FEATURED) {
    try {
      const d = await gql(token, `query($o:String!,$n:String!){ repository(owner:$o,name:$n){
        name description stargazerCount forkCount url pushedAt
        primaryLanguage{name color} repositoryTopics(first:4){nodes{topic{name}}} } }`, { o: USER, n: name });
      if (d.repository) featured.push(d.repository);
    } catch (e) { console.warn(`skip ${name}: ${e.message}`); }
  }

  return {
    name: u.name || u.login, login: u.login,
    stars: repos.reduce((s, r) => s + r.stargazerCount, 0),
    repos: u.repoCount, followers: u.followers.totalCount,
    prs: u.pullRequests.totalCount, issues: u.issues.totalCount,
    contributedTo: u.repositoriesContributedTo.totalCount,
    commits, total,
    languages: repos.flatMap((r) => r.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size }))),
    days,
    calendar: lastYear.user.contributionsCollection.contributionCalendar,
    featured,
  };
}

// ───────────────────────────── live cards ─────────────────────────────

function statsCard(d) {
  const w = 590, h = 320;
  const rows = [
    ["star", C.amber, "Total Stars", d.stars], ["commit", C.violet, "Total Commits", d.commits],
    ["pr", C.cyan, "Pull Requests", d.prs], ["issue", C.pink, "Issues", d.issues],
    ["repo", C.green, "Repositories", d.repos], ["users", "#60a5fa", "Contributed to", d.contributedTo],
  ];
  // Level ring: log-scaled progress toward 10k contributions
  const p = Math.min(1, Math.log10(1 + d.total) / 4);
  const level = Math.max(1, Math.floor(p * 40));
  const body = rows.map(([ic, col, k, v], i) => {
    const y = 104 + i * 34;
    return `<g class="fu" ${delay(0.25 + i * 0.1)}>${icon(ic, 34, y - 15, col, 18)}
  <text x="62" y="${y}" class="sans" font-size="15" fill="${C.sub}">${k}</text>
  <text x="300" y="${y}" text-anchor="end" class="sans" font-size="16" font-weight="700" fill="${C.text}">${fmt(v)}</text></g>`;
  }).join("") + `
<g class="fu" ${delay(0.3)}>${ring({ cx: 450, cy: 180, r: 78, p, width: 12, begin: 0.5, dur: 2 })}
  <text x="450" y="172" text-anchor="middle" class="sans" font-size="38" font-weight="800" fill="url(#grad)">${fmt(d.total)}</text>
  <text x="450" y="198" text-anchor="middle" class="sans" font-size="12" font-weight="600" letter-spacing="1.5" fill="${C.sub}">CONTRIBUTIONS</text>
  <rect x="412" y="212" width="76" height="22" rx="11" fill="${C.violet}" fill-opacity=".15" stroke="${C.violet}" stroke-opacity=".5"/>
  <text x="450" y="227" text-anchor="middle" class="mono" font-size="12" font-weight="700" fill="${C.violet}">LVL ${level}</text>
</g>`;
  return frame({ w, h, title: "GitHub Stats", body, label: `${d.name}'s GitHub stats` });
}

function languagesCard(d) {
  const w = 590, h = 320, agg = {};
  for (const l of d.languages) (agg[l.name] ||= { ...l, size: 0 }).size += l.size;
  const all = Object.values(agg).sort((a, b) => b.size - a.size), sum = all.reduce((s, l) => s + l.size, 0) || 1;
  const top = all.slice(0, 6);
  let x = 32;
  const stacked = top.map((l, i) => {
    const lw = (l.size / sum) * 526, s = `<rect x="${r2(x)}" y="78" width="0" height="12" fill="${l.color || C.violet}">
  <animate attributeName="width" from="0" to="${r2(Math.max(0, lw - 2))}" begin="${r2(0.3 + i * 0.12)}s" dur=".8s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/></rect>`;
    x += lw;
    return s;
  }).join("");
  const list = top.map((l, i) => {
    const col = i % 2, row = Math.floor(i / 2), lx = 32 + col * 272, ly = 136 + row * 58, pct = (l.size / sum) * 100;
    return `<g class="fu" ${delay(0.5 + i * 0.1)}>
  <circle cx="${lx + 6}" cy="${ly - 5}" r="6" fill="${l.color || C.violet}"/>
  <text x="${lx + 20}" y="${ly}" class="sans" font-size="15" font-weight="600" fill="${C.text}">${esc(l.name)}</text>
  <text x="${lx + 254}" y="${ly}" text-anchor="end" class="mono" font-size="13" fill="${C.sub}">${pct.toFixed(1)}%</text>
  ${bar({ x: lx, y: ly + 12, w: 254, h: 6, p: pct / 100 / (top[0].size / sum), color: l.color || C.violet, begin: 0.7 + i * 0.1 })}</g>`;
  }).join("");
  const body = `<clipPath id="sb"><rect x="32" y="78" width="526" height="12" rx="6"/></clipPath>
<rect x="32" y="78" width="526" height="12" rx="6" fill="#fff" fill-opacity=".06"/><g clip-path="url(#sb)">${stacked}</g>${list}`;
  return frame({ w, h, title: "Top Languages", body, orbs: [C.cyan, C.pink], accent: C.cyan });
}

function streaks(days) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().slice(0, 10);
  const past = sorted.filter((x) => x.date <= today);
  let longest = { len: 0 }, run = null;
  for (const day of past) {
    if (day.contributionCount > 0) {
      run = run ? { ...run, end: day.date, len: run.len + 1 } : { start: day.date, end: day.date, len: 1 };
      if (run.len > longest.len) longest = run;
    } else run = null;
  }
  // Current streak survives a zero "today" (the day isn't over yet)
  let i = past.length - 1;
  if (i >= 0 && past[i].contributionCount === 0) i--;
  let cur = { len: 0 };
  for (; i >= 0 && past[i].contributionCount > 0; i--) cur = { start: past[i].date, end: cur.end || past[i].date, len: cur.len + 1 };
  return { longest, cur, first: past[0]?.date };
}

const nice = (s) => (s ? new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "—");

function streakCard(d) {
  const w = 1200, h = 280, s = streaks(d.days);
  const col = (cx, value, label, sub, accent, i) => `<g class="fu" ${delay(0.3 + i * 0.15)}>
  <text x="${cx}" y="160" text-anchor="middle" class="sans" font-size="52" font-weight="800" fill="${accent}">${fmt(value)}</text>
  <text x="${cx}" y="200" text-anchor="middle" class="sans" font-size="15" font-weight="700" letter-spacing="1.5" fill="${C.text}">${label}</text>
  <text x="${cx}" y="226" text-anchor="middle" class="sans" font-size="13" fill="${C.sub}">${esc(sub)}</text></g>`;
  const rng = (r) => (r.len ? `${nice(r.start)} – ${nice(r.end)}` : "Start one today");
  const body = `
${col(220, d.total, "TOTAL CONTRIBUTIONS", `${nice(s.first)} – Present`, C.cyan, 0)}
<rect x="400" y="96" width="1" height="140" fill="#fff" fill-opacity=".1"/>
<g class="fu" ${delay(0.2)}>${ring({ cx: 600, cy: 160, r: 74, p: Math.min(1, s.cur.len / Math.max(7, s.longest.len || 1)), width: 10, color: C.pink, begin: 0.5, dur: 1.8 })}
  <g class="bob">${icon("flame", 589, 106, C.amber, 22)}</g>
  <text x="600" y="176" text-anchor="middle" class="sans" font-size="44" font-weight="800" fill="${C.text}">${s.cur.len}</text>
  <text x="600" y="198" text-anchor="middle" class="sans" font-size="11" font-weight="700" letter-spacing="1.5" fill="${C.sub}">DAY STREAK</text>
  <text x="600" y="262" text-anchor="middle" class="sans" font-size="13" fill="${C.sub}">${esc(rng(s.cur))}</text></g>
<rect x="800" y="96" width="1" height="140" fill="#fff" fill-opacity=".1"/>
${col(980, s.longest.len, "LONGEST STREAK", rng(s.longest), C.violet, 2)}`;
  return frame({ w, h, title: "Contribution Streak", body, orbs: [C.pink, C.amber], accent: C.amber });
}

function heatmapCard(d) {
  const weeks = d.calendar.weeks, cell = 16, g = 4, x0 = Math.round((1200 - weeks.length * 20) / 2) + 14, y0 = 104;
  const w = 1200, h = y0 + 7 * (cell + g) + 70;
  const max = Math.max(1, ...weeks.flatMap((wk) => wk.contributionDays.map((x) => x.contributionCount)));
  const shade = (n) => (n === 0 ? null : [C.violet, "#8b5cf6", C.cyan, C.pink][Math.min(3, Math.floor((n / max) * 4 - 1e-9))]);
  const lvl = (n) => (n === 0 ? 0.06 : 0.45 + 0.55 * Math.min(1, n / max));
  let months = "", lastM = -1;
  const cells = weeks.map((wk, wi) => wk.contributionDays.map((day) => {
    const m = new Date(day.date + "T00:00:00Z").getUTCMonth();
    if (day.weekday === 0 && m !== lastM) {
      if (wi < weeks.length - 2) months += `<text x="${x0 + wi * (cell + g)}" y="${y0 - 12}" class="sans" font-size="12" fill="${C.sub}">${new Date(day.date + "T00:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`;
      lastM = m;
    }
    const col = shade(day.contributionCount);
    return `<rect class="c" x="${x0 + wi * (cell + g)}" y="${y0 + day.weekday * (cell + g)}" width="${cell}" height="${cell}" rx="4" fill="${col || "#fff"}" fill-opacity="${r2(lvl(day.contributionCount))}" ${delay(0.2 + wi * 0.03 + day.weekday * 0.02)}/>`;
  }).join("")).join("");
  const legend = [0, 1, 2, 3, 4].map((i) => `<rect x="${1040 + i * 22}" y="${h - 46}" width="16" height="16" rx="4" fill="${i ? [C.violet, "#8b5cf6", C.cyan, C.pink][i - 1] : "#fff"}" fill-opacity="${i ? 0.45 + i * 0.13 : 0.06}"/>`).join("");
  const body = `${months}${["Mon", "Wed", "Fri"].map((t, i) => `<text x="${x0 - 12}" y="${y0 + (1 + i * 2) * (cell + g) + 12}" text-anchor="end" class="sans" font-size="11" fill="${C.dim}">${t}</text>`).join("")}
${cells}
<text x="${x0}" y="${h - 33}" class="sans fu" ${delay(0.4)} font-size="15" fill="${C.sub}"><tspan font-weight="800" fill="${C.text}">${fmt(d.calendar.totalContributions)}</tspan> contributions in the last year</text>
<text x="1030" y="${h - 33}" text-anchor="end" class="sans" font-size="12" fill="${C.dim}">Less</text>${legend}<text x="1152" y="${h - 33}" class="sans" font-size="12" fill="${C.dim}">More</text>`;
  return frame({ w, h, title: "Contribution Activity", body, orbs: [C.violet, C.cyan],
    css: `.c{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .5s cubic-bezier(.34,1.56,.64,1) forwards}` });
}

function projectCard(r, i) {
  const w = 590, h = 210, lang = r.primaryLanguage, accent = [C.violet, C.cyan, C.pink, C.amber][i % 4];
  const desc = wrap(r.description || "No description yet — check out the repository.", 62, 2);
  const topics = (r.repositoryTopics?.nodes || []).map((n) => n.topic.name).slice(0, 3);
  let tx = 32;
  const chips = topics.map((t) => { const cw = t.length * 7.4 + 20, s = `<rect x="${tx}" y="146" width="${cw}" height="24" rx="12" fill="${accent}" fill-opacity=".12" stroke="${accent}" stroke-opacity=".4"/><text x="${tx + cw / 2}" y="162" text-anchor="middle" class="mono" font-size="11.5" fill="${accent}">${esc(t)}</text>`; tx += cw + 8; return s; }).join("");
  const name = r.name.length > 34 ? r.name.slice(0, 33) + "…" : r.name;
  const body = `
<g class="fu" ${delay(0.15)}>${icon("repo", 32, 30, accent, 22)}
  <text x="66" y="48" class="sans" font-size="20" font-weight="700" fill="${C.text}">${esc(name)}</text></g>
<g class="fu" ${delay(0.35)}>${desc.map((l, j) => `<text x="32" y="${92 + j * 24}" class="sans" font-size="15" fill="${C.sub}">${esc(l)}</text>`).join("")}</g>
<g class="fu" ${delay(0.55)}>${chips}
  ${lang ? `<circle cx="${tx + 14}" cy="158" r="6" fill="${lang.color || C.violet}"/><text x="${tx + 26}" y="163" class="sans" font-size="13.5" fill="${C.text}">${esc(lang.name)}</text>` : ""}
  ${icon("star", 466, 145, C.amber, 18)}<text x="490" y="163" class="sans" font-size="14" font-weight="600" fill="${C.text}">${fmt(r.stargazerCount)}</text>
  ${icon("fork", 520, 145, C.sub, 18)}<text x="544" y="163" class="sans" font-size="14" font-weight="600" fill="${C.text}">${fmt(r.forkCount)}</text></g>
<rect x="32" y="190" width="0" height="3" rx="1.5" fill="url(#grad)"><animate attributeName="width" from="0" to="526" begin=".6s" dur="1.4s" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1"/></rect>`;
  return frame({ w, h, body, label: r.name, orbs: [accent, i % 2 ? C.violet : C.cyan], accent });
}

// ───────────────────────────── main ─────────────────────────────

const [mode = "static", outArg] = process.argv.slice(2);
const save = async (dir, name, svg) => { await mkdir(dir, { recursive: true }); await writeFile(join(dir, name), svg); console.log("wrote", join(dir, name)); };

if (mode === "static") {
  const dir = outArg || "assets";
  await save(dir, "hero.svg", hero());
  await save(dir, "about.svg", about());
  await save(dir, "stack.svg", stack());
  await save(dir, "divider.svg", divider());
  await save(dir, "footer.svg", footer());
  await save(dir, "title-projects.svg", sectionTitle("Featured Work", "Things I've built and shipped"));
  await save(dir, "title-analytics.svg", sectionTitle("GitHub Analytics", "Refreshed automatically every 6 hours"));
  await save(dir, "title-snake.svg", sectionTitle("Contribution Snake", "Watch it eat through a year of commits"));
  for (const b of ["linkedin", "email", "npm", "github"]) await save(dir, `btn-${b}.svg`, button(b));
} else if (mode === "live") {
  const dir = outArg || "dist";
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const data = process.env.MOCK_DATA ? JSON.parse(await readFile(process.env.MOCK_DATA, "utf8"))
    : token ? await fetchData(token) : (() => { throw new Error("Set GITHUB_TOKEN (or MOCK_DATA)"); })();
  await save(dir, "stats.svg", statsCard(data));
  await save(dir, "languages.svg", languagesCard(data));
  await save(dir, "streak.svg", streakCard(data));
  await save(dir, "activity.svg", heatmapCard(data));
  for (const [i, r] of data.featured.entries()) await save(dir, `project-${r.name}.svg`, projectCard(r, i));
} else {
  console.error("usage: node scripts/cards.mjs static|live [outDir]");
  process.exit(1);
}
