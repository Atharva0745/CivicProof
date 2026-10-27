# CivicProof --- UI/UX Design Specification

**Product:** CivicProof --- Verified Municipal Issue Resolution\
**Visual direction:** Modern civic-tech, light theme, editorial layout,
map-first, evidence-led\
**Frontend:** React + Vite + Tailwind CSS\
**Goal:** A polished, credible product UI---not a generic admin template
made of repeated rounded cards.

------------------------------------------------------------------------

## 1. Design principles

1.  **Map and issue list are the main interface.** The product is about
    real places, not a wall of dashboard cards.
2.  **Use hierarchy instead of decoration.** Large clear headings,
    compact metadata, thin separators, and intentional whitespace.
3.  **Light theme only for the first version.** Warm off-white canvas,
    white work surfaces, dark ink text, restrained blue and teal
    accents.
4.  **Status must be understandable without color alone.** Always pair
    status colors with text and/or icons.
5.  **Evidence before claims.** Show when a report was submitted,
    whether an official reference was added, and whether a resolution
    was reviewed.
6.  **Avoid fake authority.** Make it clear CivicProof is an independent
    citizen tool, not a BMC-operated service.
7.  **Mobile-first reporting.** A citizen should be able to submit an
    issue with a photo and location in a short, guided flow.

## 2. Visual system

### Colour tokens

Use a restrained palette. Do not use gradients as the main visual
identity.

  Token             Suggested value   Usage
  ----------------- ----------------- ---------------------------------------------
  `canvas`          `#F6F7F5`         Overall page background
  `surface`         `#FFFFFF`         Main content surfaces
  `ink`             `#17211F`         Main text and headings
  `muted`           `#68736F`         Supporting text
  `line`            `#E1E6E2`         Dividers and input borders
  `primary`         `#176B5B`         Primary actions, selected nav, map controls
  `primary-hover`   `#115448`         Hover state
  `info`            `#245FC7`         Official reference / informational links
  `warning-bg`      `#FFF3D8`         Needs attention
  `warning-ink`     `#805500`         Warning text
  `danger-bg`       `#FDE9E7`         Disputed / rejected
  `danger-ink`      `#A12D25`         Error text
  `success-bg`      `#E2F4EA`         Verified resolution
  `success-ink`     `#176443`         Verified text

### Typography

-   Use **Inter** or **Geist Sans**.
-   Page titles: 28--36px desktop, 24--28px mobile, weight 600--700.
-   Section headings: 16--20px, weight 600.
-   Body: 14--16px, line-height 1.5--1.65.
-   Metadata: 12--13px, muted but readable.
-   Use tabular numerals for counts and dates where possible.
-   Avoid uppercase labels everywhere; reserve them for small overlines.

### Shape, spacing and elevation

-   Page layout: max-width around 1440px, centered; desktop gutters
    32--40px, mobile 16px.
-   Use a 4px spacing scale.
-   Main surfaces: 10--14px radius, not pill-shaped everything.
-   Inputs: 10px radius, 44--48px height.
-   Borders: 1px solid `line`.
-   Shadows: minimal; use only for floating map controls, menus, and
    dialogs.
-   Prefer flat surfaces separated by whitespace and dividers over
    stacks of cards.
-   Use pills only for compact status labels and filters.

## 3. App shell and navigation

### Desktop

A slim top bar: - CivicProof wordmark on the left with a small
location-pin/checkmark mark. - Main navigation: `Explore map`,
`My reports`, `How it works`. - Right side: `Report an issue` primary
button and profile menu. - Thin bottom border; white or translucent
white background; no giant hero navbar.

A small persistent notice below the nav: \> CivicProof is an independent
community reporting tool. Official complaints must be submitted through
the responsible authority.

Use a muted background and a small info icon. Do not make this notice
look like an alarming warning.

### Mobile

-   Compact top bar with wordmark and profile/menu button.
-   Bottom navigation: `Explore`, `My reports`, `Report`.
-   `Report` is the visually strongest action, but remains accessible
    and not oversized.
-   Keep forms in one column and map filters in a bottom sheet.

## 4. Home / Explore screen

### Layout

Desktop uses a split-screen layout: - **Left panel (approx. 44%):**
heading, search, filters, issue list. - **Right panel (approx. 56%):**
interactive map that remains visible while scrolling the list. - The map
should feel like the primary workspace, not a small decorative image. -
Avoid a row of four KPI cards. If summary metrics are useful, use one
compact inline strip above the list.

