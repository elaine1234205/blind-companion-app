import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

// GET /api/competitions
export async function GET() {
  try {
    const competitions = dataManager.getCompetitions();
    return NextResponse.json({ success: true, data: competitions });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取赛事列表失败' }, { status: 500 });
  }
}

// POST /api/competitions - 创建赛事
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, startDate, endDate, maxParticipants, rules, prize } = body;

    const competitions = dataManager.getCompetitions();
    const newCompetition = {
      id: dataManager.generateId(),
      name,
      type,
      startDate,
      endDate,
      maxParticipants: maxParticipants || 100,
      currentParticipants: 0,
      status: 'pending',
      rules: rules || '',
      prize: prize || '',
      createdAt: Date.now(),
      participants: [],
    };

    competitions.push(newCompetition);
    dataManager.saveCompetitions(competitions);

    return NextResponse.json({ success: true, data: newCompetition });
  } catch (error) {
    return NextResponse.json({ success: false, message: '创建赛事失败' }, { status: 500 });
  }
}

// DELETE /api/competitions
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason');

    if (!id) {
      return NextResponse.json({ success: false, message: '缺少赛事ID' }, { status: 400 });
    }

    let competitions = dataManager.getCompetitions();
    const competitionIndex = competitions.findIndex(c => c.id === id);

    if (competitionIndex === -1) {
      return NextResponse.json({ success: false, message: '赛事不存在' }, { status: 404 });
    }

    // 软删除 - 更新状态
    competitions[competitionIndex] = {
      ...competitions[competitionIndex],
      status: 'deleted',
      deletedAt: Date.now(),
      deleteReason: reason || '未说明原因',
    };
    dataManager.saveCompetitions(competitions);

    return NextResponse.json({ success: true, message: '赛事已删除' });
  } catch (error) {
    return NextResponse.json({ success: false, message: '删除赛事失败' }, { status: 500 });
  }
}
