'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface User {
  id: string;
  username: string;
  name: string;
  type: string;
  points?: number;
}

interface Request {
  id: string;
  userName: string;
  type: string;
  location: string;
  time: string;
  status: string;
  volunteerName?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    loadRequests();
  }, [router]);

  const loadRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/requests`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('加载请求失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStats = () => {
    const pending = requests.filter(r => r.status === 'pending').length;
    const matched = requests.filter(r => r.status === 'matched').length;
    return { pending, matched, total: requests.length };
  };

  const stats = getStats();

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      {/* 头部 */}
      <div className="header">
        <div>
          <h1 className="title">👋 你好，{user?.name || '用户'}</h1>
          <p style={{ color: '#999', fontSize: '14px' }}>
            {user?.type === 'official' ? '官方审核员' : user?.type === 'blind' ? '视障人士' : '志愿者'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          退出
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">待接单</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.matched}</div>
          <div className="stat-label">已匹配</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总需求</div>
        </div>
      </div>

      {/* 功能入口 */}
      <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>📱 功能入口</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" onClick={() => router.push('/requests')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: '500' }}>陪跑需求</div>
          <div style={{ fontSize: '12px', color: '#999' }}>发布/查看需求</div>
        </div>

        <div className="card" onClick={() => router.push('/history')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏃</div>
          <div style={{ fontWeight: '500' }}>陪跑记录</div>
          <div style={{ fontSize: '12px', color: '#999' }}>历史陪跑记录</div>
        </div>

        <div className="card" onClick={() => router.push('/ranking')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontWeight: '500' }}>排行榜</div>
          <div style={{ fontSize: '12px', color: '#999' }}>积分排名</div>
        </div>

        <div className="card" onClick={() => router.push('/shop')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
          <div style={{ fontWeight: '500' }}>积分商城</div>
          <div style={{ fontSize: '12px', color: '#999' }}>兑换商品</div>
        </div>

        <div className="card" onClick={() => router.push('/competitions')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏅</div>
          <div style={{ fontWeight: '500' }}>赛事活动</div>
          <div style={{ fontSize: '12px', color: '#999' }}>参与赛事</div>
        </div>

        {user?.type === 'official' && (
          <div className="card" onClick={() => router.push('/review')} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontWeight: '500' }}>审核管理</div>
            <div style={{ fontSize: '12px', color: '#999' }}>审核积分申请</div>
          </div>
        )}
      </div>

      {/* 待处理请求 */}
      {user?.type !== 'official' && (
        <>
          <h2 style={{ fontSize: '18px', margin: '24px 0 16px' }}>⏳ 待接单需求</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
          ) : requests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="empty-state">
              <div className="icon">📋</div>
              <div>暂无待接单需求</div>
            </div>
          ) : (
            requests.filter(r => r.status === 'pending').map(request => (
              <div key={request.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{request.userName}</div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                      📍 {request.location} | 🕐 {request.time}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      类型：{request.type}
                    </div>
                  </div>
                  <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>待接单</span>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* 底部导航 */}
      <nav className="nav">
        <a href="/dashboard" className="nav-item active">🏠 首页</a>
        <a href="/requests" className="nav-item">📋 需求</a>
        <a href="/history" className="nav-item">🏃 记录</a>
        <a href="/profile" className="nav-item">👤 我的</a>
      </nav>
    </div>
  );
}
