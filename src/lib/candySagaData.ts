export type CandyColorId = 'strawberry' | 'lemon' | 'emerald' | 'blueberry' | 'grape' | 'caramel';

export type CandySpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb';

export interface CandyMeta {
  id: CandyColorId;
  nameVi: string;
  nameEn: string;
  emoji: string;
  bgGradient: string;
  borderHex: string;
  glowHex: string;
  ringColor: string;
}

export const CANDY_CATALOG: Record<CandyColorId, CandyMeta> = {
  strawberry: {
    id: 'strawberry',
    nameVi: 'Kẹo Dâu Đỏ',
    nameEn: 'Ruby Strawberry',
    emoji: '🍓',
    bgGradient: 'from-[#FF5E7E] via-[#F43F5E] to-[#BE123C]',
    borderHex: '#FDA4AF',
    glowHex: '#F43F5E',
    ringColor: 'ring-rose-300',
  },
  lemon: {
    id: 'lemon',
    nameVi: 'Kẹo Chanh Vàng',
    nameEn: 'Sunburst Lemon',
    emoji: '🍋',
    bgGradient: 'from-[#FEF08A] via-[#FACC15] to-[#CA8A04]',
    borderHex: '#FEF9C3',
    glowHex: '#FACC15',
    ringColor: 'ring-amber-200',
  },
  emerald: {
    id: 'emerald',
    nameVi: 'Kẹo Bạc Hà Xanh',
    nameEn: 'Highland Mint',
    emoji: '🍏',
    bgGradient: 'from-[#6EE7B7] via-[#10B981] to-[#047857]',
    borderHex: '#A7F3D0',
    glowHex: '#10B981',
    ringColor: 'ring-emerald-300',
  },
  blueberry: {
    id: 'blueberry',
    nameVi: 'Kẹo Việt Quất',
    nameEn: 'Sapphire Berry',
    emoji: '🫐',
    bgGradient: 'from-[#7DD3FC] via-[#0EA5E9] to-[#1D4ED8]',
    borderHex: '#BAE6FD',
    glowHex: '#38BDF8',
    ringColor: 'ring-sky-300',
  },
  grape: {
    id: 'grape',
    nameVi: 'Kẹo Nho Tím',
    nameEn: 'Royal Grape',
    emoji: '🍇',
    bgGradient: 'from-[#D8B4FE] via-[#A855F7] to-[#6B21A8]',
    borderHex: '#E9D5FF',
    glowHex: '#A855F7',
    ringColor: 'ring-purple-300',
  },
  caramel: {
    id: 'caramel',
    nameVi: 'Kẹo Cà Phê Caramel',
    nameEn: 'ROAR Caramel',
    emoji: '🍬',
    bgGradient: 'from-[#FDBA74] via-[#EA580C] to-[#9A3412]',
    borderHex: '#FED7AA',
    glowHex: '#F97316',
    ringColor: 'ring-orange-300',
  },
};

export const CANDY_COLOR_IDS: CandyColorId[] = [
  'strawberry',
  'lemon',
  'emerald',
  'blueberry',
  'grape',
  'caramel',
];

export interface SagaLevelSpec {
  level: number;
  titleVi: string;
  titleEn: string;
  movesLimit: number;
  targetScore: number;
  colorCount: 5 | 6;
  jellyCount: number;
  collectColor?: CandyColorId;
  collectTarget?: number;
  coinReward: number;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
}

export function getSagaLevelSpec(levelNum: number): SagaLevelSpec {
  const lvl = Math.max(1, Math.min(60, Math.floor(levelNum)));
  const colorCount: 5 | 6 = lvl <= 4 ? 5 : 6;
  const movesLimit = Math.max(15, 26 - Math.floor((lvl - 1) / 4));
  const targetScore = 900 + (lvl - 1) * 380;
  const jellyCount = lvl >= 2 ? Math.min(28, 4 + Math.floor(lvl * 1.4)) : 0;
  const collectColor = lvl % 3 === 0 ? CANDY_COLOR_IDS[lvl % CANDY_COLOR_IDS.length] : undefined;
  const collectTarget = collectColor ? 12 + Math.min(24, lvl * 2) : undefined;
  const difficulty: SagaLevelSpec['difficulty'] =
    lvl % 5 === 0 ? 'boss' : lvl >= 12 ? 'hard' : lvl >= 5 ? 'medium' : 'easy';

  const titlesVi = [
    'Thung Lũng Kẹo Ngọt',
    'Suối Thạch Bạc Hà',
    'Đồi Caramel ROAR',
    'Tháp Sấm Sét Cầu Vồng',
    'Đỉnh Hoàng Gia Saga',
  ];
  const titlesEn = [
    'Sweet Sugar Valley',
    'Mint Jelly Springs',
    'ROAR Caramel Hills',
    'Thunder Rainbow Spire',
    'Royal Saga Summit',
  ];
  const zoneIdx = Math.floor((lvl - 1) / 5) % titlesVi.length;

  return {
    level: lvl,
    titleVi: `Màn ${lvl} · ${titlesVi[zoneIdx]}`,
    titleEn: `Level ${lvl} · ${titlesEn[zoneIdx]}`,
    movesLimit,
    targetScore,
    colorCount,
    jellyCount,
    collectColor,
    collectTarget,
    coinReward: 35 + lvl * 8 + (difficulty === 'boss' ? 60 : 0),
    xpReward: 40 + lvl * 12,
    difficulty,
  };
}

