# Deduction Puzzle

A standalone, viral-first deduction puzzle game. Players get 3–4 suspects, 3–4 clues, and 2–3 minutes to name the culprit. Built to spread organically on Reddit. Mobile-first, no account required.

## Status

🔴 Pre-implementation — plan under review

## Docs

- [Implementation Plan](./PLAN.md)

## Tech Stack

- TBD (pending Q1 decision: static vs. serverless)
- Deployment: Vercel (recommended)

## Structure (planned)

```
deduction-puzzle/
├── index.html          # Today's case
├── case.html           # Shareable permalink
├── archive.html        # Past cases
├── css/style.css       # Mobile-first dark theme
├── js/
│   ├── game.js         # Timer, accusation, result logic
│   ├── analytics.js    # Anonymous event tracking
│   └── share.js        # Share card generation
├── data/cases.json     # Case library
└── api/                # Serverless functions
```
