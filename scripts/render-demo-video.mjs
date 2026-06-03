import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputDir = join(root, "demo-video");
const outputFile = join(outputDir, "garrincha-world-cup-demo.mp4");

mkdirSync(outputDir, { recursive: true });

const font = "C\\:/Windows/Fonts/arial.ttf";
const width = 1920;
const height = 1080;
const fps = 30;
const duration = 8;

const scenes = [
  {
    title: "GARRINCHA",
    subtitle: "World Cup Prediction Campaign",
    kicker: "Scan the QR code. Join your center. Predict every match.",
    bullets: ["QR-ready campaign entry", "Mobile-first registration", "Built for GARRINCHA Centers"],
    tag: "01 CAMPAIGN ENTRY",
  },
  {
    title: "REGISTER IN MINUTES",
    subtitle: "Email. Birth date. Phone. Nationality. Center.",
    kicker: "Players choose their GARRINCHA Center and start from their phone.",
    bullets: ["Simple form flow", "English and Dutch supported", "Secure session login"],
    tag: "02 QR REGISTRATION",
  },
  {
    title: "PREDICT THE SCORE",
    subtitle: "Brazil 2 - 1 Belgium",
    kicker: "Flags, teams, kickoff time, and clear score inputs.",
    bullets: ["All World Cup match slots", "Edit before kickoff", "Simple for non-football experts"],
    tag: "03 MATCH PREDICTIONS",
  },
  {
    title: "LOCKED AT KICKOFF",
    subtitle: "Predictions close automatically when the match begins.",
    kicker: "Server-side locking keeps the game fair.",
    bullets: ["Unlimited edits before kickoff", "No edits at or after kickoff", "Clear locked status"],
    tag: "04 FAIR PLAY LOCKING",
  },
  {
    title: "ADMIN FINAL SCORES",
    subtitle: "Final result saved. Points recalculated.",
    kicker: "Admins enter official scores after full time.",
    bullets: ["Automatic point calculation", "No duplicate points", "Bonus points require a reason"],
    tag: "05 ADMIN CONTROL",
  },
  {
    title: "CLIMB THE LEADERBOARD",
    subtitle: "Global. National. GARRINCHA Center.",
    kicker: "Players represent their country and their center.",
    bullets: ["Top 3 rank badges", "Flags and center names", "Bonus points included"],
    tag: "06 LEADERBOARDS",
  },
  {
    title: "READY FOR LIVE TESTING",
    subtitle: "Add official assets. Connect Supabase. Launch the campaign.",
    kicker: "Supports banners, prizes, QR campaigns, and branded visuals.",
    bullets: ["Official logo and banners", "Prize and sponsor copy", "Final campaign QR code"],
    tag: "07 NEXT STEP",
  },
];

function escapeText(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,");
}

function drawText({ text, x, y, size, color = "white", weightBox = false }) {
  const box = weightBox ? ":box=1:boxcolor=0x252320cc:boxborderw=22" : "";
  return `drawtext=fontfile=${font}:text='${escapeText(text)}':x=${x}:y=${y}:fontsize=${size}:fontcolor=${color}${box}`;
}

function sceneFilter(index, scene) {
  const bulletLines = scene.bullets.map((bullet, bulletIndex) =>
    drawText({
      text: `+ ${bullet}`,
      x: 122,
      y: 670 + bulletIndex * 58,
      size: 34,
      color: "0x252320",
      weightBox: false,
    }),
  );

  return [
    `[${index}:v]format=rgba`,
    "drawbox=x=0:y=0:w=1920:h=1080:color=0x252320:t=fill",
    "drawbox=x=92:y=90:w=1736:h=900:color=0xf3eadb:t=fill",
    "drawbox=x=92:y=90:w=1736:h=18:color=0x08eb9a:t=fill",
    "drawbox=x=92:y=972:w=1736:h=18:color=0x08eb9a:t=fill",
    "drawbox=x=1180:y=150:w=520:h=520:color=0x08eb9a:t=fill",
    "drawbox=x=1220:y=190:w=440:h=440:color=0x252320:t=8",
    "drawbox=x=1262:y=232:w=96:h=96:color=0x252320:t=fill",
    "drawbox=x=1522:y=232:w=96:h=96:color=0x252320:t=fill",
    "drawbox=x=1262:y=492:w=96:h=96:color=0x252320:t=fill",
    drawText({ text: scene.tag, x: 122, y: 150, size: 30, color: "0x08eb9a", weightBox: true }),
    drawText({ text: scene.title, x: 122, y: 235, size: scene.title.length > 22 ? 78 : 96, color: "0x252320" }),
    drawText({ text: scene.subtitle, x: 126, y: 382, size: scene.subtitle.length > 42 ? 42 : 50, color: "0x252320" }),
    drawText({ text: scene.kicker, x: 126, y: 500, size: 34, color: "0x756d62" }),
    ...bulletLines,
    drawText({ text: "DEMO PREVIEW DATA", x: 1280, y: 704, size: 32, color: "0x252320" }),
    drawText({ text: "GARRINCHA WORLD CUP APP", x: 122, y: 920, size: 30, color: "0x252320" }),
    `trim=duration=${duration}`,
    "setpts=PTS-STARTPTS",
    `fade=t=in:st=0:d=0.35`,
    `fade=t=out:st=${duration - 0.35}:d=0.35`,
    `format=yuv420p[v${index}]`,
  ].join(",");
}

const args = [];
for (let index = 0; index < scenes.length; index += 1) {
  args.push("-f", "lavfi", "-t", String(duration), "-i", `color=c=0x252320:s=${width}x${height}:r=${fps}`);
}

const filters = scenes.map((scene, index) => sceneFilter(index, scene));
const concatInputs = scenes.map((_, index) => `[v${index}]`).join("");
filters.push(`${concatInputs}concat=n=${scenes.length}:v=1:a=0[outv]`);

args.push(
  "-y",
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[outv]",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  outputFile,
);

const result = spawnSync(ffmpegPath, args, {
  cwd: root,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Demo video created: ${outputFile}`);
