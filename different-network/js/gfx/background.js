/**
 * 패럴랙스 배경: 하늘(고정) + 원경/중경/근경 3겹.
 * 시작할 때 테마별로 한 번 생성해서 캐시 → 매 프레임은 drawImage 만.
 * f = 카메라 이동 대비 스크롤 비율 (0 = 고정, 1 = 타일과 같이 움직임)
 */
G.Background = {
  W: 640,
  cache: {},

  init() {
    for (const name of Object.keys(G.THEMES)) this.cache[name] = this.build(name);
  },

  canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; },

  build(name) {
    const th = G.THEMES[name], W = this.W, H = G.CONFIG.VIEW_H;
    const rnd = G.Utils.seeded(name.length * 977 + name.charCodeAt(0) * 31);
    const sky = this.canvas(G.CONFIG.VIEW_W, H), far = this.canvas(W, H), mid = this.canvas(W, H), near = this.canvas(W, H);
    this.paintSky(sky.getContext('2d'), th, rnd, name);
    this.painters[name](far.getContext('2d'), mid.getContext('2d'), near.getContext('2d'), th, rnd, W, H);
    return [{ c: sky, f: 0 }, { c: far, f: 0.1 }, { c: mid, f: 0.28 }, { c: near, f: 0.55 }];
  },

  draw(ctx, theme, camX) {
    const layers = this.cache[theme] || this.cache.city;
    for (const L of layers) {
      if (L.f === 0) { ctx.drawImage(L.c, 0, 0); continue; }
      let o = Math.round(camX * L.f) % this.W;
      if (o < 0) o += this.W;
      ctx.drawImage(L.c, -o, 0);
      ctx.drawImage(L.c, -o + this.W, 0);
    }
  },

  paintSky(ctx, th, rnd, name) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.6, th.sky[1]); g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = th.stars;
    for (let i = 0; i < 80; i++) {
      ctx.globalAlpha = 0.25 + rnd() * 0.75;
      ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.7), 1, 1);
    }
    ctx.globalAlpha = 1;
    if (name === 'station') {
      ctx.fillStyle = '#10203a';
      ctx.beginPath(); ctx.arc(W * 0.82, H * 1.15, 150, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = th.moon; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    } else {
      const mx = W * 0.72, my = 58, r = name === 'ruins' ? 30 : 20;
      const glow = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3);
      glow.addColorStop(0, th.moon + '55'); glow.addColorStop(1, th.moon + '00');
      ctx.fillStyle = glow; ctx.fillRect(mx - r * 3, my - r * 3, r * 6, r * 6);
      ctx.fillStyle = th.moon; ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(mx - 6, my - 4, 4, 3); ctx.fillRect(mx + 5, my + 5, 5, 3);
    }
  },

  painters: {
    city(far, mid, near, th, rnd, W, H) {
      let x = 0;
      while (x < W) {
        const w = Math.min(W - x, 18 + Math.floor(rnd() * 34)), h = 70 + Math.floor(rnd() * 110);
        far.fillStyle = th.far; far.fillRect(x, H - h, w, h);
        if (rnd() < 0.35) far.fillRect(x + Math.floor(w / 2), H - h - 12, 1, 12);
        far.fillStyle = th.lightB; far.globalAlpha = 0.18;
        for (let wy = H - h + 6; wy < H; wy += 9) if (rnd() < 0.5) far.fillRect(x + 3, wy, w - 6, 1);
        far.globalAlpha = 1;
        x += w + Math.floor(rnd() * 4);
      }
      x = 0;
      while (x < W) {
        const w = Math.min(W - x, 28 + Math.floor(rnd() * 44)), h = 40 + Math.floor(rnd() * 90);
        mid.fillStyle = th.mid; mid.fillRect(x, H - h, w, h);
        for (let wy = H - h + 6; wy < H - 6; wy += 7) {
          for (let wx = x + 4; wx < x + w - 4; wx += 6) {
            if (rnd() < 0.28) {
              mid.fillStyle = rnd() < 0.75 ? th.lightA : th.lightB;
              mid.globalAlpha = 0.3 + rnd() * 0.4; mid.fillRect(wx, wy, 2, 3);
            }
          }
        }
        mid.globalAlpha = 1;
        if (rnd() < 0.35) { mid.fillStyle = rnd() < 0.5 ? th.lightB : th.lightA; mid.globalAlpha = 0.8; mid.fillRect(x + 2, H - h + 8, 3, 18); mid.globalAlpha = 1; }
        x += w + 2 + Math.floor(rnd() * 10);
      }
      // 근경: 전봇대와 늘어진 전선
      near.fillStyle = th.near; near.strokeStyle = th.near; near.lineWidth = 1;
      const step = W / 2;
      for (let i = 0; i < 2; i++) { const px = i * step + 40; near.fillRect(px, 30, 3, H - 30); near.fillRect(px - 8, 34, 19, 2); }
      for (const off of [0, -W]) {
        for (let i = 0; i < 2; i++) {
          const a = i * step + 41 + off, b = a + step;
          for (const dy of [0, 6]) { near.beginPath(); near.moveTo(a, 36 + dy); near.quadraticCurveTo((a + b) / 2, 70 + dy, b, 36 + dy); near.stroke(); }
        }
      }
    },

    station(far, mid, near, th, rnd, W, H) {
      far.fillStyle = th.far; far.strokeStyle = th.far;
      for (const by of [70, 130]) {
        far.fillRect(0, by, W, 3); far.fillRect(0, by + 16, W, 3);
        far.beginPath();
        for (let x = 0; x < W; x += 16) { far.moveTo(x, by + 3); far.lineTo(x + 16, by + 16); far.moveTo(x + 16, by + 3); far.lineTo(x, by + 16); }
        far.stroke();
      }
      for (let x = 20; x < W; x += 120 + Math.floor(rnd() * 40)) far.fillRect(x, 40, 10, H - 40);
      let x = 0;
      while (x < W) {
        const w = Math.min(W - x, 40 + Math.floor(rnd() * 50)), h = 30 + Math.floor(rnd() * 80);
        mid.fillStyle = th.mid; mid.fillRect(x, H - h, w, h);
        mid.fillStyle = th.lightA; mid.globalAlpha = 0.45; mid.fillRect(x + 3, H - h + 4, w - 6, 1);
        for (let wx = x + 5; wx < x + w - 5; wx += 8) if (rnd() < 0.4) mid.fillRect(wx, H - h + 10, 3, 2);
        mid.globalAlpha = 1;
        x += w + 4 + Math.floor(rnd() * 16);
      }
      near.fillStyle = th.near;
      near.fillRect(0, 4, W, 5);
      for (let px = 10; px < W - 10; px += 50 + Math.floor(rnd() * 50)) {
        const len = 20 + Math.floor(rnd() * 60);
        near.fillStyle = th.near; near.fillRect(px, 9, 4, len);
        near.fillStyle = th.lightA; near.globalAlpha = 0.7; near.fillRect(px + 1, 9 + len, 2, 2); near.globalAlpha = 1;
      }
    },

    ruins(far, mid, near, th, rnd, W, H) {
      let x = 0;
      far.fillStyle = th.far;
      while (x < W) {
        const w = Math.min(W - x, 14 + Math.floor(rnd() * 14)), h = 80 + Math.floor(rnd() * 100);
        far.fillStyle = th.far; far.fillRect(x, H - h, w, h);
        far.beginPath(); far.moveTo(x - 2, H - h); far.lineTo(x + w / 2, H - h - 18 - rnd() * 14); far.lineTo(x + w + 2, H - h); far.fill();
        if (rnd() < 0.5) { far.fillStyle = th.lightA; far.globalAlpha = 0.5; far.fillRect(x + Math.floor(w / 2) - 1, H - h + 14, 2, 4); far.globalAlpha = 1; }
        x += w + 6 + Math.floor(rnd() * 24);
      }
      x = 0;
      while (x < W) {
        const w = Math.min(W - x, 50 + Math.floor(rnd() * 40)), h = 40 + Math.floor(rnd() * 50);
        mid.fillStyle = th.mid; mid.fillRect(x, H - h, w, h);
        mid.globalCompositeOperation = 'destination-out';
        mid.beginPath(); mid.arc(x + w / 2, H - h + 26, 10, Math.PI, 0); mid.rect(x + w / 2 - 10, H - h + 26, 20, 30); mid.fill();
        mid.globalCompositeOperation = 'source-over';
        if (rnd() < 0.6) {
          const tx = x + 6, ty = H - h + 12;
          const g = mid.createRadialGradient(tx, ty, 1, tx, ty, 14);
          g.addColorStop(0, 'rgba(240,176,64,0.7)'); g.addColorStop(1, 'rgba(240,176,64,0)');
          mid.fillStyle = g; mid.fillRect(tx - 14, ty - 14, 28, 28);
        }
        x += w + 10 + Math.floor(rnd() * 30);
      }
      for (let px = 15; px < W - 15; px += 70 + Math.floor(rnd() * 60)) {
        const len = 30 + Math.floor(rnd() * 50);
        if (rnd() < 0.5) {
          near.fillStyle = th.near; for (let y = 0; y < len; y += 4) near.fillRect(px, y, 2, 3);
        } else {
          near.fillStyle = '#3a0f14'; near.fillRect(px, 0, 12, len);
          near.fillStyle = th.near; near.fillRect(px + 4, len - 4, 4, 4);
          near.fillStyle = th.accent; near.globalAlpha = 0.5; near.fillRect(px + 5, Math.floor(len / 2), 2, 4); near.globalAlpha = 1;
        }
      }
    },
  },
};
