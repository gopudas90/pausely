<div align="center">

# Pausely

[![Latest release](https://img.shields.io/github/v/release/gopudas90/break-reminder?style=flat-square&color=ff6b1a&labelColor=1e1e1e)](https://github.com/gopudas90/break-reminder/releases/latest)
[![Platform](https://img.shields.io/badge/platform-windows_x64-ffffff?style=flat-square&labelColor=1e1e1e)](#download)
[![License](https://img.shields.io/badge/license-MIT-ffffff?style=flat-square&labelColor=1e1e1e)](LICENSE)

<br/>

### A gentle desktop reminder for breaks, water, and screen time.

<br/>

[**↓ Download for Windows**](https://github.com/gopudas90/break-reminder/releases/latest/download/Pausely-Setup-1.2.0.exe) &nbsp;·&nbsp; [Releases](https://github.com/gopudas90/break-reminder/releases) &nbsp;·&nbsp; [Privacy](PRIVACY.md)

</div>

<br/>

---

## What it does

Pausely runs quietly in your system tray and nudges you at the intervals you set:

- **Break** — stand up and stretch
- **Water** — stay hydrated
- **Screen Break** — give your eyes a rest

Each reminder fires a soft musical chime, a corner notification, and a full-screen modal so you actually notice it. Timers stop after each reminder and only restart when you ask them to — no autopilot.

Your **Reminder Buddy** mascot tags along for the ride — there's a different pose for each timer type, so the nudge feels personal rather than mechanical.

<br/>

## Features

- ◐ &nbsp; **Three independent timers** — break, water, and screen-break, each with its own on/off switch and interval
- ◑ &nbsp; **Reminder Buddy** mascot — a different pose for each timer (stretching, holding a bottle, hugging a cup) so reminders feel personal
- ◒ &nbsp; **Layered warnings** — a "1 min heads-up" popup, a live 15-second countdown, then a full-screen reminder
- ◓ &nbsp; **Considerate by design** — timers stop after each reminder so you decide when to restart; the modal locks for 5 seconds so it isn't dismissed by reflex
- ◉ &nbsp; **Concurrent reminders** — if multiple timers fire at once, they queue and play sequentially without overlapping
- ◈ &nbsp; **System tray** — run quietly in the background, open from the tray, reset any timer from the tray menu
- ◊ &nbsp; **Fully offline** — no accounts, no telemetry, no network calls

<br/>

## Default intervals

| Reminder | Default |
|----------|---------|
| Break | every 45 minutes |
| Water | every 90 minutes |
| Screen Break | every 60 minutes |

All intervals are configurable from the **Settings** tab.

<br/>

## System requirements

- Windows 10 (1809+) or Windows 11, 64-bit
- ~250 MB disk space
- 2 GB RAM (4 GB recommended)
- No internet connection required

<br/>

## Tech stack

- [Electron](https://www.electronjs.org/) 27 — desktop runtime
- [React](https://react.dev/) 18 + [Ant Design](https://ant.design/) 5 — UI
- [Webpack](https://webpack.js.org/) 5 — bundler
- [electron-builder](https://www.electron.build/) — packaging
- Vanilla HTML/CSS/JS for the notification popup and full-screen reminder
- Web Audio API for the chime

Design language inspired by [Nothing](https://nothing.tech/) — charcoal surfaces, dot-matrix backdrop, sharp corners, mono type, with an orange accent.

<br/>

## Privacy

Pausely doesn't collect, transmit, or share any data. Settings live in `%APPDATA%\pausely\settings.json` and never leave your device. Full policy in [PRIVACY.md](PRIVACY.md).

<br/>

## License

MIT — see [LICENSE](LICENSE).

<br/>

<div align="center">

<sub>made with <span style="color:#ff6b1a">♥</span> by <a href="https://www.gopu.work">Gopu</a></sub>

</div>
