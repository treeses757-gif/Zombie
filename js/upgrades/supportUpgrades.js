// js/upgrades/supportUpgrades.js
// 30 улучшений помогающего зомби: 10 main + 10 secondary + 10 passive.

export const SUPPORT_UPGRADES = [
  // ============ MAIN (10) ============
  {
    id: 'sup_main_01', slot: 'main', role: 'zombie_support',
    title: 'Кристалл лечения',
    description: 'Лечит союзника на 40 HP',
    fullDescription: 'Основной хил. Кулдаун 6 сек. Зелёный кристалл в руке.',
    icon: 'icon_crystal',
    effects: { hp: 20 },
    visual: { part: 'crystal_green_hand', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_02', slot: 'main', role: 'zombie_support',
    title: 'Аура ускорения',
    description: '+15% скорости союзникам',
    fullDescription: 'Постоянный эффект в радиусе 150 px. Зелёные нити к союзникам.',
    icon: 'icon_haste',
    effects: { speed: 10 },
    visual: { part: 'threads_green_ally', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_03', slot: 'main', role: 'zombie_support',
    title: 'Ядовитый туман',
    description: 'Облако 100 px: 8 урона/сек',
    fullDescription: 'Живёт 4 сек. Кулдаун 8 сек. Зелёный туман.',
    icon: 'icon_poison_fog',
    effects: { damage: 15 },
    visual: { part: 'fog_green_poison', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_04', slot: 'main', role: 'zombie_support',
    title: 'Исцеляющий шар',
    description: 'Шар летит к союзнику, лечит 30 HP',
    fullDescription: 'Дальность 400 px. Светящийся шар летит по воздуху.',
    icon: 'icon_orb',
    effects: { hp: 15 },
    visual: { part: 'orb_heal_flying', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_05', slot: 'main', role: 'zombie_support',
    title: 'Щит для союзника',
    description: 'Даёт союзнику щит на 50 HP',
    fullDescription: 'Жёлтый барьер вокруг союзника. Кулдаун 8 сек.',
    icon: 'icon_barrier',
    effects: { hp: 20 },
    visual: { part: 'barrier_yellow', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_06', slot: 'main', role: 'zombie_support',
    title: 'Ярость',
    description: 'Союзник +30% урона на 4 сек',
    fullDescription: 'Красная аура на союзнике. Кулдаун 10 сек.',
    icon: 'icon_rage_buff',
    effects: { damage: 20 },
    visual: { part: 'aura_red_ally', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_07', slot: 'main', role: 'zombie_support',
    title: 'Воскрешение',
    description: 'Возрождает союзника с 50% HP',
    fullDescription: 'Зелёный свет из земли. Кулдаун 25 сек.',
    icon: 'icon_revive',
    effects: { hp: 30 },
    visual: { part: 'light_green_revive', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_08', slot: 'main', role: 'zombie_support',
    title: 'Проклятие',
    description: '−20% урона выжившего на 5 сек',
    fullDescription: 'Чёрные нити к цели. Дальность 400 px.',
    icon: 'icon_curse',
    effects: { damage: 10 },
    visual: { part: 'threads_black_curse', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_09', slot: 'main', role: 'zombie_support',
    title: 'Светлячки',
    description: 'Призывает 3 светлячков',
    fullDescription: 'По 3 урона/сек каждый, живут 8 сек. Светящиеся точки.',
    icon: 'icon_fireflies',
    effects: { damage: 20 },
    visual: { part: 'fireflies_glow', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'sup_main_10', slot: 'main', role: 'zombie_support',
    title: 'Симбиоз',
    description: '30% урона союзника → на вас',
    fullDescription: 'Оба получают +15% HP. Кулдаун 15 сек. Зелёная нить.',
    icon: 'icon_symbiosis',
    effects: { hp: 40 },
    visual: { part: 'threads_green_symbiosis', layer: 6 },
    unlocksSecondary: false
  },

  // ============ SECONDARY (10) ============
  {
    id: 'sup_sec_01', slot: 'secondary', role: 'zombie_support',
    title: 'Массовое лечение',
    description: 'Лечит всех союзников на 25 HP',
    fullDescription: 'Радиус 200 px. Зелёная волна. Кулдаун 10 сек.',
    icon: 'icon_mass_heal',
    effects: { hp: 30 },
    visual: { part: 'wave_green_mass', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_02', slot: 'secondary', role: 'zombie_support',
    title: 'Телепорт союзника',
    description: 'Мгновенно переносит союзника к себе',
    fullDescription: 'Фиолетовый портал. Кулдаун 12 сек.',
    icon: 'icon_teleport',
    effects: { speed: 5 },
    visual: { part: 'portal_violet', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_03', slot: 'secondary', role: 'zombie_support',
    title: 'Щит всем',
    description: '+20% резист всем на 5 сек',
    fullDescription: 'Золотые пузыри вокруг всех. Кулдаун 15 сек.',
    icon: 'icon_shield_all',
    effects: { hp: 20 },
    visual: { part: 'bubbles_gold_all', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_04', slot: 'secondary', role: 'zombie_support',
    title: 'Бафф скорости',
    description: '+30% скорости союзникам на 5 сек',
    fullDescription: 'Голубые следы за зомби. Кулдаун 15 сек.',
    icon: 'icon_speed_buff',
    effects: { speed: 30 },
    visual: { part: 'trails_blue_speed', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_05', slot: 'secondary', role: 'zombie_support',
    title: 'Очищение',
    description: 'Снимает все дебаффы',
    fullDescription: 'Белая вспышка. Кулдаун 8 сек.',
    icon: 'icon_cleanse',
    effects: { hp: 10 },
    visual: { part: 'flash_white_cleanse', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_06', slot: 'secondary', role: 'zombie_support',
    title: 'Ядовитое облако',
    description: 'Облако 200 px: 12 урона/сек',
    fullDescription: 'Живёт 5 сек. Кулдаун 15 сек. Густой зелёный туман.',
    icon: 'icon_big_fog',
    effects: { damage: 25 },
    visual: { part: 'fog_green_big', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_07', slot: 'secondary', role: 'zombie_support',
    title: 'Призыв миньона',
    description: 'Маленький зомби: 30 HP, 8 урона',
    fullDescription: 'Живёт 10 сек. Кулдаун 8 сек. Вылезает из земли.',
    icon: 'icon_minion',
    effects: { damage: 20 },
    visual: { part: 'minion_small_rise', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_08', slot: 'secondary', role: 'zombie_support',
    title: 'Портал',
    description: 'Портал на 8 сек между двумя точками',
    fullDescription: 'Два фиолетовых кольца в воздухе. Кулдаун 20 сек.',
    icon: 'icon_portal',
    effects: { speed: 15 },
    visual: { part: 'portals_dual_rings', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_09', slot: 'secondary', role: 'zombie_support',
    title: 'Огненная стена',
    description: 'Стена 150 px: 20 урона/сек',
    fullDescription: 'Живёт 4 сек. Кулдаун 12 сек. Пылающая стена.',
    icon: 'icon_fire_wall',
    effects: { damage: 30 },
    visual: { part: 'wall_fire', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'sup_sec_10', slot: 'secondary', role: 'zombie_support',
    title: 'Замедление',
    description: 'Враги в 300 px замедляются на 40%',
    fullDescription: '4 сек. Белые снежинки вокруг врагов. Кулдаун 12 сек.',
    icon: 'icon_snow',
    effects: { damage: 10 },
    visual: { part: 'snowflakes_slow', layer: 6 },
    unlocksSecondary: false
  },

  // ============ PASSIVE (10) ============
  {
    id: 'sup_pas_01', slot: 'passive', role: 'zombie_support',
    title: 'Регенерация союзников',
    description: '+0.5 HP/сек всем в 200 px',
    fullDescription: 'Зелёная аура вокруг помогающего.',
    icon: 'icon_team_regen',
    effects: { hp: 30 },
    visual: { part: 'aura_green_passive', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_02', slot: 'passive', role: 'zombie_support',
    title: 'Быстрый кулдаун',
    description: 'Все способности −25% кулдауна',
    fullDescription: 'Голубые часы на плече.',
    icon: 'icon_cooldown',
    effects: { attackSpeed: 25 },
    visual: { part: 'clock_blue_shoulder', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_03', slot: 'passive', role: 'zombie_support',
    title: 'Увеличенная аура',
    description: '+30% радиуса всех способностей',
    fullDescription: 'Расширяющиеся кольца вокруг тела.',
    icon: 'icon_big_aura',
    effects: { hp: 15 },
    visual: { part: 'rings_expanding', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_04', slot: 'passive', role: 'zombie_support',
    title: 'Симбиотическая связь',
    description: 'Не умирает, пока есть живой союзник',
    fullDescription: 'HP не уходит ниже 1. Невидимая нить к союзнику.',
    icon: 'icon_bond',
    effects: { hp: 50 },
    visual: { part: 'thread_symbiotic', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_05', slot: 'passive', role: 'zombie_support',
    title: 'Иммунитет к яду',
    description: 'Яд и кровотечение не действуют',
    fullDescription: 'Зелёный нимб над головой.',
    icon: 'icon_immune',
    effects: { hp: 10 },
    visual: { part: 'halo_green_poison_immune', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_06', slot: 'passive', role: 'zombie_support',
    title: 'Скрытность',
    description: 'Полупрозрачность вне атаки',
    fullDescription: 'Атакующий не видит помогающего на мини-карте.',
    icon: 'icon_stealth',
    effects: { speed: 10 },
    visual: { part: 'transparency_stealth', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_07', slot: 'passive', role: 'zombie_support',
    title: 'Эхо',
    description: 'Каждая 3-я способность срабатывает дважды',
    fullDescription: 'Двойная вспышка при каждой третьей активации.',
    icon: 'icon_echo',
    effects: { damage: 15 },
    visual: { part: 'double_flash_echo', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_08', slot: 'passive', role: 'zombie_support',
    title: 'Мана/энергия +50%',
    description: 'Кулдауны −33%',
    fullDescription: 'Синий кристалл на груди.',
    icon: 'icon_mana',
    effects: { attackSpeed: 33 },
    visual: { part: 'crystal_blue_chest', layer: 4 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_09', slot: 'passive', role: 'zombie_support',
    title: 'Сопротивление',
    description: '−20% получаемого урона',
    fullDescription: 'Фиолетовая мантия защищает тело.',
    icon: 'icon_resist',
    effects: { hp: 30 },
    visual: { part: 'mantle_violet', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'sup_pas_10', slot: 'passive', role: 'zombie_support',
    title: 'Аура ярости',
    description: '+10% урона союзникам в 200 px',
    fullDescription: 'Красный туман вокруг помогающего.',
    icon: 'icon_rage_aura',
    effects: { damage: 10 },
    visual: { part: 'fog_red_teamrage', layer: 1 },
    unlocksSecondary: false
  }
];

export default SUPPORT_UPGRADES;