/** 파티클 + 링(스캔/해킹 파동) 효과. 좌표는 월드 픽셀. */
G.Particles = class {
  constructor() { this.list = []; }

  add(p) {
    const q = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 0.5, size: 1, color: '#fff', g: 0, type: 'dot' }, p);
    q.max = q.life;
    this.list.push(q);
  }

  /** o: { speed, gravity, life, size, up } */
  burst(x, y, color, n = 8, o = {}) {
    const sp = o.speed ?? 90;
    for (let i = 0; i < n; i++) {
      const a = o.up ? -Math.PI / 2 + G.Utils.rand(-1.2, 1.2) : Math.random() * Math.PI * 2;
      const v = sp * (0.4 + Math.random() * 0.6);
      this.add({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color,
        life: o.life ?? G.Utils.rand(0.25, 0.6), size: o.size ?? (Math.random() < 0.3 ? 2 : 1), g: o.gravity ?? 260,
      });
    }
  }

  ring(x, y, color, radius) { this.add({ type: 'ring', x, y, color, radius, life: 0.45 }); }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  draw(ctx, camX, camY) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.type === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.radius * (1 - a * 0.85), 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
};
