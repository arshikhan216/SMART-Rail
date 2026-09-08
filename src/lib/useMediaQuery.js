import { useEffect, useState } from 'react'

/** Subscribes to a media query. Breakpoints follow design.md § Responsive:
    desktop >=1440px, tablet field terminal 768-1439px, mobile tactical <768px. */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
