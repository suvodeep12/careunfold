---
name: CareUnfold
description: A white decision worksheet for transparent sample review adjustments.
colors:
  ink: '#172b45'
  muted: '#52647b'
  blue: '#154fba'
  line: '#d8e0eb'
  paper: '#fff'
  tint: '#edf3ff'
  focus: '#0c409b'
  canvas: '#f1f4f8'
  button-hover: '#e8eef7'
  primary-hover: '#103e95'
  source-surface: '#f0f3f7'
  source-text: '#405570'
  synthetic-surface: '#fff4d9'
  synthetic-text: '#71521a'
  synthetic-title: '#624309'
  rating-ink: '#163f82'
  rating-divider: '#bacceb'
  original-ink: '#39557e'
  caption-ink: '#355681'
  boundary-ink: '#43556d'
  effect-ink: '#234e93'
  effect-surface: '#f2f6ff'
  error-surface: '#fff1f0'
  error-ink: '#8a2925'
  error-line: '#dfb8b5'
  selection-surface: '#c5d8ff'
  selection-ink: '#112d5d'
  scrollbar: '#a9b7cc'
typography:
  body:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 14px
    lineHeight: 1.55
  title:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 24px
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: -.02em
  section:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 17px
    fontWeight: 650
    lineHeight: 1.4
  rating:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 52px
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: -.04em
  label:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 12px
    lineHeight: 1.55
  wordmark:
    fontFamily: Segoe UI, Roboto, "Noto Sans", sans-serif
    fontSize: 19px
    fontWeight: 700
    lineHeight: 1.55
rounded:
  note: 4px
  control: 6px
  sheet: 8px
  wide-shell: 10px
spacing:
  icon-gap: 8px
  compact-gap: 12px
  control-section: 16px
  section: 20px
  panel-inset: 22px
  evidence-section: 30px
components:
  button-primary:
    backgroundColor: '{colors.blue}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: 9px 13px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-primary-small:
    backgroundColor: '{colors.blue}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: 7px 10px
    typography: '{typography.label}'
  button-secondary:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 9px 13px
  button-text:
    textColor: '{colors.blue}'
    padding: '0'
  rating-sheet:
    backgroundColor: '{colors.tint}'
    textColor: '{colors.rating-ink}'
    rounded: '{rounded.sheet}'
    padding: 18px 18px 16px
  source-note-synthetic:
    backgroundColor: '{colors.synthetic-surface}'
    textColor: '{colors.synthetic-text}'
    rounded: '{rounded.note}'
    padding: 10px 12px
    typography: '{typography.label}'
  disclosure:
    textColor: '{colors.ink}'
    padding: 15px 0
  review-entry:
    textColor: '{colors.ink}'
    padding: 13px 0
  adjustment-checkbox:
    size: 17px
  wordmark-navigation:
    textColor: '{colors.ink}'
    typography: '{typography.wordmark}'
---

# Design System: CareUnfold

## Overview

**Creative North Star: "The Decision Worksheet"**

A white decision worksheet with ink-blue navigation, flat ruled sections and system UI lettering. Numbers lead; origin, coverage and limitations stay close to the evidence they qualify.

The operative extension uses restrained controls and native disclosures to keep the review comparison readable beside a browser page. It documents a local sample sensitivity scenario, with no visual claim of clinical competence or review authenticity.

**Key Characteristics:**
- White paper and flat ruled evidence sections.
- A prominent adjusted number paired with its original average.
- System UI lettering and aligned tabular numbers.
- Local provenance, explicit uncertainty and native disclosures.

## Colors

### Primary
Ink-blue actions and focus anchor a white worksheet. The blue tint carries the numerical comparison; related blue inks separate the main value, original value and explanatory caption.

**The Evidence Proximity Rule.** Keep origin, coverage and sample limitations close to the result they qualify.

### Neutral
Paper, canvas, ink, muted text and fine rules define the resting surface. Warm amber identifies synthetic origin; pale red identifies import errors. These are informational states, not provider verdicts. Selection and scrollbar colors retain the same cool register. Frontmatter values are normative.

## Typography

The approved operative stack is Segoe UI, Roboto, Noto Sans, sans-serif. No external font is loaded. Body copy is compact and readable; titles use modest scale rather than marketing display type.

Hierarchy: title for the clinic or empty state; section for evidence; rating for the leading number; label for coverage, captions and supporting context; wordmark for navigation. The original average uses a smaller 24px number at weight 600 and line-height 1.2. Below 360px, the leading number becomes 44px. Rating comparisons and review counts use tabular figures.

**The Operative Type Rule.** Use the approved system UI stack on this extension; reserve scale for the numerical comparison rather than decorative display lettering.

## Layout

A single column grows to 560px. Toolbar and main share 22px horizontal insets; main starts with 20px top padding. Below 360px, insets become 16px, the sheet padding becomes 15px, the prototype suffix disappears, section headings stack and review/context rows wrap. Above 650px, the shell receives 24px vertical margins, a fine border and rounded clipping. Rating values remain paired within a flexible row.

The evidence section follows the result and its boundary text with a 30px gap. Affected review entries are reached through inline Wording or Dates labels in native disclosures. Source and error notices precede the clinic title.

## Elevation & Depth

No shadows. Tonal fields identify the numerical sheet, provenance and errors; thin borders divide evidence and establish the wide shell. Focus is a 3px outline with a 3px offset.

**The Ruled Worksheet Rule.** Separate evidence with thin rules and quiet tonal fields; the shipped interface has no shadows.

## Shapes

Notes use the smallest radius, buttons and errors the control radius, the rating field the sheet radius, and the wide shell its own radius. Evidence rows remain flat with bottom rules. Inline line-art SVGs use round caps and joins; no raster assets ship.

## Components

- **Buttons:** blue primary import action, paper secondary actions and an underlined text download action. Default controls have 40px minimum height; compact import uses 36px and text actions 32px. Hover changes fill; busy actions dim to 0.6 and show a wait cursor.
- **Rating sheet:** a quiet blue field, large adjusted number, smaller original value behind a vertical divider, and coverage/effective-vote caption. Updates use a polite live region.
- **Adjustment control:** native 17px checkbox, label and indented explanatory line. Its state changes the sample comparison, not provenance or context findings.
- **Disclosures:** native details/summary for evidence, arithmetic and limitations. Finding chevrons rotate over 180ms ease-out; method disclosures use plus/minus indicators. Reduced-motion preference removes transitions.
- **Evidence and states:** ruled review entries retain original text, IDs, dates and weights. Synthetic provenance is amber; user-supplied provenance is neutral and explicitly unverified. Import errors use an alert, reading uses a status, and the empty state offers import or the synthetic example.

## Do's and Don'ts

### Do:
- Do keep origin, sample coverage and uncertainty beside numerical evidence.
- Do use system UI lettering for the operative extension and tabular figures for comparisons.
- Do retain native disclosure and checkbox keyboard behavior, visible focus and narrow-panel wrapping.
- Do label synthetic demonstrations and distinguish context observations from rating changes.

### Don't:
- Don't present the sample adjustment as a clinical-quality or authenticity verdict.
- Don't add decorative imagery or theatrical depth to this worksheet.
- Don't hide unknown provenance or missing values behind reassuring styling.
