// js/ui.js
// BUG2-FIX4: карточки (2 на слот), клик для выбора, confirm.
const SCREENS = ['menu-screen','lobby-screen','upgrade-screen','game-screen','end-screen'];

export function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id ? 'block' : 'none');
  });
  window.__currentScreen = id;
}

export function formatRole(role) {
  switch (role) {
    case 'survivor': return 'Выживший';
    case 'zombie_attacker': return 'Атакующий зомби';
    case 'zombie_tank': return 'Танк-зомби';
    case 'zombie_support': return 'Помогающий зомби';
    default: return role || '—';
  }
}

function formatSlot(slot) {
  return slot === 'main' ? 'Основная атака'
    : slot === 'secondary' ? 'Второстепенная'
    : slot === 'passive' ? 'Пассивный бафф' : slot;
}

export function updateLobby(room, uid) {
  const list = document.getElementById('lobby-players');
  if (!list) return;
  list.innerHTML = '';
  if (!room?.players) return;
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

export function updateLobbyStatus(text) {
  const el = document.getElementById('lobby-status');
  if (el) el.textContent = text || '';
}

export function enableStartButton(enabled) {
  const btn = document.getElementById('start-btn');
  if (btn) btn.disabled = !enabled;
}

export function setRoomIdDisplay(roomId) {
  const el = document.getElementById('lobby-room-id');
  if (el) el.textContent = roomId || '—';
}

// BUG2-FIX4: карточки по 2 на слот, выбор кликом
export function showUpgradeScreen(role, choices, onSubmit) {
  showScreen('upgrade-screen');

  const roleEl = document.getElementById('upgrade-role');
  if (roleEl) roleEl.textContent = formatRole(role);

  const listEl = document.getElementById('upgrade-list');
  listEl.innerHTML = '';

  const selections = {}; // slot -> id

  for (const [slot, upgrades] of Object.entries(choices)) {
    const slotDiv = document.createElement('div');
    slotDiv.style.cssText = 'margin: 12px 0; padding: 10px; background: #1a1a22; border-radius: 6px';

    const slotLabel = document.createElement('div');
    slotLabel.textContent = formatSlot(slot);
    slotLabel.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #4ade80';
    slotDiv.appendChild(slotLabel);

    const cardsDiv = document.createElement('div');
    cardsDiv.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap';

    for (const upg of upgrades) {
      if (!upg) continue;
      const card = document.createElement('button');
      card.dataset.id = upg.id;
      card.style.cssText = 'flex: 1 1 200px; padding: 10px; background: #2a2a3a; color: #fff; border: 2px solid transparent; border-radius: 6px; text-align: left; cursor: pointer; font-size: 14px';
      card.innerHTML = `<b>${upg.title}</b><br><span style="color:#999;font-size:12px">${upg.description || ''}</span>`;
      card.onclick = () => {
        cardsDiv.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
        card.style.borderColor = '#4ade80';
        selections[slot] = upg.id;
        checkReady();
      };
      cardsDiv.appendChild(card);
    }
    slotDiv.appendChild(cardsDiv);
    listEl.appendChild(slotDiv);
  }

  showUpgradeMessage('');
  setUpgradeProgress('');

  const btn = document.getElementById('upgrade-submit');
  if (btn) {
    const clone = btn.cloneNode(true);
    clone.disabled = true;
    btn.parentNode.replaceChild(clone, btn);

    const checkReady = () => {
      const allFilled = Object.keys(choices).every(slot => selections[slot]);
      clone.disabled = !allFilled;
    };

    clone.onclick = () => {
      const allIds = Object.entries(selections).map(([_, id]) => id).filter(Boolean);
      if (allIds.length === 0) return;
      onSubmit(allIds);
    };
  }

  const ta = document.getElementById('upgrade-input');
  if (ta) ta.style.display = 'none';
}

export function showUpgradeMessage(text, isError = false) {
  const el = document.getElementById('upgrade-message');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#ff6b6b' : '#6bff95';
}

export function setUpgradeRole(role) {
  const el = document.getElementById('upgrade-role');
  if (el) el.textContent = formatRole(role);
}

export function setUpgradeProgress(text) {
  const el = document.getElementById('upgrade-progress');
  if (el) el.textContent = text || '';
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
  if (el) el.textContent = text || '';
}