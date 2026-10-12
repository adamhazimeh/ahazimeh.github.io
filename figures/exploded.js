const { Cam, clamp, extremes, facing, fit, poly, prism, proj, ringAt, rings, rrect, seg, spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid } = HL;

const LAY = [
  { name: "surface", r: [0, 0, 132, 96], rad: 7, segs: [[[1.5, 12], [130.5, 12]]], dots: [[7, 6], [13, 6], [19, 6]] },
  { name: "sidebar", r: [5, 17, 38, 91], rad: 4, segs: [[[10, 25], [28, 25]], [[10, 33], [32, 33]], [[10, 41], [24, 41]], [[10, 49], [30, 49]], [[10, 83], [22, 83]]] },
  { name: "card", r: [48, 22, 120, 62], rad: 5, segs: [[[54, 30], [92, 30]], [[54, 38], [112, 38]], [[54, 46], [104, 46]], [[54, 54], [80, 54]]] },
  { name: "popover", r: [80, 50, 126, 86], rad: 4, segs: [[[86, 58], [118, 58]], [[86, 74], [116, 74]], [[86, 80], [108, 80]]], sel: [83, 62, 123, 70] },
];

// Resting separation and the thickness of each layer.
const REST = 0.35, TK = 2.4;

/** Even-odd point-in-polygon. */
function inside(pt, pg) {
  let c = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const [xi, yi] = pg[i], [xj, yj] = pg[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const mount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let GAP = value, act = -1, lastP = null;
  const e = spring(REST, { eps: 0.002 });
  const C = Cam(45, 0.5, 1.96);
  fit(C, LAY.flatMap((L, i) => {
    const [x0, y0, x1, y1] = L.r, z = i * 22 * REST;
    return [[x0, y0, z], [x1, y0, z + TK], [x0, y1, z], [x1, y1, z + TK]];
  }), 200, 166);
  const rawP = proj(C), front = facing(C);
  // Keep the expanding stack centered, including its collapsed thumbnail.
  const project = (x, y, z, gap) => rawP(x, y, z - 1.5 * (GAP * gap - 22 * REST));
  const P = (x, y, z) => project(x, y, z, e.x);
  const g = mk("g", {}, svg);

  const els = LAY.map((L, i) => {
    const [ring, inner] = rings(...L.r, L.rad, 1.3);
    const ext = extremes(P, ring);
    // The guide goes in before the plate: paint order is what hides it.
    const guide = i > 0 ? mk("path", { class: "nf dash" }, g) : null;
    const el = solid(g);
    const marks = mk("path", { class: "nf" }, el.g);
    const selRing = L.sel ? rrect(...L.sel, 2) : null;
    const selEl = L.sel ? mk("path", { class: "nf sil" }, el.g) : null;
    const dotEls = L.dots ? L.dots.map(() => flatDot(el.g, C, 1.6, "nf")) : null;
    return { ring, inner, ext, guide, el, marks, selRing, selEl, dotEls };
  });

  els[2].el.sil.classList.add("hi");
  let drawnGap = NaN;
  const corners = ([x0, y0, x1, y1], z) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => project(x, y, z, e.t));
  // Pick against the target geometry so a moving layer cannot chase the pointer.
  function pick(p) {
    if (!p) return -1;
    for (let i = LAY.length - 1; i >= 0; i--) if (inside(p, corners(LAY[i].r, i * GAP * e.t + TK))) return i;
    return -1;
  }
  function setAct(a) {
    if (a === act) return;
    act = a;
    els.forEach((E, i) => E.el.sil.classList.toggle("hi", i === (a < 0 ? 2 : a)));
    B.wake();
  }

  const B = register(stage, (dt) => {
    const m = stepS(e, dt), z = (i) => i * GAP * e.x;
    if (e.x !== drawnGap) {
      drawnGap = e.x;
      LAY.forEach((L, i) => {
        const E = els[i], zi = z(i), zt = zi + TK;
        put(E.el, prism(P, front, E.ring, E.inner, zi, zt));
        E.marks.setAttribute("d", L.segs.map(([a, b]) => seg(P(a[0], a[1], zt), P(b[0], b[1], zt))).join(""));
        if (E.selEl && E.selRing) E.selEl.setAttribute("d", poly(ringAt(P, E.selRing, zt)));
        if (E.dotEls && L.dots) L.dots.forEach(([dx, dy], k) => place(E.dotEls[k], P(dx, dy, zt)));
        if (E.guide) {
          const zp = z(i - 1) + TK;
          E.guide.setAttribute("d", E.ext.map((q) => seg(P(q.u, q.v, zi), P(q.u, q.v, zp))).join(""));
        }
      });
    }
    read.textContent = act >= 0 ? `0${act + 1} · ${LAY[act].name} · z ${z(act).toFixed(1)}` : "rest";
    return m;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => { lastP = p; e.t = REST + (1 - REST) * clamp((p[0] - 60) / 280, 0, 1); setAct(pick(p)); B.wake(); },
    leave: () => { lastP = null; e.t = REST; setAct(-1); B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { GAP = v; drawnGap = NaN; if (lastP) setAct(pick(lastP)); B.wake(); },
    destroy: bag.dispose,
  };
};

hairline({
  name: "exploded",
  means: "A document separated into its editable layers.",
  rules: [1,3,4,6,7,8,9,10],
  range: [10,22,34],
  tour: [[115,182],[230,100],[295,165],null],
  mount,
});
