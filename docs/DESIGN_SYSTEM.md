# Design system

**A white gallery.** The product visuals are the event; typography and controls stay deliberately
quiet around them. The language follows the restrained, product-led style of modern hardware
launch pages: seamless white storytelling sections, Studio Mist feature bands, large flat cards, and
one blue used only for links and compact conversion pills. View it live at `/design-system`.

## Principles

- **Visuals lead.** Big centered product renders sit directly on white; text frames them.
- **Flat.** No shadows on surfaces, no gradients on the page. Separation comes from white against
  Studio Mist, 28px corners, and sparse 1px hairlines. (Gradients appear only inside product art.)
- **One blue.** Apple Blue for text links; Pricing Blue for compact filled pills. Never a large fill.
- **Quiet type.** Tight tracking at display sizes, slightly negative in text, sentence case.
- **Accessible.** WCAG 2.2 AA contrast, visible focus rings, semantic HTML, keyboard support.

## Colour tokens (`src/app/globals.css`)

| Token             | Value     | Use                                                  |
| ----------------- | --------- | ---------------------------------------------------- |
| `gallery-white`   | `#ffffff` | Canvas, hero, cards on mist                          |
| `studio-mist`     | `#f5f5f7` | Alternate bands, footer, muted surfaces              |
| `paper-frost`     | `#fafafc` | Opened navigation                                    |
| `hairline-silver` | `#d6d6d6` | 1px dividers and borders                             |
| `control-gray`    | `#e6e6e8` | Disabled fills, subdued utility surfaces             |
| `ink`             | `#1d1d1f` | Headlines and body                                   |
| `slate`           | `#6e6e73` | Secondary copy (5.1:1 on white, 4.7:1 on mist)       |
| `steel`           | `#86868b` | Input outlines, inactive glyphs (3.5:1 for controls) |
| `apple-blue`      | `#0066cc` | Links and text controls                              |
| `pricing-blue`    | `#0071e3` | Filled pills (`bg-primary`)                          |
| `launch-orange`   | `#b64400` | Launch labels as bare 12px text, never a pill        |

Semantic tokens (`background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `border`,
`input`, `ring`, `highlight`, status colours) map onto these; prefer semantic tokens in components.
Dark tokens exist under `.dark` but no theme toggle is enabled.

## Typography

SF Pro Display and SF Pro Text on Apple devices (via `-apple-system`), with **Inter** as the
fallback elsewhere. Utilities:

| Utility                   | Size / weight                                 | Use                              |
| ------------------------- | --------------------------------------------- | -------------------------------- |
| `text-hero`               | 80px / 600, 1.05, -1.2px (fluid down to 40px) | Homepage statement               |
| `text-section`            | 48px / 600 (fluid)                            | Section and page headings        |
| `text-feature`            | 40px / 600 (fluid)                            | Feature-card statements          |
| `text-kicker` / `eyebrow` | 21px / 600                                    | Product name and section kickers |
| `text-lead`               | 21px / 400                                    | Intro copy                       |
| body (default)            | 17px / 1.47, -0.374px                         | Paragraphs                       |
| `text-compact`            | 12px, -0.12px                                 | Navigation, controls, footer     |

## Shape and layout

- Cards and media: **28px** (`rounded-3xl`), flat, no border or shadow. A faint `ring-1` hairline
  is used where a white card sits on white.
- Controls: fully round pills (`rounded-full`). Form fields use 12px corners; search may use pills.
- 4px spacing base; **90px** between major sections; 20px between related elements.
- Container 80rem with 16/24/32px gutters; reading width 42rem.

## Components

- **Button:** `default` (Pricing Blue pill), `secondary`, `outline` (steel 1px, transparent),
  `ghost`, `link` (Apple Blue text), `destructive`. Sizes `sm` (12px), `default` (14px),
  `lg` (17px), `icon`.
- **Navigation:** 48px translucent bar (blur 20px) with 12px links; Donate is a compact blue pill.
  Mobile uses a sheet. In-page chapters use `AnchorNav` (17px / 500, unboxed).
- **Hero:** kicker, 80px statement, blue and outlined pills, product render directly beneath with a
  flat floating callout.
- **Highlights stage:** Studio Mist band with large white 28px cards in a CSS scroll-snap row.
- **Editorial block:** kicker, large statement, 17px copy, and a render cropped into a 28px stage.
- **Section / SectionHeading / PageHeader:** white and mist bands, centered page headers.
- **Cards for sample data** show a dashed "Sample" label (see Content guidelines).

## Product art (`src/components/marketing/device-art.tsx`)

Original SVG illustrations, not photography and not any other company's imagery: an opened foldable
device (`FoldDevice`) and phone scenes (`PrayerPhone`, `IdeasPhone`, `TeamPhone`, `GivePhone`).
They use design tokens, add no image weight, stay sharp at any size, and carry accessible labels.
Screen contents are illustrative and labelled "Sample" where they name tools or ideas. When real
photography or rendered assets are commissioned, swap them in through the same components.

## Content guidelines

- Plain, warm, specific language. Short statements, sentence case.
- Placeholder content lives in `src/content/placeholders.ts` and is visibly labelled as a sample.
- Never invent facts about the ministry (statistics, partners, doctrine); use a clear
  "content pending" state instead.
