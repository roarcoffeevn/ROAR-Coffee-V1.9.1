export type CubeDir = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

export interface CubeBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  dir: CubeDir;
  colorIndex: number;
}

export type LevelShapeType =
  | 'brick'
  | 'tower'
  | 'cross'
  | 'arch'
  | 'pyramid'
  | 'coffee_cup'
  | 'diamond'
  | 'helix'
  | 'bridge'
  | 'hollow_cube'
  | 'twin_towers'
  | 'star_burst'
  | 'spiral_stair';

export interface CubeLevelSpec {
  stageKey: string;
  mode: 'campaign' | 'daily' | 'event';
  levelNumber: number;
  titleVi: string;
  titleEn: string;
  shape: LevelShapeType;
  blocks: CubeBlock[];
  baseMovesAllowance: number;
  coinReward: number;
  xpReward: number;
}

export type CubeSkinId = 'arcade' | 'roar_gold' | 'cyber_neon' | 'pastel_macaron' | 'crystal_prism';
export type ArenaBackdropId = 'indigo_studio' | 'roar_emerald' | 'highland_mist' | 'obsidian_vault';
export type LightingMoodId = 'default' | 'sunset_highland' | 'rainy_espresso' | 'morning_caudat';
export type CharacterUpgradeId = 'radar' | 'thruster' | 'shield' | 'arsenal';

export interface LightingMoodSpec {
  id: LightingMoodId;
  nameVi: string;
  nameEn: string;
  bgHex?: string;
  keyLightHex?: string;
  fillLightHex?: string;
  rimLightHex?: string;
  ringHex?: string;
  swatchHex: string;
}

export const LIGHTING_MOODS: LightingMoodSpec[] = [
  {
    id: 'default',
    nameVi: 'Theo Phông',
    nameEn: 'Backdrop Sync',
    swatchHex: '#38BDF8',
  },
  {
    id: 'sunset_highland',
    nameVi: 'Hoàng Hôn',
    nameEn: 'Highland Sunset',
    bgHex: '#231411',
    keyLightHex: '#FDBA74',
    fillLightHex: '#F472B6',
    rimLightHex: '#F59E0B',
    ringHex: '#FB923C',
    swatchHex: '#FB923C',
  },
  {
    id: 'rainy_espresso',
    nameVi: 'Đêm Mưa',
    nameEn: 'Rainy Espresso',
    bgHex: '#0A161A',
    keyLightHex: '#BAE6FD',
    fillLightHex: '#38BDF8',
    rimLightHex: '#818CF8',
    ringHex: '#38BDF8',
    swatchHex: '#38BDF8',
  },
  {
    id: 'morning_caudat',
    nameVi: 'Sáng Sớm',
    nameEn: 'Cau Dat Dawn',
    bgHex: '#0B1F16',
    keyLightHex: '#FEF08A',
    fillLightHex: '#86EFAC',
    rimLightHex: '#C6A667',
    ringHex: '#4ADE80',
    swatchHex: '#4ADE80',
  },
];

export interface CubeSkinSpec {
  id: CubeSkinId;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  costCoins: number;
  streakUnlockDay?: number;
  palette: [string, string, string, string, string, string];
  arrowColor: string;
  rimColor: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  translucent?: boolean;
}

export interface ArenaBackdropSpec {
  id: ArenaBackdropId;
  nameVi: string;
  nameEn: string;
  costCoins: number;
  bgHex: string;
  fogHex: string;
  pedestalHex: string;
  ringHex: string;
  keyLightHex: string;
  fillLightHex: string;
  rimLightHex: string;
}

export interface CharacterUpgradeSpec {
  id: CharacterUpgradeId;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  bonusPerLevelVi: string;
  bonusPerLevelEn: string;
}

export interface CubeStreakDaySpec {
  day: number;
  coins: number;
  xp: number;
  toolGift?: { tool: 'hammer' | 'shuffle' | 'hint'; qty: number };
  skinUnlock?: CubeSkinId;
  labelVi: string;
  labelEn: string;
}

export interface SpecialEventSpec {
  id: string;
  cycleIndex: number;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  badgeVi: string;
  badgeEn: string;
  accentHex: string;
  endsAtIso: string;
  bonusRoarPoints: number;
  bonusCoins: number;
  stages: Array<{
    stageIndex: number;
    stageKey: string;
    titleVi: string;
    titleEn: string;
    shape: LevelShapeType;
    dim: [number, number, number];
  }>;
}

export interface CubeAwayUpgradesState {
  radar: number;
  thruster: number;
  shield: number;
  arsenal: number;
}

export interface CubeAwayProfile {
  user_id: number;
  display_name: string;
  member_code: string;
  tier: string;
  avatar_badge: string;
  xp: number;
  level: number;
  coins: number;
  current_level: number;
  max_level: number;
  total_score: number;
  levels_cleared: number;
  daily_cleared_count: number;
  last_daily_date: string;
  active_skin: CubeSkinId;
  unlocked_skins: CubeSkinId[];
  active_backdrop: ArenaBackdropId;
  unlocked_backdrops: ArenaBackdropId[];
  upgrades: CubeAwayUpgradesState;
  tool_hammer: number;
  tool_shuffle: number;
  tool_hint: number;
  streak_days: number;
  last_login_date: string;
  streak_claimed_days: number[];
  event_cleared_stages: string[];
}

