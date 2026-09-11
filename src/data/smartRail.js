/* ==========================================================================
   SMART-Rail — simulated planning dataset
   Every screen reads from this module so the prototype stays self-consistent.

   Reconciliations against /design-reference (the mockups disagree in places):
   - MNT-024 is Engineering / P-Way "Track Geometry Correction", 50 min. Three
     of four detail screens agree on this; the dashboard table's "TRD /
     Catenary Feeder / 150 min" reading is the outlier.
   - MNT-031 is 25 min and MNT-042 is 35 min, because Block Planning's
     arithmetic depends on them (50 + 25 = 75 min used of a 120 min window).
   - MNT-042 is TRD "OHE Inspection", the deferred conflict item.
   ========================================================================== */

export const system = {
  name: 'SMART-Rail',
  expansion: 'Smart Maintenance, Alignment & Resource Timing for Railways',
  version: 'v4.8',
  division: 'NORTHERN // DIV-4',
  linkage: 'S&T / TRD / ENG LINKED',
  section: 'SEC-NDLS-04',
  syncedAt: 'Today, 04:42',
  planningDate: '06 Sep 2026',
  signalPing: '0.4s ping',
  nextBlock: { at: '01:45 hrs', km: 'KM 142-148' },
  disclaimer: 'PROTOTYPE / SIMULATED DATA',
}

export const operator = {
  initials: 'VS',
  name: 'Dr. Vikram Sethi',
  title: 'Chief Track Eng. (P-Way)',
  role: 'Operator Lead',
  email: 'vikram.sethi@smartrail.internal',
}

/* --- Navigation ---------------------------------------------------------- */

export const navigation = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/app/tasks', label: 'Maintenance Tasks', icon: 'Wrench' },
  {
    to: '/app/planning',
    label: 'Block Planning',
    icon: 'CalendarClock',
    badge: '3',
  },
  { to: '/app/map', label: 'Operational Map', icon: 'Map' },
  {
    to: '/app/execution',
    label: 'Execution & Monitoring',
    icon: 'RadioTower',
    dot: 'nominal',
  },
  { to: '/app/analytics', label: 'Analytics', icon: 'ChartLine' },
  { to: '/app/predictions', label: 'AI Intelligence', icon: 'BrainCircuit', badge: 'AI' },
]

/* --- Maintenance register ------------------------------------------------ */

export const tasks = [
  {
    id: 'MNT-018',
    title: 'Point Machine Overhaul',
    asset: 'Point Machine 14B',
    department: 'S&T',
    discipline: 'Signals',
    priority: 'CRITICAL',
    due: 'In 18h',
    dueUrgent: true,
    duration: 90,
    p90: 110,
    assetImpact: 'High (Main Line)',
    impactLevel: 'high',
    status: 'Pending Review',
    statusTone: 'warning',
    action: 'Plan',
    section: 'Section A',
    km: 'KM 141.600',
    note: 'High asset criticality · Vibration anomaly recorded',
  },
  {
    id: 'MNT-024',
    title: 'Track Geometry Correction',
    asset: 'Down Main Alignment',
    department: 'Engineering',
    discipline: 'P-Way',
    priority: 'CRITICAL',
    due: 'In 24h',
    dueUrgent: false,
    duration: 50,
    p90: 65,
    assetImpact: 'Full Block',
    impactLevel: 'high',
    status: 'Scheduled',
    statusTone: 'nominal',
    action: 'View',
    section: 'Section A',
    km: 'KM 143.200',
    corridor: 'Midland Main Line',
    gang: 'Depot Gang 04',
    note: 'Track possession required · Pairable with MNT-031',
  },
  {
    id: 'MNT-031',
    title: 'Signal Inspection',
    asset: 'Track Circuit TC-88',
    department: 'S&T',
    discipline: 'Signals',
    priority: 'HIGH',
    due: 'In 2 days',
    dueUrgent: false,
    duration: 25,
    p90: 35,
    assetImpact: 'Bypass Feasible',
    impactLevel: 'medium',
    status: 'Ready to Pair',
    statusTone: 'accent',
    action: 'Pair',
    section: 'Section A',
    km: 'KM 143.400',
    note: 'Shares isolation window with MNT-024',
  },
  {
    id: 'MNT-042',
    title: 'OHE Inspection',
    asset: 'Catenary Feeder 25kV',
    department: 'TRD',
    discipline: 'Traction',
    priority: 'HIGH',
    due: 'In 36h',
    dueUrgent: true,
    duration: 35,
    p90: 50,
    assetImpact: 'Speed Capped',
    impactLevel: 'high',
    status: 'Conflict Flagged',
    statusTone: 'urgent',
    action: 'Adjust',
    section: 'Section B',
    km: 'KM 118.900',
    note: 'Constraint contention against Down Fast corridor',
  },
  {
    id: 'MNT-037',
    title: 'Track Component Replacement',
    asset: 'Rail Fastening Assembly',
    department: 'Engineering',
    discipline: 'P-Way',
    priority: 'MEDIUM',
    due: 'In 3 days',
    dueUrgent: false,
    duration: 60,
    p90: 80,
    assetImpact: 'Low',
    impactLevel: 'low',
    status: 'Deferred',
    statusTone: 'neutral',
    action: 'View',
    section: 'Section A',
    km: 'KM 144.100',
    note: 'Next window available 03:30',
  },
  {
    id: 'MNT-055',
    title: 'Rail Joint Weld Inspection',
    asset: 'Weld Joint Series 12',
    department: 'Engineering',
    discipline: 'P-Way',
    priority: 'MEDIUM',
    due: 'In 4 days',
    dueUrgent: false,
    duration: 120,
    p90: 145,
    assetImpact: 'Low',
    impactLevel: 'low',
    status: 'Queued',
    statusTone: 'neutral',
    action: 'View',
    section: 'Section C',
    km: 'KM 62.300',
    note: 'Awaiting corridor allocation',
  },
]

