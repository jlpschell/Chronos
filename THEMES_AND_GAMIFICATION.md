# THEMES_AND_GAMIFICATION.md

## 1. Overview
This document outlines the visual design system ("Realms") and the gamification mechanics ("Progression") for the Linear Calendar application. 

**Core Philosophy:** The UI is not just a skin; it is an environment. We avoid a generic color wheel in favor of curated "Realms" that reduce eye strain and set a specific mental mode.

---

## 2. The Gamification Layer (Retention Mechanics)
To encourage daily usage and habit formation, the visual experience is tied to user discipline.

### The Logic
* **Default State:** All users start with "Moonlit Silvery" (Dark/Focus mode).
* **Discovery:** "Sepia," "Warm," and "Cool" are available immediately as alternatives.
* **The Lock:** The "Bright & Fun" (Daylight) theme is **LOCKED** by default.
* **Unlock Condition:** The user must log activity (create a memo, complete a task) on **30 distinct days**.

### Data Requirements
We need a simple tracker in the user profile:
`user.stats.daysActive` (Integer)

---

## 3. Theme Specifications ("The Realms")

### A. Moonlit Silvery (DEFAULT)
* **Vibe:** Cyber-noir, Deep Focus, "God Mode."
* **Best For:** Night work, high contrast, coding.

| Token | CSS Variable | Hex Code (Tailwind approx) | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | `--bg-canvas` | `#020617` (Slate-950) | Main App Background |
| **Surface** | `--bg-surface` | `#0f172a` (Slate-900) | Cards, Modals, Panels |
| **Ink** | `--text-primary` | `#e2e8f0` (Slate-200) | Primary Text |
| **Sub-Ink** | `--text-secondary`| `#94a3b8` (Slate-400) | Metadata, timestamps |
| **Accent** | `--color-accent` | `#38bdf8` (Sky-400) | Primary Buttons, Active States |
| **Glow** | `--color-glow` | `#a855f7` (Purple-500) | Highlights, "AI" moments |
| **Border** | `--border-line` | `#1e293b` (Slate-800) | Dividers |

### B. Earthy Sepia (The Explorer)
* **Vibe:** Da Vinci’s Notebook, Old Maps, Grounding.
* **Best For:** Planning, reading, low eye strain.

| Token | Hex Code |
| :--- | :--- |
| **Canvas** | `#f5f5dc` (Beige) |
| **Surface** | `#e8e4c9` (Darker Tan) |
| **Ink** | `#4a3b32` (Espresso) |
| **Accent** | `#d97706` (Amber-600) |
| **Border** | `#d6d3c4` |

### C. The Warm (Sunset)
* **Vibe:** Cozy, Reflection, Winding Down.
* **Best For:** Evening reviews.

| Token | Hex Code |
| :--- | :--- |
| **Canvas** | `#fff1f2` (Rose-50) |
| **Surface** | `#ffe4e6` (Rose-100) |
| **Ink** | `#881337` (Rose-900) |
| **Accent** | `#b45309` (Gold/Amber) |
| **Border** | `#fecdd3` |

### D. The Cool (Deep Ocean)
* **Vibe:** Flow State, Sterile, Professional.
* **Best For:** Morning productivity.

| Token | Hex Code |
| :--- | :--- |
| **Canvas** | `#f0f9ff` (Sky-50) |
| **Surface** | `#e0f2fe` (Sky-100) |
| **Ink** | `#0c4a6e` (Sky-900) |
| **Accent** | `#0ea5e9` (Sky-500) |
| **Border** | `#bae6fd` |

### E. Brighter Fun (Daylight) [LOCKED]
* **Vibe:** Pop Art, Energetic, Clarity.
* **Best For:** High energy execution.

| Token | Hex Code |
| :--- | :--- |
| **Canvas** | `#ffffff` (Pure White) |
| **Surface** | `#f3f4f6` (Gray-100) |
| **Ink** | `#000000` (Pure Black) |
| **Accent** | `#ec4899` (Pink-500) |
| **Secondary**| `#eab308` (Yellow-500) |

---

## 4. Technical Implementation

### Step 1: CSS Variables (globals.css)
We will use data attributes on the `<body>` tag to switch themes.

```css
@layer base {
  :root {
    /* Default (Moonlit) Fallback */
    --bg-canvas: #020617;
    --text-primary: #e2e8f0;
    /* ... define others */
  }

  /* Theme Overrides */
  [data-theme='sepia'] {
    --bg-canvas: #f5f5dc;
    --text-primary: #4a3b32;
    /* ... */
  }
  
  [data-theme='fun'] {
    --bg-canvas: #ffffff;
    --text-primary: #000000;
    /* ... */
  }
}