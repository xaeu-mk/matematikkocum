import './style.css'
import './login.css'
import { icon } from './icons.js'
import { renderWorkspace } from './workspace.js'

const app = document.querySelector('#app')
const SESSION_TTL = 30_000
let sessionCache = null
let sessionAt = 0
const apiCache = new Map()
const inflight = new Map()

const api = async (url, options = {}, ttl = 0) => {
  const method = (options.method || 'GET').toUpperCase()
  const key = method + ':' + url
  if (method === 'GET' && ttl && apiCache.has(key)) {
    const hit = apiCache.get(key)
    if (Date.now() - hit.at < ttl) return hit.data
    apiCache.delete(key)
  }
  if (inflight.has(key)) return inflight.get(key)
  const task = fetch(url, { ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } }).then(async r => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw Object.assign(new Error(data.error || 'API isteği başarısız'), { status: r.status, data })
    if (method === 'GET' && ttl) apiCache.set(key, { at: Date.now(), data })
    else if (method !== 'GET') { for (const k of apiCache.keys()) if (k.startsWith('GET:')) apiCache.delete(k) }
    return data
  }).finally(() => inflight.delete(key))
  inflight.set(key, task)
  return task
}

const clearCache = () => apiCache.clear()
const logout = async () => { clearCache(); sessionCache = null; sessionAt = 0; await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}) }
const getSession = async () => { if (sessionCache && Date.now() - sessionAt < SESSION_TTL) return sessionCache; const d = await api('/api/auth/session', {}, SESSION_TTL); sessionCache = d; sessionAt = Date.now(); return d }

const preview = () => `<div class="dashboard-preview"><aside class="preview-sidebar"><div class="preview-logo">M</div><div class="preview-nav active">${icon('home', 16)}<span>Genel Bakış</span></div><div class="preview-nav">${icon('calendar', 16)}<span>Takvim</span></div><div class="preview-nav">${icon('book', 16)}<span>Dersler</span></div><div class="preview-nav">${icon('check', 16)}<span>Ödevler</span></div><div class="preview-nav">${icon('trending', 16)}<span>Gelişim</span></div><div class="preview-nav">${icon('mail', 16)}<span>Mesajlar</span></div></aside><div class="preview-main"><div class="preview-head"><div><h3>Günaydın</h3><p>Bugün hedeflerine bir adım daha yaklaş.</p></div><div class="preview-date">Bugün<br><b>Planını keşfet</b></div></div><div class="preview-grid-top"><div class="preview-card schedule"><h4>Bugünkü Program</h4><div class="schedule-row"><i></i><span>09:00<br><b>Matematik — Türev</b></span></div><div class="schedule-row"><i></i><span>11:00<br><b>Deneme Sınavı</b></span></div><div class="schedule-row"><i></i><span>14:00<br><b>Geometri — Üçgenler</b></span></div><button>Tümünü Gör →</button></div><div class="preview-card graph"><div class="card-title"><h4>Gelişim Grafiğin</h4><em>+18%</em></div><div class="line-chart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="chart-labels"><small>Şub</small><small>Mar</small><small>Nis</small><small>May</small><small>Haz</small></div><p>Bu ayki performansını tek ekranda takip et.</p></div><div class="preview-card goal"><h4>Hedefe Yakınlık</h4><div class="donut"><strong>72%</strong></div><b>Aylık Hedef</b><small>18 gün kaldı</small><a>Hedefini düzenle →</a></div></div><div class="preview-grid-bottom"><div class="preview-card mini"><h4>Yaklaşan Sınavlar</h4><b>TYT Matematik Deneme</b><span>24 Mayıs · 10:00</span></div><div class="preview-card mini"><h4>Ödevlerim</h4><span>3 ödev bekliyor</span><b>1 tanesi bugün</b></div><div class="preview-card mini"><h4>Çalışma Süren</h4><span>Bu hafta</span><b class="hours">18s 40d</b></div></div></div></div>`

const loginModal = () => `<div class="login-overlay" id="loginOverlay" hidden><div class="login-backdrop" data-close-login></div><section class="login-panel" role="dialog" aria-modal="true" aria-labelledby="loginTitle"><button class="login-close" data-close-login aria-label="Girişi kapat">${icon('x', 20)}</button><aside class="login-side"><div class="login-orbit"><span class="login-mark">M</span></div><h3>Matematik <span>Koçum</span></h3><p>Kariyerine giden yolda akıllı bir yol arkadaşın.</p><div class="login-benefits"><div class="login-benefit"><div class="login-benefit-icon">${icon('sparkles', 20)}</div><div><b>Planla</b><span>Hedeflerine ulaşmak için akıllı planlama yap.</span></div></div><div class="login-benefit"><div class="login-benefit-icon">${icon('trending', 20)}</div><div><b>İlerle</b><span>Gelişimini takip et, başarılarını gör.</span></div></div><div class="login-benefit"><div class="login-benefit-icon">${icon('award', 20)}</div><div><b>Başar</b><span>Disiplinli çalış, hedeflerini gerçeğe dönüştür.</span></div></div></div><div class="login-quote">"Başarı, doğru plan + istikrarlı emek = güçlü sonuç."</div></aside><div class="login-form-side"><span class="eyebrow">HOŞ GELDİN</span><h2 id="loginTitle">Hesabına <span class="gradient-text">giriş yap.</span></h2><p class="login-copy">Öğretmen veya yöneticinin verdiği bilgilerle giriş yapınız.</p><form id="loginForm"><label>Kullanıcı adı<input name="username" autocomplete="username" required placeholder="Kullanıcı adınız"></label><label>Şifre<input name="password" type="password" autocomplete="current-password" required placeholder="Şifreniz"></label><div class="login-options"><label class="login-remember"><input type="checkbox" name="remember"><span>Beni hatırla</span></label><span></span></div><button class="button button-primary login-submit" type="submit">Giriş Yap ${icon('arrowRight', 18)}</button><div class="login-divider"></div><p class="login-help">Giriş yapabilmek için öğretmeniniz veya yöneticinizle iletişime geçiniz.</p><p class="login-note" id="loginNote"></p></form></div></section></div>`