export const taskById = (id) => tasks.find((task) => task.id === id)

/* --- Dashboard ----------------------------------------------------------- */

export const dashboardKpis = [
  {
    label: 'Critical Maintenance',
    value: '12',
    icon: 'TriangleAlert',
    iconTone: 'urgent',
    delta: { text: '↑ 2 from yesterday', tone: 'urgent' },
    caption: 'Tasks requiring attention',
  },
  {
    label: 'Block Opportunities',
    value: '8',
    icon: 'CalendarClock',
    iconTone: 'telemetry',
    delta: { text: '4 optimal windows', tone: 'nominal' },
    caption: 'Compatible opportunities identified',
  },
  {
    label: 'Projected Asset Availability',
    value: '94.2%',
    icon: 'TrendingUp',
    iconTone: 'nominal',
    delta: { text: 'Stable target', tone: 'neutral' },
    caption: 'Across planned maintenance',
  },
  {
    label: 'Projected Conflicts',
    value: '3',
    icon: 'Activity',
    iconTone: 'warning',
    delta: { text: '1 critical overlap', tone: 'warning' },
    caption: 'Require planner review',
  },
]

export const recommendations = [
  {
    index: '01',
    tag: 'Window #W-104',
    tone: 'accent',
    title: 'Combine compatible maintenance tasks',
    body: 'Task MNT-024 (Track Geometry Correction) + Task MNT-031 (S&T Track Circuit)',
    meta: 'Section A · Compatible work window (01:30 – 04:00) · Shared track possession',
    benefit:
      'Recovers 45 min line closure; +22% block utilisation efficiency',
    reasons: [
      'Same section (Section A)',
      'Compatible time window',
      'Shared resources',
      'No dependency conflict',
    ],
    cta: 'Review Recommendation',
    ctaTo: '/app/planning',
    ctaVariant: 'primary',
  },
  {
    index: '02',
    tag: 'Critical Asset',
    tone: 'neutral',
    title: 'Prioritize critical asset maintenance',
    body: 'Task MNT-018 (Point Machine 14B)',
    meta: 'High asset criticality · Due in 18 hrs · Vibration anomaly recorded',
    benefit: 'Preempts potential signal failure, protects peak freight corridor',
    reasons: [
      'Exceeds 85% wear threshold',
      'Failure risk elevated',
      'Matches 90 min window',
      'Spares verified in yard',
    ],
    cta: 'Review Task',
    ctaTo: '/app/tasks/MNT-018',
    ctaVariant: 'secondary',
  },
  {
    index: '03',
    tag: '-13m Overlap',
    tone: 'urgent',
    alert: true,
    title: 'Projected operational conflict',
    body: 'Task MNT-042 (OHE Inspection, TRD)',
    meta: 'Completion: 05:28 | Train movement: 05:15 | Overlap: -13m conflict',
    suggested:
      'Adjust block duration to 150m or re-schedule to secondary window',
    reasons: [
      'Headway violation predicted',
      'Critical freight impacted',
      'Deterministic flagged',
      'Turnaround unbuffered',
    ],
    cta: 'Open Planning & Resolve',
    ctaTo: '/app/planning',
    ctaVariant: 'dark',
  },
]

