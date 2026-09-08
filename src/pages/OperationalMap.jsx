import {
  ArrowRight,
  Clock,
  Download,
  Info,
  Maximize2,
  Minus,
  Plus,
  Radio,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHeader } from '../components/shell/AppShell'
import PageHeader, { PageBody } from '../components/shell/PageHeader'
import Button from '../components/ui/Button'
import { Chip, Dot, Ref } from '../components/ui/Chip'
import { Eyebrow, Panel } from '../components/ui/Panel'
import {
  mapLayers,
  mapLegend,
  mapMarkers,
  mapSummary,
  system,
} from '../data/smartRail'
import { dotTone, textTone } from '../lib/tones'

export default function OperationalMap() {
  useHeader(
    ['Design System & Operational Shell'],
    [
      { label: 'Sec', value: system.section },
      {
        label: 'Next Block',
        value: `${system.nextBlock.at} [${system.nextBlock.km}]`,
        icon: <Clock className="size-3.5 text-ink-muted" strokeWidth={2} />,
      },
      {
        label: 'Signal Feeds',
        value: `ACTIVE (${system.signalPing})`,
        icon: <Radio className="size-3.5 text-nominal" strokeWidth={2} />,
      },
    ],
  )

  const [activeLayer, setActiveLayer] = useState('All Layers')
  const [zoom, setZoom] = useState(1)

  return (
    <PageBody>
      <PageHeader
        title="Operational Map"
        subtitle="See maintenance, assets and operational constraints in one view."
        actions={
          <>
            <Chip tone="accent" dot>
              {system.disclaimer}
            </Chip>
            <Button variant="secondary">
              <Download className="size-3.5" strokeWidth={2} />
              Export Vector
            </Button>
          </>
        }
      />

      <Panel className="p-3.5">
        {/* Layer filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {mapLayers.map((layer) => {
            const active = layer.label === activeLayer
            return (
              <button
                key={layer.label}
                type="button"
                onClick={() => setActiveLayer(layer.label)}
                className={[
                  'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded border px-2.5 text-body-md transition-colors',
                  active
                    ? 'border-ink bg-ink text-surface'
                    : 'border-line bg-surface text-ink hover:bg-canvas',
                ].join(' ')}
              >
                {layer.count !== null && (
                  <span className={`size-1.5 rounded-full ${dotTone[layer.tone]}`} />
                )}
                {layer.label}
                {layer.count !== null && (
                  <span className="font-mono text-code-dense opacity-70">
                    ({layer.count})
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Synthesis banner */}
        <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded bg-ink px-2.5 py-1.5">
          <Info className="size-3.5 shrink-0 text-accent" strokeWidth={2} />
          <span className="text-body-md font-semibold text-accent">
            1 Joint Opportunity Identified
          </span>
          <span className="text-surface/40">·</span>
          <span className="flex items-center gap-1.5 text-body-md text-surface">
            <TriangleAlert className="size-3.5 text-urgent" strokeWidth={2} />
            1 Projected Conflict
          </span>
        </div>

        {/* Schematic — kept on the alabaster canvas treatment */}
        <div className="relative mt-2.5 overflow-hidden rounded-md border border-line bg-canvas">
          <div className="absolute right-3 top-3 z-20 flex overflow-hidden rounded border border-line bg-surface">
            <ZoomButton
              onClick={() => setZoom((value) => Math.min(1.8, value + 0.2))}
              label="Zoom in"
            >
              <Plus className="size-4" strokeWidth={2} />
            </ZoomButton>
            <ZoomButton
              onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}
              label="Zoom out"
              divided
            >
              <Minus className="size-4" strokeWidth={2} />
            </ZoomButton>
            <ZoomButton onClick={() => setZoom(1)} label="Reset view" divided>
              <Maximize2 className="size-4" strokeWidth={2} />
            </ZoomButton>
          </div>

          <div className="h-[520px] overflow-hidden">
            <div
              className="graticule relative size-full origin-center transition-transform duration-150"
              style={{ transform: `scale(${zoom})` }}
            >
              <Schematic activeLayer={activeLayer} />
            </div>
          </div>

          {/* Map legend */}
          <div className="absolute bottom-3 right-3 z-20 w-[186px] rounded-md border border-line bg-surface p-2.5">
            <Eyebrow className="mb-2 border-b border-line pb-1.5">
              Map Legend
            </Eyebrow>
            <ul className="space-y-1.5">
              {mapLegend.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-body-sm text-ink-muted"
                >
                  {item.shape === 'dot' && (
                    <span className={`size-2.5 shrink-0 rounded-full ${dotTone[item.tone]}`} />
                  )}
                  {item.shape === 'band' && (
                    <span className="window-hatch h-2.5 w-4 shrink-0 rounded-sm border border-accent-hover" />
                  )}
                  {item.shape === 'arrow' && (
                    <ArrowRight className="size-3.5 shrink-0 text-ink" strokeWidth={2} />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section summary */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-line border-l-[3px] border-l-accent bg-surface p-3">
          <div className="shrink-0">
            <p className="text-label-md uppercase text-ink">{mapSummary.section}</p>
            <p className="text-body-sm text-ink-muted">Selected Section</p>
          </div>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-line pl-0 lg:border-l lg:pl-5">
            {mapSummary.stats.map((stat, index) => (
              <li
                key={stat.label}
                className={`flex items-center gap-2 text-body-md ${textTone[stat.tone]}`}
              >
                {index > 0 && (
                  <TriangleAlert
                    className="size-3 text-ink-subtle"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}
                {stat.label}
              </li>
            ))}
          </ul>

          <p className="text-body-md text-ink-muted">
            <span className="text-label-sm uppercase">Departments:</span>{' '}
            {mapSummary.departments}
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button to="/app/tasks" variant="secondary">
              View Section Details
            </Button>
            <Button to="/app/planning" variant="primary" uppercase>
              Commit to Block Plan
              <ArrowRight className="size-3.5" strokeWidth={2.25} />
            </Button>
          </div>
        </div>
      </Panel>
    </PageBody>
  )
}

function ZoomButton({ onClick, label, divided, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        'grid size-9 cursor-pointer place-items-center text-ink hover:bg-canvas',
        divided && 'border-l border-line',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */

/* Track topology. Layout is percentage-based so the schematic scales with the
   pane; the SVG carries the geometry (rails, turnouts, river) and DOM nodes
   carry the interactive labels. */
function Schematic({ activeLayer }) {
  const show = (layer) => activeLayer === 'All Layers' || activeLayer === layer

  return (
    <>
      <svg
        viewBox="0 0 1000 520"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-label="Track schematic for Section A and Section B"
      >
        {/* Distant contour of the alignment */}
        <path
          d="M0 118 C220 96 420 132 620 120 C760 112 880 128 1000 116"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1.5"
        />
        <path
          d="M0 150 C240 142 430 158 640 146"
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Section A — down fast */}
        <TrackLine y={228} />
        {/* Section B — up main */}
        <TrackLine y={272} />

        {/* Turnout connecting Section B into the up loop */}
        <path
          d="M300 272 C356 272 372 228 430 228"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          opacity="0.55"
        />
        {/* Diverging route toward Station B */}
        <path
          d="M700 228 C770 228 800 176 880 172 L1000 168"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          opacity="0.55"
        />
        <path
          d="M700 232 C776 232 806 182 886 178 L1000 174"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* River basin corridor */}
        <path
          d="M0 400 C180 372 320 424 500 404 C660 386 820 428 1000 400 L1000 448 C820 470 660 434 500 452 C320 470 180 420 0 448 Z"
          fill="var(--color-telemetry)"
          opacity="0.1"
        />
        <path
          d="M0 400 C180 372 320 424 500 404 C660 386 820 428 1000 400"
          fill="none"
          stroke="var(--color-telemetry)"
          strokeWidth="1"
          strokeDasharray="6 5"
          opacity="0.45"
        />

        {/* Projected conflict lead line */}
        {show('Tasks') && (
          <path
            d="M782 272 L782 322"
            stroke="var(--color-urgent)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Joint opportunity bracket over the clustered departments */}
        {show('Joint Opportunities') && (
          <path
            d="M452 196 L452 176 L672 176 L672 214"
            fill="none"
            stroke="var(--color-accent-hover)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* Section labels */}
      <span className="absolute left-[1.5%] top-[41%] text-label-sm uppercase text-ink-muted">
        Section A
      </span>
      <span className="absolute left-[1.5%] top-[53.5%] text-label-sm uppercase text-ink-muted">
        Section B
      </span>
      <span className="absolute left-1/2 top-[76%] -translate-x-1/2 text-label-sm uppercase tracking-[0.1em] text-telemetry/70">
        River Basin Corridor
      </span>

      {/* Stations */}
      <Station className="left-[14%] top-[33%]" name="Station A" />
      <Station className="left-[81%] top-[33%]" name="Station B" />

      {/* Recommended block opportunity band */}
      {show('Block Opportunities') && (
        <div className="absolute left-[43%] top-[40.5%] h-[6%] w-[24%] window-hatch rounded-sm border border-dashed border-accent-hover">
          <span className="absolute -bottom-4 left-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.04em] text-accent-deep">
            Recommended Block Opportunity
          </span>
        </div>
      )}

      {/* Joint maintenance callout */}
      {show('Joint Opportunities') && (
        <div className="absolute left-[45%] top-[26%] w-[230px] rounded border border-accent-line bg-surface p-2 shadow-level2">
          <p className="text-label-sm uppercase text-accent-deep">
            Joint Maintenance Opportunity
          </p>
          <p className="mt-1 text-body-sm text-ink-muted">
            Engineering (P-Way) + S&amp;T + TRD Clustered
          </p>
        </div>
      )}

      {/* Departmental task markers */}
      {show('Tasks') &&
        mapMarkers.map((marker) => (
          <div
            key={marker.department}
            className="absolute -translate-x-1/2"
            style={{ left: `${marker.x}%`, top: '38%' }}
          >
            <span className="flex flex-col items-center">
              <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                {marker.department}
              </span>
              <span
                className="w-px bg-ink-subtle"
                style={{ height: 14 }}
                aria-hidden="true"
              />
              <span
                className={`size-2.5 rounded-full border-2 border-surface ${dotTone[marker.tone]}`}
                title={`${marker.department} · ${marker.task}`}
              />
            </span>
          </div>
        ))}

      {/* Train movements */}
      {show('Train Movements') && (
        <>
          <span className="absolute left-[68%] top-[42.5%] flex -translate-y-1/2 items-center gap-1.5 rounded bg-ink px-1.5 py-1 text-[10px] font-semibold text-surface">
            <ArrowRight className="size-3 text-accent" strokeWidth={2.5} />
            Train Movement
          </span>
          <span className="absolute left-[26%] top-[55%] flex -translate-y-1/2 items-center gap-1.5 rounded bg-ink px-1.5 py-1 text-[10px] font-semibold text-surface">
            <ArrowRight className="size-3 rotate-180 text-accent" strokeWidth={2.5} />
            Train Movement
          </span>
        </>
      )}

      {/* Projected conflict */}
      {show('Tasks') && (
        <>
          <span
            className="absolute left-[78.2%] top-[52.3%] size-3 -translate-x-1/2 rounded-full border-2 border-surface bg-urgent"
            aria-hidden="true"
          />
          <div className="absolute left-[70%] top-[62%] w-[190px] rounded border border-urgent-line bg-urgent-tint p-2">
            <p className="flex items-center gap-1.5 text-label-sm uppercase text-urgent">
              <TriangleAlert className="size-3.5" strokeWidth={2} />
              Projected Conflict
            </p>
            <p className="mt-1 text-body-sm text-urgent/85">
              Potential downstream disruption
            </p>
          </div>
        </>
      )}

      {/* Corridor reference */}
      <span className="absolute bottom-3 left-3 flex items-center gap-2">
        <Ref>{system.section}</Ref>
        <span className="text-body-sm text-ink-subtle">
          {system.nextBlock.km}
        </span>
        <Dot tone="nominal" />
      </span>
    </>
  )
}

/* Two rails with sleeper ticks between them. */
function TrackLine({ y }) {
  return (
    <g>
      <line
        x1="0"
        y1={y - 3}
        x2="1000"
        y2={y - 3}
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="0"
        y1={y + 3}
        x2="1000"
        y2={y + 3}
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <line
        x1="0"
        y1={y}
        x2="1000"
        y2={y}
        stroke="var(--color-ink)"
        strokeWidth="6"
        strokeDasharray="2 7"
        opacity="0.55"
      />
    </g>
  )
}

function Station({ className, name }) {
  return (
    <span className={`absolute -translate-x-1/2 ${className}`}>
      <span className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-semibold text-ink">{name}</span>
        <span className="flex gap-0.5 rounded border border-line bg-surface px-1 py-0.5">
          <span className="h-2.5 w-0.5 bg-ink" />
          <span className="h-2.5 w-0.5 bg-ink" />
          <span className="h-2.5 w-0.5 bg-ink" />
        </span>
      </span>
    </span>
  )
}
