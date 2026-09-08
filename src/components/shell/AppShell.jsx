import { X } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import useMediaQuery from '../../lib/useMediaQuery'
import Spine from './Spine'
import UtilityHeader from './UtilityHeader'

/* Screens push their breadcrumb and header gauges up into the shell so the
   utility header stays a single fixed 48px band. */
const HeaderContext = createContext(() => {})

export function useHeader(crumbs, gauges) {
  const setHeader = useContext(HeaderContext)
  const key = JSON.stringify(crumbs)
  useEffect(() => {
    setHeader({ crumbs, gauges })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setHeader])
}

export default function AppShell() {
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1439px)')
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [manualCollapse, setManualCollapse] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [header, setHeader] = useState({ crumbs: [], gauges: [] })

  /* Tablet field terminals collapse the spine to an icon rail by default;
     an explicit toggle overrides that for the session. */
  const collapsed = manualCollapse ?? isTablet

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  const setHeaderStable = useMemo(() => (next) => setHeader(next), [])

  return (
    <HeaderContext.Provider value={setHeaderStable}>
      <div className="flex h-dvh overflow-hidden bg-canvas">
        {/* Fixed navigation spine — 240px expanded, 64px collapsed */}
        {!isMobile && (
          <aside
            className={[
              'shrink-0 border-r border-spine-line transition-[width] duration-150',
              collapsed ? 'w-spine-rail' : 'w-spine',
            ].join(' ')}
          >
            <Spine
              collapsed={collapsed}
              onToggle={() => setManualCollapse(!collapsed)}
            />
          </aside>
        )}

        {/* Mobile tactical — the spine becomes an off-canvas drawer */}
        {isMobile && drawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-spine shadow-level2">
              <Spine collapsed={false} onToggle={() => setDrawerOpen(false)} />
            </div>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="flex-1 cursor-pointer bg-ink/40 backdrop-blur-[1px]"
            >
              <X className="ml-3 size-5 text-surface" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Elastic multi-pane content staging area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <UtilityHeader
            crumbs={header.crumbs}
            gauges={header.gauges}
            onOpenNav={() => setDrawerOpen(true)}
          />
          <main className="min-w-0 flex-1 overflow-y-auto scrollbar-industrial">
            <Outlet />
          </main>
        </div>
      </div>
    </HeaderContext.Provider>
  )
}