export const blockOpportunities = [
  {
    window: '01:30 – 04:00',
    section: 'Section A',
    minutes: 150,
    compatible: 3,
    risk: 'Low',
    action: 'Pair Tasks',
    primary: true,
  },
  {
    window: '02:00 – 03:30',
    section: 'Section B',
    minutes: 90,
    compatible: 2,
    risk: 'Medium',
    action: 'Evaluate',
  },
  {
    window: '04:15 – 05:15',
    section: 'Section C',
    minutes: 60,
    compatible: 1,
    risk: 'Low',
    action: 'Inspect',
  },
  {
    window: '05:30 – 07:00',
    section: 'Section A (Down Line)',
    minutes: 90,
    compatible: 4,
    risk: 'Low',
    action: 'Reserve',
  },
]

/* Corridor possession schematic. Each segment is a span of the corridor
   coloured by clearance state — rendered as 4px continuous bars. */
export const corridors = [
  {
    name: 'Section A (Down Fast)',
    km: 'KM 120 - 160',
    segments: [
      { state: 'clear', span: 3 },
      { state: 'window', span: 2 },
      { state: 'clear', span: 4 },
      { state: 'window', span: 1 },
      { state: 'clear', span: 2 },
    ],
  },
  {
    name: 'Section B (Up Main)',
    km: 'KM 80 - 120',
    segments: [
      { state: 'clear', span: 2 },
      { state: 'conflict', span: 3 },
      { state: 'clear', span: 3 },
      { state: 'window', span: 2 },
      { state: 'clear', span: 2 },
    ],
  },
  {
    name: 'Section C (Yard/Loop)',
    km: 'KM 40 - 75',
    segments: [
      { state: 'clear', span: 4 },
      { state: 'window', span: 3 },
      { state: 'clear', span: 5 },
    ],
  },
]

export const feedEvents = [
  {
    at: '12m ago',
    tone: 'urgent',
    text: 'Task MNT-042 duration revised to 50m (+15m change)',
  },
  {
    at: '28m ago',
    tone: 'accent',
    text: 'New block opportunity identified in Section A (05:30-07:00)',
  },
  {
    at: '1h ago',
    tone: 'nominal',
    text: 'S&T approved pairing request for Task MNT-031',
  },
  {
    at: '2h ago',
    tone: 'nominal',
    text: 'Weather restriction lifted for Section C corridor',
  },
]

/* --- Maintenance intelligence (decision support graph) ------------------- */

export const intelligenceNodes = [
  {
    id: '01',
    title: 'MAINTENANCE',
    subtitle: 'Track Geometry Correction',
    tone: 'neutral',
  },
  {
    id: '02',
    title: 'AI PRIORITY',
    subtitle: 'HIGH · P1 Active',
    tone: 'accent',
  },
  {
    id: '03',
    title: 'DURATION FORECAST',
    subtitle: '50m (P90: 65m)',
    tone: 'neutral',
  },
  {
    id: '04',
    title: 'ASSET IMPACT',
    subtitle: 'HIGH IMPACT',
    tone: 'urgent',
    expandable: true,
  },
  {
    id: '05',
    title: 'BLOCK COMPATIBILITY',
    subtitle: '+10 min Fit',
    tone: 'neutral',
  },
  {
    id: '06',
    title: 'COORDINATION',
    subtitle: 'Pair MNT-031',
    tone: 'neutral',
  },
]

export const assetImpactDetail = {
  node: 'NODE 04',
  title: 'ASSET IMPACT',
  badge: 'HIGH',
  thresholds: ['LOW', 'MED', 'HIGH', 'CRIT'],
  active: 'HIGH',
  rows: [
    {
      icon: 'CircleCheck',
      label: 'Corridor Availability',
      value: '100%',
      tone: 'accent',
      meter: 100,
    },
    {
      icon: 'TriangleAlert',
      label: 'If Deferred (No Block)',
      value: '60% Degradation',
      tone: 'urgent',
    },
    {
      icon: 'CircleCheck',
      label: 'TSR Warning',
      value: '40 km/h Restriction',
      tone: 'urgent',
    },
  ],
  note: 'Requires timely block allocation to avoid imposing temporary speed restrictions on Down Fast.',
}

