G.Utils = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  approach(v, target, delta) {
    return v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);
  },
  overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
  rand: (a, b) => a + Math.random() * (b - a),
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  /** 시드 고정 난수 (배경을 매번 똑같이 생성하기 위해) */
  seeded(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  },
  hash: (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0),
};
