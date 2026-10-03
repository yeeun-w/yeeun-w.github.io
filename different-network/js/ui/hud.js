/** 캔버스 HUD: 초상화, 체력, 파티 슬롯, 호버 연료, 미니맵, 칩 개수 */
G.HUD = class {
  draw(ctx, game) {
    const p = game.player, st = game.state, C = G.CONFIG;
    // 플레이어가 HUD 뒤에 있으면 반투명하게
    const sx = p.cx - game.cam.x, sy = p.cy - game.cam.y;
    ctx.save();
    if (sx < 90 && sy < 44) ctx.globalAlpha = 0.3;

    // 초상화
    ctx.fillStyle = 'rgba(8,10,20,0.75)'; ctx.fillRect(4, 4, 26, 26);
    ctx.fillStyle = p.def.color;
    ctx.fillRect(4, 4, 26, 1); ctx.fillRect(4, 29, 26, 1); ctx.fillRect(4, 4, 1, 26); ctx.fillRect(29, 4, 1, 26);
    G.Sprites.drawPortrait(ctx, p.charId, 5, 5, 24);

    // 체력
    for (let i = 0; i < C.MAX_HP; i++) G.Sprites.drawTopLeft(ctx, i < st.hp ? 'heart' : 'heartEmpty', 'a', 33 + i * 10, 4);

    // 파티 슬롯 (1·2·3)
    ctx.font = '8px Silkscreen, monospace'; ctx.textBaseline = 'top';
    G.PARTY_ORDER.forEach((id, i) => {
      const x = 34 + i * 13, y = 15, has = st.party.includes(id), cur = id === p.charId;
      ctx.fillStyle = cur ? G.CHARACTERS[id].color : has ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y, 11, 9);
      ctx.fillStyle = cur ? '#0b0c16' : has ? '#e8ecff' : '#4a4f70';
      ctx.fillText(String(i + 1), x + 3, y);
    });

    // 호버 연료
    if (p.def.hover) {
      const f = Math.max(0, p.fuel[p.charId] / p.def.hover.fuel);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(34, 26, 37, 3);
      ctx.fillStyle = p.def.accent; ctx.fillRect(34, 26, Math.round(37 * f), 3);
    }

    ctx.restore();
    ctx.save();
    if (sx > C.VIEW_W - 90 && sy < 44) ctx.globalAlpha = 0.3;
    this.drawMinimap(ctx, game);
    ctx.restore();
  }

  drawMinimap(ctx, game) {
    const C = G.CONFIG, w = game.world, b = w.bounds, s = 0.5;
    const mw = Math.ceil(b.w * s), mh = Math.ceil(b.h * s);
    const mx = C.VIEW_W - mw - 6, my = 6;
    ctx.fillStyle = 'rgba(8,10,20,0.7)'; ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4);
    for (const r of w.rooms) {
      if (!game.state.visited.has(r.id)) continue;
      const x = mx + Math.floor((r.x - b.x) * s), y = my + Math.floor((r.y - b.y) * s);
      ctx.fillStyle = r === game.room ? G.THEMES[r.theme].accent : 'rgba(150,160,220,0.45)';
      ctx.fillRect(x, y, Math.floor(r.w * s) - 1, Math.floor(r.h * s) - 1);
    }
    if (Math.floor(game.time * 3) % 2) {
      const T = C.TILE, p = game.player;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx + Math.floor((p.cx / T - b.x) * s) - 1, my + Math.floor((p.cy / T - b.y) * s) - 1, 2, 2);
    }
    // 데이터 칩
    G.Sprites.drawTopLeft(ctx, 'chip', 'a', mx - 1, my + mh + 4);
    ctx.fillStyle = '#e8ecff'; ctx.font = '8px Silkscreen, monospace'; ctx.textBaseline = 'top';
    ctx.fillText(`${game.state.chips}/${w.totalChips}`, mx + 11, my + mh + 4);
  }
};
