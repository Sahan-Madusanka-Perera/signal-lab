import { chromium } from "playwright";

const OUT = process.env.AUDIT_OUT ?? ".audit-shots";
const ROUTES = ["/", "/lesson/signals", "/lesson/media", "/lesson/encoding", "/lesson/pstn", "/lesson/topologies", "/lesson/mac", "/lesson/internet", "/lesson/transport", "/lesson/applications", "/lesson/models", "/lesson/security", "/lesson/isp"];

function srgb(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function lum([r, g, b]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return lin.map((v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, c * 255));
  });
}

/** Colours arrive as rgb(), oklch() or oklab() depending on the token. Normalise to sRGB. */
function parse(s) {
  const nums = (s.match(/-?[\d.]+(e[-+]?\d+)?%?/gi) || []).map((n) =>
    n.endsWith("%") ? parseFloat(n) / 100 : parseFloat(n),
  );
  if (s.startsWith("oklch")) {
    const [L, C, H] = nums;
    return oklabToRgb(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));
  }
  if (s.startsWith("oklab")) return oklabToRgb(nums[0], nums[1], nums[2]);
  return nums.slice(0, 3);
}

/** Flatten a translucent foreground/background pair onto an opaque base. */
function over(fg, alpha, bg) {
  return fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));
}
function alphaOf(s) {
  const m = s.match(/\/\s*([\d.]+)\s*\)/) || s.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

const browser = await chromium.launch();
const report = [];

for (const theme of ["dark", "light"]) {
  for (const width of [1440, 768, 390]) {
    for (const route of ROUTES) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        colorScheme: theme,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });

      await page.goto("http://localhost:5180" + route, { waitUntil: "networkidle" });
      await page.evaluate((t) => localStorage.setItem("signallab.theme", t), theme);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(600);

      const data = await page.evaluate(() => {
        const de = document.documentElement;
        const overflow = Math.max(0, de.scrollWidth - de.clientWidth);
        // Content inside a horizontal scroll container is *meant* to be wider
        // than the viewport, so only report elements that actually escape.
        const escapes = (el) => {
          let anc = el.parentElement;
          while (anc && anc !== document.body) {
            const ox = getComputedStyle(anc).overflowX;
            if (ox === "auto" || ox === "scroll" || ox === "hidden") return false;
            anc = anc.parentElement;
          }
          return true;
        };
        const wide = [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > de.clientWidth + 2 && escapes(el);
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}[${(el.className || "").toString().slice(0, 60)}]`);

        // Text nodes and their effective colours, for a contrast sweep.
        const samples = [];
        const seen = new Set();
        for (const el of document.querySelectorAll("p,span,h1,h2,h3,h4,li,td,th,label,button,a,summary,figcaption")) {
          if (!el.textContent?.trim()) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.opacity === "0") continue;
          // Walk up for the first non-transparent background.
          let bgEl = el;
          let bg = "rgba(0, 0, 0, 0)";
          while (bgEl) {
            const b = getComputedStyle(bgEl).backgroundColor;
            if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) {
              bg = b;
              break;
            }
            bgEl = bgEl.parentElement;
          }
          const key = `${cs.color}|${bg}|${cs.fontSize}|${cs.fontWeight}`;
          if (seen.has(key)) continue;
          seen.add(key);
          samples.push({
            color: cs.color,
            bg,
            size: parseFloat(cs.fontSize),
            weight: Number(cs.fontWeight) || 400,
            text: el.textContent.trim().slice(0, 40),
          });
        }

        const missingAlt = [...document.querySelectorAll("canvas")].filter(
          (c) => !c.getAttribute("aria-label") && c.getAttribute("aria-hidden") !== "true",
        ).length;
        const btnNoName = [...document.querySelectorAll("button")]
          .filter(
            (b) =>
              !b.textContent?.trim() &&
              !b.getAttribute("aria-label") &&
              !b.getAttribute("aria-labelledby") &&
              !b.querySelector(".sr-only"),
          )
          .map((b) => `button[${(b.className || "").toString().slice(0, 70)}]`);
        const h1 = document.querySelectorAll("h1").length;

        return { overflow, wide, samples, missingAlt, btnNoName, h1 };
      });

      const base = theme === "dark" ? parse("oklch(0.166 0.003 75)") : [255, 255, 255];
      const fails = data.samples
        .map((s) => {
          const bg = over(parse(s.bg), alphaOf(s.bg), base);
          const fg = over(parse(s.color), alphaOf(s.color), bg);
          return { ...s, ratio: ratio(fg, bg) };
        })
        .filter((s) => {
          const large = s.size >= 24 || (s.weight >= 700 && s.size >= 18.66);
          return s.ratio < (large ? 3 : 4.5);
        })
        .map((s) => `${s.ratio.toFixed(2)}:1 "${s.text}" ${s.color} on ${s.bg} @${s.size}px/${s.weight}`);

      report.push({
        theme,
        width,
        route,
        overflow: data.overflow,
        wide: data.wide,
        contrastFails: fails,
        missingCanvasLabel: data.missingAlt,
        unnamedButtons: data.btnNoName,
        h1count: data.h1,
        errors,
      });

      if (width === 390 && theme === "dark") {
        await page.screenshot({ path: `${OUT}/m-${route.replace(/\//g, "_")}.png`, fullPage: false });
      }
      await page.close();
    }
  }
}

await browser.close();

const problems = report.filter(
  (r) =>
    r.overflow > 0 ||
    r.contrastFails.length ||
    r.missingCanvasLabel ||
    r.unnamedButtons.length ||
    r.errors.length ||
    r.h1count !== 1,
);
console.log(problems.length ? JSON.stringify(problems, null, 2) : "ALL CLEAN across " + report.length + " combinations");
