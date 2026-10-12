// טל רחבי – site interactions: intro sequence, menu, hero parallax, ribbons, selected-work viewer.
(function () {
  'use strict';
  window.__introStarted = true;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Intro: phase 0 (closed) → 1 (logo + ink line) → 2 (doors open) → 3 (done) ── */
  var timers = [];
  function setPhase(n) {
    root.classList.remove('p0', 'p1', 'p2');
    if (n < 3) root.classList.add('p' + n);
  }
  function runIntro() {
    timers.forEach(clearTimeout);
    timers = [];
    root.classList.remove('seam-on');
    if (reduceMotion || root.classList.contains('no-motion')) { setPhase(3); return; }
    setPhase(0);
    timers.push(setTimeout(function () { setPhase(1); }, 150));
    timers.push(setTimeout(function () { root.classList.add('seam-on'); }, 2150));
    timers.push(setTimeout(function () { root.classList.remove('seam-on'); setPhase(2); }, 2700));
    timers.push(setTimeout(function () { setPhase(3); }, 4800));
  }

  /* ── Ribbons inside the glass orbs ── */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function buildRibbon(n, amp, twist, ph, opScale) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1) - 0.5;
      var d = '';
      for (var x = 0; x <= 800; x += 10) {
        var a = 2 * Math.PI * x / 400;
        var y = 200 + amp * Math.sin(a) + t * twist * Math.cos(a + ph);
        d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' ';
      }
      out.push({ d: d, op: ((0.3 + 0.7 * (1 - Math.abs(t) * 2)) * opScale).toFixed(2) });
    }
    return out;
  }
  var ribbons = { '1': buildRibbon(22, 46, 92, 0.6, 1), '2': buildRibbon(10, 30, 60, 2.2, 0.6) };
  document.querySelectorAll('g[data-ribbon]').forEach(function (g) {
    ribbons[g.getAttribute('data-ribbon')].forEach(function (r) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', r.d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', g.getAttribute('data-stroke'));
      p.setAttribute('stroke-width', g.getAttribute('data-width'));
      p.setAttribute('stroke-opacity', r.op);
      g.appendChild(p);
    });
  });

  /* ── Hero parallax ── */
  var hero = document.getElementById('top');
  if (hero && !reduceMotion) {
    var frame = 0, mx = 0, my = 0;
    hero.addEventListener('mousemove', function (e) {
      mx = e.clientX / (window.innerWidth || 1) * 2 - 1;
      my = e.clientY / (window.innerHeight || 1) * 2 - 1;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        hero.style.setProperty('--mx', mx.toFixed(3));
        hero.style.setProperty('--my', my.toFixed(3));
      });
    });
  }

  /* ── Menu ── */
  var menuBtn = document.getElementById('menuBtn');
  var menu = document.getElementById('siteMenu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ── Selected-work viewer ── */
  var projects = [
    { type: 'site', title: 'רובין הנדסה', cat: 'אתר שירות · בדק בית', domain: 'rubinhandasa.co.il', url: 'https://rubinhandasa.co.il', headline: 'הדירה נראית מושלמת?', cta: 'דברו איתנו', bg: 'linear-gradient(160deg, #3A3F40, #1A1D1E)', screen: '#F9F7F3', ink: '#282C2D', btn: '#778B7E', desc: 'אתר שירות לחברת בדק בית, שבנוי סביב החשש של קוני דירות: כותרת שמדברת אליהם, תהליך עבודה בשלושה שלבים והנעה לוואטסאפ לאורך כל העמוד.' },
    { type: 'site', title: 'סיגלית קדם', cat: 'אתר מותג · תכשיטים', domain: 'sigalitkedem.com', url: 'https://sigalitkedem.com', headline: 'תכשיטים שנשארים איתך', cta: 'לקולקציה', bg: 'linear-gradient(160deg, #EFE6D6, #CDB993)', screen: '#FBF8F2', ink: '#3D3426', btn: '#A88B57', desc: 'אתר מותג לסטודיו תכשיטים בעבודת יד – קולקציות זהב וכסף ועיצוב אישי, בשפה עדינה ואלגנטית שמשדרת איכות.' },
    { type: 'site', title: 'Skymedic Israel', cat: 'דף נחיתה · כנס לרופאים', domain: 'skymedicil.com', url: 'https://skymedicil.com/international-masterclass/', headline: 'כנס SKYMEDIC DAY', cta: 'להרשמה', bg: 'linear-gradient(160deg, #DCE4DE, #96AC9E)', screen: '#1F2324', ink: '#F9F7F3', btn: '#778B7E', desc: 'דף נחיתה והרשמה לכנס SKYMEDIC DAY – מסטרקלאס בינלאומי לרופאי אסתטיקה, עם פרטי האירוע, התוכן והרשמה מסודרת.' },
    { type: 'site', title: 'לזכרו של רס״ן רועי צ\'אפל', cat: 'אתר עמותה · הנצחה', domain: 'roeychapell.com', url: 'https://roeychapell.com', headline: 'אדם של נתינה, מנהיגות ואהבת הארץ', cta: 'לתרומה', bg: 'linear-gradient(160deg, #E7EDE8, #B7C7BC)', screen: '#F9F7F3', ink: '#2E3B33', btn: '#4F6255', desc: 'אתר לעמותת ההנצחה – סיפור חייו, הפעילויות החינוכיות, מצפור רועי ואפשרות לתרום, בטון מכובד ושקט.' },
    { type: 'design', title: 'Salinka', cat: 'עיצוב גרפי · קמפיין מבצע', img: 'assets/work-salinka.jpg', alt: 'באנר מבצע נובמבר עבור Salinka', bg: '#EDE8E2', desc: 'באנר לקמפיין מבצע נובמבר של מותג האופנה – צילום דומיננטי, טיפוגרפיה חזקה וקוד קופון שקל לזכור.' },
    { type: 'design', title: 'Skymedic · exo ox', cat: 'עיצוב גרפי · השקת מוצר', img: 'assets/work-skymedic-exo.jpg', alt: 'באנר השקת exo ox של Skymedic', bg: '#E9E5DE', desc: 'באנר השקה לטיפול רגנרטיבי עם אקסוזומים – מסר מדעי בשפה אסתטית ויוקרתית, לקהל של רופאים.' },
    { type: 'design', title: 'Rollosnap', cat: 'עיצוב גרפי · קרוסלת תוכן', img: 'assets/work-rollosnap.jpg', alt: 'קרוסלת תוכן עבור Rollosnap', bg: '#EFEBE4', desc: 'קרוסלה הדרכתית לאינסטגרם – תוכן שימושי בשפה צבעונית ונגישה, שמזמינה לדפדף עד הסוף.' },
    { type: 'design', title: 'Skymedic · Hands On', cat: 'עיצוב גרפי · אירוע לרופאים', img: 'assets/work-skymedic-handson.jpg', alt: 'באנר HANDS ON של Skymedic Israel', bg: '#26292A', desc: 'באנר למפגש מעשי לרופאים – צילום קליני דרמטי עם טיפוגרפיה נקייה ויוקרתית.' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var modal = $('projModal');
  var current = 0;
  var lastTrigger = null;

  function renderProject() {
    var p = projects[current];
    var isSite = p.type === 'site';
    $('projVisual').style.background = p.bg;
    $('projImg').hidden = isSite;
    $('projSite').hidden = !isSite;
    if (isSite) {
      $('projSite').style.background = p.screen;
      $('projDomain').textContent = p.domain;
      $('projHeadline').textContent = p.headline;
      $('projHeadline').style.color = p.ink;
      modal.querySelectorAll('.proj-ink').forEach(function (el) { el.style.background = p.ink; });
      $('projCta').textContent = p.cta;
      $('projCta').style.background = p.btn;
      $('projLink').href = p.url;
    } else {
      $('projImg').src = p.img;
      $('projImg').alt = p.alt;
    }
    $('projLink').hidden = !isSite;
    $('projCat').textContent = p.cat;
    $('projTitle').textContent = p.title;
    $('projDesc').textContent = p.desc;
    $('projPos').textContent = (current + 1) + ' / ' + projects.length;
  }
  function openProject(i, trigger) {
    current = i;
    lastTrigger = trigger || document.activeElement;
    renderProject();
    modal.hidden = false;
    root.style.overflow = 'hidden';
    $('projClose').focus();
  }
  function closeProject() {
    modal.hidden = true;
    root.style.overflow = '';
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  function step(d) {
    current = (current + d + projects.length) % projects.length;
    renderProject();
  }

  document.querySelectorAll('[data-open-work]').forEach(function (b) {
    b.addEventListener('click', function () { openProject(0, b); });
  });
  $('projClose').addEventListener('click', closeProject);
  $('projNext').addEventListener('click', function () { step(1); });
  $('projPrev').addEventListener('click', function () { step(-1); });
  $('projBackdrop').addEventListener('click', function (e) { if (e.target === e.currentTarget) closeProject(); });

  document.addEventListener('keydown', function (e) {
    if (!modal.hidden) {
      if (e.key === 'Escape') closeProject();
      else if (e.key === 'ArrowLeft') step(1);   // RTL: left = next
      else if (e.key === 'ArrowRight') step(-1);
    } else if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ── Stop / resume animations (accessibility), remembered per visitor ── */
  var motionBtn = $('motionBtn');
  function syncMotionBtn() {
    var off = root.classList.contains('no-motion');
    motionBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
    motionBtn.textContent = off ? 'הפעלת אנימציות' : 'עצירת אנימציות';
  }
  motionBtn.addEventListener('click', function () {
    var off = !root.classList.contains('no-motion');
    root.classList.toggle('no-motion', off);
    if (off) setPhase(3);
    try { localStorage.setItem('tm-motion', off ? 'off' : 'on'); } catch (e) {}
    syncMotionBtn();
  });
  syncMotionBtn();

  /* ── Replay the intro from the footer ── */
  $('replayBtn').addEventListener('click', function () {
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (err) { window.scrollTo(0, 0); }
    runIntro();
  });

  if (window.__introSkipped) setPhase(3); else runIntro();
})();
