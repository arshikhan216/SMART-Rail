import {
  ArrowRight,
  Boxes,
  Clock,
  Crosshair,
  Gauge,
  Hexagon,
  Network,
  Repeat,
  Timer,
  TrainFront,
  TriangleAlert,
  Users,
  Wrench,
  CircleCheck,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DuskCorridor from '../components/marketing/DuskCorridor'
import Button from '../components/ui/Button'
import { Dot } from '../components/ui/Chip'
import { Meter } from '../components/ui/Meter'
import { Eyebrow, Panel } from '../components/ui/Panel'
import { landing, system } from '../data/smartRail'

const ICONS = {
  Wrench,
  Network,
  Zap,
  Boxes,
  Crosshair,
  Timer,
  Gauge,
  Repeat,
  TrainFront,
  Clock,
  Users,
}

export default function Landing() {
  return (
    <div className="min-h-dvh bg-canvas">
      <TopBar />
      <Hero />
      <main>
        <CoordinationProblem />
        <Pipeline />
        <BlockPreview />
        <ClosedLoop />
        <Suite />
        <Closing />
      </main>
      <Footer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-ink">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-6 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded bg-accent">
            <TrainFront className="size-4 text-ink" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-label-md uppercase tracking-[0.1em] text-surface">
              {system.name}
            </span>
            <span className="hidden text-[10px] leading-[12px] text-surface/55 sm:block">
              {system.expansion}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {landing.nav.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className="text-label-sm uppercase text-surface/70 transition-colors hover:text-accent"
            >
              {item}
            </a>
          ))}
        </nav>

        <Button to="/login" variant="primary" size="md" uppercase className="ml-auto md:ml-0">
          {landing.hero.cta}
          <ArrowRight className="size-3.5" strokeWidth={2.25} />
        </Button>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <DuskCorridor className="absolute inset-0 -z-10 size-full opacity-95" />

      {/* Surveyor's marks — the only decorative flourish, kept mechanical */}
      <svg
        className="pointer-events-none absolute inset-0 -z-10 size-full"
        aria-hidden="true"
      >
        <line
          x1="8%"
          y1="100%"
          x2="46%"
          y2="18%"
          stroke="rgba(242,183,89,0.28)"
          strokeWidth="1"
          strokeDasharray="5 7"
        />
        <line
          x1="74%"
          y1="100%"
          x2="40%"
          y2="14%"
          stroke="rgba(242,183,89,0.18)"
          strokeWidth="1"
          strokeDasharray="5 7"
        />
      </svg>
      <span className="absolute left-[28%] top-[34%] size-3 rounded-full bg-accent" />
      <span className="absolute left-[72%] top-[46%] size-2.5 rounded-full bg-accent/80" />

      <div className="mx-auto max-w-[1180px] px-4 py-24 lg:px-6 lg:py-32">
        <h1 className="max-w-2xl text-[40px] font-bold leading-[1.12] tracking-[-0.025em] text-white lg:text-[52px]">
          {landing.hero.headline}
        </h1>
        <p className="mt-5 max-w-md text-body-lg text-white/75">
          {landing.hero.sub}
        </p>
        <Button
          to="/login"
          variant="primary"
          size="lg"
          uppercase
          className="mt-8"
        >
          {landing.hero.cta}
          <ArrowRight className="size-4" strokeWidth={2.25} />
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

function Section({ id, title, sub, children, className = '' }) {
  return (
    <section id={id} className={['py-14 lg:py-20', className].join(' ')}>
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <header className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="text-headline-lg text-ink lg:text-[26px]">{title}</h2>
          {sub && <p className="mt-1.5 text-body-md text-ink-muted">{sub}</p>}
        </header>
        {children}
      </div>
    </section>
  )
}

function CoordinationProblem() {
  const { problem } = landing
  return (
    <Section id="the-problem" title={problem.title} sub={problem.sub}>
      <Panel className="graticule p-5 lg:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)]">
          {/* Departmental demand inputs */}
          <ul className="space-y-2.5">
            {problem.inputs.map((input) => {
              const Icon = ICONS[input.icon]
              return (
                <li
                  key={input.label}
                  className="flex items-center gap-3 rounded border border-line bg-surface px-3 py-2.5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded bg-accent-wash">
                    <Icon className="size-3.5 text-accent-deep" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-label-sm uppercase text-ink">
                      {input.label}
                    </span>
                    <span className="block text-body-sm text-ink-muted">
                      {input.caption}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Convergence into a single co-planning engine */}
          <div className="relative flex justify-center py-4">
            <svg
              viewBox="0 0 150 150"
              className="absolute inset-0 size-full"
              aria-hidden="true"
            >
              <path
                d="M2 26 C60 26 70 75 148 75 M2 75 H148 M2 124 C60 124 70 75 148 75"
                fill="none"
                stroke="var(--color-ink-subtle)"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              <path
                d="M140 70 L148 75 L140 80"
                fill="none"
                stroke="var(--color-urgent)"
                strokeWidth="1.4"
              />
            </svg>
            <div className="relative grid size-[86px] place-items-center rounded-md bg-ink px-2 text-center">
              <span>
                <span className="block text-[9px] uppercase leading-tight tracking-[0.1em] text-accent">
                  Co-Planning
                </span>
                <span className="mt-1 block text-label-md text-surface">
                  {system.name}
                </span>
              </span>
            </div>
          </div>

          {/* Unified result */}
          <div className="rounded border border-line border-l-[3px] border-l-urgent bg-surface p-4">
            <p className="flex items-center gap-1.5 text-label-sm uppercase text-ink-muted">
              <CircleCheck className="size-3.5 text-ink-muted" strokeWidth={2} />
              {problem.result.title}
            </p>
            <p className="mt-2 text-label-md uppercase tracking-[0.06em] text-ink">
              {problem.result.headline}
            </p>
            <p className="mt-1.5 text-body-md text-ink-muted">
              {problem.result.body}
            </p>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-body-sm text-nominal">
              <Dot tone="nominal" />
              {problem.result.note}
            </p>
          </div>
        </div>
      </Panel>
    </Section>
  )
}

function Pipeline() {
  const { pipeline } = landing
  return (
    <Section id="how-it-works" title={pipeline.title} sub={pipeline.sub}>
      <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {pipeline.steps.map((step) => {
          const Icon = ICONS[step.icon]
          return (
            <li
              key={step.title}
              className={[
                'rounded-md border p-4 text-center transition-colors',
                step.active
                  ? 'border-ink bg-ink'
                  : 'border-line bg-surface hover:bg-surface-wash',
              ].join(' ')}
            >
              <span
                className={[
                  'mx-auto grid size-9 place-items-center rounded',
                  step.active ? 'bg-accent' : 'bg-accent-wash',
                ].join(' ')}
              >
                <Icon
                  className={step.active ? 'size-4 text-ink' : 'size-4 text-accent-deep'}
                  strokeWidth={2}
                />
              </span>
              <p
                className={[
                  'mt-3 text-label-sm uppercase',
                  step.active ? 'text-surface' : 'text-ink',
                ].join(' ')}
              >
                {step.title}
              </p>
              <p
                className={[
                  'mt-1 text-body-sm',
                  step.active ? 'text-surface/60' : 'text-ink-muted',
                ].join(' ')}
              >
                {step.caption}
              </p>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

function BlockPreview() {
  const { blockPreview } = landing
  return (
    <Section title={blockPreview.title} sub={blockPreview.sub}>
      <Panel className="p-5 lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <Eyebrow className="mb-2.5">Input Constraints</Eyebrow>
            <ul className="space-y-1.5">
              {blockPreview.constraints.map((constraint) => {
                const Icon = ICONS[constraint.icon]
                return (
                  <li
                    key={constraint.label}
                    className="flex items-center gap-2.5 rounded border border-line bg-canvas px-2.5 py-2"
                  >
                    <Icon className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} />
                    <span className="text-label-sm uppercase text-ink">
                      {constraint.label}
                    </span>
                  </li>
                )
              })}
            </ul>
            <Link
              to="/app/planning"
              className="mt-4 inline-flex items-center gap-1.5 text-body-md text-accent-deep underline-offset-2 hover:underline"
            >
              Optimized by {system.name}
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="rounded border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <Eyebrow tone="ink">Optimized Block Plan</Eyebrow>
              <span className="text-body-sm text-nominal">Zero Schedule Conflict</span>
            </div>

            <div className="space-y-4 p-3">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-body-sm text-ink-muted">
                    Scheduled Train Paths
                  </span>
                  <span className="text-body-sm text-ink-subtle">
                    Active Operations
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {blockPreview.paths.map((path) => (
                    <span
                      key={path}
                      className="rounded border border-line bg-canvas px-2 py-1.5 text-center font-mono text-code-dense text-ink"
                    >
                      {path}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-body-sm text-ink-muted">
                    Matched Maintenance Work
                  </span>
                  <span className="text-body-sm text-ink-subtle">
                    Possession Slots
                  </span>
                </div>
                <div className="flex h-8 items-center rounded border border-line bg-canvas px-1">
                  <span className="ml-[22%] inline-flex h-6 items-center gap-1.5 rounded bg-accent px-2 text-label-sm text-ink">
                    {blockPreview.matched}
                    <ArrowRight className="size-3" strokeWidth={2.25} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </Section>
  )
}

function ClosedLoop() {
  const { loop } = landing
  const radius = 104
  return (
    <Section title={loop.title} sub={loop.sub}>
      <Panel className="p-5 lg:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Continuous re-optimization loop */}
          <div className="relative mx-auto aspect-square w-full max-w-[300px]">
            <svg viewBox="0 0 300 300" className="size-full" aria-hidden="true">
              <circle
                cx="150"
                cy="150"
                r={radius}
                fill="none"
                stroke="var(--color-ink-subtle)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </svg>

            <div className="absolute left-1/2 top-1/2 grid size-[104px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-line bg-canvas text-center">
              <span>
                <span className="block text-label-sm uppercase text-ink-muted">
                  Loop
                </span>
                <span className="block text-label-md uppercase text-ink">
                  Active
                </span>
              </span>
            </div>

            {loop.stages.map((stage, index) => {
              const angle = (-90 + index * (360 / loop.stages.length)) * (Math.PI / 180)
              const x = 50 + (radius / 300) * 100 * Math.cos(angle)
              const y = 50 + (radius / 300) * 100 * Math.sin(angle)
              const isReoptimize = stage === 'RE-OPTIMIZE'
              return (
                <span
                  key={stage}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span
                    className={[
                      'size-2.5 rounded-full border',
                      isReoptimize
                        ? 'border-accent bg-accent'
                        : 'border-ink-subtle bg-surface',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]',
                      isReoptimize
                        ? 'border-accent-line bg-accent-wash text-accent-deep'
                        : 'border-line bg-surface text-ink-muted',
                    ].join(' ')}
                  >
                    {stage}
                  </span>
                </span>
              )
            })}
          </div>

          {/* Loop telemetry */}
          <ul className="space-y-2.5">
            {loop.events.map((event) => (
              <li
                key={event.title}
                className={[
                  'rounded border p-3.5',
                  event.tone === 'urgent'
                    ? 'border-urgent-line bg-urgent-tint'
                    : 'border-nominal-line bg-nominal-tint',
                ].join(' ')}
              >
                <p
                  className={[
                    'flex items-center gap-1.5 text-label-sm uppercase',
                    event.tone === 'urgent' ? 'text-urgent' : 'text-nominal',
                  ].join(' ')}
                >
                  {event.tone === 'urgent' ? (
                    <TriangleAlert className="size-3.5" strokeWidth={2} />
                  ) : (
                    <CircleCheck className="size-3.5" strokeWidth={2} />
                  )}
                  {event.title}
                </p>
                <p className="mt-1.5 text-body-md text-ink-muted">{event.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </Section>
  )
}

function Suite() {
  const { suite } = landing
  const previews = [
    /* Maintenance intelligence — a node lattice */
    <span key="a" className="grid h-full place-items-center">
      <Hexagon className="size-10 text-accent" strokeWidth={1.25} />
    </span>,
    /* Block planning — stacked allocation bars */
    <span key="b" className="flex h-full flex-col justify-center gap-1.5 px-3">
      <Meter value={72} tone="accent" height={6} />
      <Meter value={44} tone="accent" height={6} />
      <Meter value={88} tone="neutral" height={6} />
    </span>,
    /* Execution — planned versus actual */
    <span key="c" className="flex h-full flex-col justify-center gap-2 px-3">
      <span className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[9px] uppercase text-ink-subtle">
          Planned
        </span>
        <Meter value={80} tone="neutral" height={5} />
      </span>
      <span className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[9px] uppercase text-ink-subtle">
          Actual
        </span>
        <Meter value={62} tone="warning" height={5} />
      </span>
    </span>,
    /* Analytics — comparison columns */
    <span key="d" className="flex h-full items-end justify-center gap-1.5 px-3 pb-3">
      {[38, 62, 48, 82].map((height, index) => (
        <span
          key={index}
          className={index % 2 ? 'w-4 bg-ink/70' : 'w-4 bg-accent'}
          style={{ height: `${height}%` }}
        />
      ))}
    </span>,
  ]

  return (
    <Section id="system-suite" title={suite.title} sub={suite.sub}>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {suite.modules.map((module, index) => (
          <Link
            key={module.title}
            to={module.to}
            className="group rounded-md border border-line bg-surface transition-colors hover:border-ink"
          >
            <p className="border-b border-line px-3 py-2.5 text-label-sm uppercase text-ink">
              {module.title}
            </p>
            <div className="h-[86px] bg-canvas">{previews[index]}</div>
          </Link>
        ))}
      </div>
    </Section>
  )
}

function Closing() {
  const { closing } = landing
  return (
    <section className="pb-14 lg:pb-20">
      <div className="mx-auto max-w-[1180px] px-4 lg:px-6">
        <Panel className="relative isolate overflow-hidden border-ink p-6 lg:p-10">
          {/* Engineering roundel, echoing a track survey mark */}
          <svg
            className="pointer-events-none absolute -right-10 top-1/2 -z-10 size-64 -translate-y-1/2 opacity-45"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <circle
              cx="100"
              cy="100"
              r="62"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <line
              x1="30"
              y1="170"
              x2="170"
              y2="30"
              stroke="var(--color-line)"
              strokeWidth="1"
            />
          </svg>

          <h2 className="max-w-lg text-headline-lg text-ink lg:text-[26px]">
            {closing.title}
          </h2>
          <p className="mt-2 max-w-md text-body-md text-ink-muted">
            {closing.sub}
          </p>
          <Button
            to="/login"
            variant="primary"
            size="lg"
            uppercase
            className="mt-6"
          >
            {closing.cta}
            <ArrowRight className="size-4" strokeWidth={2.25} />
          </Button>
        </Panel>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface-sunken">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-6">
        <p className="flex flex-wrap items-center gap-3">
          <span className="text-label-md uppercase tracking-[0.08em] text-ink">
            {system.name}
          </span>
          <span className="text-body-sm text-ink-muted">
            {landing.footer.copyright}
          </span>
        </p>
        <p className="flex items-center gap-2 text-body-sm text-ink-muted">
          <Dot tone="accent" />
          {landing.footer.note}
        </p>
      </div>
    </footer>
  )
}
