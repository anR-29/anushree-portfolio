# Playground — how emmiwu.com/playground works

The source is a Framer site. The canvas is Framer University's **"Infinite Canvas"** code
component. These notes come from its shipped bundle, and `playground.js` is a vanilla port of it.

## Structure

- **Canvas**: a fixed 2000×1400 tile, centred in a 100vh stage. It holds 14 absolutely placed cards.
- **Clones**: each card is cloned 3×, so the tile exists at (0,0), (W,0), (0,H) and (W,H).
- **Movement**: nothing moves the canvas itself. Every frame, each of the 56 nodes gets its own
  `translate()`.

## Per-frame math

| Step | Formula | Value on this page |
|---|---|---|
| Wheel | `target -= delta * scrollSpeed` | scrollSpeed 0.6 → **×1.156** |
| Drag | `target = start + (pointer - pointerStart) * dragSpeed` | dragSpeed 0.6 → **×1.156** |
| Pan smoothing | `current += (target - current) * ease` | "snappy" 0.1 → **0.029/frame** |
| Velocity | `vel += ((current - last) - vel) * 0.04` | — |
| Mouse (0–1) | `mouse += (pointer/viewport - mouse) * 0.04` | — |
| Card offset | `5 * vel * rand(0.5–1) + (mouse - 0.5) * cardSize * 0.6` | parallax general 1, child 0 |
| Wrap | moving right and `x > W` → `x -= 2W`; moving left and `x + w < 0` → `x += 2W` (same for y) | — |
| Cull | hide a node more than 1000px outside the viewport | — |

Two things make it feel the way it does:

1. **Parallax scales with card size.** Bigger cards shift further as the mouse moves, which gives
   the canvas depth.
2. **Random drift per card.** Each card's random drift factor makes cards trail or lead by
   different amounts while panning, so the set looks loose rather than moving as one sheet.

## Details

- **Card hover**: the image scales to 1.05 with `brightness(0.9)` inside a clipped frame. The
  transition is a Framer spring `{bounce: 0.1, duration: 0.6}`, solved to stiffness ≈200 /
  damping ≈25.4 and stored as a CSS `linear()` easing in `--spring`.
- **Type**: IBM Plex Mono at 10px. Titles are weight 500 in `#666`, descriptions weight 400 in
  `#969696`.
- **Cursor**: an 18px `#F2511B` dot. The native cursor is hidden.
- **Nav**: links are `#969696`, `#666` on hover, and `#F2511B` for the current page.
- **Hint**: "Scroll/drag to move" uses `mix-blend-mode: difference`, so it inverts over images.
- **Breakpoints**: below 810px the canvas is replaced by an intro heading and a stacked list of 9
  cards.

## Where the port differs (on purpose)

- **Refresh rate**: the lerps are refresh-rate independent. The original assumes 60fps, so it
  runs about twice as fast on 120Hz screens.
- **Hover**: uses CSS `:hover`. The original swaps the live React node into whichever slot is
  under the mouse, because only that node gets Framer's hover gesture. CSS makes the swap
  unnecessary.
- **Input**: pointer events replace separate mouse and touch handlers.
- **Idle**: the render loop skips DOM writes once everything has settled.
- **Reduced motion**: `prefers-reduced-motion` turns off parallax and drift.
- **Lazy layouts**: only the layout for the current breakpoint is built, so phones never
  download the canvas images.
- **Heading font**: "Self Modern" is commercial, so Newsreader 300 stands in.

## Customising

- **Content**: edit `playground-data.js`. `x`, `y` and `w` place a card on the tile, which is now
  2400×1560 (set in both `playground-data.js` and `.pg-canvas` in `playground.css`) to fit 20 cards.
  `pw` and `ph` are the media's pixel size, used for its aspect ratio. `z` is the stacking order.
  Add `video` to an item to show a muted, looping clip instead of `src`.
- **Feel**: change `SETTINGS` at the top of `playground.js`.
- **Content source**: the cards are Anushree's work and photos from `assets/`, no longer Emmi Wu's.

# About — how emmiwu.com/about works

`about.html` + `about.css` rebuild the page. It reuses `footer.css`/`footer.js`, and `about.js` only
adds the cursor dot.

## Structure

- **Row**: a 33% text column beside a photo column that fills the rest. Gap 24px, max width
  1700px, 18px outer padding.
- **Text**: the serif title (24px), Figtree 300 14px bio in `#969696`, then Experience and Education.
  Each row reads "Org /" in `#666` and the role in `#969696`. The years are IBM Plex Mono 300 12px,
  and every row has a `#E3E3E3` hairline under it.
- **Photos**: a 2×2 grid, gap 12px, 744px tall on desktop, with the portrait spanning both rows.
  Each frame is `#666` with a 2px radius. The image inside is a 3:4 box centred in the frame, so
  short frames crop the middle of the photo instead of refitting it. To keep a subject in frame,
  set `--focus` on the `<img>`, e.g. `style="--focus: 50% 0%"`.
- **Links**: underlined 1px with a 2px offset, and orange on hover with no transition.
- **Appear**: the grid fades in from 20px below using a Framer spring `{bounce: 0.2, duration: 0.6}`
  after a 0.2s delay.

## Breakpoints

| Width | Layout |
|---|---|
| ≥1200 | Portrait on the left, two photos stacked on the right |
| 810–1199 | Portrait full width above the other two (4 × 200px rows) |
| <810 | Only the portrait, 327px tall, above the text |

## Where the port differs (on purpose)

- **Tablet gap**: the original locks the tablet grid to an aspect ratio, which leaves about 500px
  of empty space under the photos. The port drops it.
- **Short names**: the original shows full org names from 1200px up. The port waits until 1400px,
  because names like "Netaji Subhas University of Technology" wrap at 1200px. Mark text with
  `.about__long` / `.about__short` to swap it.
- **Content**: the page now holds Anushree's AI/ML resume and photos (`assets/about-*.jpg`).
