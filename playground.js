(() => {
  const { items, mobileOrder } = window.PLAYGROUND;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const remap = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  // 1 - (1 - rate)^frames: a per-60fps-frame lerp rate made refresh-rate independent.
  const lerpFactor = (rate, frames) => 1 - Math.pow(1 - rate, frames);
  const FRAME_MS = 1000 / 60;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The Framer instance uses scrollSpeed 0.6, dragSpeed 0.6, "snappy" 0.1, run
  // through the component's own remapping (speed 0.1–1 → 0.1–2, snappy 0–1 → 0.01–0.2).
  const SETTINGS = {
    scrollSpeed: remap(0.6, 0.1, 1, 0.1, 2), // ≈1.156
    dragSpeed: remap(0.6, 0.1, 1, 0.1, 2), // ≈1.156
    ease: remap(0.1, 0, 1, 0.01, 0.2), // ≈0.029 per frame
    smoothing: 0.04, // velocity + mouse smoothing per frame
    parallax: reduceMotion ? 0 : 0.6, // fraction of card size shifted by mouse position
    drift: reduceMotion ? 0 : 5, // how far cards lag/lead with pan velocity
    cullMargin: 1000,
  };

  function createCard(item, { lazy = false } = {}) {
    const card = document.createElement("article");
    card.className = "card";

    const media = document.createElement("div");
    media.className = "card-media";
    let img;
    if (item.video && !reduceMotion) {
      // Attributes rather than properties, so the canvas's clones (cloneNode) autoplay muted too.
      img = document.createElement("video");
      for (const attr of ["autoplay", "muted", "loop", "playsinline"]) img.setAttribute(attr, "");
      img.setAttribute("aria-hidden", "true");
      img.preload = lazy ? "none" : "auto";
      img.src = item.video;
    } else {
      img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt ?? item.title;
      img.decoding = "async";
      if (lazy) img.loading = "lazy";
    }
    img.width = item.pw;
    img.height = item.ph;
    img.draggable = false;
    media.append(img);

    const title = document.createElement("p");
    title.className = "card-title";
    title.textContent = item.title;
    const desc = document.createElement("p");
    desc.className = "card-desc";
    desc.textContent = item.description;
    const text = document.createElement("div");
    text.append(title, desc);

    card.append(media, text);
    return card;
  }

  class InfiniteCanvas {
    constructor(stage, canvas, settings) {
      this.stage = stage;
      this.canvas = canvas;
      this.settings = settings;
      this.current = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.last = { x: 0, y: 0 };
      this.velocity = { x: 0, y: 0 };
      this.mouse = { tx: 0.5, ty: 0.5, x: 0.5, y: 0.5 };
      this.drag = null;
      this.slots = [];
      this.frame = 0;
      this.prevTime = 0;
      this.dirty = true;
    }

    // Lay the cards out with CSS, measure them, then add three clones of each so
    // the tile exists at (0,0), (W,0), (0,H) and (W,H). Every copy wraps by 2W / 2H,
    // which keeps the canvas seamless in every direction.
    build(items) {
      for (const item of items) {
        const card = createCard(item);
        Object.assign(card.style, {
          left: `${item.x}px`,
          top: `${item.y}px`,
          width: `${item.w}px`,
          zIndex: item.z,
        });
        this.canvas.append(card);
      }

      const box = this.canvas.getBoundingClientRect();
      this.W = box.width;
      this.H = box.height;

      for (const el of [...this.canvas.children]) {
        const r = el.getBoundingClientRect();
        const x = r.left - box.left;
        const y = r.top - box.top;
        const drift = Math.random() * 0.5 + 0.5;
        const nodes = [el];
        for (let i = 0; i < 3; i++) {
          const clone = el.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          this.canvas.append(clone);
          nodes.push(clone);
        }
        [[0, 0], [this.W, 0], [0, this.H], [this.W, this.H]].forEach(([ox, oy], i) => {
          const node = nodes[i];
          node.style.left = "0";
          node.style.top = "0";
          node.style.willChange = "transform";
          this.slots.push({
            node,
            x: x + ox,
            y: y + oy,
            width: r.width,
            height: r.height,
            extraX: 0,
            extraY: 0,
            drift,
            visible: true,
          });
        });
      }

      this.bind();
    }

    measure() {
      this.vw = innerWidth;
      this.vh = innerHeight;
      const box = this.canvas.getBoundingClientRect();
      this.offsetX = box.left;
      this.offsetY = box.top;
      this.dirty = true;
    }

    bind() {
      const { scrollSpeed, dragSpeed } = this.settings;

      addEventListener(
        "wheel",
        (e) => {
          if (!this.frame) return;
          e.preventDefault();
          const unit = e.deltaMode === 1 ? 16 : 1;
          this.target.x -= e.deltaX * unit * scrollSpeed;
          this.target.y -= e.deltaY * unit * scrollSpeed;
        },
        { passive: false },
      );

      this.stage.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        this.drag = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          targetX: this.target.x,
          targetY: this.target.y,
        };
      });

      addEventListener("pointermove", (e) => {
        this.mouse.tx = e.clientX / this.vw;
        this.mouse.ty = e.clientY / this.vh;
        if (this.drag?.id !== e.pointerId) return;
        this.target.x = this.drag.targetX + (e.clientX - this.drag.x) * dragSpeed;
        this.target.y = this.drag.targetY + (e.clientY - this.drag.y) * dragSpeed;
      });

      const endDrag = (e) => {
        if (this.drag?.id === e.pointerId) this.drag = null;
      };
      addEventListener("pointerup", endDrag);
      addEventListener("pointercancel", endDrag);
      addEventListener("resize", () => this.measure());
    }

    start() {
      if (this.frame) return;
      this.prevTime = 0;
      this.measure();
      this.frame = requestAnimationFrame(this.tick);
    }

    stop() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.drag = null;
    }

    tick = (now) => {
      this.frame = requestAnimationFrame(this.tick);
      const frames = (this.prevTime ? clamp(now - this.prevTime, 1, 100) : FRAME_MS) / FRAME_MS;
      this.prevTime = now;

      const { ease, smoothing } = this.settings;
      const k = lerpFactor(ease, frames);
      const ks = lerpFactor(smoothing, frames);
      const { current, target, last, velocity, mouse } = this;

      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      const dx = current.x - last.x;
      const dy = current.y - last.y;
      velocity.x += (dx / frames - velocity.x) * ks;
      velocity.y += (dy / frames - velocity.y) * ks;
      mouse.x += (mouse.tx - mouse.x) * ks;
      mouse.y += (mouse.ty - mouse.y) * ks;

      const settled =
        Math.abs(target.x - current.x) < 0.01 &&
        Math.abs(target.y - current.y) < 0.01 &&
        Math.abs(velocity.x) < 0.001 &&
        Math.abs(velocity.y) < 0.001 &&
        Math.abs(mouse.tx - mouse.x) < 0.0001 &&
        Math.abs(mouse.ty - mouse.y) < 0.0001;

      if (!settled || this.dirty) {
        this.dirty = false;
        this.render(dx > 0, dy > 0);
      }
      last.x = current.x;
      last.y = current.y;
    };

    render(movingRight, movingDown) {
      const { W, H, current, velocity, mouse, vw, vh, offsetX, offsetY } = this;
      const { parallax, drift, cullMargin } = this.settings;
      const tileW = W * 2;
      const tileH = H * 2;
      const mx = (mouse.x - 0.5) * parallax;
      const my = (mouse.y - 0.5) * parallax;

      for (const s of this.slots) {
        const ox = drift * velocity.x * s.drift + mx * s.width;
        const oy = drift * velocity.y * s.drift + my * s.height;
        let x = s.x + current.x + s.extraX + ox;
        let y = s.y + current.y + s.extraY + oy;

        // Wrap only on the side we're moving away from, so nothing pops in view.
        if (movingRight && x > W) (s.extraX -= tileW), (x -= tileW);
        else if (!movingRight && x + s.width < 0) (s.extraX += tileW), (x += tileW);
        if (movingDown && y > H) (s.extraY -= tileH), (y -= tileH);
        else if (!movingDown && y + s.height < 0) (s.extraY += tileH), (y += tileH);

        const vx = x + offsetX;
        const vy = y + offsetY;
        const visible =
          vx >= -s.width - cullMargin &&
          vx <= vw + cullMargin &&
          vy >= -s.height - cullMargin &&
          vy <= vh + cullMargin;

        s.node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        if (visible !== s.visible) {
          s.visible = visible;
          s.node.style.visibility = visible ? "" : "hidden";
        }
      }
    }
  }

  function initCursor(el) {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");

    let x = 0, y = 0, tx = 0, ty = 0, frame = 0, prev = 0;
    const follow = (now) => {
      const frames = (prev ? clamp(now - prev, 1, 100) : FRAME_MS) / FRAME_MS;
      prev = now;
      const k = lerpFactor(0.35, frames);
      x += (tx - x) * k;
      y += (ty - y) * k;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(follow) : 0;
      if (!frame) prev = 0;
    };

    addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        tx = e.clientX;
        ty = e.clientY;
        if (el.style.opacity !== "1") {
          x = tx;
          y = ty;
          el.style.opacity = "1";
        }
        if (!frame) frame = requestAnimationFrame(follow);
      },
      { passive: true },
    );
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) el.style.opacity = "0";
    });
  }

  // Only build the layout the current breakpoint shows, so phones never fetch
  // the canvas images and desktops never fetch the list.
  const stage = document.querySelector(".pg-stage");
  const list = document.getElementById("pg-list");
  const canvas = new InfiniteCanvas(stage, document.getElementById("pg-canvas"), SETTINGS);
  const desktop = matchMedia("(min-width: 810px)");
  let listBuilt = false;

  const sync = () => {
    if (desktop.matches) {
      if (!canvas.slots.length) canvas.build(items);
      canvas.start();
    } else {
      canvas.stop();
      if (!listBuilt) {
        const byId = new Map(items.map((item) => [item.id, item]));
        for (const id of mobileOrder) list.append(createCard(byId.get(id), { lazy: true }));
        listBuilt = true;
      }
    }
  };
  desktop.addEventListener("change", sync);
  sync();

  initCursor(document.querySelector(".pg-cursor"));
})();