export const CUBE_SKINS: CubeSkinSpec[] = [
  {
    id: 'arcade',
    nameVi: 'Ngọc Lục Bảo Arcade',
    nameEn: 'Arcade Jewel',
    descVi: '6 sắc ngọc rực rỡ, độ bóng cao dễ nhìn hướng mũi tên 3D.',
    descEn: 'Vibrant 6-color high-gloss blocks for crisp directional reading.',
    costCoins: 0,
    palette: ['#06B6D4', '#3B82F6', '#22C55E', '#FACC15', '#F97316', '#EC4899'],
    arrowColor: '#FFFFFF',
    rimColor: '#0F172A',
    metalness: 0.14,
    roughness: 0.24,
    clearcoat: 0.75,
  },
  {
    id: 'roar_gold',
    nameVi: 'ROAR Espresso & Vàng',
    nameEn: 'ROAR Espresso Gold',
    descVi: 'Phiên bản độc quyền ROAR: Xanh lục thẫm, Espresso rang và vàng kim.',
    descEn: 'Signature ROAR Forest Emerald, Dark Espresso & Brushed Champagne Gold.',
    costCoins: 180,
    palette: ['#00552B', '#C6A667', '#3E2723', '#0B6E3A', '#D4AF37', '#1E3A2B'],
    arrowColor: '#FFF7E0',
    rimColor: '#111111',
    metalness: 0.45,
    roughness: 0.22,
    clearcoat: 0.85,
  },
  {
    id: 'cyber_neon',
    nameVi: 'Neon Điện Quang',
    nameEn: 'Cyber Neon',
    descVi: 'Thân khối obsidian tối kết hợp dải quang phổ neon tương phản mạnh.',
    descEn: 'Obsidian carbon body accented with vivid neon plasma hues.',
    costCoins: 240,
    palette: ['#00F5D4', '#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9', '#FB5607'],
    arrowColor: '#090D16',
    rimColor: '#020617',
    metalness: 0.35,
    roughness: 0.18,
    clearcoat: 0.9,
  },
  {
    id: 'pastel_macaron',
    nameVi: 'Gốm Sứ Pastel',
    nameEn: 'Pastel Ceramic',
    descVi: 'Bề mặt gốm mịn dịu mắt với tông kem, matcha, oải hương & san hô.',
    descEn: 'Soft satin ceramic tones in cream, matcha, lavender & coral.',
    costCoins: 160,
    palette: ['#A7F3D0', '#FDE68A', '#FBCFE8', '#BAE6FD', '#DDD6FE', '#FED7AA'],
    arrowColor: '#1E293B',
    rimColor: '#475569',
    metalness: 0.05,
    roughness: 0.48,
    clearcoat: 0.2,
  },
  {
    id: 'crystal_prism',
    nameVi: 'Pha Lê Băng Giá',
    nameEn: 'Crystal Prism',
    descVi: 'Khối pha lê trong suốt phản chiếu ánh sáng studio (Mở khóa ngày 7 hoặc mua xu).',
    descEn: 'Translucent studio prism blocks (Day 7 Streak Gift or Coin Unlock).',
    costCoins: 360,
    streakUnlockDay: 7,
    palette: ['#67E8F9', '#A5B4FC', '#86EFAC', '#FDE047', '#F9A8D4', '#C4B5FD'],
    arrowColor: '#FFFFFF',
    rimColor: '#E2E8F0',
    metalness: 0.1,
    roughness: 0.12,
    clearcoat: 1.0,
    translucent: true,
  },
];

export const ARENA_BACKDROPS: ArenaBackdropSpec[] = [
  {
    id: 'indigo_studio',
    nameVi: 'Không Gian Thiên Hà',
    nameEn: 'Deep Space Indigo',
    costCoins: 0,
    bgHex: '#0F172A',
    fogHex: '#0F172A',
    pedestalHex: '#1E293B',
    ringHex: '#38BDF8',
    keyLightHex: '#FFF6E5',
    fillLightHex: '#93C5FD',
    rimLightHex: '#38BDF8',
  },
  {
    id: 'roar_emerald',
    nameVi: 'Phòng Rang ROAR Lục Bảo',
    nameEn: 'ROAR Emerald Roastery',
    costCoins: 140,
    bgHex: '#071F14',
    fogHex: '#071F14',
    pedestalHex: '#0E3523',
    ringHex: '#C6A667',
    keyLightHex: '#FFF1D0',
    fillLightHex: '#6EE7B7',
    rimLightHex: '#C6A667',
  },
  {
    id: 'highland_mist',
    nameVi: 'Sương Mù Cao Nguyên',
    nameEn: 'Highland Dawn Studio',
    costCoins: 180,
    bgHex: '#1C1917',
    fogHex: '#1C1917',
    pedestalHex: '#292524',
    ringHex: '#F59E0B',
    keyLightHex: '#FDE68A',
    fillLightHex: '#FCA5A5',
    rimLightHex: '#FB923C',
  },
  {
    id: 'obsidian_vault',
    nameVi: 'Hầm Đá Obsidian',
    nameEn: 'Midnight Obsidian',
    costCoins: 220,
    bgHex: '#09090B',
    fogHex: '#09090B',
    pedestalHex: '#18181B',
    ringHex: '#A855F7',
    keyLightHex: '#F8FAFC',
    fillLightHex: '#C084FC',
    rimLightHex: '#EC4899',
  },
];

