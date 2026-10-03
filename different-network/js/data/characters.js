/**
 * 플레이어블 캐릭터 정의.
 *
 * 새 캐릭터 추가 방법
 *  1) 아래 G.CHARACTERS 에 항목 추가 (스탯 + 공격 + 스킬)
 *  2) data/sprite-data.js 에 같은 id 로 스프라이트 추가
 *  3) G.PARTY_ORDER 에 id 추가 (숫자키 순서)
 *  4) 맵에 합류 지점 마커를 두고 world 의 ENTITY_MARKERS 에 연결
 *
 * 이동 수치 단위: px/s (속도), px/s² (가속)
 * 점프 높이 ≈ jumpVel² / (2 × GRAVITY × gravityMul)
 */
G.PARTY_ORDER = ['yuna', 'z09', 'garon'];

G.CHARACTERS = {
  // 빠르고 가벼움. 더블 점프 + 대시. 터미널 해킹으로 보안문 개방.
  yuna: {
    id: 'yuna', name: '유나', color: '#9cc0f4', accent: '#c8f04a',
    w: 10, h: 22,
    runSpeed: 150, accel: 1500, airAccel: 1200, friction: 1900,
    jumpVel: 430, jumpCut: 0.45, gravityMul: 1.0, maxJumps: 2,
    dash: { speed: 380, time: 0.14, cooldown: 0.45 },
    attack: { w: 20, h: 14, damage: 1, time: 0.15, cooldown: 0.24, color: '#c8f04a', style: 'hack' },
    skill: { name: '해킹', cooldown: 0.6, use: (p, game) => G.Skills.hack(p, game) },
    hint: '[X] 해킹툴  [C] 해킹 / EMP  [Shift] 대시  · 더블 점프',
    recruitLine: null,
  },

  // 작고 가벼움. 1칸 높이 통로 통과 + 호버 비행. 스캔으로 숨겨진 벽 발견.
  z09: {
    id: 'z09', name: 'Z-09', color: '#b8d8ff', accent: '#4de8f4',
    w: 10, h: 14,
    runSpeed: 135, accel: 1300, airAccel: 1100, friction: 1700,
    jumpVel: 400, jumpCut: 0.45, gravityMul: 1.0, maxJumps: 1,
    hover: { fuel: 2.2, fallSpeed: 22 },   // 공중에서 점프키를 누르고 있으면 천천히 하강
    attack: { w: 18, h: 10, damage: 1, time: 0.14, cooldown: 0.3, color: '#4de8f4', style: 'zap' },
    skill: { name: '스캔', cooldown: 1.0, use: (p, game) => G.Skills.scan(p, game) },
    hint: '[X] 전기 충격  [C] 스캔  [Z 길게] 호버 비행  · 좁은 통로 통과',
    recruitLine: '…데이터가… 손상되어… 하지만, 아직… 함께… 가도 될까요…?',
  },

  // 느리고 묵직함. 공격력 최강. 강공격으로 금 간 벽 파괴.
  garon: {
    id: 'garon', name: '가론', color: '#c94a4a', accent: '#f0c040',
    w: 12, h: 25,
    runSpeed: 120, accel: 1100, airAccel: 900, friction: 1600,
    jumpVel: 410, jumpCut: 0.5, gravityMul: 1.05, maxJumps: 1,
    attack: { w: 26, h: 20, damage: 2, time: 0.2, cooldown: 0.38, color: '#f0c040', style: 'slash' },
    heavy: { w: 36, h: 28, damage: 4, time: 0.28, cooldown: 0.3, color: '#e0483a', style: 'heavy', breaks: true, lunge: 200, shake: 3 },
    skill: { name: '강공격', cooldown: 0.8, use: (p, game) => G.Skills.heavySlash(p, game) },
    hint: '[X] 검격  [C] 강공격 (금 간 벽 파괴)',
    recruitLine: '……끝내야 한다. 이 검이 더 이상, 누구도 상처 입히지 않도록.',
  },
};

/** 스킬 구현. 반환값이 false 면 쿨다운을 소모하지 않는다. */
G.Skills = {
  /** 유나: 근처 터미널이 있으면 그 방의 보안문(D)을 모두 연다. 없으면 EMP 로 적 기절. */
  hack(p, game) {
    const T = G.CONFIG.TILE, w = game.world;
    const term = w.findTileNear(p.cx, p.cy, 'T', 32);
    if (term) {
      game.particles.ring(term.tx * T + 8, term.ty * T + 8, '#c8f04a', 44);
      const opened = w.replaceInRoom(w.roomAtTile(term.tx, term.ty), 'D', '.');
      if (opened.length) {
        opened.forEach((t) => game.particles.burst(t.tx * T + 8, t.ty * T + 8, '#c8f04a', 5, { speed: 70 }));
        game.ui.toast('보안 해제 — 문이 열렸다!');
        game.shake(2, 0.2);
      } else game.ui.toast('이미 해제된 터미널이다');
      return true;
    }
    game.particles.ring(p.cx, p.cy, '#c8f04a', 60);
    let n = 0;
    for (const e of game.enemies) {
      if (!e.dead && G.Utils.dist(e.cx, e.cy, p.cx, p.cy) < 60) { e.stun(1.6); n++; }
    }
    if (n) game.ui.toast(`EMP — 적 ${n}기 기절`);
    return true;
  },

  /** 가론: 넓고 강한 베기. 히트박스에 닿은 금 간 벽(B) 덩어리를 통째로 파괴. */
  heavySlash(p, game) {
    if (p.atk) return false;
    p.startAttack(p.def.heavy, game);
    game.shake(2, 0.12);
    return true;
  },

  /** Z-09: 반경 안의 숨겨진 벽(h)을 통로로 바꾼다. */
  scan(p, game) {
    const T = G.CONFIG.TILE, R = 100;
    game.particles.ring(p.cx, p.cy, '#4de8f4', R);
    const found = game.world.replaceInRadius(p.cx, p.cy, R, 'h', '.');
    found.forEach((t) => game.particles.burst(t.tx * T + 8, t.ty * T + 8, '#4de8f4', 6, { speed: 50, gravity: 0 }));
    game.ui.toast(found.length ? '숨겨진 통로 발견!' : '스캔 완료 — 특이사항 없음');
    return true;
  },
};
