export async function renderSetup(app) {
  app.innerHTML = `<main class="setup-page"><section class="setup-card"><div class="login-brand"><span class="brand-mark">✕</span><span>Matematik Koçum</span></div><span class="eyebrow">İLK KURULUM</span><h1>Başadmin hesabını oluştur.</h1><p>Bu ekran yalnızca sistemde hiç kullanıcı yokken kullanılabilir.</p><form id="setupForm"><label>Kullanıcı adı<input name="username" autocomplete="username" required minlength="3" maxlength="32" placeholder="Başadmin kullanıcı adı"></label><label>Şifre<input name="password" type="password" autocomplete="new-password" required minlength="12" placeholder="En az 12 karakter"></label><label>Şifre tekrar<input name="passwordConfirm" type="password" autocomplete="new-password" required minlength="12" placeholder="Şifreni tekrar gir"></label><button class="button button-primary" type="submit">Başadmin Hesabı Oluştur →</button><p class="setup-note" id="setupNote"></p></form></section></main>`
  const form = document.querySelector('#setupForm')
  const note = document.querySelector('#setupNote')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    note.textContent = 'Hesap oluşturuluyor…'
    const values = Object.fromEntries(new FormData(form))
    try {
      const response = await fetch('/api/setup/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const data = await response.json()
      if (!response.ok || !data.ok) { note.textContent = data.error || 'Kurulum başarısız.'; return }
      note.textContent = 'Başadmin oluşturuldu. Giriş ekranına yönlendiriliyorsun…'
      setTimeout(() => { window.location.hash = 'login'; window.location.reload() }, 700)
    } catch { note.textContent = 'Sunucuya ulaşılamadı.' }
  })
}
