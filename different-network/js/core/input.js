/**
 * 키보드 입력. 키 배치를 바꾸려면 KEYMAP 만 수정하면 된다.
 * isDown: 누르고 있는 중 / wasPressed: 이번 업데이트에 막 누름 / wasReleased: 막 뗌
 */
G.Input = (() => {
  const KEYMAP = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    jump: ['KeyZ', 'Space', 'KeyK'],
    attack: ['KeyX', 'KeyJ'],
    skill: ['KeyC', 'KeyL'],
    dash: ['ShiftLeft', 'ShiftRight'],
    prev: ['KeyQ'],
    next: ['KeyE'],
    char1: ['Digit1'],
    char2: ['Digit2'],
    char3: ['Digit3'],
    pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'KeyZ', 'Space'],
    continue: ['KeyC'],
    restart: ['KeyR'],
    debugToggle: ['Backquote'],
    debugUnlock: ['KeyU'],
  };
  const PREVENT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);
  const down = new Set(), pressed = new Set(), released = new Set();

  window.addEventListener('keydown', (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    down.add(e.code);
    pressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => { down.delete(e.code); released.add(e.code); });
  window.addEventListener('blur', () => down.clear());

  const any = (set, action) => (KEYMAP[action] || []).some((c) => set.has(c));
  return {
    KEYMAP,
    isDown: (a) => any(down, a),
    wasPressed: (a) => any(pressed, a),
    wasReleased: (a) => any(released, a),
    /** 고정 업데이트 1회가 끝날 때마다 호출 */
    endFrame() { pressed.clear(); released.clear(); },
  };
})();
