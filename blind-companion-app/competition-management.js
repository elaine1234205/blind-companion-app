// 赛事管理 - 覆盖现有函数并添加新功能

// 覆盖loadEvents函数，使用API
function loadEvents() {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        return;
    }

    const currentUser = JSON.parse(currentUserStr);

    // 显示创建赛事按钮（仅官方审核员可见）
    const createSection = document.getElementById('create-event-section');
    if (currentUser.type === 'official') {
        createSection.style.display = 'block';
    } else {
        createSection.style.display = 'none';
    }

    // 从API获取赛事数据
    fetch('/api/competitions')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取赛事列表失败:', data.message);
                return;
            }

            const competitions = data.data;

            // 检查是否有赛事到期需要自动结算
            checkExpiredCompetitions(competitions);

            // 分类赛事
            const activeCompetitions = competitions.filter(c => c.status === 'active');
            const settledCompetitions = competitions.filter(c => c.status === 'settled');

            // 渲染进行中的赛事
            renderActiveCompetitions(activeCompetitions, currentUser);

            // 渲染已结束的赛事
            renderSettledCompetitions(settledCompetitions);
        })
        .catch(error => {
            console.error('获取赛事列表错误:', error);
        });
}

// 检查过期赛事并自动结算
function checkExpiredCompetitions(competitions) {
    const now = Date.now();

    competitions.forEach(comp => {
        if (comp.status === 'active') {
            const endDate = new Date(comp.endDate).getTime();
            if (now >= endDate) {
                // 自动结算
                console.log('赛事已到期，自动结算:', comp.name);
                autoSettleCompetition(comp.id);
            }
        }
    });
}

// 自动结算赛事
function autoSettleCompetition(competitionId) {
    fetch('/api/competitions/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: competitionId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('赛事自动结算成功:', data);
            // 刷新赛事列表
            loadEvents();
        }
    })
    .catch(error => {
        console.error('自动结算错误:', error);
    });
}

// 渲染进行中的赛事
function renderActiveCompetitions(competitions, currentUser) {
    const container = document.getElementById('active-events-list');

    if (competitions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无进行中的赛事</div>';
        return;
    }

    container.innerHTML = competitions.map(comp => {
        const startDate = new Date(comp.startDate).toLocaleDateString('zh-CN');
        const endDate = new Date(comp.endDate).toLocaleDateString('zh-CN');
        const daysLeft = Math.ceil((new Date(comp.endDate) - Date.now()) / (1000 * 60 * 60 * 24));

        let actionButtons = '';
        if (currentUser.type === 'official') {
            actionButtons = `
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="showDelayModal('${comp.id}')" class="btn btn-primary" style="flex: 1;">
                        ⏰ 延迟赛事
                    </button>
                    <button onclick="showDeleteModal('${comp.id}')" class="btn" style="flex: 1; background: #ff4d4f; color: white;">
                        🗑️ 删除赛事
                    </button>
                    <button onclick="manualSettleCompetition('${comp.id}')" class="btn btn-success" style="flex: 1;">
                        ✅ 手动结算
                    </button>
                </div>
            `;
        }

        return `
            <div class="card" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #333; flex: 1;">${comp.name}</h3>
                    <span style="background: #52c41a; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        进行中
                    </span>
                </div>
                <p style="color: #666; margin: 8px 0; font-size: 14px;">${comp.description}</p>
                <div style="display: flex; gap: 15px; margin-top: 12px; flex-wrap: wrap; font-size: 13px; color: #666;">
                    <span>📅 开始：${startDate}</span>
                    <span>🏁 截止：${endDate}</span>
                    <span style="color: ${daysLeft <= 3 ? '#ff4d4f' : '#52c41a'};">
                        ⏰ 剩余 ${daysLeft} 天
                    </span>
                    ${comp.delayDays > 0 ? `<span style="color: #fa8c16;">已延迟 ${comp.delayDays} 天</span>` : ''}
                </div>
                ${actionButtons}
            </div>
        `;
    }).join('');
}

