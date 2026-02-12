'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface Competition {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  participants: number;
  prize: string;
}

interface User {
  id: string;
  name: string;
  type: string;
}

export default function Competitions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '个人赛',
    startDate: '',
    endDate: '',
    prize: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    loadCompetitions();
  }, [router]);

  const loadCompetitions = async () => {
    try {
      const res = await fetch(`${API_BASE}/competitions`);
      const data = await res.json();
      if (data.success) {
        setCompetitions(data.data);
      }
    } catch (err) {
      console.error('加载赛事失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/competitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setFormData({ name: '', type: '个人赛', startDate: '', endDate: '', prize: '' });
        loadCompetitions();
      } else {
        alert(data.message || '创建失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const activeCompetitions = competitions.filter(c => c.status === 'pending');

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">🏅 赛事活动</h1>
      </div>

      {/* 创建赛事按钮 */}
      {user?.type === 'official' && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '20px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消创建' : '+ 创建赛事'}
        </button>
      )}

      {/* 创建表单 */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>创建新赛事</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">赛事名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入赛事名称"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">赛事类型</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="个人赛">个人赛</option>
                <option value="团队赛">团队赛</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">开始日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">结束日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">奖励说明</label>
              <textarea
                className="form-input"
                placeholder="请输入奖励说明"
                value={formData.prize}
                onChange={e => setFormData({ ...formData, prize: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              创建赛事
            </button>
          </form>
        </div>
      )}

      {/* 赛事列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : activeCompetitions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏅</div>
          <div>暂无进行中的赛事</div>
        </div>
      ) : (
        activeCompetitions.map(competition => (
          <div key={competition.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: '500', fontSize: '18px' }}>{competition.name}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  📅 {competition.startDate} 至 {competition.endDate}
                </div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '4px' }}>
                  🏆 {competition.type} | 👥 {competition.participants}人参与
                </div>
              </div>
              <span className="tag" style={{ background: '#d4edda', color: '#155724' }}>进行中</span>
            </div>
            {competition.prize && (
              <div style={{
                background: '#f5f5f5',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '12px',
                fontSize: '14px',
                color: '#666'
              }}>
                🎁 奖励: {competition.prize}
              </div>
            )}
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
