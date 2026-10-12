const { Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rings, seg, unproj, spring, stepS, reducedMotion, disposer, mk, pointer, put, register, solid } = HL;

const L = 192, D = 54, TOP = 6, R = 27, GLASS = 25.5, Z = 27, N = 4;
const REST = [106, 27];
const taper = u => { const t = clamp(Math.min(u, 1 - u) / 0.1, 0, 1); return t * t * (3 - 2 * t); };

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.896);
  const [bx, by] = unproj(C, ...proj(C)(0, 0, TOP), Z + 1.5);
  fit(C, [[0, 0, 0], [L, D, 0], [L, 0, 0], [0, D, 0], [185, 90, Z], [50, 85, Z]], 200, 171);
  const P = proj(C), front = facing(C), g = mk('g', {}, svg);
  const [bo, bi] = rings(0, 0, L, D, 8, 1.6);
  put(solid(g), prism(P, front, bo, bi, 0, TOP));
  for (const x of [9, L - 9]) {
    mk('path', { d: poly(circ(2.8, 24).map(q => P(x + q.u, D + 0.1, 3 + q.v))), class: 'nf sil' }, g);
  }
  const slats = mk('path', { class: 'nf lo' }, g);
  const cards = Array.from({ length: N }, () => ({ el: solid(g), marks: mk('path', { class: 'nf' }, g) }));
  const handle = solid(g), rim = solid(g);
  const seen = mk('path', { class: 'nf sil' }, g), glint = mk('path', { class: 'nf lo' }, g);
  const ring = circ(R, 64), lens = circ(GLASS, 64), shine = circ(GLASS * 0.76, 64).slice(27, 37);
  const sx = spring(REST[0]), sy = spring(REST[1]), mag = spring(value), rate = spring(1);
  let phase = 0.13, held = false, focused = false, pointed = false, dirty = true, last = '', positions = [];
  rim.sil.classList.add('hi');

  function draw() {
    const state = [phase, sx.x, sy.x, mag.x].join(',');
    if (!dirty && state === last) return;
    dirty = false; last = state;
    const lines = [], off = (phase * L) % 16;
    let slots = '';
    for (let x = off; x < L - 4; x += 16) if (x > 4) slots += seg(P(x, 3, TOP), P(x, D - 3, TOP));
    slats.setAttribute('d', slots);
    positions = [];
    for (let j = 0; j < N; j++) {
      const u = (phase + j / N) % 1, scale = taper(u), cx = u * L;
      const w = 33 * scale, h = 35 * scale, z = TOP + 1.4;
      const [outer, inner] = rings(cx - w / 2, (D - h) / 2, cx + w / 2, (D + h) / 2, 2.6 * scale, 0.7 * scale);
      put(cards[j].el, prism(P, front, outer, inner, TOP + 0.25, z));
      const ink = [];
      for (let row = 0; row < 3; row++) {
        const y = D / 2 + (row - 1) * 8 * scale;
        const x = cx - 11 * scale, length = (row === 2 ? 14 : 22) * scale;
        const split = (7 + (j + row) % 3) * scale;
        ink.push([[x, y], [x + split, y]], [[x + split + 2.5 * scale, y], [x + length, y]]);
      }
      cards[j].marks.setAttribute('d', ink.map(([a, b]) => seg(P(...a, z), P(...b, z))).join(''));
      lines.push(...ink);
      outer.forEach((a, k) => { const b = outer[(k + 1) % outer.length]; lines.push([[a.u, a.v], [b.u, b.v]]); });
      positions.push({ x: cx, j });
    }
    const cx = sx.x, cy = sy.x, dx = cx + bx, dy = cy + by;
    const at = (q, z) => P(dx + q.u, dy + q.v, z);
    const [ho, hi] = rings(dx - 3.3, dy + R - 3, dx + 3.3, dy + R + 28, 3.2, 0.8);
    put(handle, prism(P, front, ho, hi, Z - 1, Z + 1));
    put(rim, { sil: poly(hull(ring.map(q => at(q, Z)).concat(ring.map(q => at(q, Z + 1.5))))), crease: poly(lens.map(q => at(q, Z + 1.5))) });
    glint.setAttribute('d', open(shine.map(q => at(q, Z + 1.5))));
    const cut = (p, q) => {
      const a = (p[0] - cx) * mag.x, b = (p[1] - cy) * mag.x;
      const ex = (q[0] - p[0]) * mag.x, ey = (q[1] - p[1]) * mag.x;
      const A = ex * ex + ey * ey, B = a * ex + b * ey;
      const disc = B * B - A * (a * a + b * b - (GLASS - 1) ** 2);
      if (A < 0.0001 || disc <= 0) return '';
      const t0 = Math.max(0, (-B - Math.sqrt(disc)) / A), t1 = Math.min(1, (-B + Math.sqrt(disc)) / A);
      return t1 > t0 ? seg(P(dx + a + ex * t0, dy + b + ey * t0, Z + 1.5), P(dx + a + ex * t1, dy + b + ey * t1, Z + 1.5)) : '';
    };
    seen.setAttribute('d', lines.map(([a, b]) => cut(a, b)).join(''));
    const nearest = positions.reduce((a, b) => Math.abs(a.x - cx) < Math.abs(b.x - cx) ? a : b);
    read.textContent = held ? `prompt ${nearest.j + 1}` : 'rest';
  }
  const loop = register(stage, dt => {
    rate.t = held || reducedMotion() ? 0 : 1;
    let moving = false;
    for (const sp of [sx, sy, mag, rate]) moving = stepS(sp, dt) || moving;
    if (!reducedMotion() && rate.x > 0) phase = (phase + dt * rate.x / 15) % 1;
    draw();
    return moving || (!reducedMotion() && rate.x > 0);
  });
  bag.add(loop.unregister);
  function hold(x, y) { held = true; sx.t = clamp(x, 45, 147); sy.t = clamp(y, 18, 36); dirty = true; loop.wake(); }
  bag.add(pointer(stage, {
    move: p => { pointed = true; hold(...unproj(C, p[0], p[1], TOP)); },
    leave: () => { pointed = false; held = focused; if (!held) { sx.t = REST[0]; sy.t = REST[1]; } dirty = true; loop.wake(); },
  }));
  bag.on(stage, 'focus', () => { focused = true; hold(...REST); });
  bag.on(stage, 'blur', () => { focused = false; held = pointed; dirty = true; loop.wake(); });
  bag.on(stage, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); hold(sx.t + (event.key === 'ArrowRight' ? 12 : -12), sy.t);
  });
  draw();
  bag.add(() => svg.replaceChildren());
  return { set: v => { mag.t = v; loop.wake(); }, destroy: bag.dispose };
}

hairline({
  name: 'prompt-loupe',
  means: 'Prompt cards travel beneath a loupe; hovering pauses the belt and moves the lens for inspection.',
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [1.3, 1.85, 2.4],
  tour: [[172, 151], [225, 177], [195, 162], null],
  mount,
});