// 渲染已结束的赛事
function renderSettledCompetitions(competitions) {
    const container = document.getElementById('finished-events-list');

    if (competitions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无已结束的赛事</div>';
        return;
    }

    container.innerHTML = competitions.map(comp => {
        const settledDate = new Date(comp.settledAt).toLocaleDateString('zh-CN');

        return `
            <div class="card" style="margin-bottom: 15px; cursor: pointer;" onclick="showSettlementResults('${comp.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #666; flex: 1;">${comp.name}</h3>
                    <span style="background: #d9d9d9; color: #666; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        已结束
                    </span>
                </div>
                <p style="color: #999; margin: 8px 0; font-size: 14px;">${comp.description}</p>
                <div style="font-size: 13px; color: #999; margin-top: 12px;">
                    🏆 结算时间：${settledDate}
                </div>
            </div>
        `;
    }).join('');
}

// 显示创建赛事表单
function showCreateEventForm() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 500px; width: 100%; padding: 30px;">
            <h2 style="margin: 0 0 20px 0; color: #333;">➕ 创建新赛事</h2>

            <form id="create-competition-form">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">赛事名称</label>
                    <input type="text" id="comp-name" required
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">赛事描述</label>
                    <textarea id="comp-description" required rows="3"
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"></textarea>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">开始日期</label>
                    <input type="date" id="comp-start-date" required
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">截止日期</label>
                    <input type="date" id="comp-end-date" required
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('div[style*=fixed]').remove()"
                            class="btn" style="flex: 1; background: #d9d9d9;">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        创建赛事
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 设置表单提交事件
    document.getElementById('create-competition-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitCreateCompetition(modal);
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 提交创建赛事
function submitCreateCompetition(modal) {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentUserStr);

    const competition = {
        name: document.getElementById('comp-name').value,
        description: document.getElementById('comp-description').value,
        startDate: new Date(document.getElementById('comp-start-date').value).toISOString(),
        endDate: new Date(document.getElementById('comp-end-date').value).toISOString(),
        createdBy: currentUser.username || currentUser.name
    };

    fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competition)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('赛事创建成功！');
            modal.remove();
            loadEvents();
        } else {
            alert('创建失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('创建赛事错误:', error);
        alert('创建失败，请稍后重试');
    });
}

// 显示延迟赛事模态框
function showDelayModal(competitionId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 400px; width: 100%; padding: 30px;">
            <h2 style="margin: 0 0 20px 0; color: #333;">⏰ 延迟赛事</h2>

            <div style="background: #fff7e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #fa8c16;">
                <div style="font-weight: 600; margin-bottom: 5px;">⚠️ 延迟规则</div>
                <div style="font-size: 14px; color: #666;">
                    • 最多可延迟365天<br>
                    • 只能在截止日期前延迟<br>
                    • 延迟后截止日期将自动更新
                </div>
            </div>

            <form id="delay-competition-form">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">延迟天数</label>
                    <input type="number" id="delay-days" required min="1" max="365" value="7"
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">请输入1-365之间的天数</div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('div[style*=fixed]').remove()"
                            class="btn" style="flex: 1; background: #d9d9d9;">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        确认延迟
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 设置表单提交事件
    document.getElementById('delay-competition-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitDelayCompetition(competitionId, modal);
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 提交延迟赛事
function submitDelayCompetition(competitionId, modal) {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentUserStr);
    const delayDays = parseInt(document.getElementById('delay-days').value);

    if (delayDays < 1 || delayDays > 365) {
        alert('延迟天数必须在1-365天之间');
        return;
    }

    fetch('/api/competitions/delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: competitionId,
            delayDays: delayDays,
            delayedBy: currentUser.username || currentUser.name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`赛事已延迟 ${delayDays} 天！\n新的截止日期：${new Date(data.data.endDate).toLocaleDateString('zh-CN')}`);
            modal.remove();
            loadEvents();
        } else {
            alert('延迟失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('延迟赛事错误:', error);
        alert('延迟失败，请稍后重试');
    });
}