export const CHARACTER_UPGRADES: CharacterUpgradeSpec[] = [
  {
    id: 'radar',
    nameVi: 'Thị Giác Chiến Thuật',
    nameEn: 'Tactical Vision',
    descVi: 'Tự động phát sáng 1 khối thoát sẵn khi vào màn từ Cấp 2 & tăng điểm Gợi Ý.',
    descEn: 'Auto-highlights a guaranteed clear block at stage start (Lv.2+) & boosts Hint clarity.',
    maxLevel: 5,
    baseCost: 70,
    costStep: 55,
    bonusPerLevelVi: '+15% điểm Gợi Ý & tự soi khối mở đường',
    bonusPerLevelEn: '+15% Hint bonus & auto-spot opening block',
  },
  {
    id: 'thruster',
    nameVi: 'Phản Lực Combo',
    nameEn: 'Combo Thruster',
    descVi: 'Nhân hệ số điểm khi tháo khối liên tiếp không sai bước.',
    descEn: 'Multiplies combo score per consecutive clean cube removal.',
    maxLevel: 5,
    baseCost: 85,
    costStep: 65,
    bonusPerLevelVi: '+18% điểm Combo mỗi cấp',
    bonusPerLevelEn: '+18% Combo multiplier per level',
  },
  {
    id: 'shield',
    nameVi: 'Khiên Kiên Cường',
    nameEn: 'Resilience Shield',
    descVi: 'Tăng số lượt chạm nhầm cho phép trong các màn độ khó cao.',
    descEn: 'Grants extra mistake tolerance on complex 3D stages.',
    maxLevel: 5,
    baseCost: 75,
    costStep: 60,
    bonusPerLevelVi: '+2 lượt sai mỗi màn / cấp',
    bonusPerLevelEn: '+2 extra mistake buffer / level',
  },
  {
    id: 'arsenal',
    nameVi: 'Bậc Thầy Dụng Cụ',
    nameEn: 'Arsenal Mastery',
    descVi: 'Tăng thưởng Cube Coins mỗi khi qua màn & tặng thêm Búa khi lên cấp.',
    descEn: 'Increases stage Cube Coin payout & grants bonus Hammer on level up.',
    maxLevel: 5,
    baseCost: 90,
    costStep: 70,
    bonusPerLevelVi: '+20% Cube Coins thưởng qua màn',
    bonusPerLevelEn: '+20% Cube Coins earned per stage',
  },
];

export const CUBE_STREAK_REWARDS: CubeStreakDaySpec[] = [
  {
    day: 1,
    coins: 40,
    xp: 30,
    toolGift: { tool: 'hint', qty: 1 },
    labelVi: '+40 Xu · 1 Gợi Ý',
    labelEn: '+40 Coins · 1 Hint',
  },
  {
    day: 2,
    coins: 55,
    xp: 45,
    toolGift: { tool: 'hammer', qty: 1 },
    labelVi: '+55 Xu · 1 Búa Phá',
    labelEn: '+55 Coins · 1 Hammer',
  },
  {
    day: 3,
    coins: 80,
    xp: 70,
    toolGift: { tool: 'shuffle', qty: 1 },
    labelVi: '+80 Xu · 1 Đảo Hướng',
    labelEn: '+80 Coins · 1 Shuffle',
  },
  {
    day: 4,
    coins: 75,
    xp: 65,
    toolGift: { tool: 'hint', qty: 2 },
    labelVi: '+75 Xu · 2 Gợi Ý',
    labelEn: '+75 Coins · 2 Hints',
  },
  {
    day: 5,
    coins: 100,
    xp: 90,
    toolGift: { tool: 'hammer', qty: 2 },
    labelVi: '+100 Xu · 2 Búa Phá',
    labelEn: '+100 Coins · 2 Hammers',
  },
  {
    day: 6,
    coins: 120,
    xp: 110,
    toolGift: { tool: 'shuffle', qty: 2 },
    labelVi: '+120 Xu · 2 Đảo Hướng',
    labelEn: '+120 Coins · 2 Shuffles',
  },
  {
    day: 7,
    coins: 200,
    xp: 180,
    toolGift: { tool: 'hammer', qty: 3 },
    skinUnlock: 'crystal_prism',
    labelVi: '+200 Xu · Skin Pha Lê',
    labelEn: '+200 Coins · Crystal Skin',
  },
];

