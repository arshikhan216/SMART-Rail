/* Substitute for the dusk railway photograph used in landing.png and
   logon.png. The reference images are photographic and no such asset exists
   in the repo, so this is a drawn stand-in with the same composition:
   converging track, receding catenary masts, low mist, warm horizon.
   Swap for the real photograph when it is available. */

const VANISH_X = 500
const HORIZON = 372

function sleepers() {
  const rows = []
  for (let i = 0; i < 26; i += 1) {
    /* Non-linear spacing so sleepers crowd toward the vanishing point. */
    const t = (i / 25) ** 2.6
    const y = HORIZON + 6 + t * 610
    const halfWidth = 16 + t * 300
    const thickness = 1.4 + t * 12
    rows.push({ y, halfWidth, thickness, opacity: 0.22 + t * 0.5 })
  }
  return rows
}

function masts() {
  const poles = []
  const positions = [0.1, 0.2, 0.33, 0.5, 0.72, 1]
  positions.forEach((t, index) => {
    const scale = 0.12 + t * 0.95
    const offset = 40 + t * 470
    poles.push({ x: VANISH_X - offset, scale, side: -1, key: `l${index}` })
    poles.push({ x: VANISH_X + offset, scale, side: 1, key: `r${index}` })
  })
  return poles
}

function Mast({ x, scale, side }) {
  const height = 300 * scale
  const armWidth = 78 * scale
  const top = HORIZON - height
  return (
    <g opacity={0.5 + scale * 0.45}>
      <rect
        x={x - 2.5 * scale}
        y={top}
        width={5 * scale}
        height={height}
        fill="#0d1017"
      />
      {/* Lattice cross-bracing */}
      <path
        d={`M${x - 2.5 * scale} ${top + height * 0.25} L${x + 2.5 * scale} ${top + height * 0.45}
            M${x + 2.5 * scale} ${top + height * 0.25} L${x - 2.5 * scale} ${top + height * 0.45}
            M${x - 2.5 * scale} ${top + height * 0.5} L${x + 2.5 * scale} ${top + height * 0.7}
            M${x + 2.5 * scale} ${top + height * 0.5} L${x - 2.5 * scale} ${top + height * 0.7}`}
        stroke="#0d1017"
        strokeWidth={Math.max(0.5, 1.4 * scale)}
        fill="none"
      />
      {/* Cantilever arm reaching over the track */}
      <rect
        x={side === 1 ? x - armWidth : x}
        y={top + height * 0.06}
        width={armWidth}
        height={Math.max(1, 3.4 * scale)}
        fill="#0d1017"
      />
      <rect
        x={side === 1 ? x - armWidth * 0.72 : x + armWidth * 0.24}
        y={top + height * 0.2}
        width={armWidth * 0.48}
        height={Math.max(0.8, 2.2 * scale)}
        fill="#0d1017"
      />
    </g>
  )
}

