const { Cam, clamp, fit, open, poly, proj, unproj, spring, stepS, disposer, mk, pointer, register, reducedMotion } = HL;

const W = 158, D = 132, ROWS = 42, SAMPLES = 88;
const REST = [83, 64];
const basin = (x, y) => {
  const u = (x - 86) / 79, v = (y - 63) / 66;
  return 5 + 21 * (0.7 * u * u + v * v);
};

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.84);
  fit(C, [[0, 0, basin(0, 0)], [W, D, basin(W, D)], [W, 0, basin(W, 0)], [0, D, basin(0, D)], [115, 108, -28]], 200, 166);
  const P = proj(C), g = mk('g', {}, svg);
  const sx = spring(REST[0]), sy = spring(REST[1]), indent = spring(0), strength = spring(value);
  let last = '', depth = 0, time = 0, paintedAt = -1;
  let fluctuations = [];
  const zScale = P(0, 0, 0)[1] - P(0, 0, 1)[1];
  // Opaque strips hide far curves without hiding the underside of a deep dip.
  const rows = Array.from({ length: ROWS + 1 }, (_, j) => ({
    y: D * j / ROWS,
    samples: Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const x = W * i / SAMPLES, y = D * j / ROWS;
      return [x, basin(x, y)];
    }),
    face: mk('path', { class: 'fo' }, g),
    line: mk('path', { class: 'nf sil' }, g),
  }));
  const front = mk('path', { class: 'nf sil' }, g), rim = mk('path', { class: 'nf sil' }, g);
  const field = (x, y, base = basin(x, y)) => fluctuations.reduce((z, [cx, cy, h, rx, ry]) =>
    z + h * Math.exp(-0.5 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)), base);
  const height = (x, y, base = basin(x, y)) => {
    const d = ((x - sx.x) ** 2 + (y - sy.x) ** 2) / (15 * 15);
    return field(x, y, base) - depth * Math.exp(-d / 2);
  };
  function draw() {
    const state = [sx.x, sy.x, indent.x, strength.x, time].join(',');
    if (state === last) return;
    last = state;
    // Signed, differently shaped disturbances combine naturally where they cross.
    fluctuations = [
      [44 + 25 * Math.sin(time * 0.26), 48 + 18 * Math.sin(time * 0.21 + 0.2), 26, 11, 20],
      [103 + 24 * Math.sin(time * 0.22 + 1.1), 82 + 22 * Math.cos(time * 0.28 + 0.6), 20, 17, 13],
      [77 + 35 * Math.sin(time * 0.24 + 2.6), 77 + 26 * Math.cos(time * 0.20 + 1.9), -22, 14, 17],
      [61 + 29 * Math.sin(time * 0.18 + 4.4), 91 + 15 * Math.cos(time * 0.31), -12, 12, 11],
    ];
    const roomBelow = (296 - P(sx.x, sy.x, field(sx.x, sy.x))[1]) / zScale;
    depth = indent.x * clamp(strength.x, 0, roomBelow);
    const edge = [];
    let previous = [];
    rows.forEach(row => {
      const y = row.y;
      const points = row.samples.map(([x, base]) => P(x, y, height(x, y, base)));
      row.face.setAttribute('d', previous.length ? poly([...previous, ...points.toReversed()]) : '');
      row.line.setAttribute('d', previous.length ? open(previous) : '');
      edge.push(points.at(-1));
      previous = points;
    });
    front.setAttribute('d', open(previous));
    rim.setAttribute('d', open(edge));
  }
  const loop = register(stage, dt => {
    let moving = false;
    for (const s of [sx, sy, indent, strength]) moving = stepS(s, dt) || moving;
    const ambient = !reducedMotion();
    if (ambient) time += dt;
    if (moving || !ambient || time - paintedAt >= 1 / 30) { draw(); paintedAt = time; }
    return moving || ambient;
  });
  bag.add(loop.unregister);
  function target(x, y, active) {
    sx.t = clamp(x, 24, W - 24); sy.t = clamp(y, 24, D - 24);
    indent.t = active ? 1 : 0;
    read.textContent = active ? 'depression' : 'rest';
    last = ''; loop.wake();
  }
  bag.add(pointer(stage, {
    // Pick on a fixed plane, so the dip cannot chase its own moving geometry.
    move: p => target(...unproj(C, p[0], p[1], 24), true),
    leave: () => target(...REST, false),
  }));
  bag.on(stage, 'keydown', event => {
    const move = { ArrowLeft: [-7, 7], ArrowRight: [7, -7], ArrowUp: [-7, -7], ArrowDown: [7, 7] }[event.key];
    if (event.key === 'Escape') target(...REST, false);
    else if (move) target(sx.t + move[0], sy.t + move[1], true);
    else return;
    event.preventDefault();
  });
  draw();
  bag.add(() => svg.replaceChildren());
  return { set: v => { strength.t = v; loop.wake(); }, destroy: bag.dispose };
}

hairline({
  name: 'landscape',
  means: 'Peaks and dips drift across a loss basin; the pointer pulls a sharper dip below its surface.',
  rules: [1, 3, 5, 6, 7, 8, 10],
  range: [32, 55, 68],
  tour: [[172, 158], [252, 172], [194, 220], null],
  mount,
});
