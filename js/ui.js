// js/ui.js
// Управление экранами и DOM. Только показ/скрытие и обновление.

const SCREENS = [
  'menu-screen',
  'lobby-screen',
  'upgrade-screen',
  'game-screen',
  'end-screen'
];

// Показать один экран, скрыть остальные
export function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id ? 'block' : 'none');
  });
  window.__currentScreen = id;
}

// Человекочитаемое имя роли
export function formatRole(role) {
  switch (role) {
    case 'survivor':        return 'Выживший';
    case 'zombie_attacker': return 'Атакующий зомби';
    case 'zombie_tank':     return 'Танк-зомби';
    case 'zombie_support':  return 'Помогающий зомби';
    case 'zombie':          return 'Зомби';
    default:                return role || '—';
  }
}

// Лобби: список игроков
export function updateLobby(room, uid) {
  const list = document.getElementById('lobby-players');
  if (!list) return;
  list.innerHTML = '';
  if (!room || !room.players) return;

  for (const [pid, p] of Object.entries(room.players)) {
    const li = document.createElement('li');
    const isHost = room.host === pid;
    const isYou  = pid === uid;
    const ready  = p.upgradeSubmitted ? ' ✅' : '';
    li.textContent = `${p.name || 'Аноним'}${isYou ? ' (вы)' : ''}${isHost ? ' 👑' : ''} — ${formatRole(p.role)}${ready}`;
    if (isYou) li.style.background = '#25304a';
    list.appendChild(li);
  }
}

// Статусная строка лобби
export function updateLobbyStatus(text) {
  const el = document.getElementById('lobby-status');
  if (el) el.textContent = text || '';
}

// Кнопка "Старт" активна только у хоста при достаточном числе игроков
export function enableStartButton(enabled) {
  const btn = document.getElementById('start-btn');
  if (btn) btn.disabled = !enabled;
}

// Отображение ID комнаты
export function setRoomIdDisplay(roomId) {
  const el = document.getElementById('lobby-room-id');
  if (el) el.textContent = roomId || '—';
}

// Экран улучшения. role — строка, defaultUpgrades — массив объектов для показа,
// onSubmit() вызывается при нажатии "Подтвердить".
export function showUpgradeScreen(role, defaultUpgrades, onSubmit) {
  showScreen('upgrade-screen');

  // Роль
  const roleEl = document.getElementById('upgrade-role');
  if (roleEl) roleEl.textContent = formatRole(role);

  // Список стартовых улучшений (только для показа)
  const listEl = document.getElementById('upgrade-list');
  if (listEl) {
    listEl.innerHTML = '';
    if (defaultUpgrades && defaultUpgrades.length) {
      const ul = document.createElement('ul');
      ul.style.cssText = 'list-style:none;padding:0;margin:8px 0';
      for (const u of defaultUpgrades) {
        const li = document.createElement('li');
        li.style.cssText = 'padding:8px 12px;background:#1a1a22;border-radius:6px;margin:4px 0;border-left:3px solid #4ade80';
        li.innerHTML = `<b>${u.title || u.id}</b><br><span style="color:#999;font-size:13px">${u.description || ''}</span>`;
        ul.appendChild(li);
      }
      listEl.appendChild(ul);
    } else {
      listEl.textContent = 'Стартовые улучшения назначены автоматически.';
    }
  }

  // Сброс сообщений
  showUpgradeMessage('');
  setUpgradeProgress('');

  // Пересоздаём кнопку, чтобы убрать старые обработчики
  const btn = document.getElementById('upgrade-submit');
  if (btn) {
    const clone = btn.cloneNode(true);
    clone.disabled = false;
    btn.parentNode.replaceChild(clone, btn);
    clone.addEventListener('click', () => onSubmit());
  }

  // На случай, если textarea ещё используется (опционально)
  const ta = document.getElementById('upgrade-input');
  if (ta) {
    ta.disabled = false;
    ta.value = '';
    ta.parentNode.style.display = 'none'; // скрываем — не используем
  }
}

// Сообщение об ошибке/успехе
export function showUpgradeMessage(text, isError = false) {
  const el = document.getElementById('upgrade-message');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#ff6b6b' : '#6bff95';
}

// Роль на экране улучшения
export function setUpgradeRole(role) {
  const el = document.getElementById('upgrade-role');
  if (el) el.textContent = formatRole(role);
}

// Прогресс: "Готовы: 2/3"
export function setUpgradeProgress(text) {
  const el = document.getElementById('upgrade-progress');
  if (el) el.textContent = text || '';
}

// Конец игры
export function showEndScreen(winner) {
  showScreen('end-screen');
  const t = document.getElementById('end-title');
  if (!t) return;
  if (winner === 'survivor') t.textContent = '🏆 Выживший победил!';
  else if (winner === 'zombies') t.textContent = '🧟 Зомби победили!';
  else t.textContent = 'Игра окончена';
}

// HUD в игре
export function setGameStatus(text) {
  const el = document.getElementById('game-status');
  if (el) el.textContent = text || '';
}