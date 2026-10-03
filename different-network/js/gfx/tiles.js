/**
 * 타일 종류(충돌 속성)와 그리는 방법.
 * 새 타일 추가: G.TILES 에 속성 추가 → TileRenderer.draw 의 switch 에 그리기 추가.
 */
G.TILES = {
  '.': { name: 'empty' },
  '#': { name: 'wall', solid: true },
  '=': { name: 'platform', oneway: true },
  '^': { name: 'spikes', hazard: true },
  'B': { name: 'breakable', solid: true },
  'D': { name: 'door', solid: true },
  'h': { name: 'hidden', solid: true },
  'T': { name: 'terminal' },
  'S': { name: 'save' },
  'i': { name: 'sign' },
  'X': { name: 'goal' },
};

/** 맵 문자 → 생성할 엔티티 (불러올 때 빈 칸으로 바뀐다) */
G.ENTITY_MARKERS = {
  'P': 'playerStart',
  '*': 'chip',
  'H': 'heart',
  'e': 'crawler',
  'f': 'drone',
  'z': 'recruit:z09',
  'g': 'recruit:garon',
};

G.TileRenderer = {
  draw(ctx, world, ch, tx, ty, x, y, th, t, game) {
    switch (ch) {
      case '#': return this.wall(ctx, world, tx, ty, x, y, th, false, t);
      case 'h': return this.wall(ctx, world, tx, ty, x, y, th, game.player && game.player.charId === 'z09', t);
      case '=': return this.platform(ctx, x, y, th);
      case '^': return this.spikes(ctx, x, y, th);
      case 'B': return this.breakable(ctx, world, tx, ty, x, y, th);
      case 'D': return this.door(ctx, world, tx, ty, x, y, th, t);
      case 'T': return this.terminal(ctx, x, y, th, t);
      case 'S': return this.save(ctx, x, y, t);
      case 'i': return this.sign(ctx, x, y);
      case 'X': return this.goal(ctx, x, y, t);
    }
  },

  wall(ctx, world, tx, ty, x, y, th, shimmer, t) {
    const s = (a, b) => world.isSolid(a, b);
    const up = s(tx, ty - 1), dn = s(tx, ty + 1), lf = s(tx - 1, ty), rt = s(tx + 1, ty);
    const inner = up && dn && lf && rt;
    const n = G.Utils.hash(tx, ty);
    ctx.fillStyle = inner ? th.wallDeep : th.wall;
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = th.wallDark;
    if (th.pattern === 'brick') {
      ctx.fillRect(x, y + 7, 16, 1);
      ctx.fillRect(x, y + 15, 16, 1);
      ctx.fillRect(x + (ty & 1 ? 4 : 11), y, 1, 7);
      ctx.fillRect(x + (ty & 1 ? 11 : 4), y + 8, 1, 7);
    } else if (!inner) {
      ctx.fillRect(x, y + 15, 16, 1);
      ctx.fillRect(x + 15, y, 1, 16);
      if (n % 5 === 0) { ctx.fillStyle = th.wallLight; ctx.fillRect(x + 3, y + 4, 1, 1); ctx.fillRect(x + 12, y + 4, 1, 1); }
    } else if (n % 11 === 0) {
      ctx.fillStyle = th.wall; ctx.fillRect(x + 5, y + 6, 4, 2);
    }
    if (!up) {
      ctx.fillStyle = th.wallLight; ctx.fillRect(x, y, 16, 2);
      ctx.fillStyle = th.accent; ctx.globalAlpha = 0.45; ctx.fillRect(x, y + 2, 16, 1); ctx.globalAlpha = 1;
    }
    if (!lf) { ctx.fillStyle = th.wallLight; ctx.fillRect(x, y, 1, 16); }
    if (!rt) { ctx.fillStyle = th.wallDark; ctx.fillRect(x + 15, y, 1, 16); }
    if (!dn) { ctx.fillStyle = th.wallDark; ctx.fillRect(x, y + 14, 16, 2); }
    // Z-09 일 때만 숨겨진 벽이 미세하게 반짝인다
    if (shimmer && ((t * 2 + (n % 7) * 0.3) % 1.6) < 0.35) {
      ctx.fillStyle = 'rgba(77,232,244,0.7)';
      ctx.fillRect(x + 2 + (n % 11), y + 2 + ((n >> 4) % 11), 2, 1);
    }
  },

  platform(ctx, x, y, th) {
    ctx.fillStyle = th.platform; ctx.fillRect(x, y, 16, 4);
    ctx.fillStyle = th.wallLight; ctx.fillRect(x, y, 16, 1);
    ctx.fillStyle = th.wallDark; ctx.fillRect(x, y + 4, 16, 1);
    ctx.fillRect(x + 2, y + 5, 1, 3); ctx.fillRect(x + 13, y + 5, 1, 3);
  },

  spikes(ctx, x, y, th) {
    ctx.fillStyle = th.wallDark; ctx.fillRect(x, y + 13, 16, 3);
    for (let i = 0; i < 4; i++) {
      const bx = x + i * 4;
      ctx.fillStyle = th.spike; ctx.fillRect(bx + 1, y + 5, 2, 5); ctx.fillRect(bx, y + 10, 4, 3);
      ctx.fillStyle = th.spikeHi; ctx.fillRect(bx + 1, y + 5, 1, 3);
    }
  },

  breakable(ctx, world, tx, ty, x, y, th) {
    ctx.fillStyle = th.crack; ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = th.wallDark;
    const flip = (tx + ty) & 1;
    const fx = (v) => (flip ? 15 - v : v);
    ctx.fillRect(x + fx(3), y + 1, 1, 5); ctx.fillRect(x + Math.min(fx(3), fx(7)), y + 6, 5, 1);
    ctx.fillRect(x + fx(8), y + 6, 1, 6); ctx.fillRect(x + Math.min(fx(8), fx(12)), y + 11, 5, 1);
    ctx.fillRect(x + fx(13), y + 2, 1, 3);
    ctx.fillStyle = th.wallLight; ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + 14, y + 13, 1, 1);
    if (world.getTile(tx, ty - 1) !== 'B') { ctx.fillStyle = th.wallLight; ctx.fillRect(x, y, 16, 1); }
  },

  door(ctx, world, tx, ty, x, y, th, t) {
    ctx.fillStyle = '#12141f'; ctx.fillRect(x + 1, y, 14, 16);
    ctx.fillStyle = '#3a3f5c'; ctx.fillRect(x, y, 2, 16); ctx.fillRect(x + 14, y, 2, 16);
    ctx.fillStyle = '#c8f04a'; ctx.globalAlpha = 0.55;
    for (let r = 2; r < 16; r += 5) ctx.fillRect(x + 4, y + r, 8, 2);
    ctx.globalAlpha = 1;
    if (world.getTile(tx, ty - 1) !== 'D') { // 문 맨 위: 잠금 표시등
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff4a6a' : '#7a1a2a';
      ctx.fillRect(x + 6, y + 1, 4, 2);
    }
  },

  terminal(ctx, x, y, th, t) {
    ctx.fillStyle = 'rgba(200,240,74,0.12)'; ctx.fillRect(x - 2, y - 1, 20, 14);
    ctx.fillStyle = '#20243a'; ctx.fillRect(x + 6, y + 10, 4, 4); ctx.fillRect(x + 2, y + 14, 12, 2);
    ctx.fillStyle = '#3a3f5c'; ctx.fillRect(x + 1, y + 1, 14, 10);
    ctx.fillStyle = '#0d1018'; ctx.fillRect(x + 2, y + 2, 12, 8);
    ctx.fillStyle = '#c8f04a';
    ctx.fillRect(x + 3, y + 3, 7, 1); ctx.fillRect(x + 3, y + 5, 4, 1); ctx.fillRect(x + 3, y + 7, 6, 1);
    if (t % 1 < 0.5) ctx.fillRect(x + 10, y + 7, 2, 1);
  },

  /** 저장 지점: 시트에 공통으로 나오는 고양이 홀로그램 */
  save(ctx, x, y, t) {
    const CAT = ['C.....C', 'CC...CC', 'CCCCCCC', 'C.CCC.C', 'CCCCCCC', '.CCCCC.'];
    ctx.fillStyle = '#2a3050'; ctx.fillRect(x + 2, y + 13, 12, 3);
    ctx.fillStyle = '#4de8f4'; ctx.fillRect(x + 4, y + 13, 8, 1);
    const fy = Math.round(Math.sin(t * 2.5) * 1.5);
    ctx.globalAlpha = 0.55 + Math.sin(t * 4) * 0.25;
    for (let r = 0; r < CAT.length; r++) for (let c = 0; c < 7; c++) {
      if (CAT[r][c] === 'C') ctx.fillRect(x + 4 + c, y + 3 + r + fy, 1, 1);
    }
    ctx.globalAlpha = 0.18; ctx.fillRect(x + 3, y + 10 + fy, 9, 3);
    ctx.globalAlpha = 1;
  },

  sign(ctx, x, y) {
    ctx.fillStyle = '#5a4030'; ctx.fillRect(x + 7, y + 8, 2, 8);
    ctx.fillStyle = '#8a6a48'; ctx.fillRect(x + 2, y + 2, 12, 7);
    ctx.fillStyle = '#b08a60'; ctx.fillRect(x + 2, y + 2, 12, 1);
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x + 4, y + 4, 8, 1); ctx.fillRect(x + 4, y + 6, 6, 1);
  },

  goal(ctx, x, y, t) {
    const cx = x + 8, cy = y + 2 + Math.sin(t * 2) * 2;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 18);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(77,232,244,0.6)'); g.addColorStop(1, 'rgba(77,232,244,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 18, cy - 18, 36, 36);
    ctx.strokeStyle = '#c8f04a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, 11, 4, t, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#2a3050'; ctx.fillRect(x + 3, y + 13, 10, 3);
  },
};
