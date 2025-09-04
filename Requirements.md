For Frontend:
Interactive Event Seating Map — Front-End Take-Home Task
==========================================================
OVERVIEW
You will build a small React + TypeScript application that renders an interactive
seating map for an event. Each seat should be clickable, show its details, and
allow the user to pick up to 8 seats. The core solution should be completable
in roughly 3 hours; polish and stretch goals are optional.
DELIVERABLES
- A Git repository (GitHub link or zipped archive) that runs with
`
pnpm install && pnpm dev
`
- Source code in TypeScript with `
strict`
mode enabled
- A short README (2–3 paragraphs) explaining:
- architecture choices and trade-offs
- any incomplete features / TODOs
- how to run tests (if included)
DATA (place in
```json
{
`
public/venue.json
`)
"venueId": "arena-01"
,
"name": "Metropolis Arena"
,
"map": { "width": 1024,
"height": 768 },
"sections": [
{
"id": "A"
,
"label": "Lower Bowl A"
,
"transform": { "x": 0,
"y": 0,
"rows": [
{
"scale": 1 },
"index": 1,
"seats": [
{
"id": "A-1-01"
,
"col": 1,
"x": 50,
"y": 40,
"priceTier": 1,
"status": "available"
},
{
"id": "A-1-02"
,
"col": 2,
"x": 80,
"y": 40,
"priceTier": 1,
"status": "reserved"
}
]
}
]
}
]
}
```
Explanation
`
-
-
map.width / map.height` define an SVG (or Canvas) drawing area in pixels.
- Seat coordinates are absolute; no layout algorithm is required.
`
status
` is one of
`
available | reserved | sold | held`
.
REQUIREMENTS
1. Load `
venue.json
`
and render every seat in its correct position.
2. Keep rendering smooth (≈ 60 fps) for large arenas (≈ 15 000 seats).
3. A seat can be selected via mouse click **and** keyboard.
4. Display seat details (section, row, seat, price, status) on click or focus.
5. Allow selecting up to 8 seats; show a live summary with subtotal.
6. Persist the current selection after page reload (e.g.
`localStorage
`).
7. Provide basic accessibility:
`
-
aria-label`
on interactive elements
- focus outline and keyboard navigation.
8. The UI must work on desktop and mobile viewport sizes.
TECH CONSTRAINTS
- React >= 18 and TypeScript (`"strict": true
` in
`tsconfig.json
`).
- Use any additional libraries you feel are appropriate, but document why.
- Project scaffold: either Vite + React or Next.js 14 (app directory).
- ESLint / Prettier configuration is encouraged (no specific rules required).
OPTIONAL STRETCH GOALS
- Live seat-status updates over WebSocket; animate changes.
- Heat-map toggle that colours seats by price tier.
-
"Find N adjacent seats" helper button.
- Pinch-zoom + pan for mobile (touch gestures).
- Dark-mode toggle that meets WCAG 2.1 AA contrast ratios.
- End-to-end tests with Playwright or Cypress.

EVALUATION CRITERIA (internal rubric, shared for transparency)
- Correctness: seats render, can be selected, summary updates.
- Code quality: idiomatic React, clean TypeScript types, modular structure.
- Performance: smooth interaction with 15 000 seats on a mid-range laptop.
- Accessibility & UX: keyboard support, focus management, clear status.
- Tests & documentation: unit/integration tests, concise README.
- Discussion: ability to explain decisions and trade-offs in the follow-up
interview.
