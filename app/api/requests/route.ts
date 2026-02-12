import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

// GET /api/requests
export async function GET() {
  try {
    const requests = dataManager.getRequests();
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取请求失败' }, { status: 500 });
  }
}

// POST /api/requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, type, location, time } = body;

    const requests = dataManager.getRequests();
    const newRequest = {
      id: dataManager.generateId(),
      userId,
      userName,
      type,
      location,
      time,
      status: 'pending',
      createdAt: Date.now(),
      volunteerName: null,
      volunteerId: null,
    };

    requests.push(newRequest);
    dataManager.saveRequests(requests);

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error) {
    return NextResponse.json({ success: false, message: '创建请求失败' }, { status: 500 });
  }
}
