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
  const mapFilters = document.querySelectorAll('.map-filter');
  let map = null;
  let markers = [];
  let markerGroup = null;

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

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function initInkSystem() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const handleMove = throttle(function (e) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;

      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      if (speed > 3) {
        const limitFactor = isTouchDevice ? 0.25 : 1.0;
        const angle = Math.atan2(dy, dx);
        const count = Math.min(Math.floor(speed / 5 * limitFactor), isTouchDevice ? 2 : 8);

        for (let i = 0; i < count; i++) {
          const t = i / count;
          const px = prevMouseX + dx * t + (Math.random() - 0.5) * 8;
          const py = prevMouseY + dy * t + (Math.random() - 0.5) * 8;
          const strokeLen = (speed * 0.6 + Math.random() * 20) * (isTouchDevice ? 0.5 : 1.0);
          const strokeW = (Math.random() * 6 + 3) * (isTouchDevice ? 0.6 : 1.0);

          inkStrokes.push({
            x: px,
            y: py,
            angle: angle + (Math.random() - 0.5) * 0.4,
            length: strokeLen,
            width: strokeW,
            opacity: (Math.random() * 0.4 + 0.5) * (isTouchDevice ? 0.5 : 1.0),
            life: 1,
            decay: Math.random() * 0.025 + 0.03,
          });
        }

        const splashCount = Math.min(Math.floor(speed / 12 * limitFactor), isTouchDevice ? 1 : 4);
        for (let i = 0; i < splashCount; i++) {
          inkDrops.push({
            x: mouseX + (Math.random() - 0.5) * 30,
            y: mouseY + (Math.random() - 0.5) * 30,
            radius: (Math.random() * 8 + 3) * (isTouchDevice ? 0.6 : 1.0),
            opacity: (Math.random() * 0.5 + 0.4) * (isTouchDevice ? 0.5 : 1.0),
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
            maxRadius: (speed * 1.5 + 40) * (isTouchDevice ? 0.6 : 1.0),
            opacity: isTouchDevice ? 0.3 : 0.5,
            speed: isTouchDevice ? 2 : 3,
          });
        }
      }
    }, isTouchDevice ? 32 : 16);

    document.addEventListener('mousemove', handleMove);

    if (isTouchDevice) {
      document.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) {
          handleMove({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
          });
        }
      }, { passive: true });
    }

    // 降低背景隨機滴落頻率（觸控時 6 秒滴一次，桌面 3 秒）
    setInterval(function () {
      if (Math.random() > (isTouchDevice ? 0.8 : 0.6)) {
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
    }, isTouchDevice ? 6000 : 3000);

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

    if (window.isSmoothScrolling) return;

    // 所有監聽區塊的定義，按照在頁面上的垂直位置排序
    const sections = [
      { id: 'weatherSection', navType: 'nav', navVal: 'weather' },
      { id: 'day1', navType: 'day', navVal: '1' },
      { id: 'day2', navType: 'day', navVal: '2' },
      { id: 'day3', navType: 'day', navVal: '3' },
      { id: 'day4', navType: 'day', navVal: '4' },
      { id: 'mapSection', navType: 'nav', navVal: 'map' },
      { id: 'hotelListSection', navType: 'nav', navVal: 'hotel' }
    ];

    let activeNavType = '';
    let activeNavVal = '';

    sections.forEach(function (sec) {
      const el = document.getElementById(sec.id);
      if (el) {
        // 使用 -120px offset 獲取更自然的切換邊界
        const top = el.offsetTop - 120;
        if (scrollY >= top) {
          activeNavType = sec.navType;
          activeNavVal = sec.navVal;
        }
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (activeNavType === 'day') {
        if (link.getAttribute('data-day') === activeNavVal) {
          link.classList.add('active');
        }
      } else if (activeNavType === 'nav') {
        if (link.getAttribute('data-nav') === activeNavVal) {
          link.classList.add('active');
        }
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

  function initMap() {
    if (typeof L === 'undefined') return;

    const isMobile = window.innerWidth <= 768;

    map = L.map('map', {
      zoomControl: !isMobile,
      scrollWheelZoom: false,
      dragging: !isMobile,
      tap: !isMobile,
    }).setView([26.35, 127.75], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    markerGroup = L.layerGroup().addTo(map);
    var hotelMarkerGroup = L.layerGroup().addTo(map);

    var dayColors = {
      '1': '#1a5276',
      '2': '#2e86ab',
      '3': '#ff6b6b',
      '4': '#00d4aa',
    };
    var hotelColor = '#ffd700';

    var cards = document.querySelectorAll('.card-has-bg[data-lat]');

    cards.forEach(function (card) {
      var lat = parseFloat(card.getAttribute('data-lat'));
      var lng = parseFloat(card.getAttribute('data-lng'));
      var day = card.getAttribute('data-day');
      var title = card.querySelector('.card-title').textContent;
      var color = dayColors[day] || '#1a5276';

      var icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:' + color + ';width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">' + day + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      var marker = L.marker([lat, lng], { icon: icon })
        .bindPopup('<strong>' + title + '</strong><br><span style="color:' + color + '">Day ' + day + '</span>')
        .addTo(markerGroup);

      marker._day = day;
      markers.push(marker);
    });

    var hotelMarkers = [];
    var hotelItems = document.querySelectorAll('.hotel-map-item');

    hotelItems.forEach(function (item) {
      var lat = parseFloat(item.getAttribute('data-hotel-lat'));
      var lng = parseFloat(item.getAttribute('data-hotel-lng'));
      var name = item.querySelector('.hotel-map-name').textContent;
      var coords = item.querySelector('.hotel-map-coords').textContent;

      var icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:' + hotelColor + ';width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#8b6914;font-size:14px;font-weight:700;">🏨</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      var marker = L.marker([lat, lng], { icon: icon })
        .bindPopup('<strong>🏨 ' + name + '</strong><br><span style="color:#b8860b">本團已確認住宿</span><br><span style="font-size:0.8rem;color:#888">' + coords + '</span>')
        .addTo(hotelMarkerGroup);

      marker._type = 'hotel';
      marker._name = name;
      hotelMarkers.push(marker);
    });

    mapFilters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');

        mapFilters.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');

        markerGroup.clearLayers();
        hotelMarkerGroup.clearLayers();

        if (filter === 'all') {
          markers.forEach(function (m) { markerGroup.addLayer(m); });
          hotelMarkers.forEach(function (m) { hotelMarkerGroup.addLayer(m); });
          map.setView([26.35, 127.75], 10);
        } else if (filter === 'hotel') {
          hotelMarkers.forEach(function (m) { hotelMarkerGroup.addLayer(m); });
          if (hotelMarkers.length > 0) {
            var group = L.featureGroup(hotelMarkers);
            map.fitBounds(group.getBounds().pad(0.15));
          }
        } else {
          markers.forEach(function (marker) {
            if (marker._day === filter) {
              markerGroup.addLayer(marker);
            }
          });
          var filtered = markers.filter(function (m) { return m._day === filter; });
          if (filtered.length > 0) {
            var group = L.featureGroup(filtered);
            map.fitBounds(group.getBounds().pad(0.3));
          }
        }
      });
    });

    hotelItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var lat = parseFloat(this.getAttribute('data-hotel-lat'));
        var lng = parseFloat(this.getAttribute('data-hotel-lng'));

        hotelItems.forEach(function (i) { i.classList.remove('active'); });
        this.classList.add('active');

        map.setView([lat, lng], 15);

        hotelMarkers.forEach(function (m) {
          if (Math.abs(m.getLatLng().lat - lat) < 0.001 && Math.abs(m.getLatLng().lng - lng) < 0.001) {
            m.openPopup();
          }
        });
      });
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

  function initMealToggles() {
    document.querySelectorAll('.meal-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const marker = this.closest('.meal-marker');
        const content = marker.querySelector('.meal-marker-content');
        this.classList.toggle('open');
        content.classList.toggle('open');
      });
    });
  }

  function initHotelToggles() {
    document.querySelectorAll('.hotel-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const hotelOptions = this.closest('.hotel-options');
        const content = hotelOptions.querySelector('.hotel-options-content');
        this.classList.toggle('open');
        content.classList.toggle('open');
      });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          // 精確減去 Navbar 遮擋高度，避免 scrollIntoView offset 不精確問題
          const targetOffset = target.offsetTop - 70;
          window.scrollTo({
            top: targetOffset,
            behavior: 'smooth'
          });

          // 點擊後立即切換 active 類別，防止 smooth scroll 期間的 handleScroll 誤判
          if (this.closest('.nav-links')) {
            navLinks.forEach(function (link) {
              link.classList.remove('active');
            });
            this.classList.add('active');

            window.isSmoothScrolling = true;
            clearTimeout(window.smoothScrollTimeout);
            window.smoothScrollTimeout = setTimeout(function () {
              window.isSmoothScrolling = false;
            }, 800);
          }
        }
      });
    });
  }

  function initPackingChecklist() {
    const checkboxes = document.querySelectorAll('.packing-list-items input[type="checkbox"]');
    let packingData = {};
    
    try {
      const stored = localStorage.getItem('okinawa_packing');
      if (stored) {
        packingData = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse packing checklist storage:', e);
    }

    checkboxes.forEach(function (cb) {
      const packId = cb.getAttribute('data-pack');
      if (packId && packingData[packId]) {
        cb.checked = true;
      }
    });

    checkboxes.forEach(function (cb) {
      cb.addEventListener('change', function () {
        const packId = this.getAttribute('data-pack');
        if (packId) {
          packingData[packId] = this.checked;
          try {
            localStorage.setItem('okinawa_packing', JSON.stringify(packingData));
          } catch (e) {
            console.error('Failed to save packing checklist storage:', e);
          }
        }
      });
    });
  }

  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxSpinner = document.getElementById('lightboxSpinner');
    const galleryBtns = document.querySelectorAll('.card-gallery-btn');

    if (!lightbox || !lightboxImg || !lightboxCaption || !lightboxClose) return;

    function openLightbox(imgUrl, captionText) {
      lightbox.classList.add('active');
      lightboxSpinner.style.display = 'block';
      lightboxImg.style.opacity = '0';
      
      const tempImg = new Image();
      tempImg.onload = function () {
        lightboxImg.src = imgUrl;
        lightboxImg.style.opacity = '1';
        lightboxSpinner.style.display = 'none';
      };
      tempImg.onerror = function () {
        lightboxSpinner.style.display = 'none';
        lightboxImg.style.opacity = '0';
        lightboxCaption.textContent = '圖片載入失敗';
      };
      tempImg.src = imgUrl;
      
      lightboxCaption.textContent = captionText || '';
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      lightboxImg.src = '';
      lightboxCaption.textContent = '';
      document.body.style.overflow = '';
    }

    galleryBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const card = this.closest('.card');
        if (card) {
          const bgUrl = card.getAttribute('data-bg');
          const titleEl = card.querySelector('.card-title');
          const title = titleEl ? titleEl.textContent : '沖繩經典美景';
          if (bgUrl) {
            openLightbox(bgUrl, title);
          }
        }
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox-content')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  function initMapOverlay() {
    const overlay = document.getElementById('mapOverlay');
    const unlockBtn = document.getElementById('mapUnlockBtn');
    
    if (!overlay || !unlockBtn) return;

    unlockBtn.addEventListener('click', function () {
      overlay.classList.add('unlocked');
      if (map) {
        map.dragging.enable();
        if (map.tap) map.tap.enable();
      }
    });

    window.addEventListener('scroll', function () {
      if (overlay.classList.contains('unlocked')) {
        const rect = document.getElementById('mapSection').getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          overlay.classList.remove('unlocked');
          if (map) {
            map.dragging.disable();
            if (map.tap) map.tap.disable();
          }
        }
      }
    }, { passive: true });
  }

  function initDeviceDetection() {
    const infoText = document.getElementById('deviceInfoText');
    if (!infoText) return;

    const ua = navigator.userAgent;
    let os = '未知系統';
    let browser = '未知瀏覽器';
    let device = '桌上型電腦';

    // 辨識 OS
    if (/windows/i.test(ua)) {
      os = 'Windows';
      if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11';
      else if (/windows nt 6.3/i.test(ua)) os = 'Windows 8.1';
      else if (/windows nt 6.2/i.test(ua)) os = 'Windows 8';
      else if (/windows nt 6.1/i.test(ua)) os = 'Windows 7';
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      os = 'iOS';
      device = 'iPhone/iPad';
    } else if (/macintosh|mac os x/i.test(ua)) {
      os = 'macOS';
    } else if (/android/i.test(ua)) {
      os = 'Android';
      device = '行動裝置';
    } else if (/linux/i.test(ua)) {
      os = 'Linux';
    }

    // 辨識瀏覽器
    if (/edg/i.test(ua)) {
      browser = 'Microsoft Edge';
    } else if (/chrome|crios/i.test(ua) && !/opr|opios|edg/i.test(ua)) {
      browser = 'Google Chrome';
    } else if (/safari/i.test(ua) && !/chrome|crios|opr|opios|edg/i.test(ua)) {
      browser = 'Apple Safari';
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Mozilla Firefox';
    } else if (/opr/i.test(ua)) {
      browser = 'Opera';
    }

    // 行動端細化
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      device = '平板電腦';
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) {
      device = '智慧型手機';
    }

    infoText.textContent = `${os} · ${browser} · ${device}`;
  }

  function initWeatherForecast() {
    const grid = document.getElementById('weatherGrid');
    const timeEl = document.getElementById('weatherTime');
    if (!grid || !timeEl) return;

    // 沖繩那霸
    const lat = 26.2124;
    const lng = 127.6809;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`;

    const weatherIcons = {
      0: '☀️',
      1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌧️', 53: '🌧️', 55: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️',
      80: '🌦️', 81: '🌦️', 82: '🌦️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };

    const weatherTexts = {
      0: '晴天',
      1: '晴時多雲', 2: '多雲', 3: '陰天',
      45: '有霧', 48: '有霧',
      51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
      61: '小雨', 63: '中雨', 65: '大雨',
      80: '局部陣雨', 81: '陣雨', 82: '強陣雨',
      95: '雷陣雨', 96: '雷陣雨伴有冰雹', 99: '強雷陣雨'
    };

    function renderFallback() {
      const fallbackData = [
        { day: '一', date: 'Day 1', temp: '27-32°C', icon: '☀️', pop: '10%' },
        { day: '二', date: 'Day 2', temp: '27-32°C', icon: '🌤️', pop: '20%' },
        { day: '三', date: 'Day 3', temp: '27-32°C', icon: '🌦️', pop: '40%' },
        { day: '四', date: 'Day 4', temp: '27-32°C', icon: '☀️', pop: '15%' },
        { day: '五', date: '預備日', temp: '27-32°C', icon: '🌤️', pop: '20%' },
        { day: '六', date: '預備日', temp: '28-33°C', icon: '☁️', pop: '30%' },
        { day: '日', date: '預備日', temp: '28-33°C', icon: '⛈️', pop: '50%' }
      ];
      grid.innerHTML = fallbackData.map((item, idx) => `
        <div class="weather-item ${idx === 0 ? 'is-today' : ''}">
          <span class="weather-item-date">${item.date}</span>
          <span class="weather-item-day">週${item.day}</span>
          <span class="weather-item-icon">${item.icon}</span>
          <span class="weather-item-temp">${item.temp}</span>
          <span class="weather-item-pop">☔ ${item.pop}</span>
        </div>
      `).join('');
      timeEl.textContent = '沖繩八月平均氣候資料 (載入即時天氣失敗)';
    }

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (!data.daily) throw new Error('Data format error');
        const daily = data.daily;
        const now = new Date();
        const updateTimeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        timeEl.textContent = `更新時間: 今日 ${updateTimeStr}`;

        grid.innerHTML = '';
        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

        for (let i = 0; i < 7; i++) {
          const dateStr = daily.time[i];
          const date = new Date(dateStr);
          const month = date.getMonth() + 1;
          const dayDate = date.getDate();
          const dayName = dayNames[date.getDay()];
          const code = daily.weathercode[i];
          const tempMax = Math.round(daily.temperature_2m_max[i]);
          const tempMin = Math.round(daily.temperature_2m_min[i]);
          const pop = daily.precipitation_probability_max[i] || 0;

          const icon = weatherIcons[code] || '❓';
          const text = weatherTexts[code] || '未知氣候';
          const isToday = i === 0;

          const itemHtml = `
            <div class="weather-item ${isToday ? 'is-today' : ''}" title="${text}">
              <span class="weather-item-date">${month}/${dayDate}</span>
              <span class="weather-item-day">${isToday ? '今日' : '週' + dayName}</span>
              <span class="weather-item-icon">${icon}</span>
              <span class="weather-item-temp">${isToday ? tempMin + '-' + tempMax : tempMin + '-' + tempMax}°C</span>
              <span class="weather-item-pop">☔ ${pop}%</span>
            </div>
          `;
          grid.innerHTML += itemHtml;
        }
      })
      .catch(error => {
        console.error('Weather Fetch Error:', error);
        renderFallback();
      });
  }

  function init() {
    initParticles();
    initInkSystem();
    initCardBackgrounds();
    initRevealObserver();
    initThemeSwitcher();
    initMealToggles();
    initHotelToggles();
    initSmoothScroll();
    initMap();
    initPackingChecklist();
    initLightbox();
    initMapOverlay();
    initWeatherForecast();
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