export interface SagaCharacterSkin {
  id: string;
  nameVi: string;
  nameEn: string;
  avatarEmoji: string;
  outfitTitleVi: string;
  outfitTitleEn: string;
  skillNameVi: string;
  skillNameEn: string;
  skillDescVi: string;
  skillDescEn: string;
  costCoins: number;
  accentGradient: string;
  scoreBonusPct: number;
  startMovesBonus: number;
  thunderChancePct: number;
}

export const SAGA_CHARACTER_SKINS: SagaCharacterSkin[] = [
  {
    id: 'barista_lion',
    nameVi: 'Sư Tử Barista Hoàng Gia',
    nameEn: 'Royal Barista Lion',
    avatarEmoji: '🦁',
    outfitTitleVi: 'Tạp Dề Vàng ROAR',
    outfitTitleEn: 'ROAR Gold Apron',
    skillNameVi: 'Nhịp Pha Chuẩn',
    skillNameEn: 'Golden Pour Rhythm',
    skillDescVi: '+10% điểm kẹo mỗi combo liên hoàn.',
    skillDescEn: '+10% candy score on every cascade combo.',
    costCoins: 0,
    accentGradient: 'from-[#00552B] to-[#C6A667]',
    scoreBonusPct: 10,
    startMovesBonus: 0,
    thunderChancePct: 5,
  },
  {
    id: 'thunder_panther',
    nameVi: 'Báo Đen Sấm Sét',
    nameEn: 'Thunder Black Panther',
    avatarEmoji: '🐆',
    outfitTitleVi: 'Giáp Ánh Chớp Tím',
    outfitTitleEn: 'Violet Storm Armor',
    skillNameVi: 'Lôi Kích Liên Hoàn',
    skillNameEn: 'Chain Lightning Strike',
    skillDescVi: '+25% tỉ lệ phóng tia sét chéo khi nổ kẹo đặc biệt.',
    skillDescEn: '+25% arc lightning proc when detonating special candies.',
    costCoins: 240,
    accentGradient: 'from-[#312E81] via-[#7C3AED] to-[#EC4899]',
    scoreBonusPct: 15,
    startMovesBonus: 1,
    thunderChancePct: 25,
  },
  {
    id: 'galaxy_fox',
    nameVi: 'Cáo Đỏ Thiên Hà',
    nameEn: 'Galaxy Aurora Fox',
    avatarEmoji: '🦊',
    outfitTitleVi: 'Áo Choàng Sao Băng',
    outfitTitleEn: 'Starfall Cloak',
    skillNameVi: 'Thiên Nhãn 8 Hướng',
    skillNameEn: '8-Way Star Sight',
    skillDescVi: '+20% điểm tổng & cộng thêm +2 lượt mỗi ván.',
    skillDescEn: '+20% total candy score & +2 starting moves.',
    costCoins: 380,
    accentGradient: 'from-[#EA580C] via-[#F43F5E] to-[#A855F7]',
    scoreBonusPct: 20,
    startMovesBonus: 2,
    thunderChancePct: 15,
  },
  {
    id: 'emerald_eagle',
    nameVi: 'Đại Bàng Cầu Vồng',
    nameEn: 'Rainbow Sky Eagle',
    avatarEmoji: '🦅',
    outfitTitleVi: 'Cánh Pha Lê Emerald',
    outfitTitleEn: 'Emerald Crystal Wings',
    skillNameVi: 'Bão Kẹo Cầu Vồng',
    skillNameEn: 'Prism Candy Tempest',
    skillDescVi: '+25% điểm, +3 lượt đầu ván & sét lan 30%.',
    skillDescEn: '+25% score, +3 starting moves & 30% lightning arc.',
    costCoins: 560,
    accentGradient: 'from-[#047857] via-[#06B6D4] to-[#3B82F6]',
    scoreBonusPct: 25,
    startMovesBonus: 3,
    thunderChancePct: 30,
  },
];