export const TOOL_SHOP_ITEMS: Array<{
  tool: 'hammer' | 'shuffle' | 'hint';
  costCoins: number;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
}> = [
  {
    tool: 'hint',
    costCoins: 25,
    nameVi: 'Gợi Ý Tự Động (Hint)',
    nameEn: 'Smart Hint',
    descVi: 'Xoay camera & chiếu vòng vàng đúng khối đang thoát được.',
    descEn: 'Rotates camera & spotlights a clearable cube.',
  },
  {
    tool: 'hammer',
    costCoins: 45,
    nameVi: 'Búa Phá Khối (Smash)',
    nameEn: 'Smash Hammer',
    descVi: 'Phá vỡ ngay lập tức bất kỳ khối nào đang chắn đường.',
    descEn: 'Shatters any blocked cube out of your path.',
  },
  {
    tool: 'shuffle',
    costCoins: 40,
    nameVi: 'Đảo Hướng 3D (Flip)',
    nameEn: 'Arrow Shuffle',
    descVi: 'Sắp xếp lại toàn bộ mũi tên trên các khối còn lại theo đường mới.',
    descEn: 'Re-orients remaining cubes with a fresh solvable solution.',
  },
];

export const DIR_VECTORS: Record<CubeDir, [number, number, number]> = {
  '+x': [1, 0, 0],
  '-x': [-1, 0, 0],
  '+y': [0, 1, 0],
  '-y': [0, -1, 0],
  '+z': [0, 0, 1],
  '-z': [0, 0, -1],
};

const ALL_DIRS: CubeDir[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seedStr: string): () => number {
  let a = hashSeed(seedStr) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShapeVoxels(shape: LevelShapeType, dx: number, dy: number, dz: number): Array<[number, number, number]> {
  const coords: Array<[number, number, number]> = [];
  const cx = (dx - 1) / 2;
  const cy = (dy - 1) / 2;
  const cz = (dz - 1) / 2;

  for (let x = 0; x < dx; x++) {
    for (let y = 0; y < dy; y++) {
      for (let z = 0; z < dz; z++) {
        let include = true;
        if (shape === 'cross') {
          const inXBand = Math.abs(x - cx) <= 0.6;
          const inZBand = Math.abs(z - cz) <= 0.6;
          const inYBand = Math.abs(y - cy) <= 0.6;
          include = (inXBand && inZBand) || (inXBand && inYBand) || (inYBand && inZBand);
        } else if (shape === 'arch') {
          const isHollowCenter = y < dy - 1 && Math.abs(x - cx) < dx * 0.28 && Math.abs(z - cz) < dz * 0.65;
          include = !isHollowCenter;
        } else if (shape === 'pyramid') {
          const shrink = Math.floor(y / 1.15);
          include = x >= shrink && x <= dx - 1 - shrink && z >= shrink && z <= dz - 1 - shrink;
        } else if (shape === 'tower') {
          const topTier = y >= Math.floor(dy * 0.6);
          include = !topTier || (Math.abs(x - cx) <= 0.85 && Math.abs(z - cz) <= 0.85);
        } else if (shape === 'diamond') {
          const dist = Math.abs(x - cx) / Math.max(1, cx + 0.5) + Math.abs(y - cy) / Math.max(1, cy + 0.5) + Math.abs(z - cz) / Math.max(1, cz + 0.5);
          include = dist <= 1.55;
        } else if (shape === 'coffee_cup') {
          // Cup body + side handle loop
          const isBody = x < dx - 1 && (y > 0 || (Math.abs(x - (dx - 2) / 2) <= 0.8 && Math.abs(z - cz) <= 0.8));
          const isHandle = x === dx - 1 && y >= 1 && y <= dy - 1 && Math.abs(z - cz) <= 0.6 && (y === 1 || y === dy - 1 || dy <= 3);
          include = isBody || isHandle;
        } else if (shape === 'hollow_cube') {
          const onOuterShell = x === 0 || x === dx - 1 || y === 0 || y === dy - 1 || z === 0 || z === dz - 1;
          const isCenterWindow =
            (Math.abs(x - cx) < 0.6 && Math.abs(y - cy) < 0.6) ||
            (Math.abs(y - cy) < 0.6 && Math.abs(z - cz) < 0.6);
          include = onOuterShell && !isCenterWindow;
        } else if (shape === 'twin_towers') {
          const isLeftTower = x <= 1 && Math.abs(z - cz) <= 1.1;
          const isRightTower = x >= dx - 2 && Math.abs(z - cz) <= 1.1;
          const isSkyBridge = y === Math.floor(dy * 0.55) && Math.abs(z - cz) <= 0.6;
          include = isLeftTower || isRightTower || isSkyBridge;
        } else if (shape === 'bridge') {
          const isDeck = y === dy - 1 || (y === dy - 2 && Math.abs(x - cx) <= 0.8);
          const isLeftPier = x <= 1 && y < dy - 1 && (z === 0 || z === dz - 1 || Math.abs(z - cz) <= 0.6);
          const isRightPier = x >= dx - 2 && y < dy - 1 && (z === 0 || z === dz - 1 || Math.abs(z - cz) <= 0.6);
          include = isDeck || isLeftPier || isRightPier;
        } else if (shape === 'star_burst') {
          const ax = Math.abs(x - cx);
          const ay = Math.abs(y - cy);
          const az = Math.abs(z - cz);
          const onAxisArm = (ax <= 0.6 && ay <= 0.6) || (ay <= 0.6 && az <= 0.6) || (ax <= 0.6 && az <= 0.6);
          const onCore = ax + ay + az <= 1.8;
          include = onAxisArm || onCore;
        } else if (shape === 'spiral_stair') {
          const ang = Math.atan2(z - cz, x - cx);
          const normAng = ((ang + Math.PI) / (Math.PI * 2)) * Math.max(1, dy - 1);
          const targetY = Math.round(normAng) % dy;
          const radial = Math.hypot(x - cx, z - cz);
          include = radial <= 0.85 || (radial >= 0.9 && Math.abs(y - targetY) <= 0.6);
        } else if (shape === 'helix') {
          const dxC = x - cx;
          const dzC = z - cz;
          const phaseA = ((y / Math.max(1, dy - 1)) * Math.PI * 1.5);
          const rx1 = Math.cos(phaseA) * (cx * 0.75);
          const rz1 = Math.sin(phaseA) * (cz * 0.75);
          const rx2 = -rx1;
          const rz2 = -rz1;
          const nearStrand1 = Math.hypot(dxC - rx1, dzC - rz1) <= 1.05;
          const nearStrand2 = Math.hypot(dxC - rx2, dzC - rz2) <= 1.05;
          const isRung = y % 2 === 0 && Math.abs(dxC * rx1 + dzC * rz1) >= 0 && Math.hypot(dxC, dzC) <= Math.max(cx, cz) * 0.8;
          include = nearStrand1 || nearStrand2 || isRung;
        }
        if (include) coords.push([x, y, z]);
      }
    }
  }

  // Fallback to brick if sparse
  if (coords.length < 6) {
    const fallback: Array<[number, number, number]> = [];
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          fallback.push([x, y, z]);
        }
      }
    }
    return fallback;
  }
  return coords;
}

