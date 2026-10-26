// js/upgrades/survivorUpgrades.js
// 30 улучшений выжившего: 10 main + 10 secondary + 10 passive.
// Только 3 миньона в main дают unlocksSecondary: true.

export const SURVIVOR_UPGRADES = [
  // ============ MAIN (10) ============
  {
    id: 'surv_main_01', slot: 'main', role: 'survivor',
    title: 'Тяжёлый Маузер',
    description: '+40% урона, −20% скорострельности',
    fullDescription: 'Заменяет пистолет на более мощный маузер. Каждый выстрел бьёт как молот, но медленнее.',
    icon: 'icon_mauser',
    effects: { damage: 40, attackSpeed: -20 },
    visual: { part: 'weapon_mauser', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_02', slot: 'main', role: 'survivor',
    title: 'Дробовик',
    description: '+60% урона вблизи, −20% скорострельности',
    fullDescription: 'Дробь наносит огромный урон на ближней дистанции. Учит подпускать зомби близко.',
    icon: 'icon_shotgun',
    effects: { damage: 60, attackSpeed: -20 },
    visual: { part: 'weapon_shotgun', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_03', slot: 'main', role: 'survivor',
    title: 'ПП «Оса»',
    description: '+80% скорострельности, −25% урона',
    fullDescription: 'Пистолет-пулемёт. Отлично против толпы слабых зомби, плохо против танка.',
    icon: 'icon_smg',
    effects: { damage: -25, attackSpeed: 80 },
    visual: { part: 'weapon_smg', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_04', slot: 'main', role: 'survivor',
    title: 'Снайперская винтовка',
    description: '+120% урона, −50% скорострельности',
    fullDescription: 'Один точный выстрел пробивает 2 зомби насквозь. Мощно, но медленно.',
    icon: 'icon_sniper',
    effects: { damage: 120, attackSpeed: -50 },
    visual: { part: 'weapon_sniper', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_05', slot: 'main', role: 'survivor',
    title: 'Гранатомёт',
    description: 'AoE-урон, медленная перезарядка',
    fullDescription: 'Стреляет гранатами по площади. Накрывает толпу, но перезаряжается долго.',
    icon: 'icon_launcher',
    effects: { damage: 100, attackSpeed: -70 },
    visual: { part: 'weapon_launcher', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_06', slot: 'main', role: 'survivor',
    title: 'Огнемёт',
    description: 'Конус огня, +30% урона, +20% скорострельности',
    fullDescription: 'Бьёт огнём по конусу, поджигает врагов. Хорош против групп.',
    icon: 'icon_flamethrower',
    effects: { damage: 30, attackSpeed: 20 },
    visual: { part: 'weapon_flamethrower', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_07', slot: 'main', role: 'survivor',
    title: 'Арбалет',
    description: '+80% урона, −30% скорострельности',
    fullDescription: 'Тихий арбалет пробивает до 3 зомби насквозь. Идеален для скрытных атак.',
    icon: 'icon_crossbow',
    effects: { damage: 80, attackSpeed: -30 },
    visual: { part: 'weapon_crossbow', layer: 5 },
    unlocksSecondary: false
  },
  {
    id: 'surv_main_08', slot: 'main', role: 'survivor',
    title: 'Гончая',
    description: 'Призыв гончей: 40 HP, 15 урона/сек. Открывает 2-й слот',
    fullDescription: 'Быстрая гончая атакует ближайшего зомби. Слабая, но отвлекает и добивает.',
    icon: 'icon_hound',
    effects: { damage: -20, speed: 5 },
    visual: { part: 'minion_hound', layer: 4 },
    unlocksSecondary: true
  },
  {
    id: 'surv_main_09', slot: 'main', role: 'survivor',
    title: 'Стрелок',
    description: 'Призыв стрелка: 60 HP, 12 урона/выстрел. Открывает 2-й слот',
    fullDescription: 'Стрелок с винтовкой бьёт по зомби с дистанции. Безопаснее гончей.',
    icon: 'icon_shooter',
    effects: { damage: -30, attackSpeed: 10 },
    visual: { part: 'minion_shooter', layer: 4 },
    unlocksSecondary: true
  },
  {
    id: 'surv_main_10', slot: 'main', role: 'survivor',
    title: 'Щитоносец',
    description: 'Призыв щитоносца: 150 HP, −40% урона по вам. Открывает 2-й слот',
    fullDescription: 'Бронированный миньон блокирует часть урона, если стоит рядом.',
    icon: 'icon_shieldman',
    effects: { damage: -40, hp: 30 },
    visual: { part: 'minion_shieldman', layer: 4 },
    unlocksSecondary: true
  },

  // ============ SECONDARY (10) ============
  {
    id: 'surv_sec_01', slot: 'secondary', role: 'survivor',
    title: 'Двойной выстрел',
    description: '+60% урона, +10% скорострельности',
    fullDescription: 'Пистолет стреляет двумя пулями за нажатие. Чуть менее точен.',
    icon: 'icon_double',
    effects: { damage: 60, attackSpeed: 10 },
    visual: { part: 'muzzle_double', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_02', slot: 'secondary', role: 'survivor',
    title: 'Разрывные пули',
    description: 'Пули взрываются при попадании',
    fullDescription: 'AoE 15 урона по области 40 px. Отлично против толпы.',
    icon: 'icon_explosive',
    effects: { damage: 25 },
    visual: { part: 'muzzle_explosive', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_03', slot: 'secondary', role: 'survivor',
    title: 'Прицельный выстрел',
    description: 'Заряжаемый выстрел, +80% урона',
    fullDescription: 'Удерживая ПКМ, копите урон до +200%. Медленнее двигаетесь при заряде.',
    icon: 'icon_laser',
    effects: { damage: 80 },
    visual: { part: 'laser_sight', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_04', slot: 'secondary', role: 'survivor',
    title: 'Отталкивающие пули',
    description: '−20% урона, +5% скорости',
    fullDescription: 'Каждая пуля отбрасывает зомби на 50 px. Держит дистанцию.',
    icon: 'icon_push',
    effects: { damage: -20, speed: 5 },
    visual: { part: 'trail_blue', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_05', slot: 'secondary', role: 'survivor',
    title: 'Кровотечение',
    description: 'Попадания накладывают кровотечение',
    fullDescription: '5 урона/сек в течение 4 секунд. Стакается 2 раза.',
    icon: 'icon_blood',
    effects: { damage: 20 },
    visual: { part: 'blood_drip', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_06', slot: 'secondary', role: 'survivor',
    title: 'Метка',
    description: 'Помеченные зомби получают +20% урона',
    fullDescription: 'Выстрел помечает цель на 5 секунд. Все источники бьют на 20% сильнее.',
    icon: 'icon_mark',
    effects: { damage: 15 },
    visual: { part: 'mark_target', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_07', slot: 'secondary', role: 'survivor',
    title: 'Быстрая перезарядка',
    description: '+40% скорострельности',
    fullDescription: 'Пистолет перезаряжается вдвое быстрее. Хорошо в связке с миньоном.',
    icon: 'icon_reload',
    effects: { attackSpeed: 40 },
    visual: { part: 'smoke_barrel', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_08', slot: 'secondary', role: 'survivor',
    title: 'Холодный расчёт',
    description: 'Каждый 3-й выстрел — критический',
    fullDescription: '+150% урона на каждый 3-й выстрел. Расчётливо и мощно.',
    icon: 'icon_crit',
    effects: { damage: 30 },
    visual: { part: 'crit_flash', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_09', slot: 'secondary', role: 'survivor',
    title: 'Сигнальная ракета',
    description: 'Подсветка всех зомби + AoE 20 урона',
    fullDescription: 'Раз в 8 сек ракета подсвечивает карту и бьёт по площади.',
    icon: 'icon_rocket',
    effects: { damage: 25 },
    visual: { part: 'rocket_signal', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'surv_sec_10', slot: 'secondary', role: 'survivor',
    title: 'Замораживающий выстрел',
    description: 'Замедляет зомби на 30%',
    fullDescription: 'Попадания замедляют цель на 2 секунды. Идеально против атакующего.',
    icon: 'icon_freeze',
    effects: { damage: 10 },
    visual: { part: 'freeze_tint', layer: 6 },
    unlocksSecondary: false
  },

  // ============ PASSIVE (10) ============
  {
    id: 'surv_pas_01', slot: 'passive', role: 'survivor',
    title: 'Кожаная куртка',
    description: '+15 к максимальному HP',
    fullDescription: 'Просто и надёжно: больше здоровья, больше шансов выжить.',
    icon: 'icon_jacket',
    effects: { hp: 15 },
    visual: { part: 'torso_jacket', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_02', slot: 'passive', role: 'survivor',
    title: 'Аптечка',
    description: 'Регенерация при отсутствии урона',
    fullDescription: 'Восстанавливает 1 HP/сек, если не получали урон последние 5 секунд.',
    icon: 'icon_medkit',
    effects: { hp: 10 },
    visual: { part: 'hat_01', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_03', slot: 'passive', role: 'survivor',
    title: 'Спринтерские ботинки',
    description: '+10% скорости передвижения',
    fullDescription: 'Синие ботинки с подсветкой. Быстрее убегаете от зомби.',
    icon: 'icon_boots',
    effects: { speed: 10 },
    visual: { part: 'boots_sprint', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_04', slot: 'passive', role: 'survivor',
    title: 'Тактический шлем',
    description: '−15% получаемого урона',
    fullDescription: 'Шлем с визором принимает удары на себя.',
    icon: 'icon_helmet',
    effects: { hp: 10 },
    visual: { part: 'helmet_tactical', layer: 7 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_05', slot: 'passive', role: 'survivor',
    title: 'Пояс с патронами',
    description: '+50% боезапаса, −10% перезарядки',
    fullDescription: 'Патронташ на поясе ускоряет перезарядку.',
    icon: 'icon_belt',
    effects: { attackSpeed: 10 },
    visual: { part: 'belt_ammo', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_06', slot: 'passive', role: 'survivor',
    title: 'Рация',
    description: 'Видите всех зомби в радиусе 800 px',
    fullDescription: 'Рация на плече с антенной — мини-карта лучше показывает врагов.',
    icon: 'icon_radio',
    effects: { damage: 5 },
    visual: { part: 'radio_shoulder', layer: 4 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_07', slot: 'passive', role: 'survivor',
    title: 'Фонарик',
    description: '+200 px обзора',
    fullDescription: 'Конус света помогает видеть зомби в тумане.',
    icon: 'icon_flashlight',
    effects: { speed: 5 },
    visual: { part: 'flashlight_cone', layer: 6 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_08', slot: 'passive', role: 'survivor',
    title: 'Укрепление базы',
    description: '+200 к максимальному HP базы',
    fullDescription: 'Мешки с песком и колючая проволока вокруг базы.',
    icon: 'icon_sandbags',
    effects: { hp: 20 },
    visual: { part: 'base_sandbags', layer: 2 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_09', slot: 'passive', role: 'survivor',
    title: 'Инженерный набор',
    description: 'Раз в раунд починить базу на 150 HP',
    fullDescription: 'Чемодан с инструментами за спиной. Жмите E у базы.',
    icon: 'icon_toolbox',
    effects: { hp: 10 },
    visual: { part: 'toolbox_pack', layer: 3 },
    unlocksSecondary: false
  },
  {
    id: 'surv_pas_10', slot: 'passive', role: 'survivor',
    title: 'Реактивный ранец',
    description: 'Рывок (Shift): 300 px за 0.2 сек',
    fullDescription: 'Даёт рывок с кулдауном 5 секунд. Позволяет уйти от преследования.',
    icon: 'icon_jetpack',
    effects: { speed: 15 },
    visual: { part: 'jetpack_back', layer: 3 },
    unlocksSecondary: false
  }
];

export default SURVIVOR_UPGRADES;