Header copy: - Eyebrow: `MUMBAI · COMMUNITY ISSUE MAP` - H1:
`See what needs fixing.` - Supporting text:
`Local reports, evidence and follow-up in one place.` - Primary CTA:
`Report an issue` - Secondary action: `How verification works`

Search field placeholder: `Search a locality, street or issue`

Filters: - `All issues` - `Potholes` - `Garbage` - `Drainage` -
`Streetlights` - Status dropdown: `Any status` - Time dropdown:
`Recently reported`

Use horizontal filter chips with a clear selected state. On mobile, put
secondary filters in a sheet.

### Issue list rows---not cards

Each issue should be a compact, clickable row with: - A small cropped
thumbnail (or category icon if no image). - Issue title, locality, and
distance if available. - A short status label. - Report count / "3
reports nearby" only if computed from actual records. - Relative date
plus absolute date in details. - Thin separator between rows. - Hover
background, not a large shadow.

Selected issue row gets a 3px left accent and a pale background.
Clicking it centers the map.

### Map styling

-   Use a light, low-contrast map tile style.
-   Issue markers should use category icons and distinct status
    outlines.
-   Marker clusters display counts.
-   Selected marker expands into a small map popup with title, status,
    and `View report`.
-   Map controls are small, floating, white, bordered controls.
-   Include a legend for `Reported`, `In progress`,
    `Resolution claimed`, `Verified`.
-   Do not expose exact private residential coordinates on public maps;
    round or redact location when appropriate.

## 5. Report issue flow

This is the most important form. Use a clear, progressive 3-step wizard,
not one overwhelming form.

### Step 1 --- What happened?

-   Heading: `Report a local issue`
-   Issue type as a clean icon grid/list: pothole, garbage, drainage,
    streetlight, other.
-   Title and short description.
-   Optional quick templates to help users describe the issue.
-   Avoid AI filling facts that the user hasn't supplied.

### Step 2 --- Where and evidence

-   Location search with `Use my location` (ask permission only when
    clicked).
-   Map pin that can be moved manually.
-   Address/locality field.
-   Photo upload area with dashed border and a clear camera/upload icon.
-   Show preview thumbnails, remove option, and upload progress.
-   Explain:
    `Photos help others understand the issue. Avoid including faces, number plates or private information.`
-   Show allowed file types and size limit.

### Step 3 --- Review and submit

-   Show a compact summary: issue, location, evidence count.
-   Privacy choice: public report with approximate location / private
    report.
-   Consent checkbox and short explanation.
-   Primary CTA: `Submit report`.
-   Secondary CTA: `Save draft`.
-   After submission show the CivicProof incident ID and next step:
    `Your CivicProof report is saved. To make it an official complaint, submit it to the responsible authority.`
    Include the official channel link when known.

### Form interaction details

-   Field labels always visible; don't rely on placeholders.
-   Inline validation near the field.
-   Keyboard navigation and focus ring.
-   Never block report creation just because the user declines GPS;
    allow manual location.
-   Uploads must show success/error states.
-   Use `aria-live` for submission feedback.

## 6. Incident detail page

This page is the heart of accountability.

### Header

-   Breadcrumb: `Explore / Pothole report`
-   Title: `Pothole near Dadar station`
-   Location and report date
-   Status with text, icon and restrained color
-   Actions: `Add evidence`, `Issue not fixed?`, `Share`

### Main layout

Desktop: 2/3 main column + 1/3 right rail.

**Main column** 1. Main evidence photo with small gallery thumbnails. 2.
Description and exact report details visible only according to privacy
permissions. 3. Map excerpt with privacy-aware location. 4. Activity
timeline. 5. Related/possible duplicate reports.

**Right rail** - `Official complaint` section: - State: `Not linked yet`
or `Reference added by reporter`. - `Open official complaint channel`
button/link. - `Add complaint reference` action. - If reference is
user-entered, label it
`Reporter-provided — not independently verified`. - `Resolution check`
section: - Before/after evidence. - Claimed repair date. - Verification
status: `Awaiting review`, `Verified by community reviewer`, or
`Disputed`. - Explain that photos alone do not prove a repair was
done. - Small source/privacy note.

### Activity timeline