export function isDirectionClear(
  block: Pick<CubeBlock, 'id' | 'x' | 'y' | 'z' | 'dir'>,
  allBlocks: ReadonlyArray<Pick<CubeBlock, 'id' | 'x' | 'y' | 'z'>>
): boolean {
  const [vx, vy, vz] = DIR_VECTORS[block.dir];
  for (const other of allBlocks) {
    if (other.id === block.id) continue;
    const dx = other.x - block.x;
    const dy = other.y - block.y;
    const dz = other.z - block.z;
    if (vx !== 0 && dy === 0 && dz === 0 && Math.sign(dx) === vx) return false;
    if (vy !== 0 && dx === 0 && dz === 0 && Math.sign(dy) === vy) return false;
    if (vz !== 0 && dx === 0 && dy === 0 && Math.sign(dz) === vz) return false;
  }
  return true;
}

export function findBlockingDistance(
  block: Pick<CubeBlock, 'id' | 'x' | 'y' | 'z' | 'dir'>,
  allBlocks: ReadonlyArray<Pick<CubeBlock, 'id' | 'x' | 'y' | 'z'>>
): number | null {
  const [vx, vy, vz] = DIR_VECTORS[block.dir];
  let minSteps: number | null = null;
  for (const other of allBlocks) {
    if (other.id === block.id) continue;
    const dx = other.x - block.x;
    const dy = other.y - block.y;
    const dz = other.z - block.z;
    let steps = 0;
    if (vx !== 0 && dy === 0 && dz === 0 && Math.sign(dx) === vx) steps = Math.abs(dx);
    else if (vy !== 0 && dx === 0 && dz === 0 && Math.sign(dy) === vy) steps = Math.abs(dy);
    else if (vz !== 0 && dx === 0 && dy === 0 && Math.sign(dz) === vz) steps = Math.abs(dz);
    if (steps > 0 && (minSteps === null || steps < minSteps)) {
      minSteps = steps;
    }
  }
  return minSteps;
}

function assignGuaranteedSolvableDirections(
  voxels: Array<{ id: string; x: number; y: number; z: number; colorIndex: number }>,
  rng: () => number
): CubeBlock[] {
  const remaining = [...voxels];
  const result: CubeBlock[] = [];

  while (remaining.length > 0) {
    const candidates: Array<{ idx: number; dirs: CubeDir[] }> = [];
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const clearDirs: CubeDir[] = [];
      for (const dir of ALL_DIRS) {
        if (isDirectionClear({ ...item, dir }, remaining)) {
          clearDirs.push(dir);
        }
      }
      if (clearDirs.length > 0) {
        candidates.push({ idx: i, dirs: clearDirs });
      }
    }

    // In finite 3D integer lattices, boundary extrema always have at least 1 unobstructed ray
    if (candidates.length === 0) break;

    // Prefer interior/fewer-exit blocks first during reverse peeling so final puzzles feel layered and rewarding
    candidates.sort((a, b) => a.dirs.length - b.dirs.length);
    const poolSize = Math.max(1, Math.min(candidates.length, Math.ceil(candidates.length * 0.55)));
    const picked = candidates[Math.floor(rng() * poolSize)];
    const voxel = remaining.splice(picked.idx, 1)[0];
    const dir = picked.dirs[Math.floor(rng() * picked.dirs.length)];

    result.push({
      id: voxel.id,
      x: voxel.x,
      y: voxel.y,
      z: voxel.z,
      dir,
      colorIndex: voxel.colorIndex,
    });
  }

  // Center coordinates around (0,0,0) for clean 3D studio orbiting
  if (result.length > 0) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const b of result) {
      minX = Math.min(minX, b.x);
      maxX = Math.max(maxX, b.x);
      minY = Math.min(minY, b.y);
      maxY = Math.max(maxY, b.y);
      minZ = Math.min(minZ, b.z);
      maxZ = Math.max(maxZ, b.z);
    }
    // Keep integer offsets doubled or integer-grid centered if needed, wait:
    // Keep x, y, z as exact integers for grid raycast, and compute visual offset in 3D renderer!
  }

  return result;
}

