/**
 * 전역 네임스페이스 G + 게임 공통 튜닝 값.
 * 캐릭터별 이동 수치는 js/data/characters.js 에 있다.
 * (ES 모듈 대신 일반 <script> 를 써서 index.html 더블클릭으로도 실행됨)
 */
window.G = window.G || {};

G.CONFIG = {
  TILE: 16,              // 타일 크기(px)
  VIEW_W: 480,           // 내부 해상도 = 30 x 17 타일
  VIEW_H: 272,
  STEP: 1 / 60,          // 고정 업데이트 간격 → 물리가 프레임레이트에 영향받지 않음

  // ── 조작감 (메트로배니아는 여기서 다 결정된다) ──
  GRAVITY: 1500,
  MAX_FALL: 520,
  APEX_GRAVITY_MUL: 0.55,  // 점프 꼭대기에서 점프키 누르고 있으면 중력 감소 → 체공감
  APEX_THRESHOLD: 60,
  COYOTE_TIME: 0.1,        // 발판에서 떨어진 직후에도 점프 허용
  JUMP_BUFFER: 0.12,       // 착지 직전에 누른 점프도 인정
  DROP_THROUGH_TIME: 0.2,

  // ── 전투/진행 ──
  MAX_HP: 5,
  INVULN_TIME: 1.0,
  HAZARD_DAMAGE: 1,
  SWITCH_COOLDOWN: 0.3,

  CAMERA_LERP: 9,
  SAVE_KEY: 'different-network-save-v1',
  DEBUG: /[?&]debug/.test(location.search),   // 주소 뒤에 ?debug 붙이면 디버그 모드
};
