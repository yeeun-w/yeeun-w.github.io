/**
 * 게임 본체: 상태 전환(타이틀/플레이/일시정지/엔딩), 메인 루프, 방 입장, 전투 판정, 저장.
 */
G.Game = class {
  constructor(canvas, stage) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.stage = stage;
    this.ui = new G.UI();
    this.hud = new G.HUD();
    this.particles = new G.Particles();
    this.mode = 'title';
    this.time = 0; this.acc = 0; this.lastTs = 0;
    this.cam = { x: 0, y: 0 };
    this.shakeT = 0; this.shakeMag = 0; this.hitstopT = 0; this.flash = 0;
    this.switchCd = 0; this.dyingT = 0; this.onSave = false;
    this.debug = G.CONFIG.DEBUG;
    this.enemies = []; this.items = [];
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.showTitle();
  }

  // ───────────────────── 루프 ─────────────────────
  resize() {
    const C = G.CONFIG;
    const s = Math.min(window.innerWidth / C.VIEW_W, window.innerHeight / C.VIEW_H);
    const scale = s >= 1 ? Math.floor(s) : s;   // 정수 배율 → 픽셀이 뭉개지지 않음
    this.stage.style.width = C.VIEW_W * scale + 'px';
    this.stage.style.height = C.VIEW_H * scale + 'px';
    this.stage.style.setProperty('--s', scale);
  }

  start() {
    const loop = (ts) => { this.frame(ts); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  frame(ts) {
    const C = G.CONFIG;
    const dt = Math.min(0.1, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    this.acc += dt;
    while (this.acc >= C.STEP) {
      this.update(C.STEP);
      G.Input.endFrame();
      this.acc -= C.STEP;
    }
    this.render();
  }

  update(dt) {
    const I = G.Input;
    this.time += dt;
    this.ui.update(dt);
    if (I.wasPressed('debugToggle')) { this.debug = !this.debug; this.ui.toast(`디버그 모드 ${this.debug ? 'ON — U: 전원 합류' : 'OFF'}`); }
    if (this.mode === 'title') {
      if (I.wasPressed('confirm')) this.newGame(null);
      else if (I.wasPressed('continue') && this.readSave()) this.newGame(this.readSave());
    } else if (this.mode === 'pause') {
      if (I.wasPressed('pause')) { this.mode = 'play'; this.ui.hideScreens(); }
      else if (I.wasPressed('restart')) this.newGame(this.readSave());
    } else if (this.mode === 'ending') {
      if (I.wasPressed('confirm')) this.showTitle();
    } else {
      this.updatePlay(dt);
    }
  }

  // ───────────────────── 시작 / 저장 ─────────────────────
  showTitle() {
    this.mode = 'title';
    this.world = null;
    this.ui.clearTransient();
    this.ui.setHint('');
    this.ui.showScreen('title');
    document.getElementById('continue-opt').classList.toggle('hidden', !this.readSave());
  }

  newGame(save) {
    const C = G.CONFIG, T = C.TILE;
    this.world = new G.World(G.ROOMS);
    this.state = { party: ['yuna'], hp: C.MAX_HP, chips: 0, collected: new Set(), visited: new Set(), respawn: null, time: 0 };
    this.particles = new G.Particles();
    this.dyingT = 0; this.hitstopT = 0; this.onSave = false;
    if (save) {
      Object.assign(this.world.mods, save.mods || {});
      this.state.party = save.party;
      this.state.chips = save.chips;
      this.state.collected = new Set(save.collected);
      this.state.visited = new Set(save.visited);
      this.state.time = save.time || 0;
      this.state.respawn = save.respawn;
    } else {
      const s = this.world.findSpawn('playerStart');
      this.state.respawn = { cx: s.tx * T + 8, bottom: (s.ty + 1) * T, char: 'yuna' };
    }
    this.spawnPlayer();
    this.mode = 'play';
    this.ui.clearTransient();
    this.ui.hideScreens();
    if (save) this.ui.toast('저장 지점에서 이어합니다');
    else this.ui.dialog('유나', '…같은 학교, 다른 네트워크. 오늘 밤 이 도시 어딘가에 숨겨진 데이터가 있어. 전부 찾아내 볼까?', G.CHARACTERS.yuna.color, 5);
  }

  spawnPlayer() {
    const r = this.state.respawn;
    this.player = new G.Player(r.char, 0, 0);
    this.player.placeAt(r.cx, r.bottom);
    this.player.lastSafe = { cx: r.cx, bottom: r.bottom };
    this.room = null;
    this.enterRoom(this.world.roomAtPixel(this.player.cx, this.player.cy));
    this.updateCamera(0, true);
    this.updateHint();
  }

  readSave() {
    try { const raw = localStorage.getItem(G.CONFIG.SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  writeSave() {
    const st = this.state;
    try {
      localStorage.setItem(G.CONFIG.SAVE_KEY, JSON.stringify({
        party: st.party, chips: st.chips, collected: [...st.collected], visited: [...st.visited],
        mods: this.world.mods, respawn: st.respawn, time: st.time,
      }));
      return true;
    } catch (e) { return false; }
  }

  // ───────────────────── 방 ─────────────────────
  enterRoom(room) {
    const T = G.CONFIG.TILE;
    this.room = room;
    this.state.visited.add(room.id);
    this.enemies = []; this.items = [];
    for (const s of room.spawns) {
      if (this.state.collected.has(s.key)) continue;
      const x = s.tx * T, y = s.ty * T;
      if (s.type === 'chip') this.items.push(new G.Item('chip', x + 8, y + 8, s.key));
      else if (s.type === 'heart') this.items.push(new G.Item('heart', x + 8, y + 8, s.key));
      else if (s.type === 'crawler') this.enemies.push(new G.Crawler(x + 1, y + T - 10));
      else if (s.type === 'drone') this.enemies.push(new G.Drone(x + 2, y + 3));
      else if (s.type.startsWith('recruit:')) {
        const charId = s.type.split(':')[1];
        if (!this.state.party.includes(charId)) this.items.push(new G.Item('recruit', x + 8, y + T, s.key, { charId }));
      }
    }
    this.ui.showRoomName(room.name, room.sub);
  }

  // ───────────────────── 플레이 ─────────────────────
  updatePlay(dt) {
    const I = G.Input, C = G.CONFIG;
    if (I.wasPressed('pause')) { this.mode = 'pause'; this.ui.showScreen('pause'); return; }
    if (this.debug && I.wasPressed('debugUnlock')) {
      this.state.party = [...G.PARTY_ORDER]; this.state.hp = C.MAX_HP;
      this.ui.toast('[DEBUG] 전원 합류 + 체력 회복');
    }
    this.state.time += dt;
    this.switchCd -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flash > 0) this.flash -= dt * 2.5;
    this.particles.update(dt);

    if (this.dyingT > 0) { this.dyingT -= dt; if (this.dyingT <= 0) this.respawn(); return; }
    if (this.hitstopT > 0) { this.hitstopT -= dt; return; }

    this.handleSwitch();
    this.player.update(dt, this);
    if (this.dyingT > 0) return;

    const r = this.world.roomAtPixel(this.player.cx, this.player.cy);
    if (r && r !== this.room) this.enterRoom(r);

    const pb = this.player.hitbox();
    for (const e of this.enemies) {
      e.update(dt, this);
      if (!e.dead && e.stunT <= 0 && G.Utils.overlap(pb, e.hitbox())) this.hurtPlayer(1, e.cx);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    for (const it of this.items) it.update(dt, this);
    this.items = this.items.filter((it) => !it.dead);
    if (this.mode !== 'play') return;

    this.checkInteractions();
    this.updateCamera(dt, false);
  }

  handleSwitch() {
    const I = G.Input, order = G.PARTY_ORDER;
    const unlocked = order.filter((id) => this.state.party.includes(id));
    let target = null;
    if (unlocked.length > 1 && (I.wasPressed('next') || I.wasPressed('prev'))) {
      const i = unlocked.indexOf(this.player.charId), step = I.wasPressed('next') ? 1 : -1;
      target = unlocked[(i + step + unlocked.length) % unlocked.length];
    }
    ['char1', 'char2', 'char3'].forEach((a, i) => { if (I.wasPressed(a) && unlocked.includes(order[i])) target = order[i]; });
    if (target && target !== this.player.charId && this.switchCd <= 0) this.switchTo(target);
  }

  switchTo(id) {
    const p = this.player;
    if (!p.setCharacter(id, this.world)) { this.ui.toast('공간이 좁아서 전환할 수 없다'); return false; }
    this.switchCd = G.CONFIG.SWITCH_COOLDOWN;
    this.particles.burst(p.cx, p.cy, p.def.color, 14, { speed: 80, gravity: 0 });
    this.particles.ring(p.cx, p.cy, p.def.accent, 20);
    this.updateHint();
    return true;
  }

  updateHint() {
    const d = this.player.def;
    this.ui.setHint(`${d.name} — ${d.hint}`);
  }

  checkInteractions() {
    const p = this.player, w = this.world, T = G.CONFIG.TILE;
    const tx = Math.floor(p.cx / T), ty = Math.floor((p.bottom - 2) / T);
    const ch = w.getTile(tx, ty);
    let sign = null;
    if (ch === 'i') sign = w.signAt(tx, ty);
    else {
      const term = w.findTileNear(p.cx, p.cy, 'T', 32);
      if (term) {
        const locked = w.countInRoom(w.roomAtTile(term.tx, term.ty), 'D') > 0;
        sign = !locked ? '터미널 — 보안 해제 완료' : p.charId === 'yuna' ? '[C] 해킹 — 보안문을 연다' : '터미널… 해커가 필요하다 (유나로 전환)';
      } else if (w.findTileNear(p.cx, p.cy, 'B', 28)) {
        sign = p.charId === 'garon' ? '[C] 강공격 — 금 간 벽을 부순다' : '금이 간 벽… 묵직한 일격이라면 부서질 것 같다';
      }
    }
    this.ui.setSign(sign);

    if (ch === 'S') { if (!this.onSave) { this.onSave = true; this.saveAt(tx, ty); } }
    else this.onSave = false;
    if (ch === 'X') this.finish();
  }

  saveAt(tx, ty) {
    const T = G.CONFIG.TILE, p = this.player;
    this.state.respawn = { cx: tx * T + 8, bottom: p.bottom, char: p.charId };
    this.state.hp = G.CONFIG.MAX_HP;
    const ok = this.writeSave();
    this.particles.ring(p.cx, p.cy, '#4de8f4', 40);
    this.ui.toast(ok ? '저장 완료 · 체력 회복' : '체력 회복 (이 환경에서는 저장할 수 없음)');
  }

  collectItem(it) {
    const C = G.CONFIG;
    it.dead = true;
    if (it.key) this.state.collected.add(it.key);
    if (it.type === 'chip') {
      this.state.chips++;
      this.particles.burst(it.x, it.y, '#4de8f4', 12);
      this.ui.toast(`데이터 칩 ${this.state.chips} / ${this.world.totalChips}`);
    } else if (it.type === 'heart') {
      this.state.hp = Math.min(C.MAX_HP, this.state.hp + 1);
      this.particles.burst(it.x, it.y, '#ff5a78', 8);
    } else if (it.type === 'recruit') {
      const def = G.CHARACTERS[it.data.charId];
      if (!this.state.party.includes(def.id)) this.state.party.push(def.id);
      this.particles.burst(it.x, it.y - 12, def.color, 24, { speed: 120 });
      this.switchTo(def.id);
      this.ui.dialog(def.name, def.recruitLine, def.color, 6);
      this.ui.toast(`${def.name} 합류 — [${G.PARTY_ORDER.indexOf(def.id) + 1}] 또는 Q / E 로 전환`, 4);
    }
  }

  // ───────────────────── 피해 / 사망 ─────────────────────
  hurtPlayer(n, fromX) {
    const p = this.player;
    if (p.invuln > 0 || this.dyingT > 0) return;
    this.state.hp -= n;
    p.invuln = G.CONFIG.INVULN_TIME; p.hurtT = 0.18;
    const dir = fromX == null ? -p.facing : p.cx < fromX ? -1 : 1;
    p.vx = dir * 170; p.vy = -230; p.dashT = 0;
    this.shake(3, 0.2); this.hitstop(0.06);
    this.particles.burst(p.cx, p.cy, '#ff5a6a', 10);
    if (this.state.hp <= 0) this.die();
  }

  /** 가시: 피해 + 마지막 안전 지점으로 되돌림 */
  onHazard() {
    const p = this.player;
    if (this.dyingT > 0) return;
    if (p.invuln <= 0) {
      this.state.hp -= G.CONFIG.HAZARD_DAMAGE;
      this.shake(3, 0.2);
      this.particles.burst(p.cx, p.cy, '#ff5a6a', 10);
    }
    if (this.state.hp <= 0) { this.die(); return; }
    p.placeAt(p.lastSafe.cx, p.lastSafe.bottom);
    if (G.Physics.rectHitsSolid(this.world, p.x, p.y, p.w, p.h)) p.placeAt(this.state.respawn.cx, this.state.respawn.bottom);
    p.invuln = Math.max(p.invuln, 0.9); p.dashT = 0;
    this.flash = 1;
  }

  die() {
    const p = this.player;
    this.dyingT = 1.1;
    this.particles.burst(p.cx, p.cy, p.def.color, 24, { speed: 140 });
    this.shake(5, 0.3);
    this.ui.toast('…다시 일어나자');
  }

  respawn() {
    this.state.hp = G.CONFIG.MAX_HP;
    this.spawnPlayer();
    this.player.invuln = 1;
    this.flash = 1;
  }

  finish() {
    this.mode = 'ending';
    this.ui.setSign(null);
    const t = Math.floor(this.state.time), mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
    this.ui.showScreen('ending', `
      <h2>데이터 코어 접속 완료</h2>
      <p>유나, Z-09, 가론 — 서로 다른 네트워크가 하나로 연결되었다.</p>
      <p class="stat">데이터 칩 <b>${this.state.chips} / ${this.world.totalChips}</b></p>
      <p class="stat">플레이 시간 <b>${mm}:${ss}</b></p>
      <p>"More secrets to explore!"</p>
      <div class="menu"><div><kbd>Enter</kbd> 타이틀로</div></div>`);
  }

  // ───────────────────── 연출 ─────────────────────
  shake(mag, t) { this.shakeMag = Math.max(this.shakeT > 0 ? this.shakeMag : 0, mag); this.shakeT = Math.max(this.shakeT, t); }
  hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); }

  updateCamera(dt, snap) {
    const C = G.CONFIG, r = this.room, p = this.player, U = G.Utils;
    let tx = p.cx - C.VIEW_W / 2 + p.facing * 20;
    let ty = p.cy - C.VIEW_H / 2 - 10;
    tx = r.pw <= C.VIEW_W ? r.px + (r.pw - C.VIEW_W) / 2 : U.clamp(tx, r.px, r.px + r.pw - C.VIEW_W);
    ty = r.ph <= C.VIEW_H ? r.py + (r.ph - C.VIEW_H) / 2 : U.clamp(ty, r.py, r.py + r.ph - C.VIEW_H);
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    const k = Math.min(1, dt * C.CAMERA_LERP);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
  }

  // ───────────────────── 렌더 ─────────────────────
  render() {
    const ctx = this.ctx, C = G.CONFIG;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b0c16';
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
    if (!this.world) { this.renderTitle(ctx); return; }

    const m = this.shakeT > 0 ? this.shakeMag : 0;
    const camX = Math.round(this.cam.x + G.Utils.rand(-m, m)), camY = Math.round(this.cam.y + G.Utils.rand(-m, m));

    G.Background.draw(ctx, this.room.theme, camX);
    this.drawTiles(ctx, camX, camY);
    for (const it of this.items) it.draw(ctx, camX, camY);
    for (const e of this.enemies) e.draw(ctx, camX, camY);
    if (this.dyingT <= 0) this.player.draw(ctx, camX, camY);
    this.particles.draw(ctx, camX, camY);
    if (this.debug) this.drawDebug(ctx, camX, camY);

    this.hud.draw(ctx, this);

    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, this.flash * 0.5)})`; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H); }
    if (this.dyingT > 0) { ctx.fillStyle = `rgba(0,0,0,${1 - this.dyingT / 1.1})`; ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H); }
  }

  drawTiles(ctx, camX, camY) {
    const C = G.CONFIG, T = C.TILE, w = this.world;
    const x0 = Math.floor(camX / T), y0 = Math.floor(camY / T);
    const x1 = Math.floor((camX + C.VIEW_W) / T), y1 = Math.floor((camY + C.VIEW_H) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = w.getTile(tx, ty);
        if (!ch || ch === '.') continue;
        const room = w.roomAtTile(tx, ty);
        G.TileRenderer.draw(ctx, w, ch, tx, ty, tx * T - camX, ty * T - camY, G.THEMES[room ? room.theme : 'city'], this.time, this);
      }
    }
  }

  renderTitle(ctx) {
    const t = this.time;
    G.Background.draw(ctx, 'city', t * 40);
    ctx.fillStyle = '#1a1d3a'; ctx.fillRect(0, 240, G.CONFIG.VIEW_W, 32);
    ctx.fillStyle = '#7c86d4'; ctx.fillRect(0, 240, G.CONFIG.VIEW_W, 2);
    ctx.save();
    ctx.scale(2, 2);
    G.PARTY_ORDER.forEach((id, i) => {
      const pose = ['runA', 'stand', 'runB', 'stand'][Math.floor(t * 9 + i * 2) % 4];
      G.Sprites.draw(ctx, id, pose, 92 + i * 28, 120);
    });
    ctx.restore();
  }

  drawDebug(ctx, camX, camY) {
    const box = (b, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(Math.round(b.x - camX) + 0.5, Math.round(b.y - camY) + 0.5, b.w - 1, b.h - 1); };
    box(this.player.hitbox(), '#00ff88');
    if (this.player.atk) box(this.player.attackBox(), '#ff0');
    for (const e of this.enemies) box(e.hitbox(), '#f44');
    for (const it of this.items) box(it.box(), '#4cf');
    const p = this.player, T = G.CONFIG.TILE;
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textBaseline = 'top';
    ctx.fillText(`room ${this.room.id}  tile ${Math.floor(p.cx / T)},${Math.floor(p.cy / T)}  v ${p.vx | 0},${p.vy | 0}  ground ${p.onGround}`, 4, G.CONFIG.VIEW_H - 22);
  }
};
