import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

/** Hash routes drive the app; a plain path (e.g. /me) is used when there is no hash */
const getPath = () => window.location.hash.replace(/^#/, '') || window.location.pathname || '/'

export function useRoute() {
  return useSyncExternalStore(subscribe, getPath)
}

export function navigate(to: string) {
  window.location.hash = to
}
