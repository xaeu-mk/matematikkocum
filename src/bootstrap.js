import './performance.js'
import './main.js'

// Keep the first paint focused on the core application. Secondary UI modules
// are loaded after the browser has had a chance to paint the initial screen.
const loadEnhancements = () => Promise.all([
  import('./people-features.js'),
  import('./people-ui-boot.js'),
  import('./admin-hierarchy.js'),
  import('./phase2-ui.js'),
  import('./phase3-ui.js'),
  import('./phase4-ui.js')
]).catch(() => {})

if ('requestIdleCallback' in window) {
  requestIdleCallback(loadEnhancements, { timeout: 1200 })
} else {
  setTimeout(loadEnhancements, 100)
}
