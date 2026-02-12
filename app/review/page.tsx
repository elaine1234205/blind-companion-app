'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface ExerciseRecord {
  id: string;
  recordId: string;
  duration: number;
  distance: number;
  pace: number;
  submittedBy: string;
  submittedAt: number;
  status: string;
}

export default function Review() {
  const router = useRouter();
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.type !== 'official') {
      router.push('/dashboard');
      return;
    }
    loadRecords();
  }, [router]);

  const loadRecords = async () => {
    try {
      const res = await fetch(`${API_BASE}/exercise-records`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('加载记录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId: string) => {
    if (!confirm('确定通过此运动记录吗？')) return;

    try {
      const res = await fetch(`${API_BASE}/exercise-records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, status: 'approved' }),
      });
      const data = await res.json();

      if (data.success) {
        alert('审核通过！');
        loadRecords();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const handleReject = async (recordId: string) => {
    if (!confirm('确定拒绝此运动记录吗？')) return;

    try {
      const res = await fetch(`${API_BASE}/exercise-records`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, status: 'rejected' }),
      });
      const data = await res.json();

      if (data.success) {
        alert('已拒绝');
        loadRecords();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const pendingRecords = records.filter(r => r.status === 'pending');
  const approvedRecords = records.filter(r => r.status === 'approved');

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">✅ 审核管理</h1>
      </div>

      {/* 统计 */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#856404' }}>{pendingRecords.length}</div>
          <div className待审核</div>
        </div>
        <div="stat-label"> className="stat-item">
          <div className="stat-value" style={{ color: '#155724' }}>{approvedRecords.length}</div>
          <div className="stat-label">已通过</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#721c24' }}>{records.filter(r => r.status === 'rejected').length}</div>
          <div className="stat-label">已拒绝</div>
        </div>
      </div>

      {/* 待审核列表 */}
      <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>⏳ 待审核</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : pendingRecords.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div>暂无待审核记录</div>
        </div>
      ) : (
        pendingRecords.map(record => (
          <div key={record.id} className="card" style={{ borderLeft: '4px solid #ffc107' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{record.submittedBy}</div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '4px' }}>
                  {new Date(record.submittedAt).toLocaleString()}
                </div>
              </div>
              <span className="tag" style={{ background: '#fff3cd', color: '#856404' }}>待审核</span>
            </div>
            <div className="stats-grid" style={{ marginBottom: '12px' }}>
              <div className="stat-item">
                <div className="stat-value">{record.duration}</div>
                <div className="stat-label">分钟</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{record.distance}</div>
                <div className="stat-label">公里</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{record.pace.toFixed(2)}</div>
                <div className="stat-label">配速</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-success"
                style={{ flex: 1 }}
                onClick={() => handleApprove(record.id)}
              >
                ✓ 通过
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => handleReject(record.id)}
              >
                ✗ 拒绝
              </button>
            </div>
          </div>
        ))
      )}

      {/* 已通过列表 */}
      {approvedRecords.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', marginTop: '20px' }}>✓ 已通过</h2>
          {approvedRecords.slice(0, 5).map(record => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid #52c41a', opacity: 0.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{record.submittedBy}</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    {record.duration}分钟 | {record.distance}公里
                  </div>
                </div>
                <span className="tag" style={{ background: '#d4edda', color: '#155724' }}>已通过</span>
              </div>
            </div>
          ))}
        </>
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