export const currentAssessment = [
  { label: 'Priority Rating', value: 'HIGH (P1)', tone: 'accent' },
  { label: 'Expected Duration', value: '50 min', caption: 'P90: 65 min' },
  { label: 'Asset Impact', value: 'HIGH', tone: 'urgent' },
  { label: 'Block Compatibility', value: 'HIGH FIT', tone: 'nominal' },
  { label: 'Joint Opportunity', value: 'Pairable (MNT-031)' },
]

/* --- Block planning ------------------------------------------------------ */

export const planningControls = {
  dates: ['06 Sep 2026', '07 Sep 2026', '08 Sep 2026'],
  sections: [
    'Section A · Track Segment',
    'Section B · Up Main',
    'Section C · Yard/Loop',
  ],
  windows: [
    '01:30 – 03:30 (120 min)',
    '02:00 – 03:30 (90 min)',
    '04:15 – 05:15 (60 min)',
  ],
  modes: ['Standard', 'Conservative', 'Aggressive'],
}

export const planningStages = ['Candidate Tasks', 'Constraints', 'Optimized Plan']

export const planningKpis = [
  {
    label: 'CRITICAL TASKS',
    value: '1',
    unit: 'of 1',
    caption: 'Completed / Planned',
  },
  {
    label: 'BLOCK TIME',
    value: '75m',
    unit: '/ 120m',
    caption: 'Used / Available (45m Slack)',
    active: true,
  },
  {
    label: 'JOINT OPPORTUNITIES',
    value: '1',
    unit: 'Paired',
    caption: 'Identified in Section A',
  },
  {
    label: 'PROJECTED CONFLICTS',
    value: '0',
    caption: 'Feasible window verified',
    tone: 'nominal',
  },
]

export const planningLegend = [
  { label: 'Train Movement', swatch: 'ink' },
  { label: 'Available Window', swatch: 'window' },
  { label: 'Candidate Maintenance', swatch: 'candidate' },
  { label: 'Optimized Maintenance', swatch: 'accent' },
  { label: 'Projected Conflict', swatch: 'conflict', icon: 'TriangleAlert' },
]

/* The board spans 01:30 – 03:30. Offsets below are minutes from 01:30. */
export const board = {
  start: 90, // 01:30 in minutes past midnight
  end: 210, // 03:30
  ticks: ['01:30', '01:45', '02:00', '02:15', '02:30', '02:45', '03:00', '03:15', '03:30'],
  trainMovements: [
    { label: 'Train Movement 01', from: '02:05', to: '02:25' },
    { label: 'Train Movement 02', from: '03:05', to: '03:20' },
  ],
  availableWindow: { from: '01:30', to: '03:30', label: 'Available · 120 min opportunity' },
  optimized: [
    { id: 'MNT-024', from: '01:35', to: '02:25', minutes: 50 },
    { id: 'MNT-031', from: '01:35', to: '02:00', minutes: 25 },
  ],
  slack: [
    { from: '02:25', to: '03:05', minutes: 40, label: 'Unused Window / Buffer Slack' },
    { from: '03:20', to: '03:30', minutes: 10, label: 'Slack' },
  ],
  contention: {
    id: 'MNT-042',
    label: 'OHE Inspection (TRD) · 35 min',
    note: 'Constraint Contention',
  },
}

export const selectedForBlock = [
  {
    id: 'MNT-024',
    title: 'Track Geometry Correction',
    priority: 'CRITICAL',
    tone: 'urgent',
    org: 'Engineering · Track Possession',
    slot: '01:35 – 02:25 (50 min)',
    lead: true,
  },
  {
    id: 'MNT-031',
    title: 'Signal Inspection',
    priority: 'Medium',
    tone: 'neutral',
    org: 'S&T · Signals Team',
    slot: '01:35 – 02:00 (25 min)',
  },
]

