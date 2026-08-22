import { renderAdmin } from './admin.js'

fetch('/api/auth/session')
  .then(response => response.json())
  .then(session => {
    if (session.authenticated && session.user?.role === 'admin') {
      const app = document.querySelector('#app')
      if (app) renderAdmin(app, session.user)
    }
  })
  .catch(() => {})
