import { NextRequest, NextResponse } from 'next/server';
import { dataManager, ensureOfficialAccount } from '@/lib/data-manager';

// 生成token
function generateToken(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// POST /api/auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, username, password, name, phone, type } = body;

    // 注册
    if (action === 'register') {
      const users = dataManager.getUsers();

      // 检查用户名是否已存在
      if (users.some(u => u.username === username || u.name === name)) {
        return NextResponse.json({ success: false, message: '用户名或昵称已存在' });
      }

      const newUser = {
        id: dataManager.generateId(),
        username,
        name,
        password,
        phone: phone || '',
        type: type || 'blind',
        certified: false,
        points: 0,
        pointsHistory: [],
        lastCheckIn: null,
        currentStreak: 0,
        totalStreak: 0,
        lastStreakDate: null,
        streakTorches: 0,
        checkInStreak: 0,
        achievements: [],
        streakMasterTickets: 0,
        distanceMasterTickets: 0,
        totalDistance: 0,
        createdAt: Date.now(),
      };

      users.push(newUser);
      dataManager.saveUsers(users);

      const token = generateToken();
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          type: newUser.type,
        },
      });
    }

    // 登录
    if (action === 'login') {
      let users = dataManager.getUsers();
      const result = ensureOfficialAccount(users);
      if (result.restored) {
        users = result.users;
        dataManager.saveUsers(users);
      }

      const user = users.find(u => u.username === username);

      if (!user) {
        return NextResponse.json({ success: false, message: '用户不存在' });
      }

      if (user.password !== password) {
        return NextResponse.json({ success: false, message: '密码错误' });
      }

      const token = generateToken();
      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          type: user.type,
          points: dataManager.getValidPoints(user),
        },
      });
    }

    return NextResponse.json({ success: false, message: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('认证错误:', error);
    return NextResponse.json({ success: false, message: '认证失败' }, { status: 500 });
  }
}
