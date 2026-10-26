(() => {
  const root = document.documentElement;
  const intro = document.querySelector('.intro');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Framer's duration-based spring: damping ratio is 1 - bounce, and the stiffness is
  // chosen so the motion settles (to 0.1%) within `duration` seconds. Sampled into a
  // CSS linear() curve so plain CSS transitions and WAAPI can use it.
  function spring(bounce, duration, samples = 50) {
    const zeta = Math.min(1, Math.max(0.05, 1 - bounce));
    const w0 = 6.9 / (zeta * duration);
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const points = [];
    for (let i = 0; i <= samples; i++) {
      const t = (i / samples) * duration;
      const decay = Math.exp(-zeta * w0 * t);
      const x = zeta < 1
        ? 1 - decay * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
        : 1 - decay * (1 + w0 * t);
      points.push(+x.toFixed(4));
    }
    points[samples] = 1;
    return `linear(${points.join(', ')})`;
  }

  const supportsLinear = window.CSS && CSS.supports('transition-timing-function', 'linear(0, 1)');
  const ease = (bounce, duration, fallback) => (supportsLinear ? spring(bounce, duration) : fallback);

  const EASE_HOVER = ease(0.25, 0.45, 'cubic-bezier(0.34, 1.25, 0.64, 1)');
  const EASE_POP = ease(0.2, 0.4, 'cubic-bezier(0.34, 1.2, 0.64, 1)');
  const EASE_SWING = ease(0.3, 0.3, 'cubic-bezier(0.34, 1.4, 0.64, 1)');
  const EASE_SETTLE = ease(0.35, 0.26, 'cubic-bezier(0.34, 1.4, 0.64, 1)');
  root.style.setProperty('--ease-hover', EASE_HOVER);
  root.style.setProperty('--ease-pop', EASE_POP);

  // Hand-drawn ruled line under each row of the orange card (the original is a traced SVG).
  function buildRule() {
    const path = document.querySelector('.rule__path');
    if (!path) return;
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const top = [];
    const bottom = [];
    for (let x = 0; x <= 348; x += 1.5) {
      const drift = Math.sin(x / 41) * 0.3 + Math.sin(x / 17 + 2) * 0.15;
      top.push(`${x.toFixed(1)} ${(1.9 + drift + (rand() - 0.5) * 0.45).toFixed(2)}`);
      bottom.push(`${x.toFixed(1)} ${(3.3 + drift + (rand() - 0.5) * 0.45).toFixed(2)}`);
    }
    path.setAttribute('d', `M${top.join('L')}L${bottom.reverse().join('L')}Z`);
  }

  // 18px orange dot that replaces the pointer on mouse/trackpad devices.
  function initCursor() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.append(dot);
    root.classList.add('has-cursor');
    addEventListener('pointermove', (e) => {
      dot.style.transform = `translate3d(${e.clientX - 9}px, ${e.clientY - 9}px, 0)`;
      dot.style.opacity = '1';
    }, { passive: true });
    root.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
  }

  // Nav links flash orange when pressed, then fade back after 800ms.
  function initNav() {
    for (const link of document.querySelectorAll('.nav__link')) {
      let timer;
      link.addEventListener('click', () => {
        link.classList.add('is-pressed');
        clearTimeout(timer);
        timer = setTimeout(() => link.classList.remove('is-pressed'), 800);
      });
    }
  }

  function initNameCard() {
    const card = document.querySelector('.name-card');
    if (!card) return;
    card.addEventListener('click', () => {
      card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
    });
  }

  // Two-frame ASCII flower, swapped every 400ms like the original's variant cycle.
  function initFlower() {
    const flower = document.querySelector('.flower');
    if (!flower || reduceMotion) return;
    setInterval(() => {
      flower.dataset.frame = flower.dataset.frame === 'a' ? 'b' : 'a';
    }, 400);
  }

  // Timings (ms) read off the original's 2.33s load-in video, frame by frame.
  const T = {
    rise: 150, // colour dots rise from below, orange leading
    flood: 450, // orange dot floods the screen
    e: 515, // big white "e" on orange
    fall: 880, // "e" drops out of frame
    lime: 1060, // cut to lime: giant "m", "m", "ı" swing in
    sky: 1740, // cut to sky blue: small "emmi" settles, the dot lands on the i
    reveal: 2350, // cards and nav appear, intro fades out
  };

  // The intro spells data-name: its first letter on orange, the rest swinging in on lime, then the
  // whole word on sky blue. A trailing i is drawn dotless so its dot can fly past and land on its own.
  function buildIntro() {
    const glyphs = [...(intro.dataset.name || 'emmi')];
    const dotted = glyphs.length > 1 && glyphs.at(-1) === 'i';
    if (dotted) glyphs[glyphs.length - 1] = 'ı';
    const letter = (c) => Object.assign(document.createElement('span'), { textContent: c });

    intro.querySelector('.intro__first').textContent = glyphs[0];
    intro.querySelector('.intro__rest').append(...glyphs.slice(1).map(letter));
    const word = intro.querySelector('.intro__word');
    word.style.setProperty('--n', glyphs.length);
    word.append(...glyphs.map(letter));

    if (dotted) {
      const dot = Object.assign(document.createElement('b'), { className: 'intro__dot' });
      word.lastChild.classList.add('intro__i');
      word.lastChild.append(dot);
    } else {
      intro.querySelector('.intro__fly').remove();
    }
  }

  function finishIntro() {
    root.classList.remove('intro-pending');
    if (intro) intro.remove();
  }

  function runIntro() {
    if (!intro) return;
    if (reduceMotion || !intro.animate) {
      finishIntro();
      return;
    }
    buildIntro();
    intro.classList.add('is-playing');
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(playIntro);
  }

  function playIntro() {
    const q = (sel) => intro.querySelector(sel);
    const play = (el, keyframes, at, duration, easing = 'linear', fill = 'both') =>
      el.animate(keyframes, { delay: at, duration, easing, fill });
    const cut = (el, at) => play(el, [{ opacity: 0 }, { opacity: 1 }], at, 1);

    // 1. Stack of dots rises; each one trails the orange lead slightly.
    for (const dot of intro.querySelectorAll('.scene-dots i')) {
      const i = Number(dot.style.getPropertyValue('--i'));
      const offset = i * dot.offsetHeight * 0.09;
      play(dot, [{ transform: 'translateY(80vh)' }, { transform: `translateY(${offset}px)` }],
        T.rise + i * 15, 310, 'cubic-bezier(0.5, 0, 0.3, 1)');
    }
    play(q('.scene-dots__lead'), [{ scale: 1 }, { scale: 9 }], T.flood, 70, 'cubic-bezier(0.55, 0, 1, 0.45)');

    // 2. The first letter on orange, then it falls away.
    const first = q('.intro__first');
    cut(q('.scene-first'), T.e);
    play(first, [{ scale: 0.88 }, { scale: 1 }], T.e, 260, EASE_POP);
    play(first, [{ transform: 'translateY(0)' }, { transform: 'translateY(95vh)' }],
      T.fall, 180, 'cubic-bezier(0.45, 0, 0.85, 0.5)');

    // 3. Lime: oversized letters swing up from below, each settling with a tilt. The first swings in
    //    from the left; the rest come up from the bottom right, about 170ms apart (faster for long names).
    cut(q('.scene-rest'), T.lime);
    const rest = intro.querySelectorAll('.intro__rest span');
    const gap = Math.min(170, 500 / rest.length);
    rest.forEach((letter, n) => {
      const later = n > 1;
      const from = n === 0
        ? 'translate(-38vw, 30vh) rotate(-38deg)'
        : `translate(${later ? 22 : 30}vw, 85vh) rotate(${later ? 45 : 38}deg)`;
      const to = n === 0 ? 'none' : `translateY(${later ? 3.5 : 1.5}vh) rotate(${later ? 10 : 5}deg)`;
      play(letter, [{ transform: from }, { transform: to }], T.lime + 10 + n * gap, 300, EASE_SWING);
    });
    const fly = q('.intro__fly');
    if (fly) {
      play(fly, [
        { transform: 'translate(80vw, 16vh)', opacity: 1 },
        { transform: 'translate(86vw, 25vh)', opacity: 1, offset: 0.2 },
        { transform: 'translate(97vw, 30vh)', opacity: 1, offset: 0.6 },
        { transform: 'translate(112vw, 34vh)', opacity: 1 },
      ], 1450, 250, 'linear', 'forwards');
    }

    // 4. Sky blue: the word at normal size, letters bouncing into line, dot dropping onto the i.
    cut(q('.scene-word'), T.sky);
    const scatter = [
      'translate(-0.22em, -0.3em) rotate(-6deg)',
      'translate(-0.06em, 0.14em) rotate(3deg)',
      'translate(0.03em, -0.06em)',
      'translate(0.1em, 0.04em) rotate(4deg)',
    ];
    intro.querySelectorAll('.intro__word span').forEach((letter, n) => {
      play(letter, [{ transform: scatter[n % scatter.length] }, { transform: 'none' }], T.sky, 230, EASE_SETTLE);
    });
    const wordDot = q('.intro__dot');
    if (wordDot) {
      const box = wordDot.getBoundingClientRect();
      const heroBox = intro.getBoundingClientRect();
      const dx = heroBox.left + heroBox.width * 0.75 - (box.left + box.width / 2);
      const dy = heroBox.top + heroBox.height * 0.23 - (box.top + box.height / 2);
      play(wordDot, [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.76}px)`, offset: 0.64 },
        { transform: 'none' },
      ], T.sky, 250);
    }

    // 5. Hand off to the live hero: cards and nav pop in on top, the intro fades underneath.
    intro.animate(null, T.reveal).finished.then(reveal);
  }

  function reveal() {
    root.classList.remove('intro-pending');
    intro.style.zIndex = '1';
    const nameCard = document.querySelector('.name-card');
    if (nameCard) {
      nameCard.animate([{ translate: '-50% -150px', opacity: 0 }, { translate: '-50% 0', opacity: 1 }],
        { duration: 400, easing: EASE_POP });
    }
    intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-out', fill: 'forwards' })
      .finished.then(() => intro.remove());
  }

  buildRule();
  initCursor();
  initNav();
  initNameCard();
  initFlower();
  runIntro();
})();
