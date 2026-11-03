# D3-Based User-Item Interaction Matrix Heatmap & Cold-Start Visualizer

Integrate a custom D3.js density heatmap in the 'Data' tab of the AURA recommendation engine to visually analyze matrix sparsity, interaction frequencies, and cold-start boundaries.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following recommended architectural choices will be implemented based on the dismissed questionnaire defaults:
> - **Cold-Start Visual Encoding**: Cold-start rows (users with $\le 1$ interaction) and columns (items with $\le 1$ interaction) will be highlighted with cold ice-blue hairline indicators, dashed cold-start cell badges, and a real-time sparsity gauge ($S = 1 - \frac{|E|}{|U| \times |I|}$).
> - **D3 Canvas Interactivity**: Fully interactive SVG canvas powered by D3 (`d3-scale`, `d3-selection`, `d3-axis`) featuring hover tooltips, sort-by-density clustering mode, and 1-click interaction warming (clicking a cold-start cell immediately logs a test event).
> - **Package Installation**: Will install `d3` and `@types/d3` upon plan approval.

---

### 1. Overview & Core Concept

- **What It Does**: Replaces the static matrix table in the Data Collection tab with a dual-mode visualization suite: a high-performance interactive D3.js heatmap canvas alongside density metrics and the raw log viewer.
- **Target Audience**: Recommendation system engineers, data scientists, and store administrators diagnosing collaborative filtering coverage gaps and cold-start bottlenecks.
- **Key Value**: Quickly exposes cold-start zones where collaborative filtering degrades due to missing peer overlaps, allowing instant diagnosis and interactive dataset warming.

---

### 2. User Experience & Visual Design

- **Density Heatmap Canvas**:
  - **Axes & Layout**: Top X-axis displays catalog products (with angled labels and category indicators), Left Y-axis displays users with avatar chips.
  - **Color Gradient**: Continuous sequential color ramp from deep slate/charcoal (0 interactions), to warm amber-orange (1–3 interactions), up to radiant gold (5★ purchase conversions).
  - **Cold-Start Highlight Overlay**: Cold-start users and items (interaction frequency $\le 1$) are bordered with a distinctive cool-tinted dashed halo and a warning icon indicator in the axis header.
- **HUD & Metric Cards**:
  - **Global Sparsity Rate**: Displays the exact percentage of unobserved matrix entries ($1 - \frac{\text{non-zero}}{|U| \times |I|}$).
  - **Cold-Start Users**: Count and percentage of users needing warm-up interactions.
  - **Cold-Start Products**: Count and percentage of catalog items lacking sufficient collaborative co-ratings.
  - **Average Degree of Connectivity**: Average interactions per entity.
- **Interactions & Controls**:
  - **Sorting Mode Toggle**: "Default Index" vs "Density Clustered" (sorts rows and columns by interaction volume, clustering dense activity in the top-left and isolating cold-start fringes in the bottom-right).
  - **Hover Tooltip**: Displays user, product, interaction history breakdown (e.g. 1 view, 1 cart, rated 5★), and whether this pair is in a cold-start state.
  - **Interactive Cell Warming**: Clicking any cold-start cell opens a quick 1-click action to log an interaction and immediately watch the matrix warm up in real time.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: D3 SVG vs HTML Table / Canvas**
  - *Chosen Approach*: D3.js SVG rendering with React ref integration (`useRef` + `useEffect` D3 lifecycle).
  - *Why*: SVG offers pixel-crisp typography, vector axes, smooth CSS hover transitions, and accessible DOM tooltips for matrices up to $50 \times 50$, ideal for our 10-product / 6-user interactive catalog.
- **Decision 2: Cold-Start Definition Threshold**
  - *Chosen Approach*: Configurable cold-start threshold ($\le 1$ interaction, or toggleable to $\le 2$).
  - *Why*: In collaborative filtering, 0 interactions represents strict cold-start, while 1 interaction represents extreme sparsity where neighborhood correlation is volatile.
- **Decision 3: Retaining Both Views**
  - *Chosen Approach*: Segmented switch between "D3 Density Heatmap" and "Numeric Rating Matrix".
  - *Why*: The D3 density view provides macro visual patterns and cold-start diagnostics, while the numeric table allows inspecting exact predicted rating values.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                      AURA Data Tab                           │
└──────────────────────────────┬───────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Matrix Sparsity HUD       │ │     Interaction Weights &     │
│  - Matrix Sparsity %          │ │     Event Dispatcher          │
│  - Cold-Start Users Count     │ └───────────────────────────────┘
│  - Cold-Start Items Count     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│              D3InteractionHeatmap Component                   │
│                                                               │
│   X-Axis: Products [d3.scaleBand]                             │
│   Y-Axis: Users    [d3.scaleBand]                             │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │  Cell Fill: d3.scaleSequential (slate -> amber -> gold│   │
│   │  Cold-Start Outline: Dashed cyan/ice stroke           │   │
│   │  Hover: Dynamic D3 tooltip                            │   │
│   │  Click: 1-click signal injector                       │   │
│   └───────────────────────────────────────────────────────┘   │
│                                                               │
│   Controls: [Sort by Density / Default] [Cold-Start Filter]   │
└───────────────────────────────────────────────────────────────┘
```

#### Implementation Steps
1. Install `d3` and `@types/d3` via `install_applet_package`.
2. Create `src/components/D3InteractionHeatmap.tsx`:
   - Compute user and item interaction counts, sparsity ratio, and cold-start sets.
   - Setup D3 scales (`scaleBand` for users and items, `scaleSequential` with custom interpolator for density).
   - Render D3 axes with styled labels and cold-start warning chips.
   - Implement cell enter/update transitions with cold-start dashed overlays.
   - Add hover tooltip and cell click warming modal.
3. Integrate the component into `src/components/DataCollectionView.tsx` with a view switcher (`Heatmap Density View` vs `Numeric Rating Matrix`).
4. Verify compilation with `compile_applet` and lint validation with `lint_applet`.
