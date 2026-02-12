'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface Request {
  id: string;
  userName: string;
  type: string;
  location: string;
  time: string;
  status: string;
  volunteerName?: string;
  createdAt: number;
}

interface User {
  id: string;
  name: string;
  type: string;
}

export default function Requests() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '跑步',
    location: '',
    time: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ type: '跑步', location: '', time: '' });
        loadRequests();
      } else {
        alert(data.message || '发布失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const handleAccept = async (request: Request) => {
    if (!user) return;

    if (!confirm(`确定接受 ${request.userName} 的陪跑需求吗？`)) return;

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          requestId: request.id,
          volunteerId: user.id,
          volunteerName: user.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // 跳转到历史页面开始陪跑
        router.push('/history');
      } else {
        alert(data.message || '接单失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myRequests = requests.filter(r => r.userName === user?.name);
  const acceptedRequests = requests.filter(r => r.volunteerName === user?.name);

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">📋 陪跑需求</h1>
      </div>

      {/* 发布需求按钮 */}
      {user?.type === 'blind' && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '20px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消发布' : '+ 发布陪跑需求'}
        </button>
      )}

      {/* 发布表单 */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>发布陪跑需求</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">陪跑类型</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="跑步">跑步</option>
                <option value="散步">散步</option>
                <option value="室内运动">室内运动</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">地点</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入详细地址"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">时间</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：今日下午3点"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              发布需求
            </button>
          </form>
        </div>
      )}

      {/* 标签页 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <span style={{
          padding: '8px 16px',
          background: '#667eea',
          color: '#fff',
          borderRadius: '20px',
          fontSize: '14px'
        }}>
          待接单 ({pendingRequests.length})
        </span>
        {user?.type === 'blind' && (
          <span style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            color: '#666',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            我的需求 ({myRequests.length})
          </span>
        )}
        {user?.type === 'volunteer' && (
          <span style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            color: '#666',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            已接单 ({acceptedRequests.length})
          </span>
        )}
      </div>

      {/* 需求列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : pendingRequests.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div>暂无陪跑需求</div>
        </div>
      ) : (
        pendingRequests.map(request => (
          <div key={request.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{request.userName}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  📍 {request.location}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  🕐 {request.time}
                </div>
              </div>
              <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>待接单</span>
            </div>
            {user?.type === 'volunteer' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleAccept(request)}
              >
                接单
              </button>
            )}
          </div>
        ))
      )}

      {/* 底部导航 */}
      <nav className="nav">
        <a href="/dashboard" className="nav-item">🏠 首页</a>
        <a href="/requests" className="nav-item active">📋 需求</a>
        <a href="/history" className="nav-item">🏃 记录</a>
        <a href="/profile" className="nav-item">👤 我的</a>
      </nav>
    </div>
  );
}
