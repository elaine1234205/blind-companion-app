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
}

export default function Ranking() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [userType, setUserType] = useState<'blind' | 'volunteer'>('volunteer');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(u => u.type === userType)
    .sort((a, b) => {
      if (period === 'all') {
        return (b.totalDistance || 0) - (a.totalDistance || 0);
      }
      return b.points - a.points;
    })
    .slice(0, 20);

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">🏆 排行榜</h1>
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <select
          className="form-input"
          style={{ flex: 1 }}
          value={userType}
          onChange={e => setUserType(e.target.value as any)}
        >
          <option value="volunteer">志愿者</option>
          <option value="blind">视障人士</option>
        </select>
        <select
          className="form-input"
          style={{ flex: 1 }}
          value={period}
          onChange={e => setPeriod(e.target.value as any)}
        >
          <option value="all">总里程</option>
          <option value="week">周积分</option>
          <option value="month">月积分</option>
        </select>
      </div>

      {/* 排行榜 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏆</div>
          <div>暂无排名数据</div>
        </div>
      ) : (
        filteredUsers.map((u, index) => (
          <div
            key={u.id}
            className="user-card"
            style={{
              borderLeft: index < 3 ? `4px solid ${
                index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'
              }` : 'none'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: index < 3 ? `linear-gradient(135deg, ${
                index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'
              } 0%, #${index === 0 ? 'ffec8b' : index === 1 ? '#d3d3d3' : '#daa520'} 100%)` : '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              fontWeight: '600',
              color: index < 3 ? '#fff' : '#666'
            }}>
              {index + 1}
            </div>
            <div className="user-avatar" style={{ background: u.type === 'volunteer' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
              {u.name.charAt(0)}
            </div>
            <div className="user-info" style={{ flex: 1 }}>
              <div className="user-name">{u.name}</div>
              <div className="user-type">
                {u.type === 'volunteer' ? '志愿者' : '视障人士'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="points">{u.points || 0}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                {(u.totalDistance || 0).toFixed(1)} km
              </div>
            </div>
          </div>
        ))
      )}

      {/* 底部导航 */}
      <nav className="nav">
        <a href="/dashboard" className="nav-item">🏠 首页</a>
        <a href="/requests" className="nav-item">📋 需求</a>
        <a href="/history" className="nav-item">🏃 记录</a>
        <a href="/profile" className="nav-item">👤 我的</a>
      </nav>
    </div>
  );
}
