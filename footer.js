(() => {
  const root = document.documentElement;
  const footer = document.querySelector('.footer');
  const garden = document.querySelector('.garden');
  if (!footer || !garden) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = matchMedia('(max-width: 809.98px)');
  const R = String.raw;
  const BT = '`';

  const LAND_MS = 250; // water hits the soil before the first growth step
  const STEP_MS = 320; // the original's growth variants change every 210-420ms

  // Growth stages, read off the original's Framer variants (seed -> bloom).
  // Each line is "<colour>|<text>": h = head, s = stem, l = leaf that fades from head to stem.
  // Lines sit bottom-aligned in a cols x rows box, so the ground stays put as the plant grows.
  const PLANTS = {
    rose: {
      label: 'rose', head: 'var(--pink)', stem: 'var(--lime)', cols: 8, rows: 5,
      stages: [
        R`h|    ..`,
        R`h|    .
s|   ^^^`,
        R`h|    @
s|   \|/
s|   ^^^`,
        R`h|    @
s|    Y -
s|   \|/
s|   ^^^`,
        R`h|   (@)
s|-. \Y/
s|  \ | ,-
s|   \|/
s|   ^^^`,
      ],
    },
    wildflower: {
      label: 'wildflower', head: 'var(--magenta)', stem: 'var(--moss)', cols: 8, rows: 4,
      stages: [
        R`h|    .
s|   \|`,
        R`h|    .
s|  \(| ,-
s|   \|/`,
        R`h|   (w)
s|-. ${BT}|'
s|  \(| ,-
s|   \|/`,
      ],
    },
    poppy: {
      label: 'poppy', head: 'var(--orange)', stem: 'var(--lime)', cols: 8, rows: 4,
      stages: [
        R`h|    .
s|    |`,
        R`h|   (o)
s|   \|/`,
        R`h|   (o)
s|-.  | ,
s|   \|/`,
        R`h|   (o)
s|-. ${BT}|'
s|  \(| ,-
s|   \|/`,
      ],
    },
    tulip: {
      label: 'tulip', head: 'var(--pink)', stem: 'var(--moss)', cols: 5, rows: 6,
      stages: [
        R`h|  .
s| \|
s| ^^^`,
        R`h| vVv
h| (_)
s| \|
s|^^^^^`,
        R`h|vVVVv
h|(___)
s| \|/
s|^^^^^`,
        R`h|vVVVv
h|(___)
h| ~Y~
s|\\|//
s|^^^^^`,
        R`h|vVVVv
h|(___)
l| ~Y~
s| \|
s|\\|//
s|^^^^^`,
      ],
    },
    tallTulip: {
      label: 'tulip', head: 'var(--orange)', stem: 'var(--lime)', cols: 5, rows: 7,
      stages: [
        R`h| vVv
s| \|/
s| ^^^`,
        R`h| vVv
h| (_)
s| \|/
s| ^^^`,
        R`h|vVVVv
h|(___)
s| \|/
s|^^^^^`,
        R`h|vVVVv
h|(___)
h| ~Y~
s|\\|//
s|^^^^^`,
        R`h|vVVVv
h|(___)
h| ~Y~
s| \|
s|\\|//
s|^^^^^`,
        R`h|vVVVv
h|(___)
l| ~Y~
s|  |/
s| \|
s|\\|//
s|^^^^^`,
      ],
    },
    bell: {
      label: 'bluebell', head: 'var(--sky)', stem: 'var(--lime)', cols: 5, rows: 5,
      stages: [
        R`h|  v
s|  Y
s|^^^^^`,
        R`h| vvv
s|  Y
s|^^^^^`,
        R`h| vvv
s|  Y
s| \|/
s|^^^^^`,
        R`h| vvv
h| ...
s|  Y
s| \|/
s|^^^^^`,
        R`h|vVVVv
h|(___)
s|\~Y~/
s|\\|//
s|^^^^^`,
      ],
      // Once open, it nods every couple of seconds.
      bloomSway: [
        [R`h|vVVVv
h|(___)
s|\~Y~/
s|\\|//
s|^^^^^`, 2000],
        [R`h|vVVVv
h|(___)
s|\~Y~ /
s|\\|//
s|^^^^^`, 420],
      ],
    },
    lilac: {
      label: 'lilac', head: 'var(--pink)', stem: 'var(--moss)', cols: 5, rows: 7,
      stages: [
        R`h|  ,
s|  |
s| ^^^`,
        R`h| ,,,
s| \|/
s|^^^^^`,
        R`h| ,,,
s| ~Y~
s| \|/
s|^^^^^`,
        R`h| ,,,
h|{{}}}
s| ~Y~
s| \|/
s|^^^^^`,
        R`h| ,,,
h|{{}}}
s| ~Y~
s| \|/
s| \|/
s|^^^^^`,
        R`h| ,,,
h|{{}}}
s| ~Y~
s| \|/
s| \|/
s| \|/
s|^^^^^`,
      ],
    },
    // Decoration only: these loop in the breeze and can't be watered.
    daisy: {
      head: 'var(--butter)', stem: 'var(--moss)', cols: 4, rows: 2,
      sway: [
        [R`h| (*)
s|>/`, 1200],
        ['h|(*)\ns|>\\', 420],
      ],
    },
    grass: {
      stem: 'var(--moss)', cols: 4, rows: 1,
      sway: [[R`s|\ |/`, 600], [R`s|\ | /`, 400], [R`s|\ |/`, 800], [R`s|\  |/`, 400]],
    },
  };

  const parse = (frame) => frame.split('\n').map((line) => [line[0], line.slice(2)]);
  for (const def of Object.values(PLANTS)) {
    if (def.stages) def.stages = def.stages.map(parse);
    for (const key of ['sway', 'bloomSway']) {
      if (def[key]) def[key] = def[key].map(([frame, ms]) => [parse(frame), ms]);
    }
  }

  // [plant, left %, top %, starting stage (or sway phase)].
  // Wide: measured on the original's 918x373 garden.
  const WIDE = [
    ['rose', 23.74, 4.82, 0], ['grass', -0.22, 66.16, 0], ['wildflower', 4.25, 36.96, 0],
    ['poppy', 23.74, 38.3, 0], ['rose', 31.37, 48.21, 0], ['tulip', 45.31, 43.93, 0],
    ['tallTulip', 84.19, 40.71, 0], ['bell', 72.43, 20.89, 0], ['lilac', 31.47, 17.68, 0],
    ['bell', 16.23, 27.32, 0], ['daisy', -0.22, 24.64, 0], ['daisy', 54.02, 69.1, 1],
    ['poppy', 7.95, 58.93, 1], ['poppy', 78.74, 78.21, 1], ['lilac', 92.03, 74.19, 1],
    ['lilac', 5.01, 74.19, 2], ['lilac', 62.62, 34.82, 2], ['grass', 27.23, 83.84, 0],
    ['bell', 39.53, 73.12, 1], ['wildflower', 66.22, 75, 1], ['daisy', 87.56, 75.53, 0],
    ['rose', 36.7, -1.34, 1], ['rose', 53.04, 81.16, 2], ['wildflower', 17.75, 84.64, 1],
    ['grass', 74.06, 60, 0], ['daisy', 92.47, 20.36, 0], ['tulip', 96.39, 53.57, 1],
    ['tulip', 19.6, 53.57, 1], ['tallTulip', 52.28, 27.86, 1], ['rose', 83.64, 23.57, 0],
    ['grass', 74.06, 95.09, 0], ['grass', 45.31, 28.39, 0], ['grass', 96.28, 44.19, 0],
    ['grass', 44, 96.42, 0],
  ];

  // Narrow: the original's portrait garden, minus the empty band it tucks under the links.
  const NARROW = [
    ['grass', -2.73, 58.8, 0], ['wildflower', -0.85, 25.41, 0], ['poppy', 18.65, 26.83, 0],
    ['rose', 26.28, 40.49, 0], ['tulip', 42.19, 36.05, 0], ['tallTulip', 81.1, 33.03, 0],
    ['bell', 69.23, 6.26, 0], ['lilac', 28.39, 4.18, 0], ['bell', 15.58, 18.19, 0],
    ['daisy', 2.97, 12.88, 0], ['daisy', 51.46, 63.41, 1], ['poppy', 7.36, 68.75, 1],
    ['poppy', 73.66, 76.88, 1], ['lilac', 88.92, 74.89, 1], ['lilac', 1.89, 74.89, 2],
    ['lilac', 59.48, 25.68, 2], ['grass', 24.69, 80.86, 0], ['bell', 36.39, 71.6, 1],
    ['wildflower', 61.15, 72.93, 1], ['daisy', 85.04, 71.61, 0], ['rose', 47.99, 81.49, 2],
    ['wildflower', 12.67, 84.8, 1], ['grass', 71.51, 50.88, 0], ['tulip', 93.24, 47.93, 1],
    ['tulip', 15.58, 42.99, 1], ['tallTulip', 49.18, 16.91, 1], ['rose', 78.63, 9.66, 0],
    ['grass', 71.51, 94.71, 0], ['grass', 93.77, 31.36, 0], ['grass', 41.43, 96.7, 0],
  ];

  function draw(el, def, frame) {
    el.replaceChildren(...frame.map(([kind, text]) => {
      const line = document.createElement('span');
      line.className = 'garden__line';
      line.textContent = text;
      line.style.color = kind === 's' ? def.stem : def.head;
      if (kind === 'l') {
        line.classList.add('garden__line--leaf');
        requestAnimationFrame(() => requestAnimationFrame(() => { line.style.color = def.stem; }));
      }
      return line;
    }));
  }

  // Idle loops (grass, daisies, an open bluebell), paused while the garden is off screen.
  let plants = [];
  let onScreen = false;

  function startSway(plant) {
    clearTimeout(plant.swayTimer);
    if (reduceMotion || !plant.sway) return;
    const step = () => {
      plant.phase = (plant.phase + 1) % plant.sway.length;
      draw(plant.el, plant.def, plant.sway[plant.phase][0]);
      plant.swayTimer = setTimeout(step, plant.sway[plant.phase][1]);
    };
    // Random first wait so neighbouring tufts don't sway in lockstep.
    plant.swayTimer = setTimeout(step, plant.sway[plant.phase][1] * Math.random());
  }

  // One watering plays every remaining stage, starting once the water has landed.
  function grow(plant) {
    const { def } = plant;
    const last = def.stages.length - 1;
    if (plant.growing || plant.stage === last) return;
    plant.growing = true;
    const step = () => {
      plant.stage += 1;
      draw(plant.el, def, def.stages[plant.stage]);
      if (plant.stage < last) {
        plant.growTimer = setTimeout(step, STEP_MS);
        return;
      }
      plant.growing = false;
      plant.el.setAttribute('aria-label', `${def.label} in bloom`);
      if (def.bloomSway) {
        plant.sway = def.bloomSway;
        plant.phase = 0;
        if (onScreen) startSway(plant);
      }
    };
    plant.growTimer = setTimeout(step, LAND_MS);
  }

  function plantGarden() {
    for (const plant of plants) {
      clearTimeout(plant.swayTimer);
      clearTimeout(plant.growTimer);
    }
    plants = (narrow.matches ? NARROW : WIDE).map(([kind, x, y, start]) => {
      const def = PLANTS[kind];
      const el = document.createElement(def.stages ? 'button' : 'span');
      el.className = 'garden__plant';
      el.style.cssText = `left: ${x}%; top: ${y}%; --cols: ${def.cols}; --rows: ${def.rows}`;
      const plant = { el, def, stage: start, phase: start, sway: def.sway };
      if (def.stages) {
        el.type = 'button';
        el.setAttribute('aria-label', `Water the ${def.label}`);
        el.addEventListener('click', () => grow(plant));
        draw(el, def, def.stages[start]);
      } else {
        el.setAttribute('aria-hidden', 'true');
        draw(el, def, def.sway[start][0]);
      }
      return plant;
    });
    garden.replaceChildren(...plants.map((plant) => plant.el));
    if (onScreen) plants.forEach(startSway);
  }

  function initGarden() {
    plantGarden();
    narrow.addEventListener('change', plantGarden);
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      for (const plant of plants) {
        if (onScreen) startSway(plant);
        else clearTimeout(plant.swayTimer);
      }
    }).observe(garden);
  }

  // Four frames of water, 210ms apart, with the can wobbling as it pours (from the original's cursor variants).
  const DROPS = [
    [R` :'`, '', ''],
    [R` :'`, '-!:`', ''],
    [R` :'`, '-!:`', R`:~'!'`],
    ['', '', ' . ..'],
  ];
  const TILT = [-24, -19, -24, -20];
  const POUR_MS = 210;

  // Hand-drawn stand-in for the original's pixel watering can: spout on the left, so a negative rotation pours.
  const CAN_SVG = `
    <svg class="can-cursor__can" viewBox="0 0 31 24" preserveAspectRatio="none">
      <g fill="none" stroke-linecap="round">
        <path d="M14.5 8.2C15 3.8 21 3.8 21.5 8.2M23.6 11.2C28.6 11 28.6 18.6 23 18.2" stroke="#000" stroke-width="2.6"/>
        <path d="M14.5 8.2C15 3.8 21 3.8 21.5 8.2M23.6 11.2C28.6 11 28.6 18.6 23 18.2" stroke="#FAF9F7" stroke-width="1.2"/>
      </g>
      <g fill="#fff" stroke="#000" stroke-width="0.75" stroke-linejoin="round">
        <path d="M12.8 17.2 4.6 10.2 5.9 8.8 12.6 13.6Z"/>
        <ellipse cx="4.4" cy="9" rx="1.5" ry="2.4" transform="rotate(42 4.4 9)"/>
        <path d="M12 9.6H24L23 21.2H13Z"/>
        <rect x="11.4" y="8" width="13.2" height="1.8" rx="0.9"/>
        <path d="M12.6 15H23.4" fill="none"/>
      </g>
    </svg>`;

  function initCan() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const cursor = document.createElement('div');
    cursor.className = 'can-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `<div class="can-cursor__body">${CAN_SVG}<div class="can-cursor__drops"><span></span><span></span><span></span></div></div>`;
    document.body.append(cursor);
    footer.classList.add('has-can');
    const can = cursor.querySelector('.can-cursor__can');
    const drops = cursor.querySelectorAll('.can-cursor__drops span');

    footer.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      root.classList.add('cursor-can');
    }, { passive: true });
    footer.addEventListener('pointerleave', () => root.classList.remove('cursor-can'));

    let timers = [];
    garden.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      timers.forEach(clearTimeout);
      timers = DROPS.map((frame, i) => setTimeout(() => {
        frame.forEach((text, n) => { drops[n].textContent = text; });
        can.style.rotate = `${TILT[i]}deg`;
      }, i * POUR_MS));
      timers.push(setTimeout(() => {
        drops.forEach((line) => { line.textContent = ''; });
        can.style.rotate = '0deg';
      }, (DROPS.length + 1) * POUR_MS));
    });
  }

  initGarden();
  initCan();
})();
