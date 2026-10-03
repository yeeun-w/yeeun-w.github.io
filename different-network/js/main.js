// 시작점: 스프라이트/배경을 미리 굽고 게임 루프 시작
window.addEventListener('load', () => {
  G.Sprites.init();
  G.Background.init();
  const game = new G.Game(document.getElementById('game'), document.getElementById('stage'));
  window.game = game; // 브라우저 콘솔에서 game.player, game.state 등으로 디버깅 가능
  game.start();
});
