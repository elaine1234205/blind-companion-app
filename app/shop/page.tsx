'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: string;
}

interface User {
  id: string;
  name: string;
  points: number;
}

export default function Shop() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ShopItem[]>([
    { id: '1', name: '运动水壶', price: 50, description: '便携式运动水壶', icon: '🥤' },
    { id: '2', name: '运动毛巾', price: 30, description: '吸汗速干毛巾', icon: '🧴' },
    { id: '3', name: '跑步腰包', price: 80, description: '便携式腰包', icon: '🎒' },
    { id: '4', name: '运动耳机', price: 200, description: '无线运动耳机', icon: '🎧' },
    { id: '5', name: '抽奖券', price: 100, description: '可参与抽奖活动', icon: '🎫' },
  ]);
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

  const handleBuy = async (item: ShopItem) => {
    if (!user) return;

    if (!confirm(`确定花费 ${item.price} 积分兑换 ${item.name} 吗？`)) return;

    try {
      const res = await fetch(`${API_BASE}/shop-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.name,
          itemId: item.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        // 更新用户积分
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.points -= item.price;
        localStorage.setItem('user', JSON.stringify(stored));
        setUser(stored);
      } else {
        alert(data.message || '兑换失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <h1 className="title">🛒 积分商城</h1>
      </div>

      {/* 积分显示 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        color: '#fff',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>当前积分</div>
        <div style={{ fontSize: '36px', fontWeight: '600', marginTop: '8px' }}>
          {user?.points || 0}
        </div>
      </div>

      {/* 商品列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
      ) : (
        items.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              marginRight: '16px'
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>{item.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#52c41a' }}>{item.price}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>积分</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginLeft: '12px', padding: '8px 16px' }}
              onClick={() => handleBuy(item)}
            >
              兑换
            </button>
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
