'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface History {
  id: string;
  userName: string;
  volunteerName: string;
  type: string;
  location: string;
  time: string;
  status: string;
  createdAt: number;
  completedAt?: number;
}

interface User {
  id: string;
  name: string;
  type: string;
}

export default function History() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<History | null>(null);
  const [exerciseData, setExerciseData] = useState({
    duration: '',
    distance: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    loadHistory();
  }, [router]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('加载历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (record: History) => {
    setSelectedRequest(record);
    setShowForm(true);
  };

  const handleSubmitExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !user) return;

    try {
      // 1. 创建历史记录
      await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedRequest.userName,
          userName: selectedRequest.userName,
          volunteerId: user.id,
          volunteerName: user.name,
          type: selectedRequest.type,
          location: selectedRequest.location,
          time: selectedRequest.time,
        }),
      });

      // 2. 创建运动记录
      await fetch(`${API_BASE}/exercise-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedRequest.id,
          duration: parseFloat(exerciseData.duration),
          distance: parseFloat(exerciseData.distance),
          pace: parseFloat(exerciseData.duration) / parseFloat(exerciseData.distance),
          submittedBy: user.name,
        }),
      });

      // 3. 删除已接受的请求
      await fetch(`${API_BASE}/requests?deleteId=${selectedRequest.id}`, {
        method: 'DELETE',
      });

      setShowForm(false);
      setSelectedRequest(null);
      setExerciseData({ duration: '', distance: '' });
      loadHistory();
      alert('运动记录已提交，等待官方审核！');
    } catch (err) {
      alert('提交失败');
    }
  };

  const matchedHistory = history.filter(h => h.status === 'matched');

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">🏃 陪跑记录</h1>
      </div>

      {/* 标记完成表单 */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px', background: '#f5f5f5' }}>
          <h3 style={{ marginBottom: '16px' }}>📊 提交运动数据</h3>
          <form onSubmit={handleSubmitExercise}>
            <div className="form-group">
              <label className="form-label">运动时长（分钟）</label>
              <input
                type="number"
                className="form-input"
                placeholder="例如：30"
                value={exerciseData.duration}
                onChange={e => setExerciseData({ ...exerciseData, duration: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">运动距离（公里）</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="例如：5"
                value={exerciseData.distance}
                onChange={e => setExerciseData({ ...exerciseData, distance: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                提交审核
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedRequest(null);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 待完成 */}
      {matchedHistory.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#ff6b6b' }}>
            ⏳ 待完成 ({matchedHistory.length})
          </h2>
          {matchedHistory.map(record => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid #ff6b6f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {record.userName} ↔ {record.volunteerName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    📍 {record.location} | 🕐 {record.time}
                  </div>
                </div>
                <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>
                  待完成
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                onClick={() => handleComplete(record)}
              >
                标记为已完成
              </button>
            </div>
          ))}
        </>
      )}

      {/* 历史记录 */}
      <h2 style={{ fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>
        📜 历史记录
      </h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : history.filter(h => h.status === 'completed').length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏃</div>
          <div>暂无陪跑记录</div>
        </div>
      ) : (
        history.filter(h => h.status === 'completed').map(record => (
          <div key={record.id} className="card" style={{ borderLeft: '4px solid #52c41a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: '500' }}>
                  {record.userName} ↔ {record.volunteerName}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  📍 {record.location} | 🕐 {record.time}
                </div>
              </div>
              <span className="tag" style={{ background: '#d4edda', color: '#155724' }}>
                已完成
              </span>
            </div>
          </div>
        ))
      )}

      {/* 底部导航 */}
      <nav className="nav">
        <a href="/dashboard" className="nav-item">🏠 首页</a>
        <a href="/requests" className="nav-item">📋 需求</a>
        <a href="/history" className="nav-item active">🏃 记录</a>
        <a href="/profile" className="nav-item">👤 我的</a>
      </nav>
    </div>
  );
}
