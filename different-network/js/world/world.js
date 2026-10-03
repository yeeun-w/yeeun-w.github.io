/**
 * 월드 = 모든 방을 하나의 타일 좌표계에 올려놓은 것.
 * 타일 조회는 월드 좌표로 하므로 방 경계를 넘어가도 충돌이 자연스럽게 이어진다.
 * 부서진 벽/열린 문 같은 변경 사항은 mods 에 저장 (세이브에도 그대로 들어감).
 */
G.World = class {
  constructor(defs) {
    this.rooms = defs.map((d) => this.parse(d));
    this.mods = {};
    this._last = null;
    this.totalChips = this.rooms.reduce((n, r) => n + r.spawns.filter((s) => s.type === 'chip').length, 0);
    const xs = this.rooms.map((r) => [r.x, r.x + r.w]).flat(), ys = this.rooms.map((r) => [r.y, r.y + r.h]).flat();
    this.bounds = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }

  parse(d) {
    const T = G.CONFIG.TILE;
    const h = d.map.length, w = Math.max(...d.map.map((r) => r.length));
    const tiles = new Array(w * h), spawns = [], signs = {};
    let signIdx = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let ch = d.map[y][x] ?? '#';
        const marker = G.ENTITY_MARKERS[ch];
        if (marker) {
          spawns.push({ type: marker, tx: d.x + x, ty: d.y + y, key: `${d.id}:${x},${y}` });
          ch = '.';
        }
        if (ch === 'i') signs[`${d.x + x},${d.y + y}`] = (d.signs && d.signs[signIdx++]) || '…';
        if (!G.TILES[ch]) { console.warn(`[rooms] 알 수 없는 타일 '${ch}' (방 ${d.id}, ${x},${y})`); ch = '.'; }
        tiles[y * w + x] = ch;
      }
    }
    return { ...d, w, h, tiles, spawns, signs, px: d.x * T, py: d.y * T, pw: w * T, ph: h * T };
  }

  // ── 조회 ──
  roomAtTile(tx, ty) {
    const inside = (r) => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h;
    if (this._last && inside(this._last)) return this._last;
    for (const r of this.rooms) if (inside(r)) return (this._last = r);
    return null;
  }
  roomAtPixel(px, py) { const T = G.CONFIG.TILE; return this.roomAtTile(Math.floor(px / T), Math.floor(py / T)); }
  roomById(id) { return this.rooms.find((r) => r.id === id); }

  /** 방 밖(허공)이면 null */
  getTile(tx, ty) {
    const m = this.mods[tx + ',' + ty];
    if (m !== undefined) return m;
    const r = this.roomAtTile(tx, ty);
    return r ? r.tiles[(ty - r.y) * r.w + (tx - r.x)] : null;
  }
  setTile(tx, ty, ch) { this.mods[tx + ',' + ty] = ch; }

  isSolid(tx, ty) {
    const t = this.getTile(tx, ty);
    if (t === null) return true; // 허공은 벽 취급 → 월드 밖으로 못 나감
    const d = G.TILES[t];
    return !!(d && d.solid);
  }
  isOneway(tx, ty) { return this.getTile(tx, ty) === '='; }
  isHazard(tx, ty) { const t = this.getTile(tx, ty); return !!(t && G.TILES[t] && G.TILES[t].hazard); }
  signAt(tx, ty) { const r = this.roomAtTile(tx, ty); return r ? r.signs[`${tx},${ty}`] : null; }

  findSpawn(type) {
    for (const r of this.rooms) for (const s of r.spawns) if (s.type === type) return s;
    return null;
  }

  /** (px,py) 반경 안에서 가장 가까운 ch 타일 */
  findTileNear(px, py, ch, radius) {
    const T = G.CONFIG.TILE, n = Math.ceil(radius / T);
    const cx = Math.floor(px / T), cy = Math.floor(py / T);
    let best = null, bd = Infinity;
    for (let ty = cy - n; ty <= cy + n; ty++) {
      for (let tx = cx - n; tx <= cx + n; tx++) {
        if (this.getTile(tx, ty) !== ch) continue;
        const d = G.Utils.dist(px, py, tx * T + 8, ty * T + 8);
        if (d <= radius && d < bd) { bd = d; best = { tx, ty }; }
      }
    }
    return best;
  }

  countInRoom(room, ch) {
    let n = 0;
    for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) if (this.getTile(room.x + x, room.y + y) === ch) n++;
    return n;
  }

  // ── 변경 ──
  replaceInRoom(room, from, to) {
    const out = [];
    for (let y = 0; y < room.h; y++) {
      for (let x = 0; x < room.w; x++) {
        const tx = room.x + x, ty = room.y + y;
        if (this.getTile(tx, ty) === from) { this.setTile(tx, ty, to); out.push({ tx, ty }); }
      }
    }
    return out;
  }

  replaceInRadius(px, py, radius, from, to) {
    const T = G.CONFIG.TILE, n = Math.ceil(radius / T), out = [];
    const cx = Math.floor(px / T), cy = Math.floor(py / T);
    for (let ty = cy - n; ty <= cy + n; ty++) {
      for (let tx = cx - n; tx <= cx + n; tx++) {
        if (this.getTile(tx, ty) === from && G.Utils.dist(px, py, tx * T + 8, ty * T + 8) <= radius) {
          this.setTile(tx, ty, to); out.push({ tx, ty });
        }
      }
    }
    return out;
  }

  /** 연결된 같은 타일 덩어리를 통째로 교체 (금 간 벽 한 번에 무너뜨리기) */
  floodReplace(sx, sy, from, to, limit = 400) {
    const out = [], q = [[sx, sy]], seen = new Set();
    while (q.length && out.length < limit) {
      const [tx, ty] = q.pop();
      const k = tx + ',' + ty;
      if (seen.has(k)) continue;
      seen.add(k);
      if (this.getTile(tx, ty) !== from) continue;
      this.setTile(tx, ty, to); out.push({ tx, ty });
      q.push([tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]);
    }
    return out;
  }

  breakInRect(box, ch) {
    const T = G.CONFIG.TILE, out = [];
    const x0 = Math.floor(box.x / T), x1 = Math.floor((box.x + box.w - 0.001) / T);
    const y0 = Math.floor(box.y / T), y1 = Math.floor((box.y + box.h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (this.getTile(tx, ty) === ch) out.push(...this.floodReplace(tx, ty, ch, '.'));
    return out;
  }
};
