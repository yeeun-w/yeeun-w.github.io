/**
 * 픽셀아트 데이터 (문자 1개 = 픽셀 1개, '.' = 투명).
 * 오른쪽을 보는 방향으로 그린다. 왼쪽은 자동 좌우반전.
 *
 * 캐릭터: body(상체, 공통) + poses(하체, 동작별) 를 위아래로 이어붙여 프레임을 만든다.
 *         → 다리만 바꿔서 달리기/점프 애니메이션을 쉽게 추가할 수 있음.
 * 그 외:  frames 에 프레임별 전체 그림.
 * outline: 자동 1px 외곽선 색 (어두운 배경에서 실루엣이 보이도록)
 *
 * 나중에 실제 스프라이트 시트(PNG)로 바꾸려면 gfx/sprites.js 의 get() 만 교체하면 된다.
 */
G.SPRITE_DATA = {
  // ─────────────── 유나 (17세, 해커) ───────────────
  yuna: {
    outline: '#0a0b16',
    palette: {
      h: '#5a74c8', H: '#9cc0f4', L: '#c8f04a', S: '#fbe1d3', E: '#7d5ad8', p: '#f2a7b8',
      K: '#1d2030', W: '#eef0f8', n: '#34407a', D: '#2a2d44', w: '#f4f4fa', B: '#e8ecf8', b: '#5070d0',
    },
    body: [
      '......hhhhh.....',
      '....hhHHHHHhh...',
      '...hHHHHHHHHHh..',
      '.hhHHHHHHHLHHHh.',
      'hHhHHHHHHHHHHHHh',
      'hHhHHHHSHHSSHHHh',
      '.hhHHHSSSSSSSHh.',
      '.hHHHSSESSSESSh.',
      '..hHHSSESSSESS..',
      '..hHHSSSSSSpS...',
      '...hHKSSSSSK....',
      '....KKWWWWWKK...',
      '...KKKWWnWWKKK..',
      '..KKLKKWnWKKKKK.',
      '..KLLKKWWWKKKKS.',
      '..SKKKKWWWKKKKS.',
      '...KKKKKKKKKKK..',
      '....DDDDDDDD....',
      '....DDDD.DDDD...',
    ],
    poses: {
      stand: ['....SSS..SSS....', '....www..www....', '....www..www....', '...BBBb..BBBb...'],
      runA: ['...SSS....SSS...', '..www......www..', '.www........www.', 'BBb.........BBb.'],
      runB: ['.....SSSSS......', '.....wwwww......', '......www.......', '.....BBBBb......'],
      jump: ['....SSS.SSS.....', '....www..www....', '...www....BBb...', '..BBb...........'],
      fall: ['....SSS..SSS....', '...www....www...', '...www....www...', '..BBb......BBb..'],
    },
  },

  // ─────────────── 가론 (29세, 용병 기사) ───────────────
  garon: {
    outline: '#0c0608',
    palette: {
      r: '#4a0f16', R: '#8a1f28', S: '#a8714e', s: '#7a4e34', Y: '#f0c040',
      k: '#2c2428', K: '#1a1518', C: '#2a2226', c: '#7a1a24', G: '#c9a050', B: '#4a3426',
    },
    body: [
      '......rRRr........',
      '.....rRRRRr.......',
      '...rrRRRRRRrr.....',
      '..rRRRRRRRRRRRr...',
      '.rRRRRRRRRRRRRRr..',
      '.rRRRRRSSRRSSRRr..',
      'rRRRrRSSSSSSSSRr..',
      'rRRrRRSSYSSSYSSr..',
      'rRrRRRSSSSSSSSS...',
      'rRrRRRSSSSsSSS....',
      'rRrRrRkSSSSSk.....',
      '.rRCCCKKKKKKKCC...',
      '.rCCCKKGKKKKKKCC..',
      '.CCcCKKKKGKKKKKCC.',
      '.CCcKKKKKKKKKKKSC.',
      'CCcCKKGGGKKKKKKSC.',
      'CCcCKKKKKKKKKKKSS.',
      'CCcCKKKKKKKKKKKCC.',
      'CcCCKKKKKKKKKKCCC.',
      'CcCCkkkk.kkkkCCcC.',
    ],
    poses: {
      stand: ['Cc.Ckkk..kkkk.cC..', 'c...kkk..kkk..c...', '....kkk..kkk......', '....BBB..BBB......', '...BBBB..BBBB.....', '...BBBB..BBBB.....'],
      runA: ['Cc.kkk.....kkk.C..', 'c.kkk.......kkk...', '..kkk........kkk..', '.BBB.........BBB..', 'BBBB.........BBBB.', 'BBBB..........BBB.'],
      runB: ['Cc..kkkkkk...cC...', 'c....kkkk....c....', '.....kkkk.........', '.....BBBB.........', '....BBBBB.........', '....BBBBB.........'],
      jump: ['Cc.Ckkk.kkk..cC...', 'c...kkk...kkk.c...', '...kkk.....BBB....', '...BBB.....BBB....', '..BBBB............', '..BBBB............'],
      fall: ['Cc.Ckkk...kkk.cC..', 'c..kkk.....kkk.c..', '..kkk.......kkk...', '..BBB.......BBB...', '.BBBB.......BBBB..', '.BBBB.......BBBB..'],
    },
  },

  // ─────────────── Z-09 (탐사 지원 로봇) ───────────────
  z09: {
    outline: '#070912',
    palette: { A: '#e8ecf4', C: '#4de8f4', g: '#8a8ea8', W: '#eef0f6', V: '#151826', l: '#b8d8ff' },
    body: [
      '..A........A..',
      '...A......A...',
      '...CA....AC...',
      '....A....A....',
      '...gWWWWWWg...',
      '..WWWWWWWWWW..',
      '.gWVVVVVVVVWg.',
      '.CWVVCVVVCVWC.',
      '.CWVVCVVVCVWC.',
      '.gWVVVVVVVVWg.',
      '..gWWWWWWWWg..',
      '....gWWWWg....',
      '...WWlCCWWW...',
      '..gWWWWWWWWg..',
      '...gWWWWWWg...',
    ],
    poses: {
      stand: ['....WW..WW....', '....gg..gg....'],
      runA: ['...WW....WW...', '..gg......gg..'],
      runB: ['.....WWWW.....', '.....gggg.....'],
      jump: ['....WW..WW....', '....CC..CC....'],
      fall: ['...WW....WW...', '...gg....gg...'],
      hover: ['....WW..WW....', '....CC..CC....'],
    },
  },

  // ─────────────── 적 ───────────────
  crawler: {   // 보안 버그 로봇 (바닥을 기어다님)
    outline: '#05040a',
    palette: { k: '#2a1c3a', M: '#a070c0', R: '#ff4a6a' },
    frames: {
      a: ['....kkkkkk....', '..kkMMMMMMkk..', '.kMMMMMMMMMMk.', 'kMMRRMMMMRRMMk', 'kMMMMMMMMMMMMk', '.kkkkkkkkkkkk.', '..k..k..k..k..', '.k..k..k..k...'],
      b: ['....kkkkkk....', '..kkMMMMMMkk..', '.kMMMMMMMMMMk.', 'kMMRRMMMMRRMMk', 'kMMMMMMMMMMMMk', '.kkkkkkkkkkkk.', '..k..k..k..k..', '...k..k..k..k.'],
    },
  },
  drone: {     // 감시 드론 (비행, 플레이어 추적)
    outline: '#05040a',
    palette: { k: '#2a3040', M: '#9aaac8', R: '#ff5a5a' },
    frames: {
      a: ['kkkk....kkkk', '...k....k...', '...kkkkkk...', '..kMMMMMMk..', '.kMMRRRRMMk.', '..kMMMMMMk..', '...kk..kk...'],
      b: ['.kk......kk.', '...k....k...', '...kkkkkk...', '..kMMMMMMk..', '.kMMRRRRMMk.', '..kMMMMMMk..', '...kk..kk...'],
    },
  },

  // ─────────────── 아이템 / HUD ───────────────
  chip: {
    outline: '#06121a',
    palette: { g: '#1b6f88', C: '#4de8f4', L: '#ffffff' },
    frames: { a: ['..gggg..', '.gCCCCg.', 'gCCLLCCg', 'gCLCCLCg', 'gCLCCLCg', 'gCCLLCCg', '.gCCCCg.', '..gggg..'] },
  },
  heart: {
    outline: '#12060a',
    palette: { H: '#ff5a78', h: '#ffc0cc' },
    frames: { a: ['.HH.HH.', 'HhHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'] },
  },
  heartEmpty: {
    outline: '#12060a',
    palette: { H: '#3a3550', h: '#4a4566' },
    frames: { a: ['.HH.HH.', 'HhHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'] },
  },
};