export const deferredFromBlock = [
  {
    id: 'MNT-042',
    title: 'OHE Inspection (TRD)',
    priority: 'High',
    tone: 'warning',
    org: 'TRD · 35 min',
  },
  {
    id: 'MNT-037',
    title: 'Track Component Replacement',
    priority: 'Medium',
    tone: 'neutral',
    org: 'Engineering · 60 min',
  },
]

export const planRationale = [
  {
    title: 'Critical maintenance prioritized',
    body: 'High-priority maintenance was placed first based on task criticality and planning constraints.',
  },
  {
    title: 'Available block time considered',
    body: '75 min utilized out of 120 min window, preserving a resilient 45 min operational slack buffer.',
  },
  {
    title: 'Train movements respected',
    body: 'Zero overlap with occupied track constraints: Train Movement 01 (02:05-02:25) and Train Movement 02 (03:05-03:20).',
  },
  {
    title: 'Resource & track isolation compatibility grouped',
    body: 'MNT-024 + MNT-031 joint execution achieves 100% section synergy without conflicting plant.',
  },
]

/* --- Operational map ----------------------------------------------------- */

export const mapLayers = [
  { label: 'All Layers', count: null, tone: 'ink' },
  { label: 'Tasks', count: 3, tone: 'urgent' },
  { label: 'Train Movements', count: 2, tone: 'ink' },
  { label: 'Block Opportunities', count: 1, tone: 'accent' },
  { label: 'Joint Opportunities', count: 1, tone: 'warning' },
]

export const mapLegend = [
  { label: 'Urgent', tone: 'urgent', shape: 'dot' },
  { label: 'In Progress / Conflict', tone: 'warning', shape: 'dot' },
  { label: 'Completed', tone: 'nominal', shape: 'dot' },
  { label: 'Block Opportunity', tone: 'accent', shape: 'band' },
  { label: 'Train Movement', tone: 'ink', shape: 'arrow' },
]

export const mapMarkers = [
  { department: 'Engineering', x: 46, tone: 'urgent', task: 'MNT-024' },
  { department: 'S&T', x: 54, tone: 'accent', task: 'MNT-031' },
  { department: 'TRD', x: 60, tone: 'warning', task: 'MNT-042' },
]

export const mapSummary = {
  section: 'Section A',
  stats: [
    { label: '3 Maintenance Tasks', tone: 'ink' },
    { label: '1 Block Opportunity', tone: 'accent' },
    { label: '1 Train Movement', tone: 'ink' },
    { label: '1 Projected Conflict', tone: 'urgent' },
  ],
  departments: 'Engineering (1) · S&T (1) · TRD (1)',
}

/* --- Execution & monitoring ---------------------------------------------- */

export const execution = {
  task: taskById('MNT-024'),
  headline: 'Track Maintenance',
  subtitle: 'P-Way Alignment & Geometry Correction',
  section: 'Section A (Down Main)',
  priority: 'HIGH',
  status: 'AT RISK (+8m)',
  planned: { from: '02:00', to: '02:50', minutes: 50 },
  actual: { from: '02:05', progress: 65 },
  forecast: { from: '02:05', to: '02:58', overrun: 8 },
  constraint: { at: '03:00', label: 'Down Fast Corridor', buffer: 2 },
  planLimit: '02:50',
  ticks: ['02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00'],
  elapsed: 35,
  remaining: 23,
  updatedAt: '02:40',
  milestones: [
    { name: 'Site Preparation', at: '02:10', state: 'done', detail: 'Completed (10 min)' },
    { name: 'Equipment Setup', at: '02:25', state: 'done', detail: 'Completed (15 min)' },
    { name: 'Main Maintenance', state: 'active', detail: 'In progress' },
    { name: 'Inspection & Testing', state: 'pending' },
    { name: 'Site Clearance', state: 'pending' },
  ],
  updates: [
    {
      at: '02:10',
      tag: 'COMPLETED',
      tone: 'nominal',
      title: 'Site Preparation',
    },
    {
      at: '02:25',
      tag: 'STARTED',
      tone: 'telemetry',
      title: 'Main Maintenance',
    },
    {
      at: '02:40',
      tag: 'PROGRESS',
      tone: 'warning',
      title: 'Progress updated to 65%',
      body: '35 min elapsed; estimated 23 min remaining. Forecast completion adjusted to 02:58.',
    },
  ],
  footer: [
    { label: 'Plan Status', value: 'At Risk', tone: 'warning' },
    { label: 'Forecast Status', value: 'Projected Delay (+8 min)', tone: 'warning' },
    { label: 'Operational Release', value: 'Awaiting Authorized Decision', tone: 'neutral' },
  ],
}

