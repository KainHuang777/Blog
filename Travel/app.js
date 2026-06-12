(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-links a');
  const daySections = document.querySelectorAll('.day-section');
  const revealElements = document.querySelectorAll('.reveal');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const themePanels = document.querySelectorAll('.theme-panel');
  const particlesContainer = document.getElementById('particles');
  const inkCanvas = document.getElementById('inkCanvas');
  const ctx = inkCanvas.getContext('2d');

  let mouseX = 0;
  let mouseY = 0;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let inkDrops = [];
  let ripples = [];
  let inkStrokes = [];

  function resizeCanvas() {
    inkCanvas.width = window.innerWidth;
    inkCanvas.height = window.innerHeight;
  }

  function initInkSystem() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', function (e) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 3) {
        const angle = Math.atan2(dy, dx);
        const count = Math.min(Math.floor(speed / 5), 8);

        for (let i = 0; i < count; i++) {
          const t = i / count;
          const px = prevMouseX + dx * t + (Math.random() - 0.5) * 8;
          const py = prevMouseY + dy * t + (Math.random() - 0.5) * 8;
          const strokeLen = speed * 0.6 + Math.random() * 20;
          const strokeW = Math.random() * 6 + 3;

          inkStrokes.push({
            x: px,
            y: py,
            angle: angle + (Math.random() - 0.5) * 0.4,
            length: strokeLen,
            width: strokeW,
            opacity: Math.random() * 0.4 + 0.5,
            life: 1,
            decay: Math.random() * 0.025 + 0.03,
          });
        }

        const splashCount = Math.min(Math.floor(speed / 12), 4);
        for (let i = 0; i < splashCount; i++) {
          inkDrops.push({
            x: mouseX + (Math.random() - 0.5) * 30,
            y: mouseY + (Math.random() - 0.5) * 30,
            radius: Math.random() * 8 + 3,
            opacity: Math.random() * 0.5 + 0.4,
            life: 1,
            decay: Math.random() * 0.02 + 0.025,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
          });
        }

        if (speed > 20 && Math.random() > 0.5) {
          ripples.push({
            x: mouseX,
            y: mouseY,
            radius: 0,
            maxRadius: speed * 1.5 + 40,
            opacity: 0.5,
            speed: 3,
          });
        }
      }
    });

    setInterval(function () {
      if (Math.random() > 0.6) {
        inkDrops.push({
          x: Math.random() * inkCanvas.width,
          y: Math.random() * inkCanvas.height,
          radius: Math.random() * 12 + 4,
          opacity: Math.random() * 0.15 + 0.05,
          life: 1,
          decay: Math.random() * 0.005 + 0.003,
          vx: 0,
          vy: 0,
        });
      }
    }, 2000);

    animateInk();
  }

  function animateInk() {
    ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);

    for (let i = inkStrokes.length - 1; i >= 0; i--) {
      const s = inkStrokes[i];
      s.life -= s.decay;

      if (s.life <= 0) {
        inkStrokes.splice(i, 1);
        continue;
      }

      const alpha = s.opacity * s.life;
      const cos = Math.cos(s.angle);
      const sin = Math.sin(s.angle);
      const halfLen = s.length / 2;

      const x1 = s.x - cos * halfLen;
      const y1 = s.y - sin * halfLen;
      const x2 = s.x + cos * halfLen;
      const y2 = s.y + sin * halfLen;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(10, 20, 35, 0)');
      grad.addColorStop(0.15, 'rgba(10, 20, 35, ' + (alpha * 0.8) + ')');
      grad.addColorStop(0.5, 'rgba(15, 30, 50, ' + alpha + ')');
      grad.addColorStop(0.85, 'rgba(10, 20, 35, ' + (alpha * 0.8) + ')');
      grad.addColorStop(1, 'rgba(10, 20, 35, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width * (0.5 + s.life * 0.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(
        s.x + (Math.random() - 0.5) * 4,
        s.y + (Math.random() - 0.5) * 4,
        x2, y2
      );
      ctx.stroke();

      ctx.fillStyle = 'rgba(10, 25, 45, ' + (alpha * 0.3) + ')';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.width * 0.8, s.width * 1.5, s.angle, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = inkDrops.length - 1; i >= 0; i--) {
      const drop = inkDrops[i];
      drop.x += drop.vx;
      drop.y += drop.vy;
      drop.vx *= 0.92;
      drop.vy *= 0.92;
      drop.life -= drop.decay;
      drop.radius += 0.5;

      if (drop.life <= 0) {
        inkDrops.splice(i, 1);
        continue;
      }

      const alpha = drop.opacity * drop.life;
      const gradient = ctx.createRadialGradient(
        drop.x, drop.y, 0,
        drop.x, drop.y, drop.radius
      );
      gradient.addColorStop(0, 'rgba(8, 18, 32, ' + alpha + ')');
      gradient.addColorStop(0.3, 'rgba(15, 35, 60, ' + (alpha * 0.8) + ')');
      gradient.addColorStop(0.6, 'rgba(25, 55, 85, ' + (alpha * 0.4) + ')');
      gradient.addColorStop(1, 'rgba(40, 80, 120, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.radius += ripple.speed;
      ripple.opacity -= 0.015;

      if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = 'rgba(15, 35, 60, ' + ripple.opacity + ')';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(30, 60, 100, ' + (ripple.opacity * 0.4) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (inkStrokes.length > 150) inkStrokes.splice(0, 30);
    if (inkDrops.length > 80) inkDrops.splice(0, 20);

    requestAnimationFrame(animateInk);
  }

  function initParticles() {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
      p.style.animationDuration = (Math.random() * 10 + 8) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      p.style.opacity = Math.random() * 0.5 + 0.2;
      particlesContainer.appendChild(p);
    }
  }

  function handleScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    let currentDay = '';
    daySections.forEach(function (section) {
      const top = section.offsetTop - 150;
      if (scrollY >= top) {
        currentDay = section.getAttribute('data-day');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('data-day') === currentDay) {
        link.classList.add('active');
      }
    });
  }

  function initCardBackgrounds() {
    const cards = document.querySelectorAll('.card-has-bg');
    cards.forEach(function (card) {
      const bgUrl = card.getAttribute('data-bg');
      if (bgUrl) {
        card.style.setProperty('--card-bg', 'url(' + bgUrl + ')');
      }
    });
  }

  function initRevealObserver() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initThemeSwitcher() {
    themeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const theme = this.getAttribute('data-theme');

        themeButtons.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');

        themePanels.forEach(function (panel) {
          panel.classList.remove('active');
          if (panel.getAttribute('data-panel') === theme) {
            panel.classList.add('active');
            const reveals = panel.querySelectorAll('.reveal');
            reveals.forEach(function (r, i) {
              r.classList.remove('visible');
              setTimeout(function () {
                r.classList.add('visible');
              }, i * 150);
            });
          }
        });
      });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function init() {
    initParticles();
    initInkSystem();
    initCardBackgrounds();
    initRevealObserver();
    initThemeSwitcher();
    initSmoothScroll();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
