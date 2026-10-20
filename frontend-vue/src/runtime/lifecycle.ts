/** Own native listeners needed for contenteditable, desktop integration and rich text. */
export function createLifecycle() {
  const disposers: Array<() => void> = []
  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  const intervals = new Set<ReturnType<typeof setInterval>>()
  let disposed = false
  function listen(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    target.addEventListener(type, handler, options)
    disposers.push(() => target.removeEventListener(type, handler, options))
  }
  function later(callback: () => void, delay = 0) {
    const id = setTimeout(() => { timeouts.delete(id); if (!disposed) callback() }, delay)
    timeouts.add(id)
    return id
  }
  function repeat(callback: () => void, delay: number) {
    const id = setInterval(() => { if (!disposed) callback() }, delay)
    intervals.add(id)
    return id
  }
  function observeResize(target: Element, callback: ResizeObserverCallback) {
    const observer = new ResizeObserver(callback)
    observer.observe(target)
    disposers.push(() => observer.disconnect())
  }
  function dispose() {
    disposed = true
    disposers.splice(0).reverse().forEach(dispose => dispose())
    timeouts.forEach(clearTimeout)
    intervals.forEach(clearInterval)
    timeouts.clear()
    intervals.clear()
  }
  return { listen, later, repeat, observeResize, dispose }
}
