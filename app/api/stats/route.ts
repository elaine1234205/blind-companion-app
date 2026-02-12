import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

// GET /api/stats
export async function GET() {
  try {
    const stats = dataManager.getDailyStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取统计失败' }, { status: 500 });
  }
}

// POST /api/stats/settle - 结算每日积分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'daily') {
      const history = dataManager.getHistory();
      const users = dataManager.getUsers();
      const today = new Date().toISOString().split('T')[0];

      const blindStats: Record<string, any> = {};
      const volunteerStats: Record<string, any> = {};

      // 统计今日完成数量
      history.forEach(record => {
        if (record.status === 'completed') {
          const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
          if (recordDate === today) {
            if (record.volunteerName) {
              volunteerStats[record.volunteerName] = volunteerStats[record.volunteerName] || { count: 0 };
              volunteerStats[record.volunteerName].count++;
            }
            if (record.userName) {
              blindStats[record.userName] = blindStats[record.userName] || { count: 0 };
              blindStats[record.userName].count++;
            }
          }
        }
      });

      const earnedAt = Date.now();
      const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000;

      // 分配积分
      const results: any[] = [];
      const allStats = [...Object.entries(volunteerStats), ...Object.entries(blindStats)];

      allStats.forEach(([username, stat]: [string, any], index) => {
        const rank = index + 1;
        let points = 0;
        if (rank === 1) points = 50;
        else if (rank === 2) points = 30;
        else if (rank === 3) points = 20;
        else if (rank >= 4 && rank <= 10) points = 10;
        else if (rank >= 11 && rank <= 50) points = 5;

        const user = users.find(u => u.username === username);
        if (user && points > 0) {
          if (!user.pointsHistory) user.pointsHistory = [];
          user.pointsHistory.push({
            points,
            earnedAt,
            expiresAt,
            source: 'daily',
            date: today,
          });
        }

        results.push({ date: today, rank, username, points, settledAt: earnedAt });
      });

      dataManager.saveUsers(users);
      dataManager.saveDailyStats([...dataManager.getDailyStats(), ...results]);

      return NextResponse.json({ success: true, date: today, results });
    }

    return NextResponse.json({ success: false, message: '无效操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: '结算失败' }, { status: 500 });
  }
}
