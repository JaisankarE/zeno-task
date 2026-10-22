import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getPath = () => window.location.hash.replace(/^#/, '') || '/'

export function useRoute() {
  return useSyncExternalStore(subscribe, getPath)
}

export function navigate(to: string) {
  window.location.hash = to
}