export interface SagaWeeklyQuestDef {
  id: string;
  titleVi: string;
  titleEn: string;
  target: number;
  rewardCoins: number;
  rewardRoarPts: number;
}

export const SAGA_WEEKLY_QUESTS: SagaWeeklyQuestDef[] = [
  {
    id: 'clear_levels',
    titleVi: 'Vượt 5 màn Candy Saga trong tuần',
    titleEn: 'Clear 5 Candy Saga levels this week',
    target: 5,
    rewardCoins: 180,
    rewardRoarPts: 25,
  },
  {
    id: 'trigger_specials',
    titleVi: 'Kích hoạt 15 kẹo Sọc / Bom / Cầu Vồng',
    titleEn: 'Detonate 15 Striped / Wrapped / Color Bombs',
    target: 15,
    rewardCoins: 150,
    rewardRoarPts: 20,
  },
  {
    id: 'play_pvp',
    titleVi: 'Tham gia 2 trận đấu PvP thời gian thực',
    titleEn: 'Play 2 real-time PvP matches',
    target: 2,
    rewardCoins: 220,
    rewardRoarPts: 35,
  },
  {
    id: 'guild_chat',
    titleVi: 'Gửi 3 tin nhắn giao lưu Bang hội / Thế giới',
    titleEn: 'Send 3 live chat messages in Guild or Global chat',
    target: 3,
    rewardCoins: 90,
    rewardRoarPts: 15,
  },
];

export interface SeasonalHonorTier {
  id: string;
  nameVi: string;
  nameEn: string;
  minScore: number;
  badgeEmoji: string;
  rewardLabelVi: string;
  rewardLabelEn: string;
  colorClass: string;
}

export const SEASONAL_HONOR_TIERS: SeasonalHonorTier[] = [
  {
    id: 'challenger',
    nameVi: 'Huyền Thoại Mùa 1',
    nameEn: 'Season 1 Legend',
    minScore: 25000,
    badgeEmoji: '👑',
    rewardLabelVi: 'Khung Vàng Hoàng Gia + 500 Xu + 100 điểm ROAR',
    rewardLabelEn: 'Royal Gold Crest + 500 Coins + 100 ROAR Pts',
    colorClass: 'from-[#FDE047] via-[#F59E0B] to-[#B45309]',
  },
  {
    id: 'diamond',
    nameVi: 'Kim Cương Tây Nguyên',
    nameEn: 'Highland Diamond',
    minScore: 12000,
    badgeEmoji: '💎',
    rewardLabelVi: 'Huy hiệu Kim Cương + 300 Xu + 50 điểm ROAR',
    rewardLabelEn: 'Diamond Badge + 300 Coins + 50 ROAR Pts',
    colorClass: 'from-[#38BDF8] via-[#6366F1] to-[#A855F7]',
  },
  {
    id: 'emerald',
    nameVi: 'Ngọc Lục Bảo ROAR',
    nameEn: 'ROAR Emerald',
    minScore: 5000,
    badgeEmoji: '❇️',
    rewardLabelVi: 'Huy hiệu Emerald + 150 Xu',
    rewardLabelEn: 'Emerald Badge + 150 Coins',
    colorClass: 'from-[#34D399] to-[#059669]',
  },
  {
    id: 'bronze',
    nameVi: 'Tân Binh Ngọt Ngào',
    nameEn: 'Sweet Challenger',
    minScore: 0,
    badgeEmoji: '🍬',
    rewardLabelVi: 'Huy hiệu Khởi Đầu + Quà mỗi ngày',
    rewardLabelEn: 'Starter Badge + Daily Gift Eligibility',
    colorClass: 'from-[#FB923C] to-[#C2410C]',
  },
];

export function resolveSeasonalHonorTier(seasonalScore: number): SeasonalHonorTier {
  return SEASONAL_HONOR_TIERS.find((t) => seasonalScore >= t.minScore) || SEASONAL_HONOR_TIERS[SEASONAL_HONOR_TIERS.length - 1];
}
