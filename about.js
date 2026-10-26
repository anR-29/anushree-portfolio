(() => {
  const root = document.documentElement;

  // 18px orange dot that replaces the pointer on mouse/trackpad devices (same as hero.js).
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
})();
