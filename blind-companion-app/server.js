const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');
const dataManager = require('./data-manager');

const PORT = 8080;

// 初始化官方账号
function initOfficialAccount() {
    const users = dataManager.getUsers();
    const officialAccount = users.find(u => u.type === 'official' && u.username === '官方审核员');

    if (!officialAccount) {
        const newOfficial = {
            id: 'official-' + Date.now(),
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
            streakTorches: 0
        };

        users.push(newOfficial);
        dataManager.saveUsers(users);
        console.log('✅ 官方审核员账号已创建');
    } else {
        console.log('✅ 官方审核员账号已存在');
    }
}

// 初始化官方账号
initOfficialAccount();

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // 跳过内部和非IPv4地址
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// 解析POST请求的body
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            callback(null, data);
        } catch (error) {
            callback(error, null);
        }
    });
}

// 发送JSON响应
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头，允许跨域访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API路由
    if (pathname.startsWith('/api/')) {
        handleAPI(req, res, pathname);
        return;
    }

    // 静态文件路由
    let filePath;
    let contentType = 'text/html; charset=utf-8';

    if (pathname === '/' || pathname === '/index.html') {
        filePath = path.join(__dirname, 'index.html');
    } else if (pathname === '/api-integration.js') {
        filePath = path.join(__dirname, 'api-integration.js');
        contentType = 'application/javascript; charset=utf-8';
    } else {
        // 其他请求返回HTML
        filePath = path.join(__dirname, 'index.html');
    }

    // 读取并返回文件
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('服务器错误：无法读取文件');
            console.error('读取文件错误:', err);
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// 处理API请求
function handleAPI(req, res, pathname) {
    // 调试日志
    console.log('[API请求]', req.method, pathname);

    // 用户相关API
    if (pathname === '/api/users' && req.method === 'GET') {
        const users = dataManager.getUsers();
        sendJSON(res, 200, { success: true, data: users });
        return;
    }

    if (pathname === '/api/register' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const users = dataManager.getUsers();

            // 检查用户名是否已存在
            if (users.find(u => u.name === data.name || u.username === data.name)) {
                sendJSON(res, 400, { success: false, message: '用户名已存在' });
                return;
            }

            // 创建新用户
            const newUser = {
                id: Date.now().toString(),
                name: data.name,
                username: data.name,
                phone: data.phone,
                type: data.type,
                certified: false,
                points: 0,
                currentStreak: 0,
                totalStreak: 0,
                lastStreakDate: null,
                streakTorches: 0,
                checkInStreak: 0,
                lastCheckIn: null,
                achievements: [],
                streakMasterTickets: 0,
                distanceMasterTickets: 0,
                pointsHistory: []
            };

            users.push(newUser);
            dataManager.saveUsers(users);

            sendJSON(res, 200, { success: true, data: newUser });
        });
        return;
    }

    if (pathname === '/api/login' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            console.log('=== 登录调试信息 ===');
            console.log('接收到的登录数据:', JSON.stringify(data, null, 2));

            const users = dataManager.getUsers();
            const user = users.find(u => u.name === data.name || u.username === data.name);

            if (!user) {
                console.log('❌ 用户不存在:', data.name);
                sendJSON(res, 404, { success: false, message: '用户不存在' });
                return;
            }

            console.log('✅ 找到用户:', user.username);
            console.log('用户密码字段存在:', !!user.password);
            console.log('用户密码值:', user.password);
            console.log('输入密码值:', data.password);
            console.log('密码匹配:', user.password === data.password);

            // 验证密码
            if (user.password && user.password !== data.password) {
                console.log('❌ 密码验证失败');
                sendJSON(res, 401, { success: false, message: '密码错误' });
                return;
            }

            console.log('✅ 登录成功');
            sendJSON(res, 200, { success: true, data: user });
        });
        return;
    }

    if (pathname === '/api/users/update' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const users = dataManager.getUsers();
            const userIndex = users.findIndex(u => u.id === data.id);

            if (userIndex === -1) {
                sendJSON(res, 404, { success: false, message: '用户不存在' });
                return;
            }

            users[userIndex] = { ...users[userIndex], ...data };
            dataManager.saveUsers(users);

            sendJSON(res, 200, { success: true, data: users[userIndex] });
        });
        return;
    }

    // 获取待审核的积分申请
    if (pathname === '/api/points/pending' && req.method === 'GET') {
        const users = dataManager.getUsers();
        let pendingRequests = [];

        users.forEach(user => {
            if (user.pointsHistory && Array.isArray(user.pointsHistory)) {
                user.pointsHistory.forEach(ph => {
                    if (ph.status === 'pending') {
                        pendingRequests.push({
                            ...ph,
                            userName: user.name,
                            userType: user.type,
                            userId: user.id
                        });
                    }
                });
            }
        });

        sendJSON(res, 200, { success: true, data: pendingRequests });
        return;
    }

    // 批准积分申请
    if (pathname === '/api/points/approve' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const users = dataManager.getUsers();
            const userIndex = users.findIndex(u => u.id === data.userId);

            if (userIndex === -1) {
                sendJSON(res, 404, { success: false, message: '用户不存在' });
                return;
            }

            const user = users[userIndex];
            if (user.pointsHistory && Array.isArray(user.pointsHistory)) {
                const phIndex = user.pointsHistory.findIndex(ph =>
                    ph.status === 'pending' && ph.date === data.date
                );

                if (phIndex !== -1) {
                    user.pointsHistory[phIndex].status = 'approved';
                    user.pointsHistory[phIndex].approvedAt = Date.now();

                    // 更新总积分
                    user.points = (user.points || 0) + user.pointsHistory[phIndex].points;

                    dataManager.saveUsers(users);
                    sendJSON(res, 200, {
                        success: true,
                        message: '审核通过',
                        data: { userName: user.name, points: user.pointsHistory[phIndex].points }
                    });
                    return;
                }
            }

            sendJSON(res, 404, { success: false, message: '申请不存在' });
        });
        return;
    }

    // 拒绝积分申请
    if (pathname === '/api/points/reject' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            if (!data.reason) {
                sendJSON(res, 400, { success: false, message: '必须提供拒绝理由' });
                return;
            }

            const users = dataManager.getUsers();
            const userIndex = users.findIndex(u => u.id === data.userId);

            if (userIndex === -1) {
                sendJSON(res, 404, { success: false, message: '用户不存在' });
                return;
            }

            const user = users[userIndex];
            if (user.pointsHistory && Array.isArray(user.pointsHistory)) {
                const phIndex = user.pointsHistory.findIndex(ph =>
                    ph.status === 'pending' && ph.date === data.date
                );

                if (phIndex !== -1) {
                    user.pointsHistory[phIndex].status = 'rejected';
                    user.pointsHistory[phIndex].rejectedAt = Date.now();
                    user.pointsHistory[phIndex].rejectReason = data.reason;

                    dataManager.saveUsers(users);
                    sendJSON(res, 200, {
                        success: true,
                        message: '已拒绝申请'
                    });
                    return;
                }
            }

            sendJSON(res, 404, { success: false, message: '申请不存在' });
        });
        return;
    }

    // 需求相关API
    if (pathname === '/api/requests' && req.method === 'GET') {
        const requests = dataManager.getRequests();
        sendJSON(res, 200, { success: true, data: requests });
        return;
    }

    if (pathname === '/api/requests' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const requests = dataManager.getRequests();
            const newRequest = {
                id: Date.now().toString(),
                ...data,
                createdAt: Date.now()
            };

            requests.unshift(newRequest);
            dataManager.saveRequests(requests);

            sendJSON(res, 200, { success: true, data: newRequest });
        });
        return;
    }

    if (pathname === '/api/requests/update' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const requests = dataManager.getRequests();
            const requestIndex = requests.findIndex(r => r.id === data.id);

            if (requestIndex === -1) {
                sendJSON(res, 404, { success: false, message: '需求不存在' });
                return;
            }

            requests[requestIndex] = { ...requests[requestIndex], ...data };
            dataManager.saveRequests(requests);

            sendJSON(res, 200, { success: true, data: requests[requestIndex] });
        });
        return;
    }

    if (pathname === '/api/requests/delete' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const requests = dataManager.getRequests();
            const filteredRequests = requests.filter(r => r.id !== data.id);
            dataManager.saveRequests(filteredRequests);

            sendJSON(res, 200, { success: true });
        });
        return;
    }

    // 历史记录相关API
    if (pathname === '/api/history' && req.method === 'GET') {
        const history = dataManager.getHistory();
        sendJSON(res, 200, { success: true, data: history });
        return;
    }

    if (pathname === '/api/history' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const history = dataManager.getHistory();
            const newRecord = {
                id: Date.now().toString(),
                ...data,
                createdAt: Date.now()
            };

            history.unshift(newRecord);
            dataManager.saveHistory(history);

            sendJSON(res, 200, { success: true, data: newRecord });
        });
        return;
    }

    if (pathname === '/api/history/update' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const history = dataManager.getHistory();
            const recordIndex = history.findIndex(r => r.id === data.id);

            if (recordIndex === -1) {
                sendJSON(res, 404, { success: false, message: '记录不存在' });
                return;
            }

            history[recordIndex] = { ...history[recordIndex], ...data };
            dataManager.saveHistory(history);

            sendJSON(res, 200, { success: true, data: history[recordIndex] });
        });
        return;
    }

    // 标记记录为待审核状态
    if (pathname.startsWith('/api/history/') && pathname.endsWith('/complete') && req.method === 'POST') {
        const recordId = pathname.split('/')[3];
        const history = dataManager.getHistory();
        const recordIndex = history.findIndex(r => r.id === recordId);

        if (recordIndex === -1) {
            sendJSON(res, 404, { success: false, message: '记录不存在' });
            return;
        }

        history[recordIndex].status = 'pending_review';
        history[recordIndex].completedAt = Date.now();
        dataManager.saveHistory(history);

        sendJSON(res, 200, { success: true, data: history[recordIndex] });
        return;
    }

    // 运动记录相关API
    if (pathname === '/api/exercise-records' && req.method === 'GET') {
        const records = dataManager.getExerciseRecords();
        sendJSON(res, 200, { success: true, data: records });
        return;
    }

    if (pathname === '/api/exercise-records' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const records = dataManager.getExerciseRecords();
            const newRecord = {
                id: Date.now().toString(),
                ...data,
                createdAt: Date.now()
            };

            records.unshift(newRecord);
            dataManager.saveExerciseRecords(records);

            sendJSON(res, 200, { success: true, data: newRecord });
        });
        return;
    }

    if (pathname === '/api/exercise-records/update' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            // 如果是审核通过，调用积分发放逻辑
            if (data.status === 'approved') {
                const result = dataManager.approveExerciseRecord(data.id);
                if (result.success) {
                    sendJSON(res, 200, {
                        success: true,
                        message: result.message,
                        pointsAwarded: {
                            volunteer: result.volunteer,
                            volunteerPoints: result.volunteerPoints,
                            blindUser: result.blindUser,
                            blindPoints: result.blindPoints
                        }
                    });
                } else {
                    sendJSON(res, 400, { success: false, message: result.message });
                }
                return;
            }

            // 其他状态更新（拒绝等）
            const records = dataManager.getExerciseRecords();
            const recordIndex = records.findIndex(r => r.id === data.id);

            if (recordIndex === -1) {
                sendJSON(res, 404, { success: false, message: '记录不存在' });
                return;
            }

            records[recordIndex] = { ...records[recordIndex], ...data };
            dataManager.saveExerciseRecords(records);

            sendJSON(res, 200, { success: true, data: records[recordIndex] });
        });
        return;
    }

    // 预览运动记录积分发放信息
    if (pathname === '/api/exercise-records/preview' && req.method === 'GET') {
        const records = dataManager.getExerciseRecords();
        const history = dataManager.getHistory();

        // 获取待审核记录
        const pendingRecords = records.filter(r => r.status === 'pending');

        const preview = pendingRecords.map(record => {
            const historyRecord = history.find(h => h.id === record.recordId);
            const points = dataManager.calculateExercisePoints(record.distance);

            return {
                id: record.id,
                recordId: record.recordId,
                submittedBy: record.submittedBy,
                distance: record.distance,
                duration: record.duration,
                volunteerName: historyRecord ? historyRecord.volunteerName : '未知',
                blindUserName: historyRecord ? historyRecord.userName : '未知',
                volunteerPoints: points.volunteer,
                blindPoints: points.blind
            };
        });

        sendJSON(res, 200, { success: true, data: preview, total: preview.length });
        return;
    }

    // 批量补发所有未发放积分的已审核记录
    if (pathname === '/api/exercise-records/award-all' && req.method === 'POST') {
        const records = dataManager.getExerciseRecords();
        const users = dataManager.getUsers();
        const history = dataManager.getHistory();

        let awardedCount = 0;
        const results = [];

        records.forEach(record => {
            if (record.status === 'approved') {
                // 检查是否已发放过积分
                const alreadyAwarded = users.some(u =>
                    u.pointsHistory &&
                    u.pointsHistory.some(p => p.recordId === record.id && p.source === 'exercise')
                );

                if (!alreadyAwarded) {
                    const historyRecord = history.find(h => h.id === record.recordId);
                    if (historyRecord) {
                        const points = dataManager.calculateExercisePoints(record.distance);
                        const earnedAt = Date.now();
                        const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000;

                        // 奖励志愿者
                        const volunteer = users.find(u => u.username === historyRecord.volunteerName && u.type === 'volunteer');
                        if (volunteer) {
                            if (!volunteer.pointsHistory) volunteer.pointsHistory = [];
                            volunteer.pointsHistory.push({
                                points: points.volunteer,
                                earnedAt: earnedAt,
                                expiresAt: expiresAt,
                                source: 'exercise',
                                recordId: record.id,
                                description: `陪跑${record.distance.toFixed(2)}km奖励`
                            });
                            volunteer.points = volunteer.pointsHistory
                                .filter(p => p.expiresAt > earnedAt)
                                .reduce((sum, p) => sum + p.points, 0);
                            volunteer.totalDistance = (volunteer.totalDistance || 0) + record.distance;
                        }

                        // 奖励盲人
                        const blindUser = users.find(u => u.username === historyRecord.userName && u.type === 'blind');
                        if (blindUser) {
                            if (!blindUser.pointsHistory) blindUser.pointsHistory = [];
                            blindUser.pointsHistory.push({
                                points: points.blind,
                                earnedAt: earnedAt,
                                expiresAt: expiresAt,
                                source: 'exercise',
                                recordId: record.id,
                                description: `陪跑${record.distance.toFixed(2)}km奖励`
                            });
                            blindUser.points = blindUser.pointsHistory
                                .filter(p => p.expiresAt > earnedAt)
                                .reduce((sum, p) => sum + p.points, 0);
                        }

                        results.push({
                            recordId: record.id,
                            volunteer: historyRecord.volunteerName,
                            volunteerPoints: points.volunteer,
                            blindUser: historyRecord.userName,
                            blindPoints: points.blind
                        });
                        awardedCount++;
                    }
                }
            }
        });

        dataManager.saveUsers(users);

        sendJSON(res, 200, {
            success: true,
            message: `已为 ${awardedCount} 条记录补发积分`,
            awardedCount: awardedCount,
            results: results
        });
        return;
    }

    // 商城物品相关API
    if (pathname === '/api/shop-items' && req.method === 'GET') {
        const items = dataManager.getShopItems();
        sendJSON(res, 200, { success: true, data: items });
        return;
    }

    if (pathname === '/api/shop-items' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            dataManager.saveShopItems(data);
            sendJSON(res, 200, { success: true, data: data });
        });
        return;
    }

    // 每日统计相关API
    if (pathname === '/api/daily-stats' && req.method === 'GET') {
        const stats = dataManager.getDailyStats();
        sendJSON(res, 200, { success: true, data: stats });
        return;
    }

    if (pathname === '/api/daily-stats/settle' && req.method === 'POST') {
        try {
            const result = dataManager.settleDailyRanking();
            sendJSON(res, 200, result);
        } catch (error) {
            console.error('每日结算错误:', error);
            sendJSON(res, 500, { success: false, message: '结算失败' });
        }
        return;
    }

    if (pathname === '/api/weekly-stats/settle' && req.method === 'POST') {
        try {
            const result = dataManager.settleWeeklyRanking();
            sendJSON(res, 200, result);
        } catch (error) {
            console.error('每周结算错误:', error);
            sendJSON(res, 500, { success: false, message: '结算失败' });
        }
        return;
    }

    if (pathname === '/api/monthly-stats/settle' && req.method === 'POST') {
        try {
            const result = dataManager.settleMonthlyRanking();
            sendJSON(res, 200, result);
        } catch (error) {
            console.error('每月结算错误:', error);
            sendJSON(res, 500, { success: false, message: '结算失败' });
        }
        return;
    }

    // 赛事管理相关API
    if (pathname === '/api/competitions' && req.method === 'GET') {
        const competitions = dataManager.getCompetitions();
        sendJSON(res, 200, { success: true, data: competitions });
        return;
    }

    if (pathname === '/api/competitions' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const competitions = dataManager.getCompetitions();
            const newCompetition = {
                id: 'comp-' + Date.now(),
                name: data.name,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                status: 'active',
                delayDays: 0,
                createdAt: Date.now(),
                createdBy: data.createdBy || '官方审核员'
            };

            competitions.push(newCompetition);
            dataManager.saveCompetitions(competitions);

            sendJSON(res, 200, { success: true, data: newCompetition });
        });
        return;
    }

    if (pathname === '/api/competitions/delete' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            if (!data.reason || data.reason.trim() === '') {
                sendJSON(res, 400, { success: false, message: '必须提供删除理由' });
                return;
            }

            const competitions = dataManager.getCompetitions();
            const compIndex = competitions.findIndex(c => c.id === data.id);

            if (compIndex === -1) {
                sendJSON(res, 404, { success: false, message: '赛事不存在' });
                return;
            }

            const competition = competitions[compIndex];
            const now = Date.now();
            const endDate = new Date(competition.endDate).getTime();

            if (now >= endDate) {
                sendJSON(res, 400, { success: false, message: '截止日期已过，无法删除' });
                return;
            }

            competition.status = 'deleted';
            competition.deletedAt = now;
            competition.deletedBy = data.deletedBy || '官方审核员';
            competition.deleteReason = data.reason;

            dataManager.saveCompetitions(competitions);

            sendJSON(res, 200, { success: true, data: competition });
        });
        return;
    }

    if (pathname === '/api/competitions/delay' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const delayDays = parseInt(data.delayDays);
            if (isNaN(delayDays) || delayDays <= 0 || delayDays > 365) {
                sendJSON(res, 400, { success: false, message: '延迟天数必须在1-365天之间' });
                return;
            }

            const competitions = dataManager.getCompetitions();
            const compIndex = competitions.findIndex(c => c.id === data.id);

            if (compIndex === -1) {
                sendJSON(res, 404, { success: false, message: '赛事不存在' });
                return;
            }

            const competition = competitions[compIndex];
            const now = Date.now();
            const endDate = new Date(competition.endDate).getTime();

            if (now >= endDate) {
                sendJSON(res, 400, { success: false, message: '截止日期已过，无法延迟' });
                return;
            }

            // 计算新的截止日期
            const newEndDate = new Date(endDate);
            newEndDate.setDate(newEndDate.getDate() + delayDays);

            competition.endDate = newEndDate.toISOString();
            competition.delayDays = (competition.delayDays || 0) + delayDays;
            competition.lastDelayedAt = now;
            competition.lastDelayedBy = data.delayedBy || '官方审核员';

            dataManager.saveCompetitions(competitions);

            sendJSON(res, 200, { success: true, data: competition });
        });
        return;
    }

    if (pathname === '/api/competitions/settle' && req.method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { success: false, message: '请求数据格式错误' });
                return;
            }

            const competitions = dataManager.getCompetitions();
            const compIndex = competitions.findIndex(c => c.id === data.id);

            if (compIndex === -1) {
                sendJSON(res, 404, { success: false, message: '赛事不存在' });
                return;
            }

            const competition = competitions[compIndex];

            if (competition.status === 'settled') {
                sendJSON(res, 400, { success: false, message: '赛事已结算' });
                return;
            }

            // 执行结算逻辑
            const history = dataManager.getHistory();
            const users = dataManager.getUsers();
            const startDate = new Date(competition.startDate).getTime();
            const endDate = new Date(competition.endDate).getTime();

            // 统计赛事期间的陪跑次数
            const blindStats = {};
            const volunteerStats = {};

            history.forEach(record => {
                if (record.status === 'completed') {
                    const recordDate = new Date(record.createdAt).getTime();
                    if (recordDate >= startDate && recordDate <= endDate) {
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

            // 转换为数组并排序
            const blindArray = Object.values(blindStats);
            blindArray.sort((a, b) => b.count - a.count);

            const volunteerArray = Object.values(volunteerStats);
            volunteerArray.sort((a, b) => b.count - a.count);

            // 分配积分和排名
            const blindResults = blindArray.map((stat, index) => {
                const rank = index + 1;
                let points = 0;

                if (rank === 1) points = 1000;
                else if (rank === 2) points = 800;
                else if (rank === 3) points = 600;
                else if (rank >= 4 && rank <= 10) points = 400;
                else if (rank >= 11 && rank <= 50) points = 200;
                else if (rank >= 51 && rank <= 100) points = 100;

                return {
                    competitionId: competition.id,
                    competitionName: competition.name,
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

                if (rank === 1) points = 1000;
                else if (rank === 2) points = 800;
                else if (rank === 3) points = 600;
                else if (rank >= 4 && rank <= 10) points = 400;
                else if (rank >= 11 && rank <= 50) points = 200;
                else if (rank >= 51 && rank <= 100) points = 100;

                return {
                    competitionId: competition.id,
                    competitionName: competition.name,
                    rank: rank,
                    username: stat.username,
                    type: stat.type,
                    count: stat.count,
                    points: points,
                    settledAt: Date.now()
                };
            });

            const results = [...blindResults, ...volunteerResults];

            // 更新用户积分
            const earnedAt = Date.now();
            const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000;

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
                            source: 'competition',
                            competitionId: competition.id,
                            competitionName: competition.name
                        });
                    }
                }
            });

            dataManager.saveUsers(users);

            // 更新赛事状态
            competition.status = 'settled';
            competition.settledAt = Date.now();
            competition.results = results;

            dataManager.saveCompetitions(competitions);

            sendJSON(res, 200, {
                success: true,
                competition: competition,
                results: results,
                totalUsers: results.length
            });
        });
        return;
    }

    if (pathname === '/api/points/clean-expired' && req.method === 'POST') {
        try {
            const result = dataManager.cleanExpiredPoints();
            sendJSON(res, 200, result);
        } catch (error) {
            console.error('清理过期积分错误:', error);
            sendJSON(res, 500, { success: false, message: '清理失败' });
        }
        return;
    }

    // 未找到的API
    sendJSON(res, 404, { success: false, message: 'API不存在' });
}

// 启动服务器，监听所有网络接口
server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log('\n========================================');
    console.log('🎉 盲人陪跑应用服务器已启动！');
    console.log('========================================');
    console.log(`\n📱 本机访问地址：`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n🌐 局域网访问地址（其他设备使用）：`);
    console.log(`   http://${localIP}:${PORT}`);
    console.log('\n💡 使用说明：');
    console.log('   1. 本机访问：在浏览器打开 http://localhost:' + PORT);
    console.log('   2. 手机/其他设备访问：');
    console.log(`      - 确保设备连接到同一WiFi网络`);
    console.log(`      - 在浏览器打开 http://${localIP}:${PORT}`);
    console.log('   3. 按 Ctrl+C 停止服务器');
    console.log('\n========================================\n');
});

// 错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ 错误：端口 ${PORT} 已被占用！`);
        console.error('请尝试以下方法：');
        console.error('1. 关闭占用该端口的程序');
        console.error('2. 或修改 server.js 中的 PORT 值\n');
    } else {
        console.error('服务器错误:', err);
    }
    process.exit(1);
});