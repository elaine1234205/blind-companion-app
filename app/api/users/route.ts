import { NextRequest, NextResponse } from 'next/server';
import { dataManager } from '@/lib/data-manager';

export async function GET() {
  try {
    const users = dataManager.getUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, message: '获取用户列表失败' }, { status: 500 });
  }
}
