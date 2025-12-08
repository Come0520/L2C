# React Compiler Verification Log

> **Objective**: Quantify the performance benefits and risks of enabling the experimental React Compiler.

## configuration
- **Toggle**: `REACT_COMPILER_ENABLED` (set in `.env.local` or inline command)
- **Baseline**: `REACT_COMPILER_ENABLED=false`
- **Experimental**: `REACT_COMPILER_ENABLED=true`

## Test Scenarios & Results

### 1. Dashboard (Virtual List & Cards)
- **Interaction**: Scroll list for ~5s, Toggle card filters 5 times.
- **Metric: Render Commits (Avg of 5 runs)**
  - Baseline: [TBD]
  - Compiler: [TBD]
  - **Improvement**: [TBD]%
- **Metric: Avg Render Duration (ms)**
  - Baseline: [TBD]
  - Compiler: [TBD]
  - **Improvement**: [TBD]%

### 2. Orders Status (Filters & Pagination)
- **Interaction**: Switch status tabs, Change pagination page.
- **Metric: Render Commits**
  - Baseline: [TBD]
  - Compiler: [TBD]
  - **Improvement**: [TBD]%

### 3. Leads Kanban (Drag & Drop)
- **Interaction**: Drag lead across columns 5 times.
- **Metric: Render Commits**
  - Baseline: [TBD]
  - Compiler: [TBD]
  - **Improvement**: [TBD]%

### 4. Notifications (List & Tabs)
- **Interaction**: Switch between Notification/Approval tabs.
- **Metric: Render Commits**
  - Baseline: [TBD]
  - Compiler: [TBD]
  - **Improvement**: [TBD]%

## Page Level Metrics (Lighthouse/Performance API)
- **LCP (Largest Contentful Paint)**
  - Baseline: [TBD] ms
  - Compiler: [TBD] ms
- **TBT (Total Blocking Time)**
  - Baseline: [TBD] ms
  - Compiler: [TBD] ms

## Stability Checklist
- [ ] No console errors (hydration mismatches, etc.)
- [ ] UI visual stability (no flickering)
- [ ] Functional regression test (filters work, drag & drop works)

## Conclusion
> Summary of findings and recommendation (Keep Enabled / Disable / Further Investigation).
