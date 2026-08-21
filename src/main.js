import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="page-shell">
    <header class="site-header container">
      <a class="brand" href="#top" aria-label="Matematik Koçum ana sayfa"><span class="brand-mark">M</span><span>Matematik Koçum</span></a>
      <nav class="nav-links" aria-label="Ana navigasyon"><a href="#platform">Platform</a><a href="#features">Özellikler</a><a href="#about">Hakkımızda</a></nav>
      <a class="button button-ghost" href="#login">Giriş Yap</a>
    </header>
    <main id="top">
      <section class="hero container">
        <div class="hero-copy">
          <div class="eyebrow"><span class="eyebrow-dot"></span>Eğitim deneyimini yeniden düşün</div>
          <h1>Başarıya giden<br><span class="gradient-text">yolculuğunda</span> yanında.</h1>
          <p class="hero-lead">Derslerini, hedeflerini ve gelişimini tek bir modern platformda yönet. Daha düzenli çalış, ilerlemeni gör ve hedeflerine daha bilinçli ilerle.</p>
          <div class="hero-actions"><a class="button button-primary" href="#login">Giriş Yap <span>→</span></a><a class="button button-secondary" href="#features">Platformu Keşfet</a></div>
          <div class="trust-line"><span class="trust-dot"></span>Öğrenci, öğretmen ve veli için tek deneyim</div>
        </div>
        <div class="hero-orbit" aria-hidden="true">
          <div class="glow glow-one"></div><div class="glow glow-two"></div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="hero-card hero-card-main"><div class="mini-top"><span>Gelişim özeti</span><span class="status">+12.4%</span></div><div class="metric">82<span>%</span></div><div class="metric-label">Bu haftaki ilerleme</div><div class="chart"><i style="height:34%"></i><i style="height:46%"></i><i style="height:40%"></i><i style="height:62%"></i><i style="height:57%"></i><i style="height:78%"></i><i style="height:92%"></i></div><div class="chart-days"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div></div>
          <div class="hero-card floating-card card-goal"><span class="floating-icon">↗</span><div><b>Hedef ilerliyor</b><small>TYT · 68 → 80 net</small></div></div><div class="hero-card floating-card card-task"><span class="check-icon">✓</span><div><b>Bugünkü hedef</b><small>4 / 5 tamamlandı</small></div></div>
        </div>
      </section>
      <section id="platform" class="platform-strip container"><div><span class="eyebrow">BİRLEŞİK DENEYİM</span><h2>Tek yerde. <span class="muted-gradient">Daha net.</span></h2></div><div class="platform-stats"><div><strong>01</strong><span>Ders & içerik</span></div><div><strong>02</strong><span>Plan & hedef</span></div><div><strong>03</strong><span>Gelişim & analiz</span></div></div></section>
      <section id="features" class="features container"><div class="section-heading"><span class="eyebrow">TEK PLATFORM</span><h2>İhtiyacın olan her şey,<br><span class="muted-gradient">gereksiz karmaşa olmadan.</span></h2></div><div class="feature-grid">
        <article class="feature-card feature-large"><div class="feature-icon">◎</div><h3>Gelişimini gör</h3><p>Performansını, hedeflerini ve çalışma düzenini anlaşılır verilerle takip et.</p><div class="progress-preview"><span>Matematik</span><b>81%</b><div><i></i></div></div></article>
        <article class="feature-card"><div class="feature-icon">⌁</div><h3>Planını yönet</h3><p>Ders, ödev, sınav ve çalışma planını tek merkezden düzenle.</p></article>
        <article class="feature-card"><div class="feature-icon">✦</div><h3>Hedeflerine odaklan</h3><p>Günlük ve uzun vadeli hedeflerini belirle, ilerlemeni adım adım izle.</p></article>
        <article class="feature-card feature-wide"><div><div class="feature-icon">◌</div><h3>Herkes için tek deneyim</h3><p>Öğrenci, öğretmen ve veli kendi ihtiyaçlarına göre sadeleştirilmiş bir arayüz görür.</p></div><div class="role-pills"><span>Öğrenci</span><span>Öğretmen</span><span>Veli</span></div></article>
      </div></section>
      <section id="login" class="login-cta container"><div><span class="eyebrow">HAZIR MISIN?</span><h2>Yolculuğuna <span class="gradient-text">buradan</span> başla.</h2><p>Hesabınla giriş yaparak sana özel eğitim deneyimine geç.</p></div><a class="button button-primary" href="#top">Giriş Yap <span>→</span></a></section>
    </main>
    <footer id="about" class="site-footer container"><span>© 2026 Matematik Koçum</span><span>Modern eğitim deneyimi.</span></footer>
  </div>
`;
