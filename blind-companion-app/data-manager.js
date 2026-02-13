const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const EXERCISE_RECORDS_FILE = path.join(DATA_DIR, 'exercise-records.json');
const SHOP_ITEMS_FILE = path.join(DATA_DIR, 'shop-items.json');
const DAILY_STATS_FILE = path.join(DATA_DIR, 'daily-stats.json');
const COMPETITIONS_FILE = path.join(DATA_DIR, 'competitions.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(REQUESTS_FILE)) {
        fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(EXERCISE_RECORDS_FILE)) {
        fs.writeFileSync(EXERCISE_RECORDS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(SHOP_ITEMS_FILE)) {
        fs.writeFileSync(SHOP_ITEMS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(DAILY_STATS_FILE)) {
        fs.writeFileSync(DAILY_STATS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(COMPETITIONS_FILE)) {
        fs.writeFileSync(COMPETITIONS_FILE, JSON.stringify([], null, 2));
    }
}

// 读取JSON文件
function readJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件失败: ${filePath}`, error);
        return [];
    }
}

// 写入JSON文件
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`写入文件失败: ${filePath}`, error);
        return false;
    }
}

// 初始化
initDataFiles();

// 系统内置官方审核员账号（不可删除）
const OFFICIAL_ACCOUNT = {
    id: 'official-system-builtin',
    username: '官方审核员',
    name: '官方审核员',
    password: '10280613xrldyf',
    type: 'official',
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
    lotteryTickets: 1
};

// 确保官方审核员账号存在
function ensureOfficialAccount(users) {
    const officialExists = users.some(u => u.type === 'official' && u.username === '官方审核员');

    if (!officialExists) {
        // 自动添加官方审核员账号（放在最前面）
        users.unshift(OFFICIAL_ACCOUNT);
        console.log('🔧 系统自动恢复官方审核员账号');
        return { users, restored: true };
    }

    return { users, restored: false };
}

module.exports = {
    // 用户相关
    getUsers: () => {
        const users = readJSON(USERS_FILE);
        const result = ensureOfficialAccount(users);
        // 如果官方审核员被恢复了，自动保存到文件
        if (result.restored) {
            writeJSON(USERS_FILE, result.users);
        }
        return result.users;
    },
    saveUsers: (users) => {
        // 保存前确保官方审核员存在
        const result = ensureOfficialAccount(users);
        return writeJSON(USERS_FILE, result.users);
    },

    // 需求相关
    getRequests: () => readJSON(REQUESTS_FILE),
    saveRequests: (requests) => writeJSON(REQUESTS_FILE, requests),

    // 历史记录相关
    getHistory: () => readJSON(HISTORY_FILE),
    saveHistory: (history) => writeJSON(HISTORY_FILE, history),

    // 运动记录相关
    getExerciseRecords: () => readJSON(EXERCISE_RECORDS_FILE),
    saveExerciseRecords: (records) => writeJSON(EXERCISE_RECORDS_FILE, records),

    // 商城物品相关
    getShopItems: () => readJSON(SHOP_ITEMS_FILE),
    saveShopItems: (items) => writeJSON(SHOP_ITEMS_FILE, items),

    // 每日统计相关
    getDailyStats: () => readJSON(DAILY_STATS_FILE),
    saveDailyStats: (stats) => writeJSON(DAILY_STATS_FILE, stats),

    // 赛事相关
    getCompetitions: () => readJSON(COMPETITIONS_FILE),
    saveCompetitions: (competitions) => writeJSON(COMPETITIONS_FILE, competitions),

    // 计算用户的有效积分
    getValidPoints: function(user) {
        if (!user.pointsHistory || !Array.isArray(user.pointsHistory)) {
            // 兼容旧数据：如果用户有points字段但没有pointsHistory，迁移数据
            if (user.points && typeof user.points === 'number') {
                user.pointsHistory = [{
                    points: user.points,
                    earnedAt: Date.now(),
                    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
                    source: 'legacy'
                }];
                delete user.points;
            } else {
                user.pointsHistory = [];
            }
        }

        const now = Date.now();
        const validPoints = user.pointsHistory
            .filter(record => record.expiresAt > now)
            .reduce((sum, record) => sum + record.points, 0);

        return validPoints;
    },

    // 清理所有用户的过期积分
    cleanExpiredPoints: function() {
        const users = this.getUsers();
        const now = Date.now();
        let totalCleaned = 0;

        users.forEach(user => {
            if (user.pointsHistory && Array.isArray(user.pointsHistory)) {
                const beforeCount = user.pointsHistory.length;
                user.pointsHistory = user.pointsHistory.filter(record => record.expiresAt > now);
                const afterCount = user.pointsHistory.length;
                totalCleaned += (beforeCount - afterCount);
            }
        });

        this.saveUsers(users);

        return {
            success: true,
            totalCleaned: totalCleaned,
            message: `已清理 ${totalCleaned} 条过期积分记录`
        };
    },

    // 获取本周的日期范围
    getWeekRange: function() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0是周日，1是周一
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return {
            start: monday,
            end: sunday,
            weekLabel: `${monday.toISOString().split('T')[0]} 至 ${sunday.toISOString().split('T')[0]}`
        };
    },

    // 获取本月的日期范围
    getMonthRange: function() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);

        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);

        return {
            start: firstDay,
            end: lastDay,
            monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`
        };
    },

    // 每日结算函数
    settleDailyRanking: function() {
        const history = this.getHistory();
        const users = this.getUsers();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式

        // 分别统计盲人和志愿者今天完成的陪跑次数
        const blindStats = {};
        const volunteerStats = {};

        history.forEach(record => {
            if (record.status === 'completed') {
                const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
                if (recordDate === today) {
                    // 统计志愿者
                    if (record.volunteerName) {
                        if (!volunteerStats[record.volunteerName]) {
                            volunteerStats[record.volunteerName] = {
                                username: record.volunteerName,
                                count: 0,
                                type: 'volunteer'
                            };
                        }
                        volunteerStats[record.volunteerName].count++;
                    }
                    // 统计盲人用户
                    if (record.userName) {
                        if (!blindStats[record.userName]) {
                            blindStats[record.userName] = {
                                username: record.userName,
                                count: 0,
                                type: 'blind'
                            };
                        }
                        blindStats[record.userName].count++;
                    }
                }
            }
        });

        // 分别转换为数组并排序
        const blindArray = Object.values(blindStats);
        blindArray.sort((a, b) => b.count - a.count);

        const volunteerArray = Object.values(volunteerStats);
        volunteerArray.sort((a, b) => b.count - a.count);

        // 分别为盲人和志愿者分配积分和排名
        const blindResults = blindArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 50;
            else if (rank === 2) points = 30;
            else if (rank === 3) points = 20;
            else if (rank >= 4 && rank <= 10) points = 10;
            else if (rank >= 11 && rank <= 50) points = 5;

            return {
                date: today,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        const volunteerResults = volunteerArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 50;
            else if (rank === 2) points = 30;
            else if (rank === 3) points = 20;
            else if (rank >= 4 && rank <= 10) points = 10;
            else if (rank >= 11 && rank <= 50) points = 5;

            return {
                date: today,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        // 合并结果
        const results = [...blindResults, ...volunteerResults];

        // 更新用户积分（带有效期）
        const earnedAt = Date.now();
        const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000; // 1年后

        results.forEach(result => {
            if (result.points > 0) {
                const user = users.find(u => u.username === result.username);
                if (user) {
                    if (!user.pointsHistory) {
                        user.pointsHistory = [];
                    }
                    user.pointsHistory.push({
                        points: result.points,
                        earnedAt: earnedAt,
                        expiresAt: expiresAt,
                        source: 'daily',
                        date: today
                    });
                }
            }
        });

        this.saveUsers(users);

        // 保存每日统计
        const dailyStats = this.getDailyStats();
        dailyStats.push(...results);
        this.saveDailyStats(dailyStats);

        return {
            success: true,
            date: today,
            totalUsers: results.length,
            results: results
        };
    },

    // 每周结算函数
    settleWeeklyRanking: function() {
        const history = this.getHistory();
        const users = this.getUsers();
        const weekRange = this.getWeekRange();

        // 分别统计盲人和志愿者本周完成的陪跑次数
        const blindStats = {};
        const volunteerStats = {};

        history.forEach(record => {
            if (record.status === 'completed') {
                const recordDate = new Date(record.createdAt);
                if (recordDate >= weekRange.start && recordDate <= weekRange.end) {
                    // 统计志愿者
                    if (record.volunteerName) {
                        if (!volunteerStats[record.volunteerName]) {
                            volunteerStats[record.volunteerName] = {
                                username: record.volunteerName,
                                count: 0,
                                type: 'volunteer'
                            };
                        }
                        volunteerStats[record.volunteerName].count++;
                    }
                    // 统计盲人用户
                    if (record.userName) {
                        if (!blindStats[record.userName]) {
                            blindStats[record.userName] = {
                                username: record.userName,
                                count: 0,
                                type: 'blind'
                            };
                        }
                        blindStats[record.userName].count++;
                    }
                }
            }
        });

        // 分别转换为数组并排序
        const blindArray = Object.values(blindStats);
        blindArray.sort((a, b) => b.count - a.count);

        const volunteerArray = Object.values(volunteerStats);
        volunteerArray.sort((a, b) => b.count - a.count);

        // 分别为盲人和志愿者分配积分和排名（每周积分规则）
        const blindResults = blindArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 150;
            else if (rank === 2) points = 135;
            else if (rank === 3) points = 110;
            else if (rank >= 4 && rank <= 10) points = 75;
            else if (rank >= 11 && rank <= 50) points = 45;

            return {
                week: weekRange.weekLabel,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        const volunteerResults = volunteerArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 150;
            else if (rank === 2) points = 135;
            else if (rank === 3) points = 110;
            else if (rank >= 4 && rank <= 10) points = 75;
            else if (rank >= 11 && rank <= 50) points = 45;

            return {
                week: weekRange.weekLabel,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        // 合并结果
        const results = [...blindResults, ...volunteerResults];

        // 更新用户积分（带有效期）
        const earnedAt = Date.now();
        const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000; // 1年后

        results.forEach(result => {
            if (result.points > 0) {
                const user = users.find(u => u.username === result.username);
                if (user) {
                    if (!user.pointsHistory) {
                        user.pointsHistory = [];
                    }
                    user.pointsHistory.push({
                        points: result.points,
                        earnedAt: earnedAt,
                        expiresAt: expiresAt,
                        source: 'weekly',
                        week: weekRange.weekLabel
                    });
                }
            }
        });

        this.saveUsers(users);

        // 保存每周统计（追加到每日统计文件中，用week字段区分）
        const dailyStats = this.getDailyStats();
        dailyStats.push(...results);
        this.saveDailyStats(dailyStats);

        return {
            success: true,
            week: weekRange.weekLabel,
            totalUsers: results.length,
            results: results
        };
    },

    // 每月结算函数
    settleMonthlyRanking: function() {
        const history = this.getHistory();
        const users = this.getUsers();
        const monthRange = this.getMonthRange();

        // 分别统计盲人和志愿者本月完成的陪跑次数
        const blindStats = {};
        const volunteerStats = {};

        history.forEach(record => {
            if (record.status === 'completed') {
                const recordDate = new Date(record.createdAt);
                if (recordDate >= monthRange.start && recordDate <= monthRange.end) {
                    // 统计志愿者
                    if (record.volunteerName) {
                        if (!volunteerStats[record.volunteerName]) {
                            volunteerStats[record.volunteerName] = {
                                username: record.volunteerName,
                                count: 0,
                                type: 'volunteer'
                            };
                        }
                        volunteerStats[record.volunteerName].count++;
                    }
                    // 统计盲人用户
                    if (record.userName) {
                        if (!blindStats[record.userName]) {
                            blindStats[record.userName] = {
                                username: record.userName,
                                count: 0,
                                type: 'blind'
                            };
                        }
                        blindStats[record.userName].count++;
                    }
                }
            }
        });

        // 分别转换为数组并排序
        const blindArray = Object.values(blindStats);
        blindArray.sort((a, b) => b.count - a.count);

        const volunteerArray = Object.values(volunteerStats);
        volunteerArray.sort((a, b) => b.count - a.count);

        // 分别为盲人和志愿者分配积分和排名（每月积分规则）
        const blindResults = blindArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 750;
            else if (rank === 2) points = 675;
            else if (rank === 3) points = 595;
            else if (rank >= 4 && rank <= 10) points = 300;
            else if (rank >= 11 && rank <= 50) points = 200;
            else if (rank >= 51 && rank <= 100) points = 135;
            else if (rank >= 101 && rank <= 500) points = 50;

            return {
                month: monthRange.monthLabel,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        const volunteerResults = volunteerArray.map((stat, index) => {
            const rank = index + 1;
            let points = 0;

            if (rank === 1) points = 750;
            else if (rank === 2) points = 675;
            else if (rank === 3) points = 595;
            else if (rank >= 4 && rank <= 10) points = 300;
            else if (rank >= 11 && rank <= 50) points = 200;
            else if (rank >= 51 && rank <= 100) points = 135;
            else if (rank >= 101 && rank <= 500) points = 50;

            return {
                month: monthRange.monthLabel,
                rank: rank,
                username: stat.username,
                type: stat.type,
                count: stat.count,
                points: points,
                settledAt: Date.now()
            };
        });

        // 合并结果
        const results = [...blindResults, ...volunteerResults];

        // 更新用户积分（带有效期）
        const earnedAt = Date.now();
        const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000; // 1年后

        results.forEach(result => {
            if (result.points > 0) {
                const user = users.find(u => u.username === result.username);
                if (user) {
                    if (!user.pointsHistory) {
                        user.pointsHistory = [];
                    }
                    user.pointsHistory.push({
                        points: result.points,
                        earnedAt: earnedAt,
                        expiresAt: expiresAt,
                        source: 'monthly',
                        month: monthRange.monthLabel
                    });
                }
            }
        });

        this.saveUsers(users);

        // 保存每月统计（追加到每日统计文件中，用month字段区分）
        const dailyStats = this.getDailyStats();
        dailyStats.push(...results);
        this.saveDailyStats(dailyStats);

        return {
            success: true,
            month: monthRange.monthLabel,
            totalUsers: results.length,
            results: results
        };
    },

    // 计算运动积分（与前端保持一致）
    calculateExercisePoints: function(distance) {
        let volunteerPoints = 0;
        let blindPoints = 0;

        if (distance <= 1) {
            // 1km以下：基础积分
            volunteerPoints = 25;
            blindPoints = 15;
        } else if (distance <= 5) {
            // 1km-5km（长跑）：基础积分 + 超出部分15积分/km
            const extraDistance = distance - 1;
            const extraPoints = extraDistance * 15;
            volunteerPoints = 25 + extraPoints;
            blindPoints = 15 + extraPoints;
        } else {
            // 5km以上（超长跑）：基础积分 + 1-5km部分(4km×15) + 超出5km部分20积分/km
            const longRunPoints = 4 * 15; // 1-5km的部分
            const ultraDistance = distance - 5;
            const ultraPoints = ultraDistance * 20;
            volunteerPoints = 25 + longRunPoints + ultraPoints;
            blindPoints = 15 + longRunPoints + ultraPoints;
        }

        // 设置积分上限为70
        const maxPoints = 70;
        return {
            volunteer: Math.min(Math.round(volunteerPoints), maxPoints),
            blind: Math.min(Math.round(blindPoints), maxPoints)
        };
    },

    // 审核运动记录并发放积分
    approveExerciseRecord: function(recordId) {
        const records = this.getExerciseRecords();
        const record = records.find(r => r.id === recordId);

        if (!record) {
            return { success: false, message: '记录不存在' };
        }

        const history = this.getHistory();
        const historyRecord = history.find(h => h.id === record.recordId);

        // 如果已经审核通过，需要检查是否已发放过积分
        if (record.status === 'approved') {
            // 检查是否已通过此 recordId 发放过积分
            const users = this.getUsers();
            const alreadyAwarded = users.some(u =>
                u.pointsHistory &&
                u.pointsHistory.some(p => p.recordId === recordId && p.source === 'exercise')
            );

            if (alreadyAwarded) {
                return { success: false, message: '该记录已审核通过，积分已发放' };
            }
            // 如果未发放过积分，继续发放
        }

        // 更新运动记录状态
        record.status = 'approved';
        record.approvedAt = Date.now();
        this.saveExerciseRecords(records);

        // 如果找到对应的历史记录，更新状态并发放积分
        if (historyRecord) {
            // 支持多种状态：pending_review, pending, matched
            if (['pending_review', 'pending', 'matched', 'completed'].includes(historyRecord.status)) {
                historyRecord.status = 'completed';
                this.saveHistory(history);
            }

            // 发放积分
            const users = this.getUsers();
            const earnedAt = Date.now();
            const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000;

            // 计算积分（与前端一致）
            const points = this.calculateExercisePoints(record.distance);
            const volunteerPoints = points.volunteer;
            const blindPoints = points.blind;

            // 查找并奖励志愿者
            const volunteer = users.find(u => u.username === historyRecord.volunteerName && u.type === 'volunteer');
            if (volunteer) {
                if (!volunteer.pointsHistory) volunteer.pointsHistory = [];
                volunteer.pointsHistory.push({
                    points: volunteerPoints,
                    earnedAt: earnedAt,
                    expiresAt: expiresAt,
                    source: 'exercise',
                    recordId: recordId,
                    description: `陪跑${record.distance.toFixed(2)}km奖励`
                });
                // 计算有效积分
                volunteer.points = volunteer.pointsHistory
                    .filter(p => p.expiresAt > earnedAt)
                    .reduce((sum, p) => sum + p.points, 0);
                // 累加总距离
                volunteer.totalDistance = (volunteer.totalDistance || 0) + record.distance;
            }

            // 查找并奖励盲人
            const blindUser = users.find(u => u.username === historyRecord.userName && u.type === 'blind');
            if (blindUser) {
                if (!blindUser.pointsHistory) blindUser.pointsHistory = [];
                blindUser.pointsHistory.push({
                    points: blindPoints,
                    earnedAt: earnedAt,
                    expiresAt: expiresAt,
                    source: 'exercise',
                    recordId: recordId,
                    description: `陪跑${record.distance.toFixed(2)}km奖励`
                });
                // 计算有效积分
                blindUser.points = blindUser.pointsHistory
                    .filter(p => p.expiresAt > earnedAt)
                    .reduce((sum, p) => sum + p.points, 0);
            }

            this.saveUsers(users);

            return {
                success: true,
                message: '审核通过，积分已发放',
                volunteerPoints: volunteerPoints,
                blindPoints: blindPoints,
                volunteer: historyRecord.volunteerName,
                blindUser: historyRecord.userName,
                distance: record.distance
            };
        }

        return { success: true, message: '审核通过' };
    }
};