import './performance.js'
import './main.js'

// Secondary UI modules are application enhancements. Do not download or parse
// them on the public landing page; load them only after the authenticated
// workspace has rendered, keeping the first mobile request lightweight.
const loadEnhancements = () => Promise.all([
  import('./people-features.js'),
  import('./people-ui-boot.js'),
  import('./admin-hierarchy.js'),
  import('./phase2-ui.js'),
  import('./phase3-ui.js'),
  import('./phase4-ui.js')
]).catch(() => {})

window.addEventListener('mk:workspace-ready', () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadEnhancements, { timeout: 1200 })
  } else {
    setTimeout(loadEnhancements, 100)
  }
}, { once: true })
