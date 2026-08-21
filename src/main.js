import './style.css'
import './login.css'

const app = document.querySelector('#app')

const dashboardPreview = () => `
  <div class="dashboard-preview">
    <aside class="preview-sidebar">
      <div class="preview-logo">✕</div>
      <div class="preview-nav active">⌂ <span>Ana Sayfa</span></div>
      <div class="preview-nav">▣ <span>Akademik</span><b>⌄</b></div>
      <div class="preview-nav">◫ <span>Gelişim</span></div>
      <div class="preview-nav">▣ <span>Planlama</span></div>
      <div class="preview-nav">◱ <span>İletişim</span></div>
      <div class="preview-nav">▢ <span>Mesajlar</span></div>
      <div class="preview-nav">⚙ <span>Ayarlar</span></div>
      <div class="preview-theme">☼ <span>Açık Tema</span><b>⌄</b></div>
    </aside>
    <div class="preview-main">
      <div class="preview-head"><div><h3>Günaydın, Tufan! 👋</h3><p>Bugün hedeflerine bir adım daha yaklaş.</p></div><div class="preview-date">20 Mayıs 2025<br><b>Salı</b>　▣</div></div>
      <div class="preview-grid-top">
        <div class="preview-card schedule"><h4>Bugünkü Program</h4><div class="schedule-row"><i></i><span>09:00<br><b>Matematik - Türev</b></span></div><div class="schedule-row"><i></i><span>11:00<br><b>Deneme Sınavı</b></span></div><div class="schedule-row"><i></i><span>14:00<br><b>Geometri - Üçgenler</b></span></div><button>Tümünü Gör →</button></div>
        <div class="preview-card graph"><div class="card-title"><h4>Gelişim Grafiğin</h4><em>↑ 18%</em></div><div class="line-chart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="chart-labels"><small>Şub</small><small>Mar</small><small>Nis</small><small>May</small><small>Haz</small></div><p>Bu ayki performansın geçen aya göre %18 arttı.</p></div>
        <div class="preview-card goal"><h4>Hedefe Yakınlık</h4><div class="donut"><strong>72%</strong></div><b>Aylık Hedef</b><small>18 gün kaldı</small><a>Hedefini düzenle →</a></div>
      </div>
      <div class="preview-grid-bottom"><div class="preview-card mini"><h4>Yaklaşan Sınavlar</h4><b>TYT Matematik Deneme - 12</b><span>24 Mayıs 2025 - 10:00 <em>4 Gün</em></span></div><div class="preview-card mini"><h4>Ödevlerim</h4><span>3 ödev bekliyor</span><b>1 ödev süresi bugün doluyor</b><strong class="doc-icon">▤</strong></div><div class="preview-card mini"><h4>Çalışma Süren</h4><span>Bu hafta</span><b class="hours">18s 40d</b><div class="bars"><i></i><i></i><i></i><i></i></div></div></div>
    </div>
  </div>`

