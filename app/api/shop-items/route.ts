import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

// GET /api/shop-items
export async function GET() {
  try {
    const items = dataManager.getShopItems();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取商城物品失败' }, { status: 500 });
  }
}

// POST /api/shop-items - 购买物品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, itemId } = body;

    const users = dataManager.getUsers();
    const items = dataManager.getShopItems();

    const user = users.find(u => u.username === username);
    const item = items.find(i => i.id === itemId);

    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    if (!item) {
      return NextResponse.json({ success: false, message: '物品不存在' }, { status: 404 });
    }

    const validPoints = dataManager.getValidPoints(user);
    if (validPoints < item.price) {
      return NextResponse.json({ success: false, message: '积分不足' });
    }

    // 扣除积分
    const earnedAt = Date.now();
    const expiresAt = earnedAt + 365 * 24 * 60 * 60 * 1000;
    user.pointsHistory = user.pointsHistory || [];
    user.pointsHistory.push({
      points: -item.price,
      earnedAt,
      expiresAt,
      source: 'shop',
      itemId,
      description: `兑换${item.name}`,
    });

    dataManager.saveUsers(users);

    return NextResponse.json({ success: true, message: `成功兑换 ${item.name}！` });
  } catch (error) {
    return NextResponse.json({ success: false, message: '购买失败' }, { status: 500 });
  }
}
