(() => {
  const players = [...document.querySelectorAll('.player')];
  function stop(player) {
    player.dataset.ticket = String(Number(player.dataset.ticket || 0) + 1);
    player.classList.remove('is-playing', 'is-loading');
    player.setAttribute('aria-pressed', 'false');
    player.removeAttribute('aria-busy');
    player.querySelector('img').src = player.dataset.poster;
    player.querySelector('.play-label span').textContent = '播放 GIF';
  }
  function play(player) {
    if (player.classList.contains('is-playing') || player.classList.contains('is-loading')) return;
    const ticket = String(Number(player.dataset.ticket || 0) + 1);
    player.dataset.ticket = ticket;
    player.classList.add('is-loading');
    player.setAttribute('aria-busy', 'true');
    player.querySelector('.play-label span').textContent = '加载中…';
    const preload = new Image();
    preload.onload = () => {
      if (player.dataset.ticket !== ticket) return;
      player.querySelector('img').src = player.dataset.gif;
      player.classList.remove('is-loading');
      player.classList.add('is-playing');
      player.removeAttribute('aria-busy');
      player.setAttribute('aria-pressed', 'true');
      player.querySelector('.play-label span').textContent = '停止播放';
    };
    preload.onerror = () => {
      if (player.dataset.ticket !== ticket) return;
      stop(player);
      player.querySelector('.play-label span').textContent = '重试播放';
    };
    preload.src = player.dataset.gif;
  }
  for (const player of players) player.addEventListener('click', () => {
    if (player.classList.contains('is-playing') || player.classList.contains('is-loading')) stop(player);
    else play(player);
  });
  const actionsButton = document.querySelector('#toggle-actions');
  document.querySelector('#stop-all').addEventListener('click', () => {
    players.forEach(stop);
    actionsButton.setAttribute('aria-pressed', 'false');
    actionsButton.textContent = '播放全部动作';
  });
  actionsButton.addEventListener('click', () => {
    const playing = actionsButton.getAttribute('aria-pressed') !== 'true';
    players.filter(p => p.dataset.kind === 'action').forEach(playing ? play : stop);
    actionsButton.setAttribute('aria-pressed', String(playing));
    actionsButton.textContent = playing ? '停止全部动作' : '播放全部动作';
  });
  // Only the overview starts automatically; the rest load on request.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play(document.querySelector('.hero-player'));
  // Leave the page with no invisible animations continuing in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      players.forEach(stop);
      actionsButton.setAttribute('aria-pressed', 'false');
      actionsButton.textContent = '播放全部动作';
    }
  });
})();
