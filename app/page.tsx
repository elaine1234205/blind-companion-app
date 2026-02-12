'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    type: 'blind',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const action = isLogin ? 'login' : 'register';
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData }),
      });

      const result = await response.json();

      if (result.success) {
        // 保存登录信息
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>👁️‍🗨️</div>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          盲人陪跑
        </h1>
        <p style={{ color: '#999' }}>让跑步成为温暖的陪伴</p>
      </div>

      {error && (
        <div style={{
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#ff4d4f'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="form-group">
              <label className="form-label">昵称 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入昵称"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input
                type="tel"
                className="form-input"
                placeholder="请输入手机号（选填）"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">用户类型 *</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="blind">👁️ 我是盲人（需要陪跑）</option>
                <option value="volunteer">💪 我是志愿者（提供陪跑）</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">用户名 *</label>
          <input
            type="text"
            className="form-input"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">密码 *</label>
          <input
            type="password"
            className="form-input"
            placeholder="请输入密码"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '20px' }}
          disabled={loading}
        >
          {loading ? '加载中...' : (isLogin ? '登录' : '注册')}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer'
          }}
        >
          {isLogin ? '没有账号？立即注册' : '已有账号？去登录'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '12px' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          官方审核员测试账号
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          用户名：官方审核员<br />
          密码：10280613xrldyf
        </div>
      </div>
    </div>
  );
}
