// Управление DOM-экранами. Никакой бизнес-логики — только показ/скрытие и обновление.

const SCREENS = [
  'menu-screen',
  'lobby-screen',
  'upgrade-screen',
  'game-screen',
  'end-screen'
];

export function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id ? 'block' : 'none');
  });
  window.__currentScreen = id;
}

export function updateLobby(room, uid) {
  const list = document.getElementById('lobby-players');
  if (!list) return;
  list.innerHTML = '';

  if (!room || !room.players) return;

  for (const [pid, p] of Object.entries(room.players)) {
    const li = document.createElement('li');
    const isHost = room.host === pid;
    const isYou = pid === uid;
    const roleLabel = formatRole(p.role);
    li.textContent = `${p.name || 'Аноним'}${isYou ? ' (вы)' : ''}${isHost ? ' 👑' : ''} — ${roleLabel}`;
    list.appendChild(li);
  }

  const idEl = document.getElementById('lobby-room-id');
  if (idEl) idEl.textContent = room.id || '';
}

export function updateLobbyStatus(text) {
  const el = document.getElementById('lobby-status');
  if (el) el.textContent = text;
}

export function enableStartButton(enabled) {
  const btn = document.getElementById('start-btn');
  if (btn) btn.disabled = !enabled;
}

export function setRoomIdDisplay(roomId) {
  const el = document.getElementById('lobby-room-id');
  if (el) el.textContent = roomId;
}

// Показать экран улучшения и повесить обработчик кнопки
export function showUpgradeScreen(onSubmit) {
  showScreen('upgrade-screen');
  const btn = document.getElementById('upgrade-submit');
  const ta = document.getElementById('upgrade-input');
  const msg = document.getElementById('upgrade-message');
  const progress = document.getElementById('upgrade-progress');

  if (msg) msg.textContent = '';
  if (progress) progress.textContent = '';
  if (ta) ta.disabled = false;
  if (btn) btn.disabled = false;

  // Клонирование для удаления старых обработчиков
  if (btn) {
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener('click', () => {
      const text = ta ? ta.value : '';
      onSubmit(text);
    });
  }
}

export function showUpgradeMessage(text, isError = false) {
  const el = document.getElementById('upgrade-message');
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#ff6b6b' : '#6bff95';
}

export function setUpgradeRole(role) {
  const el = document.getElementById('upgrade-role');
  if (el) el.textContent = formatRole(role);
}

export function setUpgradeProgress(text) {
  const el = document.getElementById('upgrade-progress');
  if (el) el.textContent = text;
}

export function showEndScreen(winner) {
  showScreen('end-screen');
  const t = document.getElementById('end-title');
  if (!t) return;
  if (winner === 'survivor') t.textContent = '🏆 Выживший победил!';
  else if (winner === 'zombies') t.textContent = '🧟 Зомби победили!';
  else t.textContent = 'Игра окончена';
}

export function setGameStatus(text) {
  const el = document.getElementById('game-status');
  if (el) el.textContent = text;
}

// Форматирование роли для отображения
export function formatRole(role) {
  switch (role) {
    case 'survivor':        return 'Выживший';
    case 'zombie_attacker': return 'Атакующий зомби';
    case 'zombie_tank':     return 'Танк';
    case 'zombie_support':  return 'Помогающий';
    case 'zombie':          return 'Зомби';
    default:                return role || '—';
  }
}