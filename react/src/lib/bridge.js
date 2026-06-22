// Tiny bridge for screens migrated from imperative island → declarative JSX.
// Navigation stays imperative (the engine owns .on toggling); when the engine
// enters a migrated screen it calls notifyScreen(key) so that screen's React
// component re-renders from the current shared `state`. One listener per key.
const listeners = {}

export function subscribeScreen(key, fn) {
  listeners[key] = fn
  return () => { if (listeners[key] === fn) delete listeners[key] }
}

export function notifyScreen(key) {
  if (listeners[key]) listeners[key]()
}
