/**
 * sprite-data.js 의 문자열 픽셀아트를 시작할 때 한 번 캔버스로 구워 캐시한다.
 * 그리기 기준점: (cx = 가로 중심, bottom = 발바닥 y)
 */
G.Sprites = {
  cache: {},
  silCache: {},

  init() {
    for (const [name, d] of Object.entries(G.SPRITE_DATA)) {
      const frames = {};
      if (d.body) {
        for (const [pose, legs] of Object.entries(d.poses)) frames[pose] = this.build(d.body.concat(legs), d.palette, d.outline);
      }
      if (d.frames) {
        for (const [k, rows] of Object.entries(d.frames)) frames[k] = this.build(rows, d.palette, d.outline);
      }
      this.cache[name] = frames;
    }
  },

  build(rows, palette, outline) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 2;
    const ctx = c.getContext('2d');
    const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < rows[y].length && palette[rows[y][x]] !== undefined;
    if (outline) {
      ctx.fillStyle = outline;
      for (let y = -1; y <= h; y++) {
        for (let x = -1; x <= w; x++) {
          if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) ctx.fillRect(x + 1, y + 1, 1, 1);
        }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const col = palette[rows[y][x]];
        if (col) { ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, 1, 1); }
      }
    }
    return c;
  },

  /** strict=true 면 없는 프레임에 null, 아니면 기본 프레임으로 대체 */
  get(name, frame, strict = false) {
    const f = this.cache[name];
    if (!f) return null;
    return f[frame] || (strict ? null : (f.stand || f.a || Object.values(f)[0]));
  },

  /** 단색 실루엣 (피격 깜빡임, 잔상) */
  silhouette(name, frame, color) {
    const key = `${name}|${frame}|${color}`;
    if (this.silCache[key]) return this.silCache[key];
    const img = this.get(name, frame);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return (this.silCache[key] = c);
  },

  draw(ctx, name, frame, cx, bottom, flip = false, opt = {}) {
    let img = this.get(name, frame);
    if (!img) return;
    if (opt.tint) img = this.silhouette(name, frame, opt.tint);
    const x = Math.round(cx - img.width / 2);
    const y = Math.round(bottom - img.height + 1);
    ctx.save();
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (flip) { ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); }
    else ctx.drawImage(img, x, y);
    ctx.restore();
  },

  drawTopLeft(ctx, name, frame, x, y) {
    const img = this.get(name, frame);
    if (img) ctx.drawImage(img, Math.round(x), Math.round(y));
  },

  /** HUD 초상화: 서 있는 프레임 윗부분(얼굴)을 정사각형으로 잘라 그림 */
  drawPortrait(ctx, name, x, y, size) {
    const img = this.get(name, 'stand');
    if (!img) return;
    const s = img.width;
    ctx.drawImage(img, 0, 0, s, Math.min(s, img.height), x, y, size, size);
  },
};