Use a vertical timeline with a thin line and small icons: - Report
submitted - Possible duplicate linked - Official complaint reference
added - Follow-up prepared - Repair claimed - Resolution verified or
disputed

Each event shows actor role, date/time, and a concise explanation. Keep
the timeline in chronological order. Preserve audit history; don't
silently rewrite past events.

## 7. "Issue not fixed?" escalation wizard

This feature should be prominent but must not imply automatic government
submission.

### Screen 1 --- Confirm

Prompt: `Is the issue still present?`

-   `Yes, it is still there`
-   `It has been partly fixed`
-   `The issue is resolved`

Allow a new photo and optional note.

### Screen 2 --- Link official complaint

Fields: - Authority (e.g. BMC / Maharashtra grievance portal / Other) -
Official complaint reference (optional) - Date submitted - Official
portal link - Latest status as reported by user - Last checked date

Show a clear note:
`CivicProof cannot check your official complaint status unless an authorized integration is available. Updates here are based on information you provide.`

### Screen 3 --- Prepare follow-up

Generate a preview with: - Original issue and location - Original report
date - Official reference if supplied - Previous follow-up dates - New
evidence - A neutral request for inspection/action - Correct official
channel link

Actions: - `Copy follow-up text` - `Download report` -
`Open official portal`

Do not use `Send to BMC` unless a real authorized API or approved
submission workflow has been implemented and verified.

## 8. My Reports dashboard

Do not create a grid of KPI cards. Use: - Page title `My reports` - One
compact summary line,
e.g. `8 reports · 3 awaiting review · 2 follow-ups ready`. - Tabs:
`All`, `Needs attention`, `Resolved`. - Dense list/table rows with
thumbnail, issue, locality, status, last update. - An unobtrusive action
`Continue follow-up`. - Empty state with a helpful CTA to report the
first issue.

For desktop, use a table-like list. For mobile, use stacked rows with
only essential fields.

## 9. Public insights page

Show meaningful, qualified metrics: - Reports by category and ward (only
when ward data is reliable). - Recurring incident locations. - Median
time from report to a recorded resolution, if timestamps are complete. -
Percentage of claimed resolutions that have been reviewed. - Reports
awaiting verification.

Always show period, denominator, source and caveats. Don't call a
citizen report an official complaint. Don't infer corruption or official
fault from an unresolved issue. Avoid ranking individual officers unless
the data and governance basis support it.

Charts should be restrained: simple line/bar charts, readable axes, no
3D charts, and no arbitrary gradients.

## 10. Tailwind CSS implementation approach

Use Tailwind utility classes and a small set of reusable components.
Keep the design consistent without building a generic "card everywhere"
UI.

### Recommended tokens in `tailwind.config.js` (Tailwind v3-style example)

If using Tailwind CSS v4, configure equivalent CSS-first theme variables
in `src/index.css`; do not mix v3 config instructions blindly into a v4
setup.

``` js
// Tailwind v3-style example
export default {
  theme: {
    extend: {
      colors: {
        canvas: "#F6F7F5",
        surface: "#FFFFFF",
        ink: "#17211F",
        muted: "#68736F",
        line: "#E1E6E2",
        primary: "#176B5B",
        "primary-hover": "#115448",
        info: "#245FC7",
        "warning-bg": "#FFF3D8",
        "warning-ink": "#805500",
        "danger-bg": "#FDE9E7",
        "danger-ink": "#A12D25",
        "success-bg": "#E2F4EA",
        "success-ink": "#176443"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        floating: "0 8px 24px rgba(23, 33, 31, 0.08)"
      }
    }
  }
};
```

### Component styling examples

``` jsx
// App page shell
<div className="min-h-screen bg-canvas text-ink font-sans">
  <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
    {/* compact navigation */}
  </header>
  <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
    {/* page content */}
  </main>
</div>
```

``` jsx
// Search input
<label className="flex h-12 items-center gap-3 rounded-xl border border-line bg-white px-4
                  transition focus-within:border-primary focus-within:ring-4
                  focus-within:ring-primary/10">
  <span className="text-muted">{/* search icon */}</span>
  <input
    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none
               placeholder:text-muted"
    placeholder="Search a locality, street or issue"
  />
</label>
```