const landing = () => `<div class="page-shell"><header class="site-header container"><a class="brand" href="#top"><span class="brand-mark">M</span><span>Matematik Koçum</span></a><nav class="nav-links"><a class="active" href="#top">Ana Sayfa</a><a href="#features">Özellikler</a><a href="#about">Hakkımızda</a><a href="#contact">İletişim</a></nav><div class="header-actions"><button class="theme-toggle" id="landingTheme" aria-label="Tema değiştir">${icon('sun', 20)}</button><button class="button button-ghost" data-login>Giriş Yap</button></div></header><main id="top"><section class="hero container"><div class="hero-copy"><div class="eyebrow">${icon('sparkles', 16)} Başarıya giden yolculukta yanındayız</div><h1>Sadece matematik değil,<br>kariyerinde <span class="gradient-text">başarıya giden</span><br>yolculukta yanındayız.</h1><p class="hero-lead">Derslerden sınavlara, ödevlerden koçluğa kadar ihtiyacın olan her şey tek platformada.<br>Planla, çalış, gelişimini takip et ve hedeflerine ulaş!</p><div class="hero-actions"><button class="button button-primary" data-login>Sisteme Giriş Yap ${icon('arrowRight', 18)}</button><a class="button button-secondary" href="#features">Platformu Keşfet ${icon('chevronRight', 18)}</a></div><div class="hero-trust"><span>${icon('users', 20)}<b>Öğrenci, Öğretmen<br>ve Veli Paneli</b></span><span>${icon('barChart', 20)}<b>Güçlü Raporlama<br>ve Analiz</b></span><span>${icon('shield', 20)}<b>Güvenli ve<br>Hızlı Altyapı</b></span><span>${icon('calendar', 20)}<b>Planlı Çalışma<br>ve Takvim</b></span></div></div><div class="hero-dashboard">${preview()}</div></section><section id="features" class="features container"><div class="section-heading"><span>Her şey en iyi öğrenme deneyimi için</span><h2>Tek platform. Tüm eğitim yolculuğu.</h2></div><div class="feature-grid"><article><div class="feature-icon">${icon('book', 22)}</div><h3>Ders ve İçerikler</h3><p>Derslerini, konu içeriklerini ve video kaynaklarını tek merkezden yönet.</p></article><article><div class="feature-icon">${icon('check', 22)}</div><h3>Ödev ve Takip</h3><p>Görevlerini, teslim tarihlerini ve tamamlanma durumlarını kontrol et.</p></article><article><div class="feature-icon">${icon('clipboard', 22)}</div><h3>Sınav ve Sonuçlar</h3><p>Sınavlarını planla, sonuçlarını incele ve performansını ölç.</p></article><article><div class="feature-icon">${icon('trending', 22)}</div><h3>Gelişim Analizi</h3><p>Hedeflerini ve ilerlemeni sade, anlaşılır göstergelerle takip et.</p></article><article><div class="feature-icon">${icon('award', 22)}</div><h3>Koçluk</h3><p>Hedef, değerlendirme ve görüşme süreçlerini tek yerde buluştur.</p></article><article><div class="feature-icon">${icon('mail', 22)}</div><h3>Güvenli İletişim</h3><p>Öğrenci, öğretmen, veli ve yönetici arasındaki iletişimi kolaylaştır.</p></article></div></section><section id="about" class="about container"><span>MATEMATİK KOÇUM</span><h2>Başarı tesadüf değil.<br><b>Doğru sistemle mümkün.</b></h2><p>Modern, sade ve güvenli bir eğitim deneyimi için tasarlandı.</p></section></main><footer id="contact" class="site-footer container"><span>© 2026 Matematik Koçum</span><span>Planla · İlerle · Başar</span></footer>${loginModal()}</div>`

const boot = async () => {
  try {
    const d = await getSession()
    if (d.authenticated && d.user) { await renderWorkspace(app, d.user, logout); return }
  } catch {}
  app.innerHTML = landing()
  const overlay = app.querySelector('#loginOverlay')
  const open = () => { overlay.hidden = false; document.body.style.overflow = 'hidden'; overlay.querySelector('input')?.focus() }
  const close = () => { overlay.hidden = true; document.body.style.overflow = '' }
  app.querySelectorAll('[data-login]').forEach(b => b.addEventListener('click', open))
  app.querySelectorAll('[data-close-login]').forEach(b => b.addEventListener('click', close))
  app.querySelector('#landingTheme')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('mk_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  })
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close() })
  app.querySelector('#loginForm').addEventListener('submit', async e => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const note = app.querySelector('#loginNote')
    const button = e.currentTarget.querySelector('button[type=submit]')
    button.disabled = true
    note.textContent = 'Giriş yapılıyor…'
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) })
      const d = await r.json()
      if (!r.ok || !d.ok) { note.textContent = d.error || 'Giriş başarısız.'; return }
      clearCache()
      sessionCache = { authenticated: true, user: d.user }
      sessionAt = Date.now()
      close()
      await renderWorkspace(app, d.user, logout)
    } catch (err) {
      note.textContent = err.message || 'Sunucuya ulaşılamadı.'
    } finally {
      button.disabled = false
    }
  })
}

const saved = localStorage.getItem('mk_theme')
if (saved === 'dark') document.documentElement.classList.add('dark')
boot()