/* --- Analytics ----------------------------------------------------------- */

export const comparisons = [
  {
    title: 'Critical Maintenance Completed',
    qualifier: '(P-Way & S&T)',
    baselineLabel: 'Baseline 64%',
    smartLabel: 'SMART-Rail 92%',
    baseline: 64,
    smart: 92,
    badge: { icon: 'ArrowUp', text: 'Simulated Gain +28%' },
  },
  {
    title: 'Asset Downtime',
    qualifier: '(Corridor Total Possession Hours)',
    baselineLabel: 'Baseline 48 hrs',
    smartLabel: 'SMART-Rail 32 hrs',
    baseline: 100,
    smart: 67,
    badge: { icon: 'ArrowDown', text: '-33% Reduction' },
  },
  {
    title: 'Block Utilization',
    qualifier: '(Active Work vs Line Possession)',
    baselineLabel: 'Baseline 58%',
    smartLabel: 'SMART-Rail 84%',
    baseline: 58,
    smart: 84,
    badge: { icon: 'TrendingUp', text: '+26% Utilization' },
  },
  {
    title: 'Projected Operational Conflicts',
    qualifier: '(Simulated Impact)',
    baselineLabel: 'Baseline 7.4 hrs',
    smartLabel: 'SMART-Rail 3.2 hrs',
    baseline: 100,
    smart: 43,
    badge: { icon: 'ArrowDown', text: '-57% Conflict Reduction (Simulated)' },
  },
  {
    title: 'Joint Maintenance Opportunities',
    qualifier: '(Multi-Department Possession Window)',
    baselineLabel: 'Baseline 1 window',
    smartLabel: 'SMART-Rail 5 paired slots',
    baseline: 20,
    smart: 100,
    badge: { icon: 'Network', text: '5x Coordination' },
  },
]

export const workMix = {
  total: 48,
  slices: [
    { label: 'P-Way', share: 54, count: '26 Tasks (Civil)', color: 'var(--color-accent)' },
    { label: 'S&T', share: 28, count: '14 Tasks (Signals)', color: '#dd8a20' },
    { label: 'TRD', share: 18, count: '8 Tasks (Traction)', color: '#4a5568' },
  ],
}

export const availability = {
  days: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
  baseline: [88.6, 88.2, 88.9, 88.5, 88.3, 88.7, 88.4],
  smart: [89.3, 90.4, 91.8, 93.1, 93.9, 94.2, 94.6],
  baselineAvg: '88.4%',
  smartPeak: '94.6%',
  gain: '+6.2% Reliability Gain',
}

export const planningOutcomes = [
  {
    eyebrow: 'ACTIVE CORRIDOR YIELD',
    title: 'Block Utilization',
    baseline: '58%',
    smart: '84%',
    fill: 84,
    note: '+26% active work yield',
    icon: 'TrendingUp',
  },
  {
    eyebrow: 'DEPARTMENTAL SYNERGY',
    title: 'Joint Maintenance',
    baseline: '1 Slot',
    smart: '5 Paired',
    fill: 100,
    note: '5x cross-department window pairing',
    icon: 'Network',
  },
  {
    eyebrow: 'OPERATIONAL RESPONSIVENESS',
    title: 'Re-planning Time',
    baseline: '180 min',
    smart: '12 min',
    fill: 93,
    note: '93% turnaround acceleration',
    icon: 'Zap',
  },
]

export const planningCycle = [
  {
    id: '01',
    title: 'Maintenance Data',
    caption: 'Telemetry & Work Orders',
    icon: 'Boxes',
  },
  { id: '02', title: 'AI Priority', caption: 'Risk & Criticality Scoring', icon: 'MapPin' },
  {
    id: '03',
    title: 'Optimization',
    caption: 'Multi-Criteria Block Solver',
    icon: 'SlidersHorizontal',
  },
  {
    id: '04',
    title: 'Validated Plan',
    caption: 'Authorized Controller Review',
    icon: 'ClipboardCheck',
    active: true,
  },
]

/* --- Landing page -------------------------------------------------------- */

