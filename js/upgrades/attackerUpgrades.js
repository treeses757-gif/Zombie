// js/upgrades/attackerUpgrades.js
// 30 улучшений атакующего зомби: 10 main + 10 secondary + 10 passive.

export const ATTACKER_UPGRADES = [
  // ============ MAIN (10) ============
  {
    id: 'att_main_01', slot: 'main', role: 'zombie_attacker',
    title: 'Заточенные когти',
    description: '+30% урона от ударов',
    fullDescription: 'Длинные когти с каплями крови. Просто и эффективно.',
    icon: 'icon_claws',
    effects: { damage: 30 },
    visual: { part: 'claws_sharp', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_02', slot: 'main', role: 'zombie_attacker',
    title: 'Кровавый кулак',
    description: 'Удары вызывают кровотечение',
    fullDescription: 'Окровавленные кулаки: 4 урона/сек в течение 3 секунд, стакается.',
    icon: 'icon_bloody',
    effects: { damage: 15 },
    visual: { part: 'claws_bloody', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_03', slot: 'main', role: 'zombie_attacker',
    title: 'Ядовитые когти',
    description: 'Удары накладывают яд',
    fullDescription: 'Зелёная слизь на когтях: 3 урона/сек в течение 5 секунд.',
    icon: 'icon_poison',
    effects: { damage: 20 },
    visual: { part: 'claws_poison', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_04', slot: 'main', role: 'zombie_attacker',
    title: 'Берсерк',
    description: '+50% урона при HP < 50%',
    fullDescription: 'Опасно, но рискованно. Красные глаза и аура при активации.',
    icon: 'icon_berserk',
    effects: { damage: 25, speed: 5 },
    visual: { part: 'aura_berserk', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_05', slot: 'main', role: 'zombie_attacker',
    title: 'Рывок',
    description: 'ПКМ-рывок на 200 px с уроном',
    fullDescription: 'Быстрый рывок вперёд, 25 урона всем на пути. Кулдаун 4 сек.',
    icon: 'icon_dash',
    effects: { damage: 10, speed: 20 },
    visual: { part: 'blur_rush', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_06', slot: 'main', role: 'zombie_attacker',
    title: 'Прыжок',
    description: 'Прыжок на 250 px с уроном при приземлении',
    fullDescription: 'Урон 20, оглушение 0.5 сек. Высокий прыжок и ударная волна.',
    icon: 'icon_jump',
    effects: { damage: 15 },
    visual: { part: 'jump_shockwave', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_07', slot: 'main', role: 'zombie_attacker',
    title: 'Тройной удар',
    description: 'Комбо из 3 быстрых ударов',
    fullDescription: 'Первый 10, второй 15, третий 30 урона. Три вспышки у кулаков.',
    icon: 'icon_combo',
    effects: { damage: 40, attackSpeed: 20 },
    visual: { part: 'combo_flash', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_08', slot: 'main', role: 'zombie_attacker',
    title: 'Круговой удар',
    description: 'AoE-удар по области 150 px',
    fullDescription: 'Красно-оранжевая волна от тела бьёт всех вокруг.',
    icon: 'icon_wave',
    effects: { damage: 30 },
    visual: { part: 'wave_circular', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_09', slot: 'main', role: 'zombie_attacker',
    title: 'Разрывающий удар',
    description: 'Игнорирует 50% брони и щитов',
    fullDescription: 'Светящиеся белым когти. Отлично против танка и брони.',
    icon: 'icon_rip',
    effects: { damage: 50 },
    visual: { part: 'claws_white_glow', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'att_main_10', slot: 'main', role: 'zombie_attacker',
    title: 'Хватание',
    description: 'Схватить и наносить 40 урона за 1.5 сек',
    fullDescription: 'Требует близкой дистанции (30 px). Нельзя двигаться во время хватания.',
    icon: 'icon_grab',
    effects: { damage: 30, speed: -20 },
    visual: { part: 'grab_hands', layer: 6 },
    unlocksSecondary: false
  },

  // ============ SECONDARY (10) ============
  {
    id: 'att_sec_01', slot: 'secondary', role: 'zombie_attacker',
    title: 'Рёв',
    description: 'Оглушает всех врагов в радиусе 200 px',
    fullDescription: 'Раз в 10 секунд оглушает врагов на 0.8 сек. Паника в бою.',
    icon: 'icon_roar',
    effects: { damage: 5 },
    visual: { part: 'roar_waves', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_02', slot: 'secondary', role: 'zombie_attacker',
    title: 'Плевание кислотой',
    description: 'Дальняя атака на 300 px',
    fullDescription: 'Струя кислоты, 15 урона + горение. Зелёная струя изо рта.',
    icon: 'icon_acid',
    effects: { damage: 20 },
    visual: { part: 'acid_spit', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_03', slot: 'secondary', role: 'zombie_attacker',
    title: 'Прыжок с потолка',
    description: 'Телепорт на 400 px с +50% урона',
    fullDescription: 'Зомби исчезает и падает на цель сверху. Кулдаун 8 сек.',
    icon: 'icon_drop',
    effects: { damage: 30 },
    visual: { part: 'drop_from_above', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_04', slot: 'secondary', role: 'zombie_attacker',
    title: 'Рывок сквозь стены',
    description: 'Проходит сквозь препятствия на 300 px',
    fullDescription: 'Становится полупрозрачным на 0.5 сек. Кулдаун 6 сек.',
    icon: 'icon_phase',
    effects: { speed: 15 },
    visual: { part: 'phase_ghost', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_05', slot: 'secondary', role: 'zombie_attacker',
    title: 'Ярость',
    description: '+15% урона, +20% скорострельности',
    fullDescription: '3 секунды ускорения атак и передвижения. Красная пульсация.',
    icon: 'icon_rage',
    effects: { damage: 15, attackSpeed: 20 },
    visual: { part: 'aura_rage_red', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_06', slot: 'secondary', role: 'zombie_attacker',
    title: 'Вой',
    description: 'Призывает 2 крыс-зомби',
    fullDescription: '15 HP, 8 урона, живут 10 сек. Отвлекают внимание.',
    icon: 'icon_howl',
    effects: { damage: 10 },
    visual: { part: 'rats_minions', layer: 4 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_07', slot: 'secondary', role: 'zombie_attacker',
    title: 'Укус',
    description: '30 урона + лечит атакующего',
    fullDescription: 'Лечит на 50% нанесённого урона. Жёлтые зубы и кровь.',
    icon: 'icon_bite',
    effects: { damage: 25 },
    visual: { part: 'teeth_yellow', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_08', slot: 'secondary', role: 'zombie_attacker',
    title: 'Бросок камня',
    description: 'Дальняя атака на 400 px',
    fullDescription: '20 урона, шанс оглушения 20%. Камень летит по дуге.',
    icon: 'icon_rock',
    effects: { damage: 15 },
    visual: { part: 'rock_thrown', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_09', slot: 'secondary', role: 'zombie_attacker',
    title: 'Крик страха',
    description: 'Замедляет врагов на 40%',
    fullDescription: 'Радиус 150 px, длительность 3 сек. Фиолетовые волны.',
    icon: 'icon_fear',
    effects: { damage: 5 },
    visual: { part: 'fear_waves_purple', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_sec_10', slot: 'secondary', role: 'zombie_attacker',
    title: 'Смертельный удар',
    description: '×3 урона, если HP цели < 25%',
    fullDescription: 'Казнь слабых. Чёрная аура на кулаке перед ударом.',
    icon: 'icon_execute',
    effects: { damage: 40 },
    visual: { part: 'dark_aura_execute', layer: 6 },
    unlocksSecondary: false
  },

  // ============ PASSIVE (10) ============
  {
    id: 'att_pas_01', slot: 'passive', role: 'zombie_attacker',
    title: 'Регенерация',
    description: '+2 HP/сек без урона 4 сек',
    fullDescription: 'Зелёные искры вокруг тела восстанавливают здоровье.',
    icon: 'icon_regen',
    effects: { hp: 10 },
    visual: { part: 'sparks_regen_green', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_02', slot: 'passive', role: 'zombie_attacker',
    title: 'Ночное зрение',
    description: 'Видит выжившего сквозь стены',
    fullDescription: 'Радиус 600 px. Жёлтые светящиеся глаза.',
    icon: 'icon_night',
    effects: { damage: 5 },
    visual: { part: 'eyes_night_glow', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_03', slot: 'passive', role: 'zombie_attacker',
    title: 'Толстая кожа',
    description: '−15% получаемого урона',
    fullDescription: 'Утолщённые серые пластины на теле.',
    icon: 'icon_skin',
    effects: { hp: 15 },
    visual: { part: 'plates_gray_thick', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_04', slot: 'passive', role: 'zombie_attacker',
    title: 'Ускорение',
    description: '+10% скорости передвижения',
    fullDescription: 'Красные следы за ногами.',
    icon: 'icon_speed',
    effects: { speed: 10 },
    visual: { part: 'trails_red_speed', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_05', slot: 'passive', role: 'zombie_attacker',
    title: 'Хитиновые шипы',
    description: 'Атакующий вас получает 5 урона',
    fullDescription: 'Шипы по всему телу наносят ответный урон.',
    icon: 'icon_spikes',
    effects: { damage: 10 },
    visual: { part: 'spikes_body', layer: 4 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_06', slot: 'passive', role: 'zombie_attacker',
    title: 'Прилипание',
    description: 'Враги при касании замедляются на 20%',
    fullDescription: 'Слизь под ногами затрудняет движение.',
    icon: 'icon_slime',
    effects: { speed: 5 },
    visual: { part: 'slime_ground', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_07', slot: 'passive', role: 'zombie_attacker',
    title: 'Запах крови',
    description: 'Видит HP выжившего и миньонов',
    fullDescription: 'Красные нити показывают цели даже через стены.',
    icon: 'icon_scent',
    effects: { damage: 5 },
    visual: { part: 'threads_blood', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_08', slot: 'passive', role: 'zombie_attacker',
    title: 'Ускоренное размножение',
    description: 'Возрождение через 3 сек вместо 5',
    fullDescription: 'Зелёная аура возрождения.',
    icon: 'icon_revive',
    effects: { hp: 20 },
    visual: { part: 'aura_revive_green', layer: 1 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_09', slot: 'passive', role: 'zombie_attacker',
    title: 'Голод',
    description: '+1 урон за каждого убитого миньона',
    fullDescription: 'До +10 урона. Косточки на спине считают жертв.',
    icon: 'icon_hunger',
    effects: { damage: 10 },
    visual: { part: 'bone_counter', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'att_pas_10', slot: 'passive', role: 'zombie_attacker',
    title: 'Выносливость',
    description: '+15% скорости, не устаёт при беге',
    fullDescription: 'Красная повязка на голове.',
    icon: 'icon_endurance',
    effects: { speed: 15 },
    visual: { part: 'headband_red', layer: 7 },
    unlocksSecondary: false
  }
];

export default ATTACKER_UPGRADES;