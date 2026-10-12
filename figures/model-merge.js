const { Cam, clamp, fit, proj, seg, spring, stepS, disposer, mk, place, pointer, register } = HL;

const NODES = [
  [0, 0], [0, 30], [0, 60],
  [40, 0], [40, 30], [40, 60],
  [80, 0], [80, 30], [80, 60],
];
// Two complementary weight patterns on the same architecture.
const CONNECTIONS = [
  [[0, 3], [0, 4], [1, 4], [2, 5], [3, 6], [3, 7], [4, 7], [5, 7], [5, 8]],
  [[0, 5], [1, 3], [1, 5], [2, 3], [2, 4], [3, 8], [4, 6], [4, 8], [5, 6]],
];
const ARCHITECTURE = CONNECTIONS.flat();

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.35, 2.95);
  fit(C, NODES.map(([x, y]) => [x, y, 0]), 200, 166);
  const P = proj(C), points = NODES.map(([x, y]) => P(x, y, 0));
  const g = mk('g', {}, svg), architecture = mk('path', { class: 'nf lo' }, g);
  const edges = mk('path', { class: 'nf sil' }, g);
  const dots = Array.from({ length: 18 }, () => mk('ellipse', { rx: 4.2, ry: 4.2, class: 'sil' }, g));
  const join = spring(0);
  let enlargement = value, last = '';
  function draw() {
    const t = clamp(join.x, 0, 1), state = `${t},${enlargement}`;
    if (state === last) return;
    last = state;
    const scale = 1 + t * (enlargement - 1), spread = 1 - t;
    const poses = [-1, 1].map(side => points.map(([x, y]) => [
      200 + (x - 200) * scale,
      166 + (y - 166) * scale + side * 46 * spread,
    ]));
    architecture.setAttribute('d', poses.map(p => ARCHITECTURE.map(([a, b]) => seg(p[a], p[b])).join('')).join(''));
    edges.setAttribute('d', CONNECTIONS.map((links, i) => links.map(([a, b]) => seg(poses[i][a], poses[i][b])).join('')).join(''));
    dots.forEach((dot, i) => {
      place(dot, poses[Math.floor(i / 9)][i % 9]);
      dot.setAttribute('rx', 4.2 * scale);
      dot.setAttribute('ry', 4.2 * scale);
      // Coincident neurons are drawn once when the two models have become one.
      if (i >= 9 && t > 0.999) dot.setAttribute('display', 'none');
      else dot.removeAttribute('display');
    });
  }
  const loop = register(stage, dt => { const moving = stepS(join, dt); draw(); return moving; });
  bag.add(loop.unregister);
  function target(amount, engaged) {
    join.t = clamp(amount, 0, 1);
    read.textContent = engaged ? (join.t > 0.98 ? 'one model' : 'combining') : 'rest';
    loop.wake();
  }
  bag.add(pointer(stage, {
    move: p => target(1 - Math.abs(p[0] - 200) / 85, true),
    leave: () => target(0, false),
  }));
  bag.on(stage, 'keydown', event => {
    if (event.key === 'ArrowRight') target(join.t + 0.25, true);
    else if (event.key === 'ArrowLeft') target(join.t - 0.25, true);
    else if (event.key === 'Escape') target(0, false);
    else return;
    event.preventDefault();
  });
  draw();
  bag.add(() => svg.replaceChildren());
  return { set: v => { enlargement = v; draw(); }, destroy: bag.dispose };
}

hairline({
  name: 'model-merge',
  means: 'Two flat neural networks form a stack, then collapse into one layer with the connections contributed by both.',
  rules: [1, 3, 5, 6, 7, 8, 10],
  range: [1, 1.06, 1.12],
  tour: [[110, 166], [157, 166], [200, 166], null],
  mount,
});