export const landing = {
  hero: {
    headline:
      'Intelligent maintenance planning for a more coordinated railway network.',
    sub: 'Connect maintenance intelligence, operational constraints and optimized block planning.',
    cta: 'ENTER SMART-RAIL',
  },
  nav: ['THE PROBLEM', 'HOW IT WORKS', 'SYSTEM SUITE'],
  problem: {
    title: 'The Coordination Problem',
    sub: 'Bring maintenance demands together before planning the block.',
    inputs: [
      { label: 'ENGINEERING', caption: 'Civil & Track Maintenance', icon: 'Wrench' },
      { label: 'S&T', caption: 'Signalling & Interlocking', icon: 'Network' },
      { label: 'TRD', caption: 'Traction & Catenary Power', icon: 'Zap' },
    ],
    result: {
      title: 'UNIFIED RESULT',
      headline: 'COORDINATED PLAN',
      body: 'Verified possession with zero timetable conflicts.',
      note: 'Synchronized single window',
    },
  },
  pipeline: {
    title: 'From Maintenance Data to Intelligent Decisions',
    sub: 'A continuous pipeline synchronizing demands into verified blocks.',
    steps: [
      { title: 'MAINTENANCE DATA', caption: 'Collect demands', icon: 'Boxes' },
      { title: 'AI PRIORITY', caption: 'Identify what matters most', icon: 'Crosshair' },
      { title: 'DURATION FORECAST', caption: 'Estimate realistic work time', icon: 'Timer' },
      { title: 'ASSET IMPACT', caption: 'Understand availability impact', icon: 'Gauge' },
      {
        title: 'BLOCK COMPATIBILITY',
        caption: 'Find suitable opportunities',
        icon: 'Repeat',
        active: true,
      },
    ],
  },
  blockPreview: {
    title: 'Intelligent Block Planning',
    sub: 'Match maintenance work with available operating windows.',
    constraints: [
      { label: 'MAINTENANCE TASKS', icon: 'Wrench' },
      { label: 'TRAIN OPERATIONS', icon: 'TrainFront' },
      { label: 'AVAILABLE WINDOWS', icon: 'Clock' },
      { label: 'RESOURCES', icon: 'Users' },
    ],
    paths: ['Train 154', 'Freight 230', 'Express 12'],
    matched: 'Track & Catenary Block',
  },
  loop: {
    title: "Planning doesn't stop at the block plan.",
    sub: 'SMART-Rail reassesses the plan when conditions change.',
    stages: ['PLAN', 'EXECUTE', 'MONITOR', 'FORECAST', 'RE-OPTIMIZE'],
    center: 'LOOP ACTIVE',
    events: [
      {
        tone: 'urgent',
        title: 'PROJECTED VARIANCE DETECTED',
        body: 'Execution delay identified prior to track window closure.',
      },
      {
        tone: 'nominal',
        title: 'RE-OPTIMIZED CANDIDATE PLAN',
        body: 'Corridor window adjusted dynamically without passenger delay.',
      },
    ],
  },
  suite: {
    title: 'One decision-support layer.',
    sub: 'From maintenance planning to execution monitoring.',
    modules: [
      { title: 'MAINTENANCE INTELLIGENCE', to: '/app/tasks' },
      { title: 'BLOCK PLANNING', to: '/app/planning' },
      { title: 'EXECUTION & MONITORING', to: '/app/execution' },
      { title: 'ANALYTICS', to: '/app/analytics' },
    ],
  },
  closing: {
    title: 'Make every maintenance opportunity count.',
    sub: 'Turn maintenance demands into coordinated, intelligent plans.',
    cta: 'ENTER SMART-RAIL',
  },
  footer: {
    copyright: '© 2026 SMART-Rail Systems. All rights reserved.',
    note: 'Prototype Simulation Environment — For demonstration and planning purposes only.',
  },
}

/* --- Helpers ------------------------------------------------------------- */

/** "02:05" -> 125 */
export function toMinutes(clock) {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

/** Percentage offset of a clock value across a [start, end] minute span. */
export function offsetPct(clock, start, end) {
  return ((toMinutes(clock) - start) / (end - start)) * 100
}

/** Percentage width of a clock range across a [start, end] minute span. */
export function widthPct(from, to, start, end) {
  return ((toMinutes(to) - toMinutes(from)) / (end - start)) * 100
}