export function reshuffleCubeArrows(blocks: CubeBlock[], seed = String(Date.now())): CubeBlock[] {
  const rng = createSeededRng(seed);
  return assignGuaranteedSolvableDirections(
    blocks.map((b) => ({ id: b.id, x: b.x, y: b.y, z: b.z, colorIndex: b.colorIndex })),
    rng
  );
}

const CAMPAIGN_TEMPLATES: Array<{
  titleVi: string;
  titleEn: string;
  shape: LevelShapeType;
  dim: [number, number, number];
}> = [
  { titleVi: 'Khởi Động Khối Vuông', titleEn: 'First Pour Warmup', shape: 'brick', dim: [2, 2, 2] },
  { titleVi: 'Gạch Cà Phê Phin', titleEn: 'Phin Filter Brick', shape: 'brick', dim: [3, 2, 3] },
  { titleVi: 'Lập Phương Cổ Điển', titleEn: 'Classic 3×3×3 Cube', shape: 'brick', dim: [3, 3, 3] },
  { titleVi: 'Tách Espresso 3D', titleEn: '3D Espresso Cup', shape: 'coffee_cup', dim: [4, 3, 3] },
  { titleVi: 'Tháp Thập Tự Cầu Đất', titleEn: 'Cau Dat Cross Spire', shape: 'cross', dim: [3, 4, 3] },
  { titleVi: 'Cổng Vòm Tây Nguyên', titleEn: 'Highland Archway', shape: 'arch', dim: [4, 3, 3] },
  { titleVi: 'Kim Tự Tháp Rang Mộc', titleEn: 'Roast Pyramid', shape: 'pyramid', dim: [4, 3, 4] },
  { titleVi: 'Tòa Tháp Di Sản', titleEn: 'Heritage Tower', shape: 'tower', dim: [4, 4, 3] },
  { titleVi: 'Kim Cương Arabica', titleEn: 'Arabica Diamond', shape: 'diamond', dim: [4, 4, 4] },
  { titleVi: 'Khối Lập Phương 4×4', titleEn: 'Master 4×4×4 Cube', shape: 'brick', dim: [4, 4, 4] },
  { titleVi: 'Cầu Vượt Đôi Cao Nguyên', titleEn: 'Twin Pier Bridge', shape: 'bridge', dim: [5, 3, 3] },
  { titleVi: 'Khối Rỗng Tâm Ánh Sáng', titleEn: 'Hollow Core Cube', shape: 'hollow_cube', dim: [4, 4, 4] },
  { titleVi: 'Pháo Đài Robusta', titleEn: 'Robusta Citadel', shape: 'tower', dim: [4, 5, 4] },
  { titleVi: 'Cổng Vòm Hoàng Kim', titleEn: 'Golden Arch 5×4', shape: 'arch', dim: [5, 4, 3] },
  { titleVi: 'Sao Sáu Cánh ROAR', titleEn: 'Six-Point Starburst', shape: 'star_burst', dim: [5, 5, 5] },
  { titleVi: 'Đỉnh Núi Bazan', titleEn: 'Basalt Peak 5×4', shape: 'pyramid', dim: [5, 4, 5] },
  { titleVi: 'Tháp Đôi Thiên Hà', titleEn: 'Galaxy Twin Towers', shape: 'twin_towers', dim: [5, 4, 4] },
  { titleVi: 'Tách Signature Reserve', titleEn: 'Reserve Cup Master', shape: 'coffee_cup', dim: [5, 4, 4] },
  { titleVi: 'Bậc Thang Rang Xay', titleEn: 'Roaster Spiral Stair', shape: 'spiral_stair', dim: [4, 5, 4] },
  { titleVi: 'Xoắn Ốc Espresso', titleEn: 'Espresso DNA Helix', shape: 'helix', dim: [4, 5, 4] },
  { titleVi: 'Đại Lập Phương ROAR', titleEn: 'ROAR Grand Cube', shape: 'brick', dim: [5, 4, 4] },
  { titleVi: 'Cầu Treo Sương Mù', titleEn: 'Mist Valley Bridge', shape: 'bridge', dim: [5, 4, 4] },
  { titleVi: 'Khối Rỗng Bạch Kim', titleEn: 'Platinum Hollow Vault', shape: 'hollow_cube', dim: [5, 4, 5] },
  { titleVi: 'Kim Cương Đêm Mưa', titleEn: 'Rainy Night Diamond', shape: 'diamond', dim: [5, 5, 5] },
  { titleVi: 'Tháp Đôi Đại Ngàn', titleEn: 'Highland Twin Spires', shape: 'twin_towers', dim: [5, 5, 4] },
  { titleVi: 'Ngôi Sao Bazan', titleEn: 'Basalt Starburst', shape: 'star_burst', dim: [5, 5, 5] },
  { titleVi: 'Tháp Xoắn Ngân Hà', titleEn: 'Nebula Helix Tower', shape: 'helix', dim: [5, 5, 5] },
  { titleVi: 'Đại Kim Tự Tháp 5×5', titleEn: 'Grand 5×5 Pyramid', shape: 'pyramid', dim: [5, 5, 5] },
  { titleVi: 'Đấu Trường Cổng Đôi', titleEn: 'Grand Coliseum Arch', shape: 'arch', dim: [6, 4, 4] },
  { titleVi: 'Pháo Đài Báo Đen 5×5', titleEn: 'Panther 5×5×5 Bastion', shape: 'brick', dim: [5, 5, 5] },
  { titleVi: 'Thánh Địa Cà Phê Cổ', titleEn: 'Ancient Roast Spire', shape: 'spiral_stair', dim: [5, 5, 5] },
  { titleVi: 'Cung Điện Vàng Kim', titleEn: 'Champagne Gold Citadel', shape: 'tower', dim: [5, 5, 4] },
  { titleVi: 'Siêu Tách Espresso', titleEn: 'Colossal Espresso Cup', shape: 'coffee_cup', dim: [5, 5, 4] },
  { titleVi: 'Khối Vô Cực Thiên Hà', titleEn: 'Cosmic Hollow Matrix', shape: 'hollow_cube', dim: [5, 5, 5] },
  { titleVi: 'Hợp Lưu Thập Tự 6×5', titleEn: 'Grand Cross Nexus', shape: 'cross', dim: [5, 5, 5] },
  { titleVi: 'Đế Chế ROAR 6×4×4', titleEn: 'ROAR Empire Monolith', shape: 'brick', dim: [6, 4, 4] },
];

