import './admin.css'

const roleLabels = { admin: 'Admin', teacher: 'Öğretmen', student: 'Öğrenci', parent: 'Veli' }

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char])

const userRows = (users) => users.length ? users.map((user) => `<tr><td><strong>${escapeHtml(user.fullName || user.full_name)}</strong><br><small>${escapeHtml(user.username)}</small></td><td>${escapeHtml(user.email || '—')}</td><td><span class="role-badge">${escapeHtml(roleLabels[user.role] || user.role)}</span></td><td>${user.isActive ? 'Aktif' : 'Pasif'}</td><td>${escapeHtml((user.createdAt || user.created_at || '').slice(0,10))}</td></tr>`).join('') : '<tr><td colspan="5"><div class="admin-empty">Henüz kullanıcı bulunmuyor.</div></td></tr>'

export const renderAdmin = async (app, currentUser) => {
  app.innerHTML = `<div class="admin-shell"><div class="admin-wrap"><a class="admin-back" href="#top">← Ana sayfaya dön</a><div class="admin-top"><div><h1>Yönetim Merkezi</h1><p>Hoş geldin, ${escapeHtml(currentUser.fullName)}. Kullanıcıları ve rolleri buradan yönet.</p></div><div class="admin-actions"><button class="button button-ghost" id="adminLogout">Çıkış Yap</button></div></div><section class="admin-card" style="margin-bottom:18px"><div class="admin-toolbar"><div><h2>Yeni kullanıcı</h2><span>Öğretmen, öğrenci, veli veya yönetici hesabı oluştur.</span></div></div><form class="admin-form" id="createUserForm"><label>Kullanıcı adı<input name="username" required autocomplete="off" placeholder="ornek.kullanici"></label><label>Ad soyad<input name="fullName" required placeholder="Ad Soyad"></label><label>E-posta<input name="email" type="email" placeholder="ornek@mail.com"></label><label>Rol<select name="role" required><option value="student">Öğrenci</option><option value="teacher">Öğretmen</option><option value="parent">Veli</option><option value="admin">Admin</option></select></label><label>Geçici şifre<input name="password" type="password" required minlength="8" placeholder="En az 8 karakter"></label><div class="submit-row"><button class="button button-primary" type="submit">Kullanıcı Oluştur</button><span class="admin-message" id="createMessage"></span></div></form></section><section class="admin-card"><div class="admin-toolbar"><div><h2>Kullanıcılar</h2><span id="userCount">Yükleniyor…</span></div><button class="button button-secondary" id="refreshUsers">Yenile</button></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Durum</th><th>Oluşturulma</th></tr></thead><tbody id="userRows"><tr><td colspan="5"><div class="admin-empty">Kullanıcılar yükleniyor…</div></td></tr></tbody></table></div></section></div></div>`

  const rows = document.querySelector('#userRows')
  const count = document.querySelector('#userCount')
  const loadUsers = async () => {
    rows.innerHTML = '<tr><td colspan="5"><div class="admin-empty">Yükleniyor…</div></td></tr>'
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Kullanıcılar alınamadı.')
      rows.innerHTML = userRows(data.users || [])
      count.textContent = `${(data.users || []).length} kullanıcı`
    } catch (error) {
      rows.innerHTML = `<tr><td colspan="5"><div class="admin-empty">${escapeHtml(error.message)}</div></td></tr>`
      count.textContent = 'Yüklenemedi'
    }
  }

  document.querySelector('#refreshUsers').addEventListener('click', loadUsers)
  document.querySelector('#adminLogout').addEventListener('click', async () => { await fetch('/api/auth/logout', { method:'POST' }); window.location.reload() })
  document.querySelector('#createUserForm').addEventListener('submit', async (event) => {
    event.preventDefault()
    const message = document.querySelector('#createMessage')
    const form = new FormData(event.currentTarget)
    message.textContent = 'Oluşturuluyor…'
    try {
      const response = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(form.entries())) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Kullanıcı oluşturulamadı.')
      event.currentTarget.reset()
      message.textContent = 'Kullanıcı oluşturuldu.'
      await loadUsers()
    } catch (error) { message.textContent = error.message }
  })

  await loadUsers()
}
