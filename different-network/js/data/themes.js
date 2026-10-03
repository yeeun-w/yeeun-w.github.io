/**
 * 구역별 색 테마. 캐릭터 시트 색감에서 가져옴.
 *  city    — 유나 (네온 야경, 라임 포인트)
 *  station — Z-09 (폐우주정거장, 시안 포인트)
 *  ruins   — 가론 (몰락한 왕국, 붉은 달 + 금장식)
 * pattern: 'panel' = 금속 패널, 'brick' = 석조 벽돌
 */
G.THEMES = {
  city: {
    pattern: 'panel',
    sky: ['#13142c', '#272352', '#45306a'], stars: '#cfd6ff', moon: '#efe6ff',
    far: '#1d2046', mid: '#262a58', near: '#0f1024', lightA: '#c8f04a', lightB: '#ff7ac8',
    wall: '#353a6c', wallLight: '#7c86d4', wallDark: '#22264a', wallDeep: '#1a1d3a',
    accent: '#c8f04a', platform: '#6f78c0', spike: '#d9dcf5', spikeHi: '#ffffff', crack: '#555a8c',
  },
  station: {
    pattern: 'panel',
    sky: ['#070b16', '#0f1a30', '#16284a'], stars: '#e0f4ff', moon: '#9fd8ff',
    far: '#132038', mid: '#1b2c4a', near: '#0a1222', lightA: '#4de8f4', lightB: '#9fb8ff',
    wall: '#34425e', wallLight: '#8aa2c8', wallDark: '#212b40', wallDeep: '#182033',
    accent: '#4de8f4', platform: '#6c82a8', spike: '#cfe8ff', spikeHi: '#ffffff', crack: '#56648a',
  },
  ruins: {
    pattern: 'brick',
    sky: ['#1a0c10', '#3e161c', '#6a2626'], stars: '#ffcfa0', moon: '#e05a4a',
    far: '#2a1216', mid: '#22100f', near: '#0e0607', lightA: '#f0b040', lightB: '#c9502e',
    wall: '#3a2c2e', wallLight: '#7a6058', wallDark: '#241a1c', wallDeep: '#1a1214',
    accent: '#c9a050', platform: '#6a5048', spike: '#d8c8b8', spikeHi: '#fff4e0', crack: '#5a4440',
  },
};
