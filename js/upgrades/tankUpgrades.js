// js/upgrades/tankUpgrades.js
// 30 улучшений танка-зомби: 10 main + 10 secondary + 10 passive.

export const TANK_UPGRADES = [
  // ============ MAIN (10) ============
  {
    id: 'tnk_main_01', slot: 'main', role: 'zombie_tank',
    title: 'Улучшенный щит',
    description: '+30 HP, −5% скорости',
    fullDescription: 'Щит блокирует 45% урона вместо 30%. Чуть тяжелее.',
    icon: 'icon_shield_big',
    effects: { hp: 30, speed: -5 },
    visual: { part: 'shield_bigger', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_02', slot: 'main', role: 'zombie_tank',
    title: 'Шипастый щит',
    description: 'Отражает 20% урона при блоке',
    fullDescription: 'Шипы на щите ранят атакующего.',
    icon: 'icon_shield_spiked',
    effects: { damage: 20 },
    visual: { part: 'shield_spiked', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_03', slot: 'main', role: 'zombie_tank',
    title: 'Костяная броня',
    description: '+80 к максимальному HP',
    fullDescription: 'Костяные пластины на груди.',
    icon: 'icon_bone_armor',
    effects: { hp: 80 },
    visual: { part: 'plates_bone', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_04', slot: 'main', role: 'zombie_tank',
    title: 'Таран',
    description: 'Рывок на 250 px с отбрасыванием',
    fullDescription: 'Урон 30. Рога на шлеме, след при рывке. Кулдаун 6 сек.',
    icon: 'icon_ram',
    effects: { damage: 20, speed: 10 },
    visual: { part: 'horns_helm', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_05', slot: 'main', role: 'zombie_tank',
    title: 'Тяжёлый удар',
    description: '−40% скорострельности, ×2.5 урона',
    fullDescription: 'Огромные кулаки-кувалды. Отбрасывают цель на 80 px.',
    icon: 'icon_fists',
    effects: { damage: 80, attackSpeed: -40 },
    visual: { part: 'fists_massive', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_06', slot: 'main', role: 'zombie_tank',
    title: 'Разрушающий удар',
    description: '×2 урона по базе',
    fullDescription: 'Кулак светится оранжевым при ударе по базе.',
    icon: 'icon_smash',
    effects: { damage: 40 },
    visual: { part: 'fist_glow_orange', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_07', slot: 'main', role: 'zombie_tank',
    title: 'Броня из шин',
    description: '+50 HP, −15% скорости',
    fullDescription: 'Чёрные покрышки на плечах. Почти непробиваемый.',
    icon: 'icon_tires',
    effects: { hp: 50, speed: -15 },
    visual: { part: 'tires_shoulders', layer: 4 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_08', slot: 'main', role: 'zombie_tank',
    title: 'Двойной щит',
    description: '+40 HP, −20% скорости',
    fullDescription: 'Блокирует атаки с двух сторон.',
    icon: 'icon_dual',
    effects: { hp: 40, speed: -20 },
    visual: { part: 'shields_dual', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_09', slot: 'main', role: 'zombie_tank',
    title: 'Каменная кожа',
    description: '−20% получаемого урона',
    fullDescription: 'Серая каменистая текстура по всему телу.',
    icon: 'icon_stone',
    effects: { hp: 40 },
    visual: { part: 'skin_stone', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_main_10', slot: 'main', role: 'zombie_tank',
    title: 'Огненный щит',
    description: 'Атакующие получают 8 урона огнём',
    fullDescription: 'Щит горит по краям.',
    icon: 'icon_fire_shield',
    effects: { damage: 25 },
    visual: { part: 'shield_fire', layer: 6 },
    unlocksSecondary: false
  },

  // ============ SECONDARY (10) ============
  {
    id: 'tnk_sec_01', slot: 'secondary', role: 'zombie_tank',
    title: 'Щит для союзника',
    description: 'Даёт союзнику +30% резист на 5 сек',
    fullDescription: 'Синяя аура на выбранном союзнике. Кулдаун 12 сек.',
    icon: 'icon_ally_shield',
    effects: { hp: 20 },
    visual: { part: 'aura_ally_blue', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_02', slot: 'secondary', role: 'zombie_tank',
    title: 'Землетрясение',
    description: 'Оглушает всех в радиусе 150 px',
    fullDescription: '15 урона и оглушение 1 сек. Трещины на земле.',
    icon: 'icon_quake',
    effects: { damage: 20 },
    visual: { part: 'cracks_ground', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_03', slot: 'secondary', role: 'zombie_tank',
    title: 'Стена',
    description: 'Создаёт стену 100×50 px на 6 сек',
    fullDescription: 'Каменная стена вырастает из земли.',
    icon: 'icon_wall',
    effects: { hp: 10 },
    visual: { part: 'wall_summon', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_04', slot: 'secondary', role: 'zombie_tank',
    title: 'Рёв ярости',
    description: '+25% урона союзникам на 5 сек',
    fullDescription: 'Красный туман вокруг танка. Кулдаун 15 сек.',
    icon: 'icon_rage_roar',
    effects: { damage: 15 },
    visual: { part: 'fog_red_rage', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_05', slot: 'secondary', role: 'zombie_tank',
    title: 'Бросок щита',
    description: 'Бумеранг: 30 урона туда и обратно',
    fullDescription: 'Щит летит по дуге. Кулдаун 7 сек.',
    icon: 'icon_boomerang',
    effects: { damage: 30 },
    visual: { part: 'shield_boomerang', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_06', slot: 'secondary', role: 'zombie_tank',
    title: 'Удар щитом',
    description: '40 урона + отбрасывание + оглушение',
    fullDescription: 'Мощный удар вперёд. Вспышка при ударе. Кулдаун 5 сек.',
    icon: 'icon_slam',
    effects: { damage: 40 },
    visual: { part: 'shield_slam_flash', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_07', slot: 'secondary', role: 'zombie_tank',
    title: 'Укрепление',
    description: '3 сек неуязвимости, но без движения',
    fullDescription: 'Серая каменная статуя. Кулдаун 15 сек.',
    icon: 'icon_statue',
    effects: { hp: 30 },
    visual: { part: 'statue_gray', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_08', slot: 'secondary', role: 'zombie_tank',
    title: 'Отражение',
    description: '3 сек отражения снарядов',
    fullDescription: 'Зеркальная поверхность щита. Кулдаун 12 сек.',
    icon: 'icon_mirror',
    effects: { hp: 20 },
    visual: { part: 'shield_mirror', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_09', slot: 'secondary', role: 'zombie_tank',
    title: 'Поглощение',
    description: '50% урона конвертируется в HP',
    fullDescription: '5 секунд, максимум +50 HP. Фиолетовые нити к атакующим.',
    icon: 'icon_absorb',
    effects: { hp: 40 },
    visual: { part: 'threads_violet_absorb', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_sec_10', slot: 'secondary', role: 'zombie_tank',
    title: 'Разрушение',
    description: '50 урона базе, 2 сек каста',
    fullDescription: 'Танк светится красным во время каста. Кулдаун 20 сек.',
    icon: 'icon_destroy',
    effects: { damage: 50 },
    visual: { part: 'glow_red_charge', layer: 1 },
    unlocksSecondary: false
  },

  // ============ PASSIVE (10) ============
  {
    id: 'tnk_pas_01', slot: 'passive', role: 'zombie_tank',
    title: 'Невосприимчивость к замедлению',
    description: 'Замедления действуют вдвое меньше',
    fullDescription: 'Фиолетовые кольца вокруг ног.',
    icon: 'icon_slow_res',
    effects: { speed: 5 },
    visual: { part: 'rings_violet_legs', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_02', slot: 'passive', role: 'zombie_tank',
    title: 'Быстрое восстановление HP',
    description: '+1 HP/сек всегда',
    fullDescription: 'Зелёная пульсация вокруг тела.',
    icon: 'icon_heal_passive',
    effects: { hp: 30 },
    visual: { part: 'pulse_green_regen', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_03', slot: 'passive', role: 'zombie_tank',
    title: 'Больший обзор',
    description: '+300 px радиуса обзора',
    fullDescription: 'Светящиеся глаза-фонари.',
    icon: 'icon_vision',
    effects: { speed: 5 },
    visual: { part: 'eyes_lantern', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_04', slot: 'passive', role: 'zombie_tank',
    title: 'Толстые слои',
    description: 'Ещё −10% получаемого урона',
    fullDescription: 'Двойная броня на груди.',
    icon: 'icon_thick',
    effects: { hp: 40 },
    visual: { part: 'plates_double', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_05', slot: 'passive', role: 'zombie_tank',
    title: 'Щит всегда активен',
    description: 'Блок 80% даже при атаке',
    fullDescription: 'Щит в левой руке постоянно.',
    icon: 'icon_always_shield',
    effects: { hp: 20 },
    visual: { part: 'shield_always', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_06', slot: 'passive', role: 'zombie_tank',
    title: 'Усиление союзников',
    description: '+10% HP и +5% скорости союзникам',
    fullDescription: 'Жёлтая аура вокруг танка. Радиус 150 px.',
    icon: 'icon_team_buff',
    effects: { damage: 10 },
    visual: { part: 'aura_yellow_team', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_07', slot: 'passive', role: 'zombie_tank',
    title: 'Иммунитет к оглушению',
    description: 'Оглушения и станы не действуют',
    fullDescription: 'Шлем с закрытым забралом.',
    icon: 'icon_stun_imm',
    effects: { hp: 20 },
    visual: { part: 'helm_closed', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_08', slot: 'passive', role: 'zombie_tank',
    title: 'Медленная, но мощная',
    description: '−10% скорости, +25% урона',
    fullDescription: 'Массивная фигура с наклоном вперёд.',
    icon: 'icon_slow_strong',
    effects: { speed: -10, damage: 25 },
    visual: { part: 'body_heavy_lean', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_09', slot: 'passive', role: 'zombie_tank',
    title: 'Восстановление щита',
    description: 'Щит восстанавливается через 8 сек',
    fullDescription: 'Щит сначала с трещинами, потом целый.',
    icon: 'icon_repair',
    effects: { hp: 30 },
    visual: { part: 'shield_repair', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'tnk_pas_10', slot: 'passive', role: 'zombie_tank',
    title: 'Здоровье ×1.5',
    description: 'Базовое HP растёт до 450',
    fullDescription: 'Ещё более массивное тело.',
    icon: 'icon_hp_x15',
    effects: { hp: 150 },
    visual: { part: 'body_massive', layer: 3 },
    unlocksSecondary: false
  }
];

export default TANK_UPGRADES;