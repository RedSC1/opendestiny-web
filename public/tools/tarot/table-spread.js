// Only physical layout lives here. DOM order still maps to remaining deck positions.
export class TableSpread {
  constructor(viewport, surface, { onDraw, onBrowse }) {
    Object.assign(this, { viewport, surface, onDraw, onBrowse });
    this.buttons = []; this.open = false; this.enabled = false;
    this.suppressUntil = 0;
    viewport.addEventListener('pointerover', e => {
      const button = e.target.closest('.deck-card');
      if (button && !this.drag?.moved) this.preview(button);
    });
    viewport.addEventListener('pointerleave', () => this.preview(null));
    viewport.addEventListener('focusin', e => this.preview(e.target.closest('.deck-card')));
    viewport.addEventListener('focusout', () => this.preview(null));
    new ResizeObserver(() => this.layout()).observe(viewport);
    viewport.addEventListener('pointerdown', e => {
      if (!this.enabled || e.button !== 0) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, scroll: viewport.scrollLeft, moved: false };
    });
    viewport.addEventListener('pointermove', e => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
        d.moved = true; this.preview(null); viewport.setPointerCapture(e.pointerId); viewport.classList.add('dragging');
      }
      if (d.moved) { e.preventDefault(); viewport.scrollLeft = d.scroll - dx; }
    });
    const end = e => {
      if (!this.drag || this.drag.id !== e.pointerId) return;
      if (this.drag.moved) this.suppressUntil = performance.now() + 250;
      this.drag = null; viewport.classList.remove('dragging');
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('scroll', onBrowse, { passive: true });
    viewport.addEventListener('wheel', e => {
      if (!this.enabled || e.ctrlKey || viewport.scrollWidth <= viewport.clientWidth + 1) return;
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? 300 : 1);
      if (delta < 0 ? viewport.scrollLeft > 0 : viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1) {
        e.preventDefault(); viewport.scrollLeft += delta;
      }
    }, { passive: false });
  }
  reset(buttons) {
    this.positions = new Map(buttons.map((button, index) => [button, index]));
    this.positionCount = buttons.length;
    this.buttons = buttons; this.hovered = null; this.open = false; this.drag = null;
    this.viewport.scrollLeft = 0; this.layout();
  }
  async expand() {
    this.open = true; this.layout();
    // Flush once, then await browser-owned animations, not a guessed timer.
    await new Promise(requestAnimationFrame);
    await Promise.all(this.buttons.flatMap(button => button.getAnimations()).map(animation => animation.finished.catch(() => {})));
  }
  setEnabled(enabled) { this.enabled = enabled; if (!enabled) this.preview(null); this.layout(); }
  activate(button) {
    if (!this.enabled || performance.now() < this.suppressUntil) return;
    this.enabled = false; this.onDraw(button);
  }
  preview(button) {
    const active = this.enabled && this.open ? this.buttons.indexOf(button) : -1;
    this.surface.classList.toggle('previewing', active >= 0);
    this.buttons.forEach((card, index) => {
      const distance = index - active;
      const push = active < 0 || distance === 0 ? 0 : Math.sign(distance) * 10 * Math.max(0, 1 - (Math.abs(distance) - 1) / 5);
      card.classList.toggle('preview', active === index);
      card.style.setProperty('--nudge', `${push}px`);
    });
  }
  remove(button) { this.buttons = this.buttons.filter(b => b !== button); button.remove(); this.layout(); }
  layout() {
    this.surface.classList.toggle('stacked', !this.open);
    const count = this.positionCount || 0;
    const width = Math.min(112, Math.max(60, (this.viewport.clientHeight - 36) * 7 / 12));
    this.surface.style.setProperty('--deck-width', `${width}px`);
    const available = this.viewport.clientWidth;
    const step = Math.min(34, Math.max(14, (available - width - 64) / Math.max(1, count - 1)));
    const extent = width + Math.max(0, count - 1) * step;
    const canvas = this.open ? Math.max(available, extent + 64) : available;
    this.surface.style.width = `${canvas}px`;
    this.buttons.forEach((button, remainingIndex) => {
      const i = this.positions.get(button);
      const t = count > 1 ? 2 * i / (count - 1) - 1 : 0;
      // A low hand-spread: at most 24px of curvature and 6° of rotation.
      button.style.setProperty('--deck-x', `${this.open ? (canvas - extent) / 2 + i * step : (canvas - width) / 2}px`);
      button.style.setProperty('--deck-y', `${this.open ? 12 + 12 * t * t + 1.5 * Math.sin(i * .7) : 14}px`);
      button.style.setProperty('--angle', `${this.open ? t * 6 : 0}deg`);
      button.style.zIndex = i + 1;
      button.disabled = this.open && !this.enabled;
      button.tabIndex = this.open || remainingIndex === this.buttons.length - 1 ? 0 : -1;
      button.setAttribute('aria-hidden', String(!this.open && remainingIndex !== this.buttons.length - 1));
      button.setAttribute('aria-label', this.open ? `抽取牌背 ${remainingIndex + 1}` : '摊开牌堆');
    });
    this.onBrowse();
  }
}