export function generateSolvableCubeLevel(opts: {
  mode: 'campaign' | 'daily' | 'event';
  levelNumber?: number;
  dateStr?: string;
  eventStage?: SpecialEventSpec['stages'][number];
}): CubeLevelSpec {
  if (opts.mode === 'daily') {
    const dateStr = opts.dateStr || new Date().toISOString().slice(0, 10);
    const rng = createSeededRng(`roar-daily-${dateStr}`);
    const shapes: LevelShapeType[] = [
      'coffee_cup',
      'diamond',
      'pyramid',
      'arch',
      'tower',
      'brick',
      'hollow_cube',
      'twin_towers',
      'bridge',
      'star_burst',
      'helix',
    ];
    const shape = shapes[Math.floor(rng() * shapes.length)];
    const dim: [number, number, number] = shape === 'brick' ? [4, 4, 3] : [4, 4, 4];
    const coords = buildShapeVoxels(shape, dim[0], dim[1], dim[2]);
    const voxels = coords.map(([x, y, z], idx) => ({
      id: `d-${x}-${y}-${z}`,
      x,
      y,
      z,
      colorIndex: (idx + Math.floor(rng() * 6)) % 6,
    }));
    const blocks = assignGuaranteedSolvableDirections(voxels, rng);
    return {
      stageKey: `daily-${dateStr}`,
      mode: 'daily',
      levelNumber: 0,
      titleVi: `Thử Thách Ngày ${dateStr}`,
      titleEn: `Daily Challenge ${dateStr}`,
      shape,
      blocks,
      baseMovesAllowance: Math.max(8, Math.round(blocks.length * 0.35)),
      coinReward: 95,
      xpReward: 120,
    };
  }

  if (opts.mode === 'event' && opts.eventStage) {
    const st = opts.eventStage;
    const rng = createSeededRng(`roar-event-${st.stageKey}`);
    const coords = buildShapeVoxels(st.shape, st.dim[0], st.dim[1], st.dim[2]);
    const voxels = coords.map(([x, y, z], idx) => ({
      id: `e-${x}-${y}-${z}`,
      x,
      y,
      z,
      colorIndex: (x + y + z + idx) % 6,
    }));
    const blocks = assignGuaranteedSolvableDirections(voxels, rng);
    return {
      stageKey: st.stageKey,
      mode: 'event',
      levelNumber: st.stageIndex,
      titleVi: st.titleVi,
      titleEn: st.titleEn,
      shape: st.shape,
      blocks,
      baseMovesAllowance: Math.max(8, Math.round(blocks.length * 0.32)),
      coinReward: 110 + st.stageIndex * 25,
      xpReward: 140 + st.stageIndex * 30,
    };
  }

  const lvl = Math.max(1, Math.floor(opts.levelNumber || 1));
  const rng = createSeededRng(`roar-campaign-v3-lvl-${lvl}`);
  const tpl = CAMPAIGN_TEMPLATES[(lvl - 1) % CAMPAIGN_TEMPLATES.length];
  const extraCycle = Math.floor((lvl - 1) / CAMPAIGN_TEMPLATES.length);
  const dx = Math.min(6, tpl.dim[0] + (extraCycle > 0 && tpl.dim[0] < 6 ? 1 : 0));
  const dy = Math.min(5, tpl.dim[1] + (extraCycle > 0 && tpl.dim[1] < 5 ? 1 : 0));
  const dz = Math.min(5, tpl.dim[2] + (extraCycle > 1 && tpl.dim[2] < 5 ? 1 : 0));
  const coords = buildShapeVoxels(tpl.shape, dx, dy, dz);
  const voxels = coords.map(([x, y, z]) => ({
    id: `c-${lvl}-${x}-${y}-${z}`,
    x,
    y,
    z,
    colorIndex: Math.floor(rng() * 6),
  }));
  const blocks = assignGuaranteedSolvableDirections(voxels, rng);

  return {
    stageKey: `lvl-${lvl}`,
    mode: 'campaign',
    levelNumber: lvl,
    titleVi: `Cấp ${lvl}: ${tpl.titleVi}`,
    titleEn: `Level ${lvl}: ${tpl.titleEn}`,
    shape: tpl.shape,
    blocks,
    baseMovesAllowance: Math.max(6, Math.round(blocks.length * 0.35)),
    coinReward: 35 + Math.min(110, lvl * 4),
    xpReward: 45 + Math.min(160, lvl * 6),
  };
}