const landing = () => `
  <div class="page-shell">
    <header class="site-header container">
      <a class="brand" href="#top"><span class="brand-mark">✕</span><span>Matematik Koçum</span></a>
      <nav class="nav-links"><a class="active" href="#top">Ana Sayfa</a><a href="#features">Özellikler</a><a href="#about">Hakkımızda</a><a href="#contact">İletişim</a></nav>
      <div class="header-actions"><button class="theme-toggle" aria-label="Tema değiştir">☼ ◔</button><button class="button button-ghost" data-login>Giriş Yap</button><button class="button button-primary" data-login>Kayıt Ol</button></div>
    </header>
    <main id="top">
      <section class="hero container">
        <div class="hero-copy">
          <div class="eyebrow"><span>✧</span> Başarıya giden yolculukta yanındayız</div>
          <h1>Sadece matematik değil,<br>kariyerinde <span class="gradient-text">başarıya giden</span><br>yolculukta yanındayız.</h1>
          <p class="hero-lead">Derslerden sınavlara, ödevlerden koçluğa kadar ihtiyacın olan her şey tek platformda.<br>Planla, çalış, gelişimini takip et ve hedeflerine ulaş!</p>
          <div class="hero-actions"><button class="button button-primary" data-login>Sisteme Giriş Yap <span>→</span></button><a class="button button-secondary" href="#features">Platformu Keşfet <span>▷</span></a></div>
          <div class="hero-trust"><span><i>♧</i><b>Öğrenci, Öğretmen<br>ve Veli Paneli</b></span><span><i>▥</i><b>Güçlü Raporlama<br>ve Analiz</b></span><span><i>◷</i><b>Güvenli ve<br>Hızlı Altyapı</b></span><span><i>▣</i><b>Planlı Çalışma<br>ve Takvim</b></span></div>
        </div>
        <div class="hero-dashboard">${dashboardPreview()}</div>
      </section>
      <section id="features" class="features container">
        <div class="section-heading"><span>Her şey en iyi öğrenme deneyimi için</span><h2>Neden Matematik Koçum?</h2></div>
        <div class="feature-grid">
          <article><div class="feature-icon">▣</div><h3>Ders ve Konu Anlatımları</h3><p>Video dersler ve detaylı konu anlatımları ile öğrenmeni destekler.</p></article>
          <article><div class="feature-icon">♧</div><h3>Ödev ve Soru Takibi</h3><p>Ödevlerini takip et, tamamla ve gelişimini gör.</p></article>
          <article><div class="feature-icon">▣</div><h3>Sınav ve Denemeler</h3><p>Sınavlara hazırlan, deneme sınavlarını çöz ve sonuçlarını analiz et.</p></article>
          <article><div class="feature-icon">▥</div><h3>Gelişim Raporları</h3><p>Performansını grafiklerle takip et, güçlü ve gelişime açık yönlerini gör.</p></article>
          <article><div class="feature-icon">♙</div><h3>Koçluk Desteği</h3><p>Kişisel koçunla iletişimde kal, hedeflerine birlikte ulaş.</p></article>
          <article><div class="feature-icon">▱</div><h3>İletişim ve Duyurular</h3><p>Tüm duyurulara ulaş, öğretmenlerinle kolayca iletişim kur.</p></article>
        </div>
      </section>
      <section id="about" class="about container"><span>MATEMATİK KOÇUM</span><h2>Başarı tesadüf değil.<br><b>Doğru sistemle mümkün.</b></h2></section>
    </main>
    <footer id="contact" class="site-footer container"><span>© 2026 Matematik Koçum</span><span>Modern eğitim deneyimi.</span></footer>
    <div class="login-overlay" id="loginOverlay" hidden><div class="login-backdrop" data-close-login></div><section class="login-panel" role="dialog" aria-modal="true"><button class="login-close" data-close-login>×</button><div class="login-brand"><span class="brand-mark">✕</span><span>Matematik Koçum</span></div><span class="eyebrow">HOŞ GELDİN</span><h2>Hesabına giriş yap.</h2><p class="login-copy">Devam etmek için kullanıcı bilgilerini gir.</p><form id="loginForm"><label>Kullanıcı adı<input name="username" autocomplete="username" required placeholder="Kullanıcı adın"></label><label>Şifre<input name="password" type="password" autocomplete="current-password" required placeholder="Şifren"></label><button class="button button-primary login-submit" type="submit">Giriş Yap <span>→</span></button><p class="login-note" id="loginNote">Gerçek giriş sistemi hazırlanıyor.</p></form></section></div>
  </div>`

app.innerHTML = landing()
const overlay = document.querySelector('#loginOverlay')
const openLogin = () => { overlay.hidden = false; document.body.style.overflow = 'hidden'; overlay.querySelector('input')?.focus() }
const closeLogin = () => { overlay.hidden = true; document.body.style.overflow = '' }
document.querySelectorAll('[data-login]').forEach((button) => button.addEventListener('click', openLogin))
document.querySelectorAll('[data-close-login]').forEach((element) => element.addEventListener('click', closeLogin))
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !overlay.hidden) closeLogin() })
document.querySelector('#loginForm').addEventListener('submit', async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const note = document.querySelector('#loginNote'); note.textContent = 'Giriş servisine bağlanılıyor…'; try { const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) }); const data = await response.json(); note.textContent = data.error || 'İşlem tamamlandı.' } catch { note.textContent = 'Sunucuya ulaşılamadı.' } })
