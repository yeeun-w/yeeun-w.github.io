/**
 * 줍는 것들: 데이터 칩, 체력, 동료 합류 지점.
 * x, y = 칩/체력은 중심, 동료는 (중심x, 발바닥y)
 */
G.Item = class {
  constructor(type, x, y, key, data = {}) {
    Object.assign(this, { type, x, y, key, data, t: Math.random() * 6, dead: false });
  }

  box() {
    if (this.type === 'recruit') return { x: this.x - 8, y: this.y - 24, w: 16, h: 24 };
    return { x: this.x - 6, y: this.y - 6, w: 12, h: 12 };
  }

  update(dt, game) {
    this.t += dt;
    if (G.Utils.overlap(this.box(), game.player.hitbox())) game.collectItem(this);
  }

  draw(ctx, camX, camY) {
    const bob = Math.round(Math.sin(this.t * 3) * 2);
    const x = this.x - camX, y = this.y - camY;
    if (this.type === 'chip') {
      ctx.fillStyle = 'rgba(77,232,244,0.18)'; ctx.fillRect(Math.round(x - 7), Math.round(y - 7 + bob), 14, 14);
      G.Sprites.draw(ctx, 'chip', 'a', x, y + 5 + bob);
    } else if (this.type === 'heart') {
      G.Sprites.draw(ctx, 'heart', 'a', x, y + 4 + bob);
    } else if (this.type === 'recruit') {
      const def = G.CHARACTERS[this.data.charId];
      ctx.fillStyle = def.color; ctx.globalAlpha = 0.18 + Math.sin(this.t * 3) * 0.08;
      ctx.beginPath(); ctx.ellipse(x, y - 1, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      G.Sprites.draw(ctx, def.id, 'stand', x, y, true);
      // 머리 위 "!" 말풍선
      const by = Math.round(y - def.h - 14 + bob);
      ctx.fillStyle = '#f4f4fa'; ctx.fillRect(Math.round(x - 3), by, 7, 9);
      ctx.fillStyle = '#1d2030'; ctx.fillRect(Math.round(x), by + 2, 1, 4); ctx.fillRect(Math.round(x), by + 7, 1, 1);
    }
  }
};
