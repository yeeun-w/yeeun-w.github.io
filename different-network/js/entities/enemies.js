/**
 * 적. 새 적 추가: G.Enemy 를 상속해서 update/draw 만 작성 → tiles.js ENTITY_MARKERS 와 game.js spawnEntity 에 연결.
 */
G.Enemy = class {
  constructor(x, y, w, h, hp) {
    Object.assign(this, { x, y, w, h, hp, maxHp: hp, vx: 0, vy: 0, onGround: false, flash: 0, stunT: 0, dead: false, t: Math.random() * 10, dir: -1 });
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  damage(n, dir, game) {
    if (this.dead) return;
    this.hp -= n;
    this.flash = 0.12;
    this.vx = dir * 140;
    this.vy = this.gravity ? -140 : -40;
    game.particles.burst(this.cx, this.cy, '#ffffff', 5);
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    this.dead = true;
    game.particles.burst(this.cx, this.cy, this.deathColor || '#ff4a6a', 14, { speed: 110 });
    if (Math.random() < 0.3 && game.state.hp < G.CONFIG.MAX_HP) game.items.push(new G.Item('heart', this.cx, this.cy, null));
  }

  stun(t) { this.stunT = Math.max(this.stunT, t); }

  drawSprite(ctx, camX, camY, name, frame, flip) {
    const opt = this.flash > 0 ? { tint: '#ffffff' } : {};
    G.Sprites.draw(ctx, name, frame, this.cx - camX, this.bottom - camY, flip, opt);
    if (this.stunT > 0 && Math.floor(this.t * 10) % 2) {
      ctx.fillStyle = '#c8f04a';
      ctx.fillRect(Math.round(this.cx - camX - 4), Math.round(this.y - camY - 4), 2, 2);
      ctx.fillRect(Math.round(this.cx - camX + 3), Math.round(this.y - camY - 3), 2, 2);
    }
  }
};

/** 바닥을 기어다니다 벽/낭떠러지에서 방향 전환 */
G.Crawler = class extends G.Enemy {
  constructor(x, y) { super(x, y, 14, 10, 3); this.gravity = true; this.speed = 32; this.deathColor = '#ff4a6a'; }

  update(dt, game) {
    const w = game.world, T = G.CONFIG.TILE, U = G.Utils;
    this.t += dt; this.flash -= dt;
    if (this.stunT > 0) {
      this.stunT -= dt;
      this.vx = U.approach(this.vx, 0, 600 * dt);
    } else {
      if (this.onGround) {
        const aheadX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
        const tx = Math.floor(aheadX / T);
        const footTy = Math.floor((this.bottom + 1) / T);
        const ground = w.isSolid(tx, footTy) || w.isOneway(tx, footTy);
        const wall = w.isSolid(tx, Math.floor((this.bottom - 1) / T));
        if (!ground || wall || w.isHazard(tx, footTy)) this.dir *= -1;
      }
      this.vx = U.approach(this.vx, this.dir * this.speed, 300 * dt);
    }
    this.vy = Math.min(this.vy + G.CONFIG.GRAVITY * dt, G.CONFIG.MAX_FALL);
    G.Physics.moveX(this, this.vx * dt, w);
    G.Physics.moveY(this, this.vy * dt, w);
  }

  draw(ctx, camX, camY) { this.drawSprite(ctx, camX, camY, 'crawler', Math.floor(this.t * 6) % 2 ? 'a' : 'b', this.dir > 0); }
};

/** 떠다니다가 가까이 오면 추적 */
G.Drone = class extends G.Enemy {
  constructor(x, y) { super(x, y, 12, 9, 2); this.gravity = false; this.hx = x; this.hy = y; this.deathColor = '#ff8a5a'; }

  update(dt, game) {
    const U = G.Utils, p = game.player;
    this.t += dt; this.flash -= dt;
    const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
    let tvx, tvy;
    if (this.stunT > 0) { this.stunT -= dt; tvx = 0; tvy = 20; }
    else if (d < 130) { tvx = (dx / d) * 48; tvy = (dy / d) * 48 + Math.sin(this.t * 4) * 20; }
    else { tvx = (this.hx - this.x) * 1.5; tvy = (this.hy - this.y) * 1.5 + Math.sin(this.t * 3) * 15; }
    this.vx = U.approach(this.vx, tvx, 200 * dt);
    this.vy = U.approach(this.vy, tvy, 200 * dt);
    if (tvx) this.dir = Math.sign(tvx);
    G.Physics.moveX(this, this.vx * dt, game.world);
    G.Physics.moveY(this, this.vy * dt, game.world, true);
  }

  draw(ctx, camX, camY) { this.drawSprite(ctx, camX, camY, 'drone', Math.floor(this.t * 12) % 2 ? 'a' : 'b', this.dir > 0); }
};
