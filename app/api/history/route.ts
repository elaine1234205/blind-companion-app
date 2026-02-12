import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

// GET /api/history
export async function GET() {
  try {
    const history = dataManager.getHistory();
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取历史记录失败' }, { status: 500 });
  }
}

// POST /api/history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, volunteerId, volunteerName, type, location, time } = body;

    const history = dataManager.getHistory();
    const newHistory = {
      id: dataManager.generateId(),
      requestId: null,
      userId,
      userName,
      volunteerId,
      volunteerName,
      type,
      location,
      time,
      status: 'matched',
      createdAt: Date.now(),
      completedAt: null,
    };

    history.push(newHistory);
    dataManager.saveHistory(history);

    return NextResponse.json({ success: true, data: newHistory });
  } catch (error) {
    return NextResponse.json({ success: false, message: '创建历史记录失败' }, { status: 500 });
  }
}
