# Aviator Crash Demo

Client-side simulation of an Aviator-style crash betting game built with React + Vite + TailwindCSS.

## Features
- Round loop: waiting -> running -> crashed -> waiting
- Random crash multiplier with heavy-tail distribution
- Two independent bet panels with auto bet & optional auto cashout
- Live multiplier growth and plane animation (Framer Motion)
- Cash out before crash to secure winnings
- Simulated other players with automatic cashouts
- History of last 16 multipliers
- Balance management & winnings calculation

## Getting Started

```bash
npm install
npm run dev
```

Open the printed localhost URL.

## Project Structure
```
src/
  components/       Reusable UI components
  context/          Global game state & loop
  utils/            Helper functions (crash point)
  App.jsx           Layout & composition
  main.jsx          Entry point
```

## Notes
This is a front-end only demo; no real money, networking, or fairness cryptography is implemented. The crash distribution & fairness label are illustrative only.

## Next Steps / Ideas
- Persist balance & settings (localStorage)
- Server authoritative engine & WebSocket sync
- Provably fair hash chain
- Authentication & multi-user real-time backend
- Mobile UI refinements

---
Enjoy exploring the code!
