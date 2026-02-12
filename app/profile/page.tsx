'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface User {
  id: string;
  username: string;
  name: string;
  type: string;
  points: number;
  totalDistance: number;
  createdAt: number;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleDeleteAccount = () => {
    if (!confirm('确定要注销账号吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：确定要注销账号吗？')) return;

    alert('账号注销功能需要在网页端操作，请联系管理员。');
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">👤 个人中心</h1>
      </div>

      {/* 用户信息 */}
      <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: user?.type === 'official'
            ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
            : user?.type === 'volunteer'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '32px',
          color: '#fff'
        }}>
          {user?.name.charAt(0)}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          {user?.name}
        </div>
        <div style={{ color: '#999', fontSize: '14px' }}>
          {user?.type === 'official' ? '官方审核员' : user?.type === 'volunteer' ? '志愿者' : '视障人士'}
        </div>
      </div>

      {/* 统计数据 */}
      <div className="stats-grid" style={{ marginTop: '20px' }}>
        <div className="stat-item">
          <div className="stat-value">{user?.points || 0}</div>
          <div className="stat-label">当前积分</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{(user?.totalDistance || 0).toFixed(1)}</div>
          <div className="stat-label">总里程(km)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">
            {user?.createdAt ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) : 0}
          </div>
          <div className="stat-label">注册天数</div>
        </div>
      </div>

      {/* 菜单 */}
      <div style={{ marginTop: '20px' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <span>📱 绑定手机</span>
            <span style={{ color: '#999' }}>未绑定</span>
          </div>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <span>🔔 消息通知</span>
            <span style={{ color: '#999' }}>已开启</span>
          </div>
          <div style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <span>❓ 帮助中心</span>
            <span style={{ color: '#999' }}>></span>
          </div>
        </div>

        <div className="card" style={{ padding: 0, marginTop: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#ff4d4f'
            }}
            onClick={handleDeleteAccount}
          >
            <span>🗑️ 注销账号</span>
            <span style={{ color: '#ff4d4f' }}>></span>
          </div>
          <div
            style={{
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#ff4d4f'
            }}
            onClick={handleLogout}
          >
            <span>🚪 退出登录</span>
            <span style={{ color: '#ff4d4f' }}>></span>
          </div>
        </div>
      </div>

      {/* 版本信息 */}
      <div style={{ textAlign: 'center', marginTop: '40px', color: '#999', fontSize: '12px' }}>
        盲人陪跑 v1.0.0
      </div>

      {/* 底部导航 */}
      <nav className="nav">
        <a href="/dashboard" className="nav-item">🏠 首页</a>
        <a href="/requests" className="nav-item">📋 需求</a>
        <a href="/history" className="nav-item">🏃 记录</a>
        <a href="/profile" className="nav-item active">👤 我的</a>
      </nav>
    </div>
  );
}
