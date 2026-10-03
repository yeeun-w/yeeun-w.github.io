# Different Network

유나 · Z-09 · 가론, 세 캐릭터를 필드에서 바꿔 가며 진행하는 **사이드뷰 메트로배니아** 프로토타입입니다.
순수 HTML5 Canvas + JavaScript로 만들었고 빌드 도구나 라이브러리가 필요 없습니다.

## 실행

- **가장 간단한 방법**: `index.html` 을 더블클릭 (ES 모듈을 쓰지 않아서 `file://` 로도 동작)
- 로컬 서버: `npm start` → http://localhost:8080
- **GitHub Pages**: 저장소 Settings → Pages → Branch `main` / `(root)` 선택하면 바로 배포됨
- 파일 하나로 합치기: `npm run build` → `dist/index.html` (itch.io 업로드용)
- 디버그 모드: 주소 뒤에 `?debug` 를 붙이거나 게임 중 `` ` `` 키 → 히트박스 표시, `U` 로 전원 합류

## 조작

| 키 | 동작 |
|---|---|
| ← → | 이동 |
| Z / Space | 점프 (길게 = 높이, 짧게 = 낮게) |
| ↓ + Z | 발판 아래로 내려가기 |
| X | 공격 |
| C | 캐릭터 고유 능력 |
| Shift | 대시 (유나) |
| 1 · 2 · 3 / Q · E | 캐릭터 전환 |
| Esc | 일시정지 |

## 캐릭터와 진행 구조

능력 하나가 길 하나를 연다는 원칙으로 맵을 설계했습니다.

| 캐릭터 | 체형 | 이동 | 고유 능력 (C) | 여는 길 |
|---|---|---|---|---|
| 유나 | 10×22 | 가장 빠름, 더블 점프, 대시 | 해킹: 터미널 근처면 방의 보안문 전부 개방, 아니면 EMP로 적 기절 | 보안문 `D` |
| Z-09 | 10×14 | 공중에서 점프키를 누르고 있으면 호버 비행 | 스캔: 숨겨진 벽 `h` 을 통로로 | 1칸 통로, 넓은 가시밭, 비밀 방 |
| 가론 | 12×25 | 느리고 무거움, 공격력 최고 | 강공격: 금 간 벽 `B` 덩어리 파괴 | 금 간 벽 |

```
[A 옥상][B 네온 골목 ][C 정거장 게이트][D 탑 ]
             [F 코어 ][E 지하 회랑      ][  ↓ ]
```

A(시작) → B(해킹) → C(Z-09 합류, 좁은 통로·호버) → D(가론 합류) → E(세 능력 모두) → F(엔딩).
A 의 금 간 벽 안쪽 칩은 가론을 얻은 뒤 돌아와야 하는 백트래킹 보상입니다.

## 폴더 구조

```
index.html              진입점 (스크립트 로드 순서가 곧 의존성 순서)
css/style.css           DOM UI 스타일 (한글 텍스트는 선명하게 DOM으로 그림)
js/
  core/
    config.js           ★ 공통 튜닝 값 (중력, 코요테 타임, 점프 버퍼 …)
    input.js            키 배치 (KEYMAP)
    physics.js          타일 충돌 (x/y 분리 이동, 발판)
    utils.js
  data/                 ← 게임 내용은 대부분 여기서 수정
    characters.js       ★ 캐릭터 스탯 · 공격 · 스킬
    rooms.js            ★ 맵 (문자 그리드) + 타일 범례
    sprite-data.js      ★ 픽셀아트 (문자 그리드)
    themes.js           구역별 색상
  gfx/
    sprites.js          픽셀아트 → 캔버스 캐시, 그리기
    tiles.js            타일 속성 · 엔티티 마커 · 타일 그리기
    background.js       3겹 패럴랙스 배경 생성
    particles.js
  world/world.js        방 배치, 월드 좌표 타일 조회, 문 열기/벽 부수기
  entities/
    player.js           이동·점프·대시·호버·공격 (모든 캐릭터 공통 로직)
    enemies.js          Crawler(기는 적), Drone(나는 적)
    items.js            데이터 칩, 체력, 동료 합류
  ui/ui.js, ui/hud.js   DOM 텍스트 UI / 캔버스 HUD·미니맵
  game.js               상태 전환, 메인 루프, 방 입장, 피해·사망·저장
  main.js               시작점
tools/build-single.js   단일 HTML 빌드
docs/DESIGN.md          설계 메모
```

## 개발 가이드

### 1. 조작감 다듬기 (가장 먼저)
`js/core/config.js` 와 `js/data/characters.js` 의 숫자만 바꿔 보세요.
점프 높이 ≈ `jumpVel² / (2 × GRAVITY × gravityMul)`. 현재 유나 약 4칸, Z-09·가론 약 3.5칸.
맵의 발판은 "3칸 위"를 기준으로 배치되어 있으니 점프를 낮추면 맵도 함께 조정해야 합니다.

### 2. 방 추가
`js/data/rooms.js` 에 객체 하나를 추가합니다.

```js
{ id: 'G', name: '새 방', sub: '부제', theme: 'station', x: 140, y: 0,
  signs: ['표지판 문구'],
  map: [ '##########', '#........#', ... ] }
```

- `x, y` 는 월드 타일 좌표. 다른 방과 **붙여 놓기만 하면** 자동으로 연결됩니다.
- 출입구는 양쪽 방에서 **같은 월드 행(또는 열)** 이 비어 있어야 합니다.
- 30×17 이 화면 한 장. 더 크게 만들면 카메라가 따라 스크롤합니다.
- 방 바깥은 벽으로 취급되므로 월드 밖으로 떨어질 일은 없습니다.

### 3. 캐릭터 추가
1. `characters.js` 에 정의 + `G.PARTY_ORDER` 에 id 추가
2. `sprite-data.js` 에 같은 id 로 `body` + `poses` 작성
3. `tiles.js` 의 `G.ENTITY_MARKERS` 에 합류 마커 문자 추가 (예: `'k': 'recruit:newchar'`)

### 4. 스프라이트
`sprite-data.js` 의 문자 하나가 픽셀 하나입니다. 몸통(`body`) 아래에 다리(`poses`)를 이어 붙여 프레임을 만들기 때문에 다리 줄만 바꿔서 동작을 늘릴 수 있습니다.
실제 PNG 스프라이트 시트로 교체하려면 `gfx/sprites.js` 의 `get(name, frame)` 이 `Image` 를 돌려주도록만 바꾸면 나머지 코드는 그대로 동작합니다.

### 5. 적 추가
`enemies.js` 에서 `G.Enemy` 를 상속해 `update` / `draw` 작성 → `tiles.js` 마커 추가 → `game.js` 의 `enterRoom` 에서 생성.

## 다음 단계 아이디어
- 보스전 (가론의 저주받은 검 / 폐정거장 AI)
- 사운드 (WebAudio로 효과음, 구역별 BGM)
- 게임패드 · 모바일 터치 버튼
- 능력 업그레이드 (유나 벽 점프, Z-09 연료 증가, 가론 룬 스킬)
- 실제 스프라이트 시트 적용, 세이브 슬롯 여러 개