// 显示删除赛事模态框
function showDeleteModal(competitionId) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 400px; width: 100%; padding: 30px;">
            <h2 style="margin: 0 0 20px 0; color: #ff4d4f;">🗑️ 删除赛事</h2>

            <div style="background: #fff1f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ff4d4f;">
                <div style="font-weight: 600; margin-bottom: 5px;">⚠️ 警告</div>
                <div style="font-size: 14px; color: #666;">
                    删除赛事后将无法恢复，请谨慎操作！<br>
                    必须提供删除理由。
                </div>
            </div>

            <form id="delete-competition-form">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">删除理由 *</label>
                    <textarea id="delete-reason" required rows="4" placeholder="请输入删除理由..."
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"></textarea>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="this.closest('div[style*=fixed]').remove()"
                            class="btn" style="flex: 1; background: #d9d9d9;">
                        取消
                    </button>
                    <button type="submit" class="btn" style="flex: 1; background: #ff4d4f; color: white;">
                        确认删除
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 设置表单提交事件
    document.getElementById('delete-competition-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitDeleteCompetition(competitionId, modal);
    });

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 提交删除赛事
function submitDeleteCompetition(competitionId, modal) {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = JSON.parse(currentUserStr);
    const reason = document.getElementById('delete-reason').value.trim();

    if (!reason) {
        alert('请输入删除理由');
        return;
    }

    if (!confirm('确定要删除这个赛事吗？此操作无法撤销！')) {
        return;
    }

    fetch('/api/competitions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: competitionId,
            reason: reason,
            deletedBy: currentUser.username || currentUser.name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('赛事已删除！');
            modal.remove();
            loadEvents();
        } else {
            alert('删除失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除赛事错误:', error);
        alert('删除失败，请稍后重试');
    });
}

// 手动结算赛事
function manualSettleCompetition(competitionId) {
    if (!confirm('确定要手动结算这个赛事吗？结算后将无法修改。')) {
        return;
    }

    fetch('/api/competitions/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: competitionId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`赛事结算成功！\n参与用户：${data.totalUsers}人`);
            loadEvents();
            // 显示结算结果
            showSettlementResults(competitionId);
        } else {
            alert('结算失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('结算赛事错误:', error);
        alert('结算失败，请稍后重试');
    });
}

// 显示结算结果
function showSettlementResults(competitionId) {
    fetch('/api/competitions')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('获取赛事信息失败');
                return;
            }

            const competition = data.data.find(c => c.id === competitionId);
            if (!competition || !competition.results) {
                alert('未找到结算结果');
                return;
            }

            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            `;

            // 分离盲人和志愿者结果
            const blindResults = competition.results.filter(r => r.type === 'blind');
            const volunteerResults = competition.results.filter(r => r.type === 'volunteer');

            const renderResults = (results, title) => {
                if (results.length === 0) {
                    return `<p style="text-align: center; color: #999;">暂无${title}参与</p>`;
                }

                return `
                    <h3 style="margin: 20px 0 15px 0; color: #333;">${title}</h3>
                    ${results.map(result => {
                        const rankEmoji = result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : '';
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center;
                                        padding: 15px; background: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="font-size: 24px; min-width: 40px; text-align: center;">
                                        ${rankEmoji || `#${result.rank}`}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 16px;">${result.username}</div>
                                        <div style="font-size: 12px; color: #666;">完成 ${result.count} 次</div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 20px; font-weight: 700; color: #52c41a;">+${result.points}</div>
                                    <div style="font-size: 12px; color: #666;">积分</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                `;
            };

            modal.innerHTML = `
                <div style="background: white; border-radius: 20px; max-width: 600px; width: 100%;
                            max-height: 80vh; overflow-y: auto; padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #333;">🏆 ${competition.name} - 结算结果</h2>
                        <button onclick="this.closest('div[style*=fixed]').remove()"
                                style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">×</button>
                    </div>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                padding: 15px; border-radius: 10px; margin-bottom: 20px; color: white;">
                        <div style="font-size: 14px; opacity: 0.9;">
                            结算时间：${new Date(competition.settledAt).toLocaleString('zh-CN')}<br>
                            参与用户：${competition.results.length}人
                        </div>
                    </div>

                    ${renderResults(volunteerResults, '🤝 志愿者排行榜')}
                    ${renderResults(blindResults, '👤 盲人排行榜')}
                </div>
            `;

            document.body.appendChild(modal);

            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        })
        .catch(error => {
            console.error('获取结算结果错误:', error);
            alert('加载结算结果失败');
        });
}

// 页面加载时自动检查赛事
setInterval(() => {
    const currentPage = document.querySelector('.page:not(.hidden)');
    if (currentPage && currentPage.id === 'page-events') {
        loadEvents();
    }
}, 60000); // 每分钟检查一次

console.log('赛事管理模块已加载：支持创建、删除、延迟和自动结算功能');