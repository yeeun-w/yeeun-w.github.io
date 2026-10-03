/**
 * 타일 충돌. x축 → y축 순서로 따로 이동시키는 가장 단순하고 안정적인 방식.
 * body: { x, y, w, h, vx, vy, onGround }
 */
G.Physics = {
  rectHitsSolid(world, x, y, w, h) {
    const T = G.CONFIG.TILE;
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T);
    const y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (world.isSolid(tx, ty)) return true;
    return false;
  },

  moveX(b, dx, world) {
    if (!dx) return false;
    const T = G.CONFIG.TILE;
    b.x += dx;
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
    const tx = dx > 0 ? Math.floor((b.x + b.w - 0.001) / T) : Math.floor(b.x / T);
    for (let ty = y0; ty <= y1; ty++) {
      if (world.isSolid(tx, ty)) {
        b.x = dx > 0 ? tx * T - b.w : (tx + 1) * T;
        b.vx = 0;
        return true;
      }
    }
    return false;
  },

  /** ignoreOneway: 아래로 내려가기 중이면 true */
  moveY(b, dy, world, ignoreOneway = false) {
    const T = G.CONFIG.TILE;
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T);
    const prevBottom = b.y + b.h;
    b.onGround = false;

    if (dy === 0) { // 정지 상태에서도 바닥 판정 유지
      const ty = Math.floor((prevBottom + 0.5) / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (world.isSolid(tx, ty) ||
          (!ignoreOneway && world.isOneway(tx, ty) && Math.abs(prevBottom - ty * T) < 0.5)) {
          b.onGround = true; break;
        }
      }
      return false;
    }

    b.y += dy;
    if (dy > 0) {
      const ty = Math.floor((b.y + b.h - 0.001) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const oneway = !ignoreOneway && world.isOneway(tx, ty) && prevBottom <= ty * T + 0.5;
        if (world.isSolid(tx, ty) || oneway) {
          b.y = ty * T - b.h; b.vy = 0; b.onGround = true;
          return true;
        }
      }
    } else {
      const ty = Math.floor(b.y / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (world.isSolid(tx, ty)) { b.y = (ty + 1) * T; b.vy = 0; return true; }
      }
    }
    return false;
  },
};
