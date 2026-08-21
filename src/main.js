import './style.css'
import './login.css'

const app = document.querySelector('#app')

const landing = () => `
  <div class="page-shell">
    <header class="site-header container">
      <a class="brand" href="#top" aria-label="Matematik Koçum ana sayfa"><span class="brand-mark">M</span><span>Matematik Koçum</span></a>
      <nav class="nav-links" aria-label="Ana navigasyon"><a href="#platform">Platform</a><a href="#features">Özellikler</a><a href="#about">Hakkımızda</a></nav>
      <button class="button button-ghost" data-login>Giriş Yap</button>
    </header>

    <main id="top">
      <section class="hero hero-clean container">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-dot"></span>Başarıya giden yolculukta yanındayız</div>
          <h1>Sadece matematik değil,<br><span class="gradient-text">kariyerinde başarıya giden</span><br>yolculukta yanındayız.</h1>
          <p class="hero-lead">Derslerden sınavlara, ödevlerden koçluğa kadar başarıya ulaşman için ihtiyacın olan deneyimi tek ve sade bir platformda buluşturuyoruz.</p>
          <div class="hero-actions"><button class="button button-primary" data-login>Sisteme Giriş Yap <span>→</span></button><a class="button button-secondary" href="#features">Platformu Keşfet <span>›</span></a></div>
          <div class="hero-trust"><span><i>♧</i> Öğrenci, öğretmen ve veli</span><span><i>↗</i> Gelişim ve analiz</span><span><i>◷</i> Her yerden erişim</span></div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="visual-glow"></div><div class="visual-ring ring-a"></div><div class="visual-ring ring-b"></div><div class="visual-ring ring-c"></div>
          <div class="visual-core"><span class="core-mark">M</span><span class="core-label">MATEMATİK KOÇUM</span><span class="core-line"></span><span class="core-caption">Daha düzenli. Daha bilinçli. Daha güçlü.</span></div>
          <div class="visual-orb orb-a"><b>Hedef</b><small>Odaklan</small></div>
          <div class="visual-orb orb-b"><b>Plan</b><small>İlerle</small></div>
          <div class="visual-orb orb-c"><b>Gelişim</b><small>Gör</small></div>
        </div>
      </section>

      <section id="platform" class="platform-strip container">
        <div><span class="eyebrow">BİR PLATFORM</span><h2>İhtiyacın olan her şey.<br><span class="muted-gradient">Gereksiz karmaşa olmadan.</span></h2></div>
        <div class="platform-stats"><div><strong>01</strong><span>Ders & içerik</span></div><div><strong>02</strong><span>Plan & hedef</span></div><div><strong>03</strong><span>Gelişim & analiz</span></div></div>
      </section>

      <section id="features" class="features container">
        <div class="section-heading"><span class="eyebrow">SENİN İÇİN TASARLANDI</span><h2>Her adımında <span class="muted-gradient">yanında.</span></h2></div>
        <div class="feature-grid">
          <article class="feature-card feature-large"><div class="feature-icon">◎</div><h3>Gelişimini takip et</h3><p>Çalışma düzenini, hedeflerini ve ilerlemeni sade bir deneyim üzerinden takip et. Ne yaptığını ve sırada ne olduğunu her zaman bil.</p><div class="feature-line"><span></span><span></span><span></span><span></span><span></span></div></article>
          <article class="feature-card"><div class="feature-icon">⌁</div><h3>Planını oluştur</h3><p>Ders, ödev, sınav ve çalışma hedeflerini tek yerde düzenle.</p></article>
          <article class="feature-card"><div class="feature-icon">✦</div><h3>Hedefine odaklan</h3><p>Günlük küçük adımları uzun vadeli hedeflerinle birleştir.</p></article>
          <article class="feature-card feature-wide"><div><div class="feature-icon">◌</div><h3>Herkes için sade</h3><p>Öğrenci, öğretmen ve veli için ihtiyaca göre şekillenen tek bir deneyim.</p></div><div class="role-pills"><span>Öğrenci</span><span>Öğretmen</span><span>Veli</span></div></article>
        </div>
      </section>

      <section class="login-cta container"><div><span class="eyebrow">HAZIR MISIN?</span><h2>Yolculuğuna <span class="gradient-text">buradan</span> başla.</h2><p>Hesabınla giriş yap ve sana özel deneyime geç.</p></div><button class="button button-primary" data-login>Giriş Yap <span>→</span></button></section>
    </main>

    <footer id="about" class="site-footer container"><span>© 2026 Matematik Koçum</span><span>Modern eğitim deneyimi.</span></footer>

    <div class="login-overlay" id="loginOverlay" hidden><div class="login-backdrop" data-close-login></div><section class="login-panel" role="dialog" aria-modal="true" aria-labelledby="loginTitle"><button class="login-close" data-close-login aria-label="Giriş penceresini kapat">×</button><div class="login-brand"><span class="brand-mark">M</span><span>Matematik Koçum</span></div><span class="eyebrow">HOŞ GELDİN</span><h2 id="loginTitle">Hesabına giriş yap.</h2><p class="login-copy">Devam etmek için kullanıcı bilgilerini gir.</p><form id="loginForm"><label>Kullanıcı adı<input name="username" autocomplete="username" required placeholder="Kullanıcı adın"></label><label>Şifre<input name="password" type="password" autocomplete="current-password" required placeholder="Şifren"></label><button class="button button-primary login-submit" type="submit">Giriş Yap <span>→</span></button><p class="login-note" id="loginNote">Gerçek giriş sistemi hazırlanıyor.</p></form></section></div>
  </div>`

app.innerHTML = landing()

const overlay = document.querySelector('#loginOverlay')
const openLogin = () => { overlay.hidden = false; document.body.style.overflow = 'hidden'; overlay.querySelector('input')?.focus() }
const closeLogin = () => { overlay.hidden = true; document.body.style.overflow = '' }
document.querySelectorAll('[data-login]').forEach((button) => button.addEventListener('click', openLogin))
document.querySelectorAll('[data-close-login]').forEach((element) => element.addEventListener('click', closeLogin))
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !overlay.hidden) closeLogin() })
document.querySelector('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const note = document.querySelector('#loginNote')
  note.textContent = 'Giriş servisine bağlanılıyor…'
  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) })
    const data = await response.json()
    note.textContent = data.error || 'İşlem tamamlandı.'
  } catch { note.textContent = 'Sunucuya ulaşılamadı.' }
})
