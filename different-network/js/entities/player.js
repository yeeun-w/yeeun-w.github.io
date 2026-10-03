/**
 * 플레이어 = "지금 조종 중인 파티원".
 * 캐릭터 전환 시 객체를 새로 만들지 않고 def(스탯)와 히트박스만 바꾼다 → 위치/속도 유지.
 * 수치 튜닝은 data/characters.js, core/config.js 에서.
 */
G.Player = class {
  constructor(charId, x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.facing = 1; this.onGround = false;
    this.coyote = 0; this.jumpBuffer = 0; this.jumpsUsed = 0; this.dropTimer = 0;
    this.dashT = 0; this.dashCd = 0; this.canAirDash = true;
    this.hovering = false;
    this.fuel = {};  // 호버 연료 (캐릭터별, 땅에 닿으면 충전 → 공중 전환으로 무한 충전 불가)
    for (const id in G.CHARACTERS) if (G.CHARACTERS[id].hover) this.fuel[id] = G.CHARACTERS[id].hover.fuel;
    this.atk = null; this.attackCd = 0; this.skillCd = 0;
    this.invuln = 0; this.hurtT = 0; this.animT = 0; this.trail = [];
    this.applyDef(charId);
    this.lastSafe = { cx: this.cx, bottom: this.bottom };
  }

  applyDef(id) { this.charId = id; this.def = G.CHARACTERS[id]; this.w = this.def.w; this.h = this.def.h; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  placeAt(cx, bottom) { this.x = cx - this.w / 2; this.y = bottom - this.h; this.vx = 0; this.vy = 0; }

  /** 발 위치 기준으로 체형 교체. 공간이 좁아 끼면 false */
  setCharacter(id, world) {
    const nd = G.CHARACTERS[id];
    const nx = this.cx - nd.w / 2, ny = this.bottom - nd.h;
    if (G.Physics.rectHitsSolid(world, nx, ny, nd.w, nd.h)) return false;
    this.applyDef(id);
    this.x = nx; this.y = ny;
    this.dashT = 0; this.atk = null; this.hovering = false;
    return true;
  }

  update(dt, game) {
    const C = G.CONFIG, I = G.Input, U = G.Utils, d = this.def, world = game.world;
    this.animT += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtT -= dt; this.dashCd -= dt; this.attackCd -= dt; this.skillCd -= dt; this.dropTimer -= dt;
    this.jumpBuffer -= dt;
    if (I.wasPressed('jump')) this.jumpBuffer = C.JUMP_BUFFER;

    const dir = this.hurtT > 0 ? 0 : (I.isDown('right') ? 1 : 0) - (I.isDown('left') ? 1 : 0);

    // ── 대시 ──
    if (d.dash && I.wasPressed('dash') && this.dashCd <= 0 && (this.onGround || this.canAirDash)) {
      if (dir) this.facing = dir;
      this.dashT = d.dash.time; this.dashCd = d.dash.cooldown;
      if (!this.onGround) this.canAirDash = false;
      game.particles.burst(this.cx, this.cy, d.accent, 6, { speed: 60, gravity: 0 });
    }

    // ── 수평 이동 / 중력 / 호버 ──
    this.hovering = false;
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.facing * d.dash.speed; this.vy = 0;
      this.trail.push({ x: this.cx, y: this.bottom, pose: this.pose(), flip: this.facing < 0, life: 0.18 });
    } else {
      if (dir) this.facing = dir;
      const accel = this.hurtT > 0 ? d.airAccel * 0.3 : this.onGround ? (dir ? d.accel : d.friction) : d.airAccel;
      this.vx = U.approach(this.vx, dir * d.runSpeed, accel * dt);

      let g = C.GRAVITY * d.gravityMul;
      if (!this.onGround && I.isDown('jump') && Math.abs(this.vy) < C.APEX_THRESHOLD) g *= C.APEX_GRAVITY_MUL;
      this.vy += g * dt;

      if (d.hover && !this.onGround && this.coyote <= 0 && this.vy > 0 && I.isDown('jump') && this.fuel[this.charId] > 0) {
        this.hovering = true;
        this.fuel[this.charId] -= dt;
        this.vy = Math.min(this.vy, d.hover.fallSpeed);
        if (Math.random() < 0.6) {
          game.particles.add({ x: this.cx + U.rand(-3, 3), y: this.bottom, vx: U.rand(-15, 15), vy: U.rand(40, 80), life: 0.25, color: Math.random() < 0.5 ? d.accent : '#ffffff' });
        }
      }
      this.vy = Math.min(this.vy, C.MAX_FALL);
    }

    // ── 지면 상태 / 코요테 타임 ──
    if (this.onGround) {
      this.coyote = C.COYOTE_TIME; this.jumpsUsed = 0; this.canAirDash = true;
      for (const id in this.fuel) this.fuel[id] = G.CHARACTERS[id].hover.fuel;
    } else {
      this.coyote -= dt;
      if (this.coyote <= 0 && this.jumpsUsed === 0) this.jumpsUsed = 1; // 그냥 떨어졌으면 지상 점프는 소모된 것으로
    }

    // ── 점프 ──
    if (this.jumpBuffer > 0 && this.onGround && I.isDown('down') && this.onOneway(world)) {
      this.dropTimer = C.DROP_THROUGH_TIME; this.jumpBuffer = 0; this.coyote = 0; this.jumpsUsed = 1; this.onGround = false;
    } else if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.jump(game, false);
    } else if (I.wasPressed('jump') && this.coyote <= 0 && this.jumpsUsed < d.maxJumps) {
      this.jump(game, true);
    }
    if (I.wasReleased('jump') && this.vy < 0 && this.dashT <= 0) this.vy *= d.jumpCut; // 짧게 누르면 낮은 점프

    // ── 공격 / 스킬 ──
    if (I.wasPressed('attack') && this.attackCd <= 0 && !this.atk) this.startAttack(d.attack, game);
    if (I.wasPressed('skill') && this.skillCd <= 0) {
      if (d.skill.use(this, game) !== false) this.skillCd = d.skill.cooldown;
    }

    // ── 이동 + 충돌 ──
    const wasGround = this.onGround;
    G.Physics.moveX(this, this.vx * dt, world);
    G.Physics.moveY(this, this.vy * dt, world, this.dropTimer > 0);
    if (!wasGround && this.onGround) game.particles.burst(this.cx, this.bottom, '#cfd6ff', 4, { speed: 40, gravity: 0, life: 0.25, up: true });

    this.updateAttack(dt, game);
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter((t) => t.life > 0);

    // ── 위험 지형 / 안전 지점 기록 ──
    if (this.touchingHazard(world)) game.onHazard();
    else if (this.onGround && this.onSafeGround(world)) this.lastSafe = { cx: this.cx, bottom: this.bottom };
  }

  jump(game, air) {
    this.vy = -this.def.jumpVel * (air ? 0.92 : 1);
    this.jumpsUsed = air ? this.jumpsUsed + 1 : 1;
    this.coyote = 0; this.jumpBuffer = 0; this.onGround = false; this.dropTimer = 0;
    if (air) game.particles.burst(this.cx, this.bottom, this.def.accent, 8, { speed: 70, gravity: 0, life: 0.3 });
    else game.particles.burst(this.cx, this.bottom, '#cfd6ff', 5, { speed: 50, gravity: 0, life: 0.25, up: true });
  }

  onOneway(world) {
    const T = G.CONFIG.TILE, ty = Math.floor((this.bottom + 1) / T);
    const a = Math.floor(this.x / T), b = Math.floor((this.x + this.w - 0.001) / T);
    let one = false;
    for (let tx = a; tx <= b; tx++) { if (world.isSolid(tx, ty)) return false; if (world.isOneway(tx, ty)) one = true; }
    return one;
  }

  touchingHazard(world) {
    const T = G.CONFIG.TILE;
    const x0 = Math.floor((this.x + 2) / T), x1 = Math.floor((this.x + this.w - 3) / T);
    const y0 = Math.floor((this.y + 2) / T), y1 = Math.floor((this.bottom - 1) / T);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (world.isHazard(tx, ty) && this.bottom > ty * T + 5) return true;
    return false;
  }

  onSafeGround(world) {
    const T = G.CONFIG.TILE, ty = Math.floor((this.bottom + 1) / T);
    const a = Math.floor(this.x / T), b = Math.floor((this.x + this.w - 0.001) / T);
    for (let tx = a; tx <= b; tx++) if (!world.isSolid(tx, ty) || world.getTile(tx, ty) === 'B') return false;
    return true;
  }

  // ── 공격 ──
  startAttack(cfg) {
    this.atk = { cfg, t: cfg.time, hit: new Set(), broke: false };
    this.attackCd = cfg.cooldown;
    if (cfg.lunge) this.vx = this.facing * cfg.lunge;
  }

  attackBox() {
    const c = this.atk.cfg;
    return { x: this.facing > 0 ? this.x + this.w - 2 : this.x - c.w + 2, y: this.y + this.h * 0.45 - c.h / 2, w: c.w, h: c.h };
  }

  updateAttack(dt, game) {
    const a = this.atk;
    if (!a) return;
    a.t -= dt;
    const box = this.attackBox();
    for (const e of game.enemies) {
      if (!e.dead && !a.hit.has(e) && G.Utils.overlap(box, e.hitbox())) {
        a.hit.add(e);
        e.damage(a.cfg.damage, this.facing, game);
        game.hitstop(0.035);
        game.shake(a.cfg.shake || 1.5, 0.08);
      }
    }
    if (a.cfg.breaks && !a.broke) {
      const broken = game.world.breakInRect(box, 'B');
      if (broken.length) {
        a.broke = true;
        const T = G.CONFIG.TILE, th = G.THEMES[game.room.theme];
        broken.forEach((t) => game.particles.burst(t.tx * T + 8, t.ty * T + 8, th.crack, 8, { speed: 120 }));
        game.shake(4, 0.25);
        game.ui.toast('벽을 부쉈다!');
      }
    }
    if (a.t <= 0) this.atk = null;
  }

  // ── 그리기 ──
  pose() {
    const has = (p) => !!G.Sprites.get(this.charId, p, true);
    if (this.hovering && has('hover')) return 'hover';
    if (!this.onGround) return this.vy < 0 ? 'jump' : 'fall';
    if (Math.abs(this.vx) > 15) return ['runA', 'stand', 'runB', 'stand'][Math.floor(this.animT * this.def.runSpeed / 15) % 4];
    return 'stand';
  }

  draw(ctx, camX, camY) {
    const S = G.Sprites;
    for (const t of this.trail) S.draw(ctx, this.charId, t.pose, t.x - camX, t.y - camY, t.flip, { alpha: (t.life / 0.18) * 0.5, tint: this.def.accent });
    const blink = this.invuln > 0 && Math.floor(this.invuln * 18) % 2 === 0;
    if (!blink) {
      S.draw(ctx, this.charId, this.pose(), this.cx - camX, this.bottom - camY, this.facing < 0);
      if (this.hovering) {
        ctx.fillStyle = Math.random() < 0.5 ? '#4de8f4' : '#ffffff';
        ctx.fillRect(Math.round(this.cx - camX - 3), Math.round(this.bottom - camY + 1), 2, 2 + Math.floor(Math.random() * 3));
        ctx.fillRect(Math.round(this.cx - camX + 1), Math.round(this.bottom - camY + 1), 2, 2 + Math.floor(Math.random() * 3));
      }
    }
    this.drawAttack(ctx, camX, camY);
  }

  drawAttack(ctx, camX, camY) {
    const a = this.atk;
    if (!a) return;
    const c = a.cfg, prog = 1 - a.t / c.time;
    const cx = Math.round(this.cx - camX), cy = Math.round(this.y + this.h * 0.45 - camY);
    const r = c.w * 0.85;
    ctx.save();
    ctx.translate(cx, cy);
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.globalAlpha = 1 - prog * 0.6;
    ctx.strokeStyle = c.color;
    const sweep = -1.3 + 2.6 * Math.min(1, prog * 1.8);
    if (c.style === 'zap') {
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, 0);
      for (let i = 1; i <= 5; i++) ctx.lineTo(4 + i * (c.w / 5), (i % 2 ? -3 : 3) * (1 - prog));
      ctx.stroke();
    } else {
      ctx.lineWidth = c.style === 'heavy' ? 4 : 2;
      ctx.beginPath(); ctx.arc(0, 0, r, -1.3, sweep); ctx.stroke();
      if (c.style === 'heavy') { ctx.strokeStyle = '#f0c040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r - 5, -1.3, sweep); ctx.stroke(); }
      if (c.style === 'hack') {
        ctx.fillStyle = c.color;
        for (let i = 0; i < 3; i++) { const ang = -1 + i * 0.9 * prog; ctx.fillRect(Math.cos(ang) * (r + 3), Math.sin(ang) * (r + 3), 2, 2); }
      }
    }
    ctx.restore();
  }
};