export default function DuskCorridor({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Railway corridor at dusk with converging track and catenary masts"
    >
      <defs>
        <linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141926" />
          <stop offset="34%" stopColor="#2f3446" />
          <stop offset="62%" stopColor="#8a6a45" />
          <stop offset="84%" stopColor="#d99a4e" />
          <stop offset="100%" stopColor="#e8b268" />
        </linearGradient>
        <radialGradient id="dc-sun" cx="0.5" cy="1" r="0.62">
          <stop offset="0%" stopColor="#ffd18a" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#e79b46" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#e79b46" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dc-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3b2c" />
          <stop offset="26%" stopColor="#2a2119" />
          <stop offset="100%" stopColor="#100d0a" />
        </linearGradient>
        <linearGradient id="dc-rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c078" />
          <stop offset="55%" stopColor="#c99a54" />
          <stop offset="100%" stopColor="#6b5433" />
        </linearGradient>
        <linearGradient id="dc-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9bf82" stopOpacity="0" />
          <stop offset="55%" stopColor="#dcb27a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c99a63" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dc-vignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b0d14" stopOpacity="0.55" />
          <stop offset="38%" stopColor="#0b0d14" stopOpacity="0" />
          <stop offset="72%" stopColor="#0b0d14" stopOpacity="0" />
          <stop offset="100%" stopColor="#08070a" stopOpacity="0.72" />
        </linearGradient>
      </defs>

      {/* Sky and horizon glow */}
      <rect width="1000" height={HORIZON} fill="url(#dc-sky)" />
      <ellipse cx={VANISH_X} cy={HORIZON} rx="430" ry="210" fill="url(#dc-sun)" />

      {/* Catenary wires strung between masts, sagging slightly */}
      <g stroke="#0d1017" fill="none" opacity="0.6">
        <path d={`M0 118 Q${VANISH_X} 250 ${VANISH_X} ${HORIZON - 40}`} strokeWidth="1.6" />
        <path d={`M1000 96 Q${VANISH_X} 238 ${VANISH_X} ${HORIZON - 40}`} strokeWidth="1.6" />
        <path d={`M0 210 Q${VANISH_X} 300 ${VANISH_X} ${HORIZON - 26}`} strokeWidth="1.1" />
        <path d={`M1000 188 Q${VANISH_X} 292 ${VANISH_X} ${HORIZON - 26}`} strokeWidth="1.1" />
        <path d={`M0 44 Q620 210 ${VANISH_X} ${HORIZON - 54}`} strokeWidth="0.9" opacity="0.7" />
        <path d={`M1000 30 Q380 200 ${VANISH_X} ${HORIZON - 54}`} strokeWidth="0.9" opacity="0.7" />
      </g>

      {masts().map((mast) => (
        <Mast key={mast.key} x={mast.x} scale={mast.scale} side={mast.side} />
      ))}

      {/* Approaching train silhouette on the adjacent line */}
      <g opacity="0.92">
        <path
          d={`M${VANISH_X + 86} ${HORIZON - 4} L${VANISH_X + 96} ${HORIZON - 58}
              Q${VANISH_X + 122} ${HORIZON - 76} ${VANISH_X + 150} ${HORIZON - 58}
              L${VANISH_X + 176} ${HORIZON - 4} Z`}
          fill="#171a24"
        />
        <rect
          x={VANISH_X + 104}
          y={HORIZON - 50}
          width="42"
          height="15"
          fill="#ffd489"
          opacity="0.85"
        />
        <ellipse
          cx={VANISH_X + 126}
          cy={HORIZON - 14}
          rx="46"
          ry="14"
          fill="#ffcf82"
          opacity="0.35"
        />
      </g>

      {/* Ballast bed */}
      <rect y={HORIZON} width="1000" height={1000 - HORIZON} fill="url(#dc-ground)" />

      {/* Sleepers, then rails on top */}
      <g fill="#241c14">
        {sleepers().map((row, index) => (
          <rect
            key={index}
            x={VANISH_X - row.halfWidth}
            y={row.y}
            width={row.halfWidth * 2}
            height={row.thickness}
            opacity={row.opacity}
          />
        ))}
      </g>

      {/* Main line — polished crowns catching the last light */}
      <g fill="url(#dc-rail)">
        <path d={`M${VANISH_X - 8} ${HORIZON} L${VANISH_X - 22} ${HORIZON} L188 1000 L246 1000 Z`} />
        <path d={`M${VANISH_X + 8} ${HORIZON} L${VANISH_X + 22} ${HORIZON} L812 1000 L754 1000 Z`} />
      </g>
      {/* Adjacent line receding to the right */}
      <g fill="url(#dc-rail)" opacity="0.5">
        <path d={`M${VANISH_X + 30} ${HORIZON} L${VANISH_X + 40} ${HORIZON} L1000 812 L1000 872 Z`} />
        <path d={`M${VANISH_X + 52} ${HORIZON} L${VANISH_X + 62} ${HORIZON} L1000 660 L1000 706 Z`} />
      </g>

      {/* Low-lying mist across the corridor */}
      <rect y={HORIZON - 46} width="1000" height="150" fill="url(#dc-mist)" />

      {/* Photographic vignette so overlaid type stays legible */}
      <rect width="1000" height="1000" fill="url(#dc-vignette)" />
    </svg>
  )
}
