// 数据管理模块 - 支持 Vercel KV 和本地文件

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// 数据文件路径
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  requests: path.join(DATA_DIR, 'requests.json'),
  history: path.join(DATA_DIR, 'history.json'),
  exerciseRecords: path.join(DATA_DIR, 'exercise-records.json'),
  shopItems: path.join(DATA_DIR, 'shop-items.json'),
  dailyStats: path.join(DATA_DIR, 'daily-stats.json'),
  competitions: path.join(DATA_DIR, 'competitions.json'),
};

// 初始化数据目录
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 读取 JSON 文件
function readJSON<T>(filePath: string): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
  }
  return [] as T;
}

// 写入 JSON 文件
function writeJSON<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`写入文件失败: ${filePath}`, error);
    return false;
  }
}

// 数据管理器
export const dataManager = {
  // 用户相关
  getUsers: () => readJSON<any[]>(FILES.users),
  saveUsers: (users: any[]) => writeJSON(FILES.users, users),

  // 需求相关
  getRequests: () => readJSON<any[]>(FILES.requests),
  saveRequests: (requests: any[]) => writeJSON(FILES.requests, requests),

  // 历史记录相关
  getHistory: () => readJSON<any[]>(FILES.history),
  saveHistory: (history: any[]) => writeJSON(FILES.history, history),

  // 运动记录相关
  getExerciseRecords: () => readJSON<any[]>(FILES.exerciseRecords),
  saveExerciseRecords: (records: any[]) => writeJSON(FILES.exerciseRecords, records),

  // 商城物品相关
  getShopItems: () => readJSON<any[]>(FILES.shopItems),
  saveShopItems: (items: any[]) => writeJSON(FILES.shopItems, items),

  // 每日统计相关
  getDailyStats: () => readJSON<any[]>(FILES.dailyStats),
  saveDailyStats: (stats: any[]) => writeJSON(FILES.dailyStats, stats),

  // 赛事相关
  getCompetitions: () => readJSON<any[]>(FILES.competitions),
  saveCompetitions: (competitions: any[]) => writeJSON(FILES.competitions, competitions),

  // 生成 ID
  generateId: () => Date.now().toString() + Math.random().toString(36).substr(2, 9),

  // 计算有效积分
  getValidPoints: (user: any): number => {
    if (!user.pointsHistory || !Array.isArray(user.pointsHistory)) {
      return user.points || 0;
    }
    const now = Date.now();
    return user.pointsHistory
      .filter((record: any) => record.expiresAt > now)
      .reduce((sum: number, record: any) => sum + record.points, 0);
  },

  // 清理过期积分
  cleanExpiredPoints: (users: any[]): number => {
    const now = Date.now();
    let totalCleaned = 0;
    users.forEach(user => {
      if (user.pointsHistory && Array.isArray(user.pointsHistory)) {
        const beforeCount = user.pointsHistory.length;
        user.pointsHistory = user.pointsHistory.filter((record: any) => record.expiresAt > now);
        totalCleaned += beforeCount - user.pointsHistory.length;
      }
    });
    return totalCleaned;
  },
};

// 官方审核员账号
export const OFFICIAL_ACCOUNT = {
  id: 'official-system-builtin',
  username: '官方审核员',
  name: '官方审核员',
  password: '10280613xrldyf',
  type: 'official' as const,
  phone: '官方账号',
  points: 0,
  pointsHistory: [],
  lastCheckIn: null,
  certified: true,
  createdAt: Date.now(),
  currentStreak: 0,
  totalStreak: 0,
  lastStreakDate: null,
  streakTorches: 0,
  lotteryTickets: 1,
};

// 确保官方审核员存在
export function ensureOfficialAccount(users: any[]): { users: any[]; restored: boolean } {
  const officialExists = users.some(u => u.type === 'official' && u.username === '官方审核员');

  if (!officialExists) {
    users.unshift({ ...OFFICIAL_ACCOUNT, createdAt: Date.now() });
    return { users, restored: true };
  }

  return { users, restored: false };
}

// 计算运动积分
export function calculateExercisePoints(distance: number): { volunteer: number; blind: number } {
  let volunteerPoints = 0;
  let blindPoints = 0;

  if (distance <= 1) {
    volunteerPoints = 25;
    blindPoints = 15;
  } else if (distance <= 5) {
    const extraDistance = distance - 1;
    const extraPoints = extraDistance * 15;
    volunteerPoints = 25 + extraPoints;
    blindPoints = 15 + extraPoints;
  } else {
    const longRunPoints = 4 * 15;
    const ultraDistance = distance - 5;
    const ultraPoints = ultraDistance * 20;
    volunteerPoints = 25 + longRunPoints + ultraPoints;
    blindPoints = 15 + longRunPoints + ultraPoints;
  }

  const maxPoints = 70;
  return {
    volunteer: Math.min(Math.round(volunteerPoints), maxPoints),
    blind: Math.min(Math.round(blindPoints), maxPoints),
  };
}
