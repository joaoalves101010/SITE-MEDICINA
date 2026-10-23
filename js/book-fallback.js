import { bookPose } from './book-renderer.js';

const LAST_SPREAD = 6;
const clampProgress = value => Math.max(0, Math.min(LAST_SPREAD, Number.isFinite(Number(value)) ? Number(value) : 0));

/** A real front/back hinged CSS book, sharing the WebGL pose and original page art. */
export function initBookFallback(root, options = {}) {
  const doc = options.env?.document || root?.ownerDocument || globalThis.document;
  const win = options.env?.window || doc?.defaultView || globalThis.window;
  const raf = options.env?.requestAnimationFrame || win?.requestAnimationFrame?.bind(win) || (fn => setTimeout(fn, 16));
  const caf = options.env?.cancelAnimationFrame || win?.cancelAnimationFrame?.bind(win) || clearTimeout;
  let disposed = false, visible = options.visible !== false, frame = null, busy = false, dirty = false;
  let progress = clampProgress(options.getProgress?.() ?? 0), revision = 0, paintedIndex = -1, paintedKey = '', ready = false, explicitProgress = false;
  const cache = new Map();
  let world, turn, left, right, front, back, contexts;
  let resolveReady;
  const readyPromise = new Promise(resolve => { resolveReady = resolve; });
  const host = root?.closest?.('[data-book-visual]') || root;
  const allowed = () => !disposed && visible && !doc?.hidden;
  const settle = value => { if (resolveReady) { resolveReady(value); resolveReady = null; } };
  const release = canvas => { try { canvas.width = 1; canvas.height = 1; } catch {} };
  const fail = error => {
    if (disposed) return;
    controller.mode = 'unavailable'; dirty = false;
    if (frame !== null) { caf(frame); frame = null; }
    if (root?.dataset) delete root.dataset.bookCssReady;
    cache.clear(); // Spread canvases are borrowed from the shared artwork cache.
    for (const canvas of [left, right, front, back]) if (canvas) release(canvas);
    world?.remove?.();
    if (host?.dataset) host.dataset.bookRender = 'unavailable';
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
    settle(false);
  };
  function sample() {
    const value = explicitProgress ? undefined : options.getProgress?.();
    if (value !== undefined) progress = clampProgress(value);
    return bookPose(progress);
  }
  function indexOf(pose) { return Math.min(LAST_SPREAD, Math.floor(pose.progress)); }
  function needed(pose) {
    const index = indexOf(pose);
    return index === LAST_SPREAD || pose.progress === index ? [index] : [index, index + 1];
  }
  function trim(keep = []) {
    while (cache.size > 3) {
      const key = [...cache.keys()].find(index => !keep.includes(index));
      if (key === undefined) break;
      cache.delete(key); // Never mutate a canvas that may still back a GPU texture.
    }
  }
  function touch(index) {
    const canvas = cache.get(index);
    if (canvas) { cache.delete(index); cache.set(index, canvas); }
    return canvas;
  }
  async function ensure(index, version) {
    if (cache.has(index)) return touch(index);
    if (!allowed() || typeof options.loadSpread !== 'function') return null;
    const canvas = await options.loadSpread(index);
    if (!canvas || !Number.isFinite(canvas.width) || !Number.isFinite(canvas.height)) throw new Error('Book artwork unavailable');
    if (!allowed() || (version !== revision && !needed(sample()).includes(index))) return null;
    cache.set(index, canvas); trim(needed(sample()));
    return canvas;
  }
  function drawHalf(context, canvas, side) {
    context.clearRect(0, 0, 1050, 1200);
    context.drawImage(canvas, side === 'right' ? canvas.width / 2 : 0, 0, canvas.width / 2, canvas.height, 0, 0, 1050, 1200);
  }
  function applyPose(pose) {
    const index = indexOf(pose);
    const angle = pose.leaves[index].angle;
    const offset = pose.centerX;
    world.style.transform = `translateX(${offset / 2.1 * 100}%)`;
    turn.style.transform = `translateZ(3px) rotateY(${angle * 180 / Math.PI}deg)`;
    world.style.setProperty('--book-turn-shadow', String(.06 + .28 * Math.sin(Math.abs(angle))));
    left.style.visibility = index > 0 ? 'visible' : 'hidden';
    turn.style.visibility = index === LAST_SPREAD ? 'hidden' : 'visible';
    world.dataset.spread = String(index);
    world.dataset.progress = String(pose.progress);
  }
  function paint(pose) {
    const index = indexOf(pose);
    const turning = index < LAST_SPREAD && pose.progress > index;
    const key = `${index}:${turning ? 1 : 0}`;
    if (paintedKey !== key) {
      const current = cache.get(index), next = turning ? cache.get(index + 1) : null;
      if (!current || (turning && !next)) return false;
      if (index > 0) drawHalf(contexts.left, current, 'left');
      drawHalf(contexts.right, turning ? next : current, 'right');
      if (index !== LAST_SPREAD) {
        drawHalf(contexts.front, current, 'right');
        if (turning) drawHalf(contexts.back, next, 'left');
        else contexts.back.clearRect(0, 0, 1050, 1200);
      }
      paintedIndex = index; paintedKey = key;
    }
    applyPose(pose);
    if (!ready) {
      ready = true; controller.mode = 'css';
      if (host?.dataset) host.dataset.bookRender = 'fallback-ready';
      root.dataset.bookCssReady = 'true';
      options.onReady?.(controller); settle(true);
    }
    return true;
  }
  async function pump() {
    frame = null;
    if (!allowed() || busy) return;
    busy = true;
    try {
      while (allowed() && dirty) {
        dirty = false;
        const version = revision, pose = sample();
        for (const index of needed(pose)) {
          await ensure(index, version);
          if (!allowed() || revision !== version) break;
        }
        if (!allowed()) break;
        if (revision !== version) { dirty = true; continue; }
        if (!paint(sample())) dirty = true;
      }
    } catch (error) { fail(error); }
    finally { busy = false; if (dirty && allowed()) schedule(); }
  }
  function schedule() {
    dirty = true;
    if (!allowed() || busy || frame !== null || controller.mode === 'unavailable') return;
    frame = raf(pump);
  }
  function resize() {
    if (disposed || !world) return;
    const rect = root.getBoundingClientRect?.() || {};
    const width = Number(root.clientWidth || rect.width) || 1000;
    const height = Number(root.clientHeight || rect.height) || width / 1.75;
    const fitted = Math.max(1, Math.min(width * .94, height * 1.75 * .94));
    world.style.width = `${fitted}px`; world.style.height = `${fitted / 1.75}px`;
    world.style.setProperty('--book-radius', `${fitted / 21}px`);
    root.style.perspective = `${Math.max(600, fitted * 2.6)}px`;
    schedule();
  }
  function onVisibility() {
    if (!allowed() && frame !== null) { caf(frame); frame = null; }
    if (allowed()) schedule();
  }
  const controller = {
    mode: 'pending', ready: readyPromise,
    setProgress(value) { if (disposed) return; progress = clampProgress(value); explicitProgress = true; revision++; schedule(); },
    setVisible(value) { if (disposed) return; visible = !!value; if (!visible && frame !== null) { caf(frame); frame = null; } if (visible) schedule(); },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true; revision++;
      if (frame !== null) { caf(frame); frame = null; }
      doc?.removeEventListener?.('visibilitychange', onVisibility);
      cache.clear(); // Spread canvases are borrowed from the shared artwork cache.
      for (const canvas of [left, right, front, back]) if (canvas) release(canvas);
      world?.remove?.();
      if (root?.dataset) delete root.dataset.bookCssReady;
      settle(false);
    },
    get debug() { return { cachedSpreads: [...cache.keys()], progress, paintedIndex, busy, disposed, visible }; },
  };
  if (!root || !doc?.createElement || typeof options.loadSpread !== 'function') {
    fail(new Error('CSS book environment unavailable')); return controller;
  }
  try {
    world = doc.createElement('div'); world.className = 'book-css__world'; world.setAttribute('aria-hidden', 'true');
    turn = doc.createElement('div'); turn.className = 'book-css__turn';
    function face(name) {
      const canvas = doc.createElement('canvas'); canvas.width = 1050; canvas.height = 1200;
      canvas.className = `book-css__face book-css__${name}`; canvas.setAttribute('aria-hidden', 'true');
      return canvas;
    }
    left = face('left'); right = face('right'); front = face('front'); back = face('back');
    contexts = { left:left.getContext('2d'), right:right.getContext('2d'), front:front.getContext('2d'), back:back.getContext('2d') };
    if (Object.values(contexts).some(context => !context)) throw new Error('Canvas 2D unavailable');
    world.append(left, right, turn); turn.append(front, back); root.append(world);
    root.classList?.add('book-css');
    doc.addEventListener?.('visibilitychange', onVisibility);
    resize();
  } catch (error) { world?.remove?.(); fail(error); }
  return controller;
}
