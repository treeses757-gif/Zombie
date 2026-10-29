export function showUpgradeScreen(role, choices, onSubmit) {
  showScreen('upgrade-screen');

  const roleEl = document.getElementById('upgrade-role');
  if (roleEl) roleEl.textContent = formatRole(role);

  const listEl = document.getElementById('upgrade-list');
  listEl.innerHTML = '';

  const selections = {};

  // UI-FIX: ссылка на кнопку определяем СРАЗУ, до создания карточек
  let confirmBtn = document.getElementById('upgrade-submit');

  // UI-FIX: checkReady объявлена в области видимости showUpgradeScreen,
  // поэтому доступна и из card.onclick, и из обработчика кнопки.
  const checkReady = () => {
    if (!confirmBtn) return;
    const slots = Object.keys(choices);
    if (slots.length === 0) return;
    const allFilled = slots.every(slot => !!selections[slot]);
    confirmBtn.disabled = !allFilled;
  };

  // UI-FIX: страховка — если где-то в HTML остался inline onclick="checkReady()",
  // он сможет найти функцию в window.
  window.checkReady = checkReady;

  for (const [slot, upgrades] of Object.entries(choices)) {
    if (!upgrades || upgrades.length === 0) continue;
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

      // UI-FIX: addEventListener вместо onclick + вызов checkReady из замыкания
      card.addEventListener('click', () => {
        cardsDiv.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
        card.style.borderColor = '#4ade80';
        selections[slot] = upg.id;
        checkReady();
      });
      cardsDiv.appendChild(card);
    }
    slotDiv.appendChild(cardsDiv);
    listEl.appendChild(slotDiv);
  }

  showUpgradeMessage('');
  setUpgradeProgress('');

  if (confirmBtn) {
    const clone = confirmBtn.cloneNode(true);
    clone.disabled = true;
    confirmBtn.parentNode.replaceChild(clone, confirmBtn);
    confirmBtn = clone;

    // UI-FIX: на всякий случай убираем inline onclick, если он был унаследован от HTML
    confirmBtn.removeAttribute('onclick');

    // UI-FIX: навешиваем addEventListener вместо onclick-атрибута
    confirmBtn.addEventListener('click', () => {
      const ids = Object.values(selections).filter(Boolean);
      if (ids.length === 0) return;
      onSubmit(ids);
    });
  }

  const ta = document.getElementById('upgrade-input');
  if (ta) ta.style.display = 'none';
}