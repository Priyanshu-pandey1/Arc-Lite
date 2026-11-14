/** Generate a unique id for local message/conversation records. */
export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Tiny class-name joiner: cx('a', cond && 'b'). */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

/** Resolve a promise after ms — used by mock services to simulate latency. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