``` jsx
// Issue list row — intentionally not a card
<button className="group flex w-full gap-3 border-b border-line px-3 py-4 text-left
                   transition hover:bg-white focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary">
  <img className="h-16 w-20 shrink-0 rounded-lg object-cover" src={imageUrl} alt="" />
  <span className="min-w-0 flex-1">
    <span className="block truncate text-sm font-semibold text-ink">
      Pothole near Dadar station
    </span>
    <span className="mt-1 block text-xs text-muted">Dadar West · Reported 2 hours ago</span>
    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warning-ink">
      {/* status icon */} Awaiting review
    </span>
  </span>
  {/* chevron */}
</button>
```

``` jsx
// Primary button
<button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg
                   bg-primary px-4 py-2.5 text-sm font-semibold text-white
                   transition hover:bg-primary-hover active:translate-y-px
                   focus-visible:outline-none focus-visible:ring-4
                   focus-visible:ring-primary/20 disabled:cursor-not-allowed
                   disabled:opacity-50">
  Report an issue
</button>
```

``` jsx
// Status label: always pair colour with text
<span className="inline-flex items-center gap-1.5 rounded-md bg-success-bg
                 px-2 py-1 text-xs font-medium text-success-ink">
  {/* check icon */} Verified resolution
</span>
```

## 11. Reusable component inventory

-   `AppHeader`
-   `MobileBottomNav`
-   `IndependentProjectNotice`
-   `SearchInput`
-   `IssueFilterBar`
-   `IncidentListRow`
-   `IncidentMap`
-   `MapMarker`
-   `StatusLabel`
-   `EvidenceGallery`
-   `EvidenceUploader`
-   `ActivityTimeline`
-   `OfficialComplaintPanel`
-   `EscalationWizard`
-   `SourceLink`
-   `EmptyState`
-   `InlineError`
-   `Toast`
-   `ConfirmDialog`

Use icons from Lucide (`lucide-react`) consistently. Don't mix emoji
icons with line icons in the main interface.

## 12. Motion and micro-interactions

-   150--220ms transitions for hover, selection and menus.
-   Map selection synchronizes the selected list row and marker.
-   Upload progress is visible and cancelable where supported.
-   Optimistic UI only for low-risk actions; status changes should
    confirm backend success.
-   Respect `prefers-reduced-motion`.
-   Avoid page-wide animations, bouncing buttons, parallax, and
    decorative gradients.

## 13. Accessibility and responsive requirements

-   WCAG-conscious contrast; do not rely on green/red alone.
-   All controls keyboard accessible with visible focus.
-   Labels remain visible after typing.
-   Use semantic headings and landmarks.
-   Provide text alternatives for map-only information.
-   On mobile, map and list become switchable tabs or a map/list toggle.
-   Ensure upload, status, and error announcements work with screen
    readers.
-   Use a minimum 44px target size for primary touch controls.

## 14. States that must be designed

-   Loading/skeleton for map and issue list.
-   No incidents in the selected area.
-   Location permission denied.
-   Map/geocoding service unavailable.
-   Image upload in progress, failed, or too large.
-   Duplicate suggestions found.
-   Report submitted successfully with CivicProof ID.
-   Official complaint reference not provided.
-   Official status is user-reported, not verified.
-   Repair claimed but awaiting review.
-   Resolution disputed / issue reopened.
-   Access denied for private incident.
-   Network disconnected / retry available.

## 15. UI copy and trust language

Prefer: - `CivicProof report ID` -
`Official complaint reference (optional)` - `Reported by a citizen` -
`Repair claimed` - `Awaiting verification` - `Verified by a reviewer` -
`Status last updated by reporter`

Avoid: - `Official complaint submitted` unless the official submission
was genuinely confirmed. - `BMC failed to fix this` without
substantiated evidence. - `Corruption detected` based only on delays or
repeated reports. - `Resolved` when only a repair claim exists.

## 16. Suggested build order

1.  Build app shell, typography, palette, navigation and list/map
    layout.
2.  Build issue rows, filters, map markers and selected-state
    synchronization.
3.  Build the 3-step report wizard with validation and photo preview.
4.  Build the incident detail timeline and official complaint panel.
5.  Build the escalation wizard and follow-up preview.
6.  Add mobile layout, accessibility, loading/error states, and
    usability tests.
7.  Connect components to real Express endpoints after the static UI is
    consistent.

**Design acceptance test:** At a glance, users should understand where
the issue is, what its current status means, whether an official
complaint exists, and what they can do next---without needing to
interpret colors or open multiple cards.
