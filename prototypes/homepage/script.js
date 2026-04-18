/* ── Navbar scroll opacity ───────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile menu ─────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
const navOverlay = document.getElementById('nav-overlay');

function openMenu() {
  navMobile.classList.add('open');
  navOverlay.classList.add('open');
  navbar.classList.add('menu-open');
  requestAnimationFrame(() => navOverlay.classList.add('visible'));
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  navMobile.classList.remove('open');
  navbar.classList.remove('menu-open');
  navOverlay.classList.remove('visible');
  navOverlay.addEventListener('transitionend', () => navOverlay.classList.remove('open'), { once: true });
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  navMobile.classList.contains('open') ? closeMenu() : openMenu();
});

navOverlay.addEventListener('click', closeMenu);

navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', closeMenu);
});

/* ── Footer year ─────────────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── Chaos canvas animation ──────────────────────────────────────── */
(function initChaos() {
  const canvas = document.getElementById('chaosCanvas');
  const ctx = canvas.getContext('2d');

  // Icon definitions (emoji + label)
  const ICONS = [
    { emoji: '📝', label: 'Notion' },
    { emoji: '🐙', label: 'GitHub' },
    { emoji: '💬', label: 'Slack' },
    { emoji: '💻', label: 'VS Code' },
    { emoji: '🌐', label: 'Browser' },
    { emoji: '⬛', label: 'Terminal' },
    { emoji: '📄', label: 'Text file' },
    { emoji: '🔖', label: 'Bookmark' },
  ];

  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let animFrame;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 32; // account for padding
    canvas.height = parseInt(canvas.style.height || '220');
    initParticles();
  }

  function initParticles() {
    particles = ICONS.map((icon) => ({
      ...icon,
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: 34 + Math.random() * 10,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.02,
      opacity: 0.6 + Math.random() * 0.4,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 80;
      if (dist < repelRadius && dist > 0) {
        const force = (repelRadius - dist) / repelRadius;
        p.vx += (dx / dist) * force * 0.6;
        p.vy += (dy / dist) * force * 0.6;
      }

      // Speed cap
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 3) { p.vx *= 3 / speed; p.vy *= 3 / speed; }

      // Friction
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Move
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.rotSpeed;
      p.pulse += p.pulseSpeed;

      // Bounce off walls
      const pad = p.size;
      if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx); }
      if (p.x > canvas.width - pad) { p.x = canvas.width - pad; p.vx = -Math.abs(p.vx); }
      if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy); }
      if (p.y > canvas.height - pad) { p.y = canvas.height - pad; p.vy = -Math.abs(p.vy); }

      // Draw emoji with subtle scale pulse
      const scale = 1 + Math.sin(p.pulse) * 0.08;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size * scale}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }

    animFrame = requestAnimationFrame(draw);
  }

  // Track mouse relative to canvas
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Also repel on touch
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = t.clientX - rect.left;
    mouse.y = t.clientY - rect.top;
  }, { passive: true });

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();
  draw();
})();

/* ── Pricing toggle ──────────────────────────────────────────────── */
const billingToggle = document.getElementById('billing-toggle');
const proPrice = document.getElementById('pro-price');
const priceNote = document.getElementById('price-note');
const labelMonthly = document.getElementById('toggle-monthly');
const labelYearly = document.getElementById('toggle-yearly');

billingToggle.addEventListener('change', () => {
  const yearly = billingToggle.checked;
  proPrice.textContent = yearly ? '$6' : '$8';
  priceNote.style.visibility = yearly ? 'visible' : 'hidden';
  labelMonthly.classList.toggle('active', !yearly);
  labelYearly.classList.toggle('active', yearly);
});

/* ── Scroll fade-in ──────────────────────────────────────────────── */
// Add js-ready so CSS can apply the initial hidden state — without this,
// elements are visible by default (no-JS / screenshot safe).
document.body.classList.add('js-ready');

const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach((el) => observer.observe(el));
