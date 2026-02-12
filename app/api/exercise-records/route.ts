import { NextRequest, NextResponse } from 'next/server';
import { dataManager, calculateExercisePoints } from '@/lib/data-manager';

// GET /api/exercise-records
export async function GET() {
  try {
    const records = dataManager.getExerciseRecords();
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取运动记录失败' }, { status: 500 });
  }
}

// POST /api/exercise-records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const records = dataManager.getExerciseRecords();
    const newRecord = {
      id: dataManager.generateId(),
      ...body,
      status: 'pending',
      submittedAt: Date.now(),
    };

    records.push(newRecord);
    dataManager.saveExerciseRecords(records);

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error) {
    return NextResponse.json({ success: false, message: '创建运动记录失败' }, { status: 500 });
  }
}

// PUT /api/exercise-records
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const records = dataManager.getExerciseRecords();
    const recordIndex = records.findIndex(r => r.id === id);

    if (recordIndex === -1) {
      return NextResponse.json({ success: false, message: '记录不存在' }, { status: 404 });
    }

    records[recordIndex] = { ...records[recordIndex], ...body };
    dataManager.saveExerciseRecords(records);

    return NextResponse.json({ success: true, data: records[recordIndex] });
  } catch (error) {
    return NextResponse.json({ success: false, message: '更新运动记录失败' }, { status: 500 });
  }
}