const ROTATING_EVENTS: Array<Omit<SpecialEventSpec, 'cycleIndex' | 'endsAtIso'>> = [
  {
    id: 'highland_harvest_cup',
    titleVi: 'Giải Đấu Mùa Vụ Tây Nguyên',
    titleEn: 'Highland Harvest 3D Cup',
    subtitleVi: 'Vượt 3 màn 3D chủ đề thu hoạch nhận ngay +180 Xu & +40 Điểm ROAR CLUB.',
    subtitleEn: 'Clear all 3 Highland 3D stages to earn +180 Coins & +40 ROAR CLUB Points.',
    badgeVi: 'SỰ KIỆN MÙA VỤ',
    badgeEn: 'HARVEST CUP',
    accentHex: '#22C55E',
    bonusRoarPoints: 40,
    bonusCoins: 180,
    stages: [
      {
        stageIndex: 1,
        stageKey: 'event-highland-1',
        titleVi: 'Màn 1: Cổng Vòm Buôn Ma Thuột',
        titleEn: 'Stage 1: Buon Ma Thuot Arch',
        shape: 'arch',
        dim: [4, 3, 3],
      },
      {
        stageIndex: 2,
        stageKey: 'event-highland-2',
        titleVi: 'Màn 2: Tháp Chín Đỏ',
        titleEn: 'Stage 2: Crimson Spire',
        shape: 'tower',
        dim: [4, 4, 3],
      },
      {
        stageIndex: 3,
        stageKey: 'event-highland-3',
        titleVi: 'Màn 3: Đỉnh Cầu Đất 3D',
        titleEn: 'Stage 3: Cau Dat Summit',
        shape: 'pyramid',
        dim: [5, 4, 4],
      },
    ],
  },
  {
    id: 'panther_reserve_rush',
    titleVi: 'Tuần Lễ Báo Đen Signature',
    titleEn: 'Black Panther Reserve Rush',
    subtitleVi: 'Chinh phục 3 khối kiến trúc Reserve nhận +200 Xu & +50 Điểm ROAR CLUB.',
    subtitleEn: 'Conquer 3 Reserve architectures for +200 Coins & +50 ROAR CLUB Points.',
    badgeVi: 'SỰ KIỆN RESERVE',
    badgeEn: 'RESERVE RUSH',
    accentHex: '#C6A667',
    bonusRoarPoints: 50,
    bonusCoins: 200,
    stages: [
      {
        stageIndex: 1,
        stageKey: 'event-reserve-1',
        titleVi: 'Màn 1: Ly Signature 3D',
        titleEn: 'Stage 1: 3D Reserve Cup',
        shape: 'coffee_cup',
        dim: [4, 3, 3],
      },
      {
        stageIndex: 2,
        stageKey: 'event-reserve-2',
        titleVi: 'Màn 2: Kim Cương Rang Mộc',
        titleEn: 'Stage 2: Dark Roast Diamond',
        shape: 'diamond',
        dim: [4, 4, 4],
      },
      {
        stageIndex: 3,
        stageKey: 'event-reserve-3',
        titleVi: 'Màn 3: Hộp Báu Báo Đen',
        titleEn: 'Stage 3: Panther Vault Cube',
        shape: 'brick',
        dim: [5, 4, 4],
      },
    ],
  },
];

export function getActiveSpecialEvent(nowMs = Date.now()): SpecialEventSpec {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const cycleIndex = Math.floor(nowMs / weekMs);
  const template = ROTATING_EVENTS[cycleIndex % ROTATING_EVENTS.length];
  const endsAtIso = new Date((cycleIndex + 1) * weekMs).toISOString();
  return {
    ...template,
    cycleIndex,
    endsAtIso,
  };
}

export function computeXpForNextLevel(level: number): number {
  return 100 + Math.max(0, level - 1) * 65;
}
