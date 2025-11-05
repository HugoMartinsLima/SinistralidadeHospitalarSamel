# Design Guidelines: Hospital Claims Management System

## Design Approach

**Selected Approach**: Design System - Material Design 3 inspired
**Justification**: Healthcare data management applications require clarity, efficiency, and established patterns. This is an information-dense, utility-focused system where data comprehension and workflow efficiency are critical. Material Design provides excellent patterns for data tables, dashboards, and form interactions.

**Key Design Principles**:
- Clinical Clarity: Information hierarchy that supports quick decision-making
- Data Integrity: Clear visual distinction between data types and statuses
- Professional Trust: Clean, consistent interface that instills confidence
- Workflow Efficiency: Minimize clicks and cognitive load for healthcare professionals

---

## Core Design Elements

### A. Typography

**Font Family**: Inter (via Google Fonts CDN)

**Hierarchy**:
- Page Titles: text-3xl, font-semibold (32px)
- Section Headers: text-xl, font-semibold (20px)
- Card Titles: text-lg, font-medium (18px)
- Body Text: text-base, font-normal (16px)
- Labels/Metadata: text-sm, font-medium (14px)
- Captions/Footnotes: text-xs, font-normal (12px)

**Data-Specific Typography**:
- Numerical Data: font-mono for alignment (patient IDs, claim numbers, dates)
- Status Indicators: font-medium, uppercase tracking-wide for labels

---

### B. Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing (p-2, gap-2): Within table cells, compact lists
- Standard spacing (p-4, gap-4): Card padding, form field spacing
- Section spacing (p-6, gap-6): Between card sections
- Component spacing (p-8, m-8): Between major components
- Page margins (px-12, py-16): Container padding on desktop

**Grid Structure**:
- Dashboard: 12-column grid for flexible layouts
- Main content area: max-w-7xl centered
- Sidebar navigation: Fixed width 256px (w-64)
- Data tables: Full-width within container

---

### C. Component Library

**1. Navigation**
- **Top Navigation Bar**: Fixed header with logo, search bar, user profile, notifications
- **Sidebar**: Collapsible left sidebar with hierarchical menu (Dashboard, Claims, Patients, Analytics, Reports, Settings)
- **Breadcrumbs**: Always visible for deep navigation paths

**2. Dashboard Components**
- **KPI Cards**: Grid of 2x2 or 4-column cards showing key metrics (Total Claims, Pending Reviews, Average Processing Time, Monthly Costs)
  - Large number display with trend indicators (↑ 12% from last month)
  - Icon in top-right corner using Material Icons
- **Charts**: Line charts for trends, bar charts for comparisons, donut charts for category breakdowns
- **Recent Activity Table**: Compact table showing latest 5-10 claims with quick actions

**3. Data Tables**
- **Full-featured tables**: Sortable columns, filterable headers, pagination
- **Row actions**: Hover state reveals action icons (view, edit, delete)
- **Status badges**: Pill-shaped badges for claim status (Pending, Approved, Rejected, Under Review)
- **Expandable rows**: Click to reveal detailed information without leaving table view
- **Selection**: Checkboxes for bulk actions

**4. Forms**
- **Structured layouts**: Two-column forms for data entry
- **Input groups**: Related fields grouped with subtle borders
- **Inline validation**: Real-time feedback with icons and helper text
- **Date pickers**: Calendar widgets for date selection
- **Dropdowns**: Searchable select menus for large option lists
- **File upload**: Drag-and-drop zones for document uploads

**5. Cards**
- **Patient Cards**: Avatar/initial, name, ID, key info, quick actions
- **Claim Detail Cards**: Organized sections with dividers (Patient Info, Claim Details, Financial Summary, Documents)
- **Elevation**: Subtle shadows for depth (shadow-sm for standard, shadow-md for elevated states)

**6. Modals & Overlays**
- **Detail Views**: Large modals for claim/patient details with tabbed sections
- **Confirmation Dialogs**: Clear action confirmation with primary/secondary buttons
- **Loading States**: Skeleton screens for data fetching, spinners for quick actions

**7. Search & Filters**
- **Global Search**: Prominent search bar in top nav with autocomplete
- **Advanced Filters**: Collapsible filter panel with multiple criteria (date ranges, status, hospital department, claim type)
- **Applied Filters**: Chip-style tags showing active filters with remove option

---

### D. Icons

**Library**: Material Icons (via CDN)
**Usage**:
- Navigation menu items
- KPI card indicators
- Table action buttons
- Status indicators
- Form field prefixes

---

### E. Responsive Behavior

**Breakpoints**:
- Mobile (< 768px): Stack cards vertically, hide sidebar (hamburger menu), simplified tables (card view)
- Tablet (768px - 1024px): 2-column layouts, collapsible sidebar
- Desktop (> 1024px): Full multi-column layouts, persistent sidebar

---

## Images

**No hero images** - This is a data application, not a marketing site. Focus is on dashboard efficiency.

**Functional Images**:
- Patient avatars/placeholders in patient lists
- Hospital/clinic logos in claims where applicable
- Document thumbnails in file attachment areas
- Empty state illustrations for "No claims found" scenarios

---

## Accessibility

- WCAG 2.1 AA compliance throughout
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for status changes
- Focus indicators clearly visible
- Form inputs with associated labels (not just placeholders)