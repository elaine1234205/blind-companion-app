// 多用户API集成 - 覆盖关键函数以使用服务器API

// 覆盖注册函数
function handleRegister(event) {
    event.preventDefault();

    if (!selectedRole) {
        alert('请选择身份！');
        return;
    }

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const phone = document.getElementById('register-phone').value.trim();

    if (password !== passwordConfirm) {
        alert('两次输入的密码不一致！');
        return;
    }

    // 调用注册API
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: username,
            password: password,
            phone: phone,
            type: selectedRole
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.data));
            alert('注册成功！');
            document.getElementById('auth-page').classList.add('hidden');
            // 更新导航栏
            if (typeof updateNavigation === 'function') {
                updateNavigation(data.data);
            }
            loadUserProfile();
        } else {
            alert(data.message || '注册失败');
        }
    })
    .catch(error => {
        console.error('注册错误:', error);
        alert('注册失败，请稍后重试');
    });
}

// 覆盖登录函数
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // 调用登录API
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.data));
            alert('登录成功！');
            document.getElementById('auth-page').classList.add('hidden');
            // 更新导航栏
            if (typeof updateNavigation === 'function') {
                updateNavigation(data.data);
            }
            loadUserProfile();
        } else {
            alert(data.message || '用户名或密码错误');
        }
    })
    .catch(error => {
        console.error('登录错误:', error);
        alert('登录失败，请稍后重试');
    });
}

// 发布需求表单处理 - 使用API
document.addEventListener('DOMContentLoaded', function() {
    console.log('[API集成] DOMContentLoaded 事件触发，准备覆盖发布表单');
    const publishForm = document.getElementById('publish-form');
    if (publishForm) {
        console.log('[API集成] 找到发布表单，准备替换');
        // 移除原有的事件监听器，添加新的
        const newForm = publishForm.cloneNode(true);
        publishForm.parentNode.replaceChild(newForm, publishForm);
        console.log('[API集成] 表单已替换，添加新的事件监听器');

        newForm.addEventListener('submit', function(e) {
            console.log('[API集成] 表单提交事件触发');
            e.preventDefault();

            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) {
                alert('请先登录');
                location.reload();
                return;
            }

            const userInfo = JSON.parse(currentUserStr);
            const locationType = document.querySelector('input[name="location-type"]:checked').value;
            const pickupType = document.querySelector('input[name="pickup-type"]:checked').value;

            const request = {
                userName: userInfo.username,
                userType: userInfo.type,
                age: document.getElementById('request-age').value,
                type: document.getElementById('request-type').value,
                locationType: locationType,
                locationTypeText: locationType === 'destination' ? '要去的地点' : '结伴的地点',
                location: document.getElementById('request-location').value,
                pickupType: pickupType,
                pickupTypeText: pickupType === 'home' ? '到家接' : '正常接送',
                time: document.getElementById('request-time').value,
                phone: document.getElementById('request-phone').value,
                description: document.getElementById('request-description').value,
                status: 'pending'
            };

            console.log('[API集成] 准备发送请求到服务器:', request);

            // 调用发布需求API
            fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            })
            .then(response => {
                console.log('[API集成] 收到服务器响应，状态码:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('[API集成] 解析响应数据:', data);
                if (data.success) {
                    console.log('[API集成] 发布成功，准备显示成功消息');
                    alert('需求发布成功！');
                    // 异步执行表单重置和页面切换，避免错误影响成功流程
                    setTimeout(() => {
                        try {
                            console.log('[API集成] 开始执行页面切换');
                            newForm.reset();
                            switchPage('map');
                            loadRequestsList();
                            console.log('[API集成] 页面切换完成');
                        } catch (e) {
                            console.error('[API集成] 页面切换错误:', e);
                        }
                    }, 100);
                } else {
                    console.error('[API集成] 发布失败，服务器返回:', data);
                    alert('发布失败：' + (data.message || '未知错误'));
                }
            })
            .catch(error => {
                console.error('[API集成] 发布需求错误（catch块）:', error);
                alert('发布失败，请稍后重试');
            });
        });
        console.log('[API集成] 发布表单事件监听器已添加');
    } else {
        console.warn('[API集成] 未找到发布表单');
    }
});

// 覆盖接单函数，使用API
function acceptRequest(requestId) {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        alert('请先登录');
        location.reload();
        return;
    }

    const userInfo = JSON.parse(currentUserStr);

    if (userInfo.type !== 'volunteer') {
        alert('只有志愿者可以接单');
        return;
    }

    // 首先获取请求详情
    fetch('/api/requests')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error('获取需求信息失败');
            }

            const request = data.data.find(r => r.id === requestId);
            if (!request) {
                throw new Error('需求不存在');
            }

            // 更新请求状态为已匹配
            return fetch('/api/requests/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: requestId,
                    status: 'matched',
                    volunteerId: userInfo.id,
                    volunteerName: userInfo.username || userInfo.name,
                    matchedAt: Date.now()
                })
            })
            .then(response => response.json())
            .then(updateData => {
                if (!updateData.success) {
                    throw new Error('接单失败：' + (updateData.message || '未知错误'));
                }

                // 添加到历史记录
                return fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestId: request.id,
                        userName: request.userName,
                        volunteerName: userInfo.username || userInfo.name,
                        type: request.type,
                        location: request.location,
                        time: request.time,
                        status: 'matched'
                    })
                });
            })
            .then(response => response.json())
            .then(historyData => {
                // 更新志愿者积分
                userInfo.points = (userInfo.points || 0) + 5;

                return fetch('/api/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: userInfo.id,
                        points: userInfo.points
                    })
                });
            })
            .then(response => response.json())
            .then(userData => {
                if (userData.success) {
                    // 更新本地用户信息
                    localStorage.setItem('currentUser', JSON.stringify(userData.data));
                }

                alert('接单成功！您获得 5 积分\n正在启动导航...');

                // 保存当前接单信息到localStorage（会话特定）
                localStorage.setItem('currentNavigation', JSON.stringify({
                    requestId: request.id,
                    userName: request.userName,
                    userPhone: request.phone,
                    destination: request.location,
                    pickupType: request.pickupType || 'normal',
                    startTime: Date.now()
                }));

                // 异步执行页面切换和导航启动，避免错误影响成功流程
                setTimeout(() => {
                    try {
                        switchPage('map');
                        if (typeof startNavigation === 'function') {
                            startNavigation(request);
                        }
                        // 刷新接单列表
                        if (typeof loadVolunteerRequests === 'function') {
                            loadVolunteerRequests();
                        }
                    } catch (e) {
                        console.error('页面切换或导航启动错误:', e);
                    }
                }, 100);
            });
        })
        .catch(error => {
            console.error('接单错误:', error);
            alert('接单失败，请稍后重试');
        });
}

console.log('API集成已加载：注册和登录功能已覆盖');
// 覆盖获取需求列表函数，使用API
function loadRequestsList() {
    const container = document.getElementById('requests-list');
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    fetch('/api/requests')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取需求列表失败:', data.message);
                container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><div>加载失败</div></div>';
                return;
            }

            const requests = data.data;
            if (requests.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div>暂无需求</div></div>';
                return;
            }

            container.innerHTML = requests.map(req => `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <strong style="font-size: 18px;">${req.userName}</strong>
                            ${req.userType === 'blind' ? '<span class="tag tag-certified">视障用户</span>' : ''}
                        </div>
                        <span class="tag tag-${req.status}">
                            ${req.status === 'pending' ? '等待接单' : req.status === 'matched' ? '已匹配' : '已完成'}
                        </span>
                    </div>
                    <div style="margin-bottom: 8px;"><strong>📍 ${req.locationTypeText || '地点'}：</strong>${req.location}</div>
                    <div style="margin-bottom: 8px;"><strong>🕐 时间：</strong>${req.time}</div>
                    <div style="margin-bottom: 15px; color: #666;">${req.description}</div>
                    <div style="font-size: 12px; color: #999;">发布于 ${formatTime(req.createdAt)}</div>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('获取需求列表错误:', error);
            container.innerHTML = '<div class="empty-state"><div class="icon">❌</div><div>加载失败</div></div>';
        });
}

// 覆盖提交运动记录函数，使用API
function submitExerciseRecord(event) {
    event.preventDefault();

    const recordId = document.getElementById('exercise-record-id').value;
    const duration = parseFloat(document.getElementById('exercise-duration').value);
    const distance = parseFloat(document.getElementById('exercise-distance').value);

    if (!duration || !distance) {
        alert('请填写完整的运动数据');
        return;
    }

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        alert('请先登录');
        return;
    }

    const currentUser = JSON.parse(currentUserStr);
    const pace = duration / distance;

    const exerciseRecord = {
        recordId: recordId,
        duration: duration,
        distance: distance,
        pace: pace,
        submittedAt: Date.now(),
        status: 'pending',
        submittedBy: currentUser.username || currentUser.name
    };

    fetch('/api/exercise-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseRecord)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('运动记录已提交！\n等待官方审核通过后，将获得积分和连胜奖励。');
            closeExerciseRecordForm();
            loadHistory();
        } else {
            alert('提交失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('提交运动记录错误:', error);
        alert('提交失败，请稍后重试');
    });
}

// 覆盖审核运动记录函数，使用API
function approveExerciseRecord(exerciseRecordId) {
    // 获取运动记录
    fetch('/api/exercise-records')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('获取运动记录失败');
                return;
            }

            const exerciseRecord = data.data.find(r => r.id === exerciseRecordId);
            if (!exerciseRecord) {
                alert('运动记录不存在');
                return;
            }

            // 更新运动记录状态为已通过
            return fetch('/api/exercise-records/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: exerciseRecordId,
                    status: 'approved',
                    approvedAt: Date.now()
                })
            })
            .then(response => response.json())
            .then(updateData => {
                if (!updateData.success) {
                    alert('更新运动记录失败');
                    return;
                }

                // 获取历史记录并更新状态
                return fetch('/api/history')
                    .then(response => response.json())
                    .then(historyData => {
                        if (!historyData.success) {
                            alert('获取历史记录失败');
                            return;
                        }

                        const history = historyData.data;
                        const historyRecord = history.find(r => r.id === exerciseRecord.recordId);

                        if (!historyRecord) {
                            alert('历史记录不存在');
                            return;
                        }

                        // 更新历史记录状态为已完成
                        return fetch('/api/history/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: historyRecord.id,
                                status: 'completed'
                            })
                        })
                        .then(response => response.json())
                        .then(() => {
                            // 获取所有用户
                            return fetch('/api/users')
                                .then(response => response.json())
                                .then(usersData => {
                                    if (!usersData.success) {
                                        alert('获取用户信息失败');
                                        return;
                                    }

                                    const users = usersData.data;
                                    const volunteer = users.find(u => u.username === historyRecord.volunteerName && u.type === 'volunteer');
                                    const blindUser = users.find(u => u.username === historyRecord.userName && u.type === 'blind');

                                    let streakMessages = [];
                                    let updatePromises = [];

                                    // 更新志愿者积分
                                    if (volunteer) {
                                        volunteer.points = (volunteer.points || 0) + 20;

                                        // 更新连胜（如果有updateUserStreak函数）
                                        if (typeof updateUserStreak === 'function') {
                                            const volunteerStreakResult = updateUserStreak(volunteer, users);
                                            if (volunteerStreakResult.streakUpdated && volunteerStreakResult.message) {
                                                streakMessages.push('志愿者：' + volunteerStreakResult.message);
                                            }
                                        }

                                        updatePromises.push(
                                            fetch('/api/users/update', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(volunteer)
                                            })
                                        );
                                    }

                                    // 更新盲人积分
                                    if (blindUser) {
                                        blindUser.points = (blindUser.points || 0) + 10;

                                        // 更新连胜（如果有updateUserStreak函数）
                                        if (typeof updateUserStreak === 'function') {
                                            const blindStreakResult = updateUserStreak(blindUser, users);
                                            if (blindStreakResult.streakUpdated && blindStreakResult.message) {
                                                streakMessages.push('盲人：' + blindStreakResult.message);
                                            }
                                        }

                                        updatePromises.push(
                                            fetch('/api/users/update', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(blindUser)
                                            })
                                        );
                                    }

                                    // 等待所有用户更新完成
                                    return Promise.all(updatePromises)
                                        .then(() => {
                                            // 更新当前用户信息
                                            const currentUserStr = localStorage.getItem('currentUser');
                                            if (currentUserStr) {
                                                const currentUser = JSON.parse(currentUserStr);
                                                if (volunteer && currentUser.id === volunteer.id) {
                                                    localStorage.setItem('currentUser', JSON.stringify(volunteer));
                                                } else if (blindUser && currentUser.id === blindUser.id) {
                                                    localStorage.setItem('currentUser', JSON.stringify(blindUser));
                                                }
                                            }

                                            alert('审核通过！\n志愿者获得 20 积分\n盲人获得 10 积分\n' +
                                                  (streakMessages.length > 0 ? '\n' + streakMessages.join('\n') : ''));

                                            // 刷新页面数据
                                            if (typeof loadHistory === 'function') {
                                                loadHistory();
                                            }
                                        });
                                });
                        });
                    });
            });
        })
        .catch(error => {
            console.error('审核运动记录错误:', error);
            alert('审核失败，请稍后重试');
        });
}

// 覆盖志愿者接单页面加载函数，使用API
function loadVolunteerRequests() {
    const container = document.getElementById('volunteer-requests-list');

    fetch('/api/requests')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取需求列表失败:', data.message);
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <div>加载失败</div>
                    </div>
                `;
                return;
            }

            // 只显示待接单的需求
            const requests = data.data.filter(r => r.status === 'pending');

            if (requests.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">✅</div>
                        <div>暂无待接单需求</div>
                        <div style="font-size: 14px; margin-top: 10px;">
                            所有需求都已被接单
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = requests.map(req => `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <strong style="font-size: 18px;">${req.userName}</strong>
                            ${req.userType === 'blind' ? '<span class="tag tag-certified">视障用户</span>' : ''}
                            ${req.age ? `<span style="color: #666; font-size: 14px; margin-left: 8px;">${req.age}岁</span>` : ''}
                        </div>
                        <span class="tag tag-pending">等待接单</span>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <span class="tag tag-running">
                            ${req.type || '活动'}
                        </span>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <strong>📍 ${req.locationTypeText || '地点'}：</strong>${req.location}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>🕐 时间：</strong>${req.time}
                    </div>
                    ${req.phone ? `<div style="margin-bottom: 8px;">
                        <strong>📱 联系电话：</strong><a href="tel:${req.phone}" style="color: #667eea; text-decoration: none; font-weight: 600;">${req.phone}</a>
                    </div>` : ''}
                    <div style="margin-bottom: 15px; color: #666;">
                        ${req.description}
                    </div>

                    <div style="font-size: 12px; color: #999; margin-bottom: 15px;">
                        发布于 ${formatTime(req.createdAt)}
                    </div>

                    <button class="btn btn-success btn-block" onclick="acceptRequest('${req.id}')">
                        接单并联系
                    </button>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('获取志愿者接单列表错误:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">❌</div>
                    <div>加载失败</div>
                </div>
            `;
        });
}

// 覆盖志愿者排行榜加载函数，使用API - 显示今日助跑距离排名
function loadVolunteersRatings() {
    const container = document.getElementById('volunteers-ratings-list');

    // 并行获取用户和运动记录数据
    Promise.all([
        fetch('/api/users').then(response => response.json()),
        fetch('/api/exercise-records').then(response => response.json())
    ])
    .then(([usersData, exerciseData]) => {
        if (!usersData.success || !exerciseData.success) {
            console.error('获取数据失败');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">❌</div>
                    <div>加载失败</div>
                </div>
            `;
            return;
        }

        const users = usersData.data;
        const exerciseRecords = exerciseData.data;

        // 获取今日日期
        const today = new Date().toISOString().split('T')[0];

        // 计算每个用户今日的助跑距离
        const usersWithDistance = users.map(user => {
            // 找到该用户今日已通过的运动记录
            const todayRecords = exerciseRecords.filter(record => {
                const recordDate = new Date(record.submittedAt).toISOString().split('T')[0];
                return recordDate === today &&
                       record.status === 'approved' &&
                       record.submittedBy === user.username;
            });

            // 计算总距离
            const totalDistance = todayRecords.reduce((sum, record) => sum + (record.distance || 0), 0);

            return {
                ...user,
                todayDistance: totalDistance,
                todayRecordsCount: todayRecords.length
            };
        });

        // 分离盲人和志愿者
        const blindUsers = usersWithDistance.filter(u => u.type === 'blind');
        const volunteers = usersWithDistance.filter(u => u.type === 'volunteer');

        // 分别排序
        blindUsers.sort((a, b) => b.todayDistance - a.todayDistance);
        volunteers.sort((a, b) => b.todayDistance - a.todayDistance);

        // 计算并列排名
        const calculateRanks = (usersList) => {
            let currentRank = 1;
            let previousDistance = null;
            let sameRankCount = 0;

            usersList.forEach((user, index) => {
                if (index === 0) {
                    user.rank = 1;
                    previousDistance = user.todayDistance;
                    sameRankCount = 1;
                } else if (user.todayDistance === previousDistance) {
                    user.rank = currentRank;
                    sameRankCount++;
                } else {
                    currentRank += sameRankCount;
                    user.rank = currentRank;
                    previousDistance = user.todayDistance;
                    sameRankCount = 1;
                }
            });
        };

        // 为盲人和志愿者计算排名
        calculateRanks(blindUsers);
        calculateRanks(volunteers);

        // 生成排行榜HTML的函数
        const generateRankingHTML = (usersList, title, emptyIcon) => {
            if (usersList.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="icon">${emptyIcon}</div>
                        <div>暂无${title}用户</div>
                    </div>
                `;
            }

            // 显示前999位
            const topUsers = usersList.slice(0, 999);

            return topUsers.map((user) => {
                const rank = user.rank;
                const displayRank = rank > 999 ? '999+' : rank;
                const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

                return `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-size: 36px; min-width: 50px; text-align: center;">
                                ${rankEmoji || `#${displayRank}`}
                            </div>
                            <div>
                                <strong style="font-size: 20px;">${user.username}</strong>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 32px; font-weight: 600; color: #667eea;">
                                ${user.todayDistance.toFixed(1)}
                            </div>
                            <div style="font-size: 14px; color: #999;">公里</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: 600; color: #fa8c16;">${user.todayRecordsCount}</div>
                            <div style="font-size: 14px; color: #666;">今日次数</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: 600; color: #52c41a;">${user.points || 0}</div>
                            <div style="font-size: 14px; color: #666;">总积分</div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        };

        // 显示两个排行榜
        container.innerHTML = `
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 24px; margin-bottom: 20px; color: #333;">
                    🤝 志愿者助跑排行榜
                </h3>
                ${generateRankingHTML(volunteers, '志愿者', '💪')}
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 24px; margin-bottom: 20px; color: #333;">
                    👤 盲人助跑排行榜
                </h3>
                ${generateRankingHTML(blindUsers, '盲人', '🏃')}
            </div>
        `;
    })
    .catch(error => {
        console.error('获取排行榜错误:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">❌</div>
                <div>加载失败</div>
            </div>
        `;
    });
}

// 覆盖历史记录加载函数，使用API
function loadHistory() {
    const container = document.getElementById('history-list');
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    fetch('/api/history')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取历史记录失败:', data.message);
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <div>加载失败</div>
                    </div>
                `;
                return;
            }

            const history = data.data;

            if (history.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📝</div>
                        <div>暂无陪跑记录</div>
                        <div style="font-size: 14px; margin-top: 10px;">
                            完成陪跑后会在这里显示记录
                        </div>
                    </div>
                `;
                return;
            }

            container.innerHTML = history.map(record => {
                const hasFeedback = record.feedback && record.feedback.rating;
                const isBlindUser = currentUser && currentUser.type === 'blind' && currentUser.username === record.userName;

                return `
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <strong style="font-size: 18px;">陪跑记录</strong>
                        </div>
                        <span class="tag tag-${record.status}">
                            ${record.status === 'matched' ? '已匹配' : '已完成'}
                        </span>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <span class="tag tag-running">
                            ${record.type || '活动'}
                        </span>
                    </div>

                    <div style="margin-bottom: 8px;">
                        <strong>👤 视障用户：</strong>${record.userName}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>💪 志愿者：</strong>${record.volunteerName}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>📍 地点：</strong>${record.location}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>🕐 时间：</strong>${record.time}
                    </div>

                    ${hasFeedback ? `
                        <div style="margin-top: 15px; padding: 15px; background: #f6ffed; border-radius: 8px; border-left: 4px solid #52c41a;">
                            <div style="margin-bottom: 8px;">
                                <strong>⭐ 评分：</strong>
                                ${'⭐'.repeat(record.feedback.rating)}
                                <span style="color: #666;">(${record.feedback.rating}/5)</span>
                            </div>
                            ${record.feedback.comment ? `
                                <div style="margin-bottom: 8px;">
                                    <strong>💬 评价：</strong>${record.feedback.comment}
                                </div>
                            ` : ''}
                            <div style="font-size: 12px; color: #999;">
                                评价于 ${formatTime(record.feedback.createdAt)}
                            </div>
                        </div>
                    ` : ''}

                    <div style="font-size: 12px; color: #999; margin-top: 15px;">
                        记录于 ${formatTime(record.createdAt)}
                    </div>

                    ${record.status === 'matched' && isBlindUser ? `
                        <button class="btn btn-success btn-block" style="margin-top: 15px;"
                                onclick="completeRecord('${record.id}')">
                            标记为已完成
                        </button>
                    ` : ''}

                    ${record.status === 'completed' && isBlindUser && !hasFeedback ? `
                        <button class="btn btn-primary btn-block" style="margin-top: 15px;"
                                onclick="showFeedbackForm('${record.id}')">
                            ⭐ 评价志愿者
                        </button>
                    ` : ''}
                </div>
            `;
            }).join('');
        })
        .catch(error => {
            console.error('获取历史记录错误:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">❌</div>
                    <div>加载失败</div>
                </div>
            `;
        });
}

// 覆盖地图标记加载函数，使用API
function loadMapMarkers() {
    if (!map) return;

    // 清除现有标记
    markers.forEach(marker => marker.remove());
    markers = [];

    // 从API获取需求数据
    fetch('/api/requests')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取地图标记数据失败:', data.message);
                return;
            }

            const requests = data.data;

            // 为每个需求添加标记
            requests.forEach(req => {
                // 模拟坐标（实际应用中应该从需求中获取真实坐标）
                const lat = 31.2304 + (Math.random() - 0.5) * 0.1;
                const lng = 121.4737 + (Math.random() - 0.5) * 0.1;

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${req.status === 'pending' ? '#fa8c16' : '#52c41a'};
                                       color: white;
                                       padding: 8px 12px;
                                       border-radius: 20px;
                                       font-size: 14px;
                                       font-weight: 600;
                                       box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                       white-space: nowrap;">
                            ${req.type === 'running' ? '🏃' : req.type === 'walking' ? '🚶' : '🚌'}
                            ${req.userName}
                           </div>`,
                    iconSize: [120, 40],
                    iconAnchor: [60, 40]
                });

                const marker = L.marker([lat, lng], {icon: icon}).addTo(map);

                // 添加弹窗
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <strong style="font-size: 16px;">${req.userName}</strong>
                        ${req.age ? `<span style="color: #666; font-size: 14px;"> (${req.age}岁)</span>` : ''}<br>
                        <span style="color: #666;">
                            ${req.type || '活动'}
                        </span><br>
                        <strong>📍 ${req.locationTypeText || '地点'}：</strong> ${req.location}<br>
                        <strong>🕐</strong> ${req.time}<br>
                        ${req.phone ? `<strong>📱</strong> <a href="tel:${req.phone}" style="color: #667eea;">${req.phone}</a><br>` : ''}
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                            ${req.description}
                        </div>
                        <div style="margin-top: 10px;">
                            <span style="padding: 4px 8px; background: ${req.status === 'pending' ? '#fff7e6' : '#f6ffed'};
                                         color: ${req.status === 'pending' ? '#fa8c16' : '#52c41a'};
                                         border-radius: 4px; font-size: 12px;">
                                ${req.status === 'pending' ? '等待接单' : '已匹配'}
                            </span>
                        </div>
                    </div>
                `);

                markers.push(marker);
            });
        })
        .catch(error => {
            console.error('获取地图标记错误:', error);
        });
}

// 加载每月排行榜
function loadMonthlyRanking() {
    fetch('/api/daily-stats')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取每月排行榜失败:', data.message);
                return;
            }

            // 过滤本月的数据（有month字段的）
            const monthlyStats = data.data.filter(stat => stat.month);

            // 获取最新的一月数据
            if (monthlyStats.length > 0) {
                const latestMonth = monthlyStats[monthlyStats.length - 1].month;
                const latestMonthStats = monthlyStats.filter(stat => stat.month === latestMonth);
                latestMonthStats.sort((a, b) => a.rank - b.rank);
                displayMonthlyRanking(latestMonthStats, latestMonth);
            } else {
                displayMonthlyRanking([], null);
            }
        })
        .catch(error => {
            console.error('获取每月排行榜错误:', error);
        });
}

// 加载每周排行榜
function loadWeeklyRanking() {
    fetch('/api/daily-stats')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取每周排行榜失败:', data.message);
                return;
            }

            // 过滤本周的数据（有week字段的）
            const weeklyStats = data.data.filter(stat => stat.week);

            // 获取最新的一周数据
            if (weeklyStats.length > 0) {
                const latestWeek = weeklyStats[weeklyStats.length - 1].week;
                const latestWeekStats = weeklyStats.filter(stat => stat.week === latestWeek);
                latestWeekStats.sort((a, b) => a.rank - b.rank);
                displayWeeklyRanking(latestWeekStats, latestWeek);
            } else {
                displayWeeklyRanking([], null);
            }
        })
        .catch(error => {
            console.error('获取每周排行榜错误:', error);
        });
}

// 加载每日排行榜
function loadDailyRanking() {
    const today = new Date().toISOString().split('T')[0];

    fetch('/api/daily-stats')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('获取每日排行榜失败:', data.message);
                return;
            }

            // 过滤今天的数据
            const todayStats = data.data.filter(stat => stat.date === today);

            // 按排名排序
            todayStats.sort((a, b) => a.rank - b.rank);

            // 显示在页面上
            displayDailyRanking(todayStats, today);
        })
        .catch(error => {
            console.error('获取每日排行榜错误:', error);
        });
}

// 显示每日排行榜
function displayDailyRanking(stats, date) {
    // 查找排行榜容器
    const container = document.getElementById('volunteers-ratings-list');
    if (!container) return;

    // 在排行榜顶部添加每日排行榜区域
    let dailySection = document.getElementById('daily-ranking-section');
    if (!dailySection) {
        dailySection = document.createElement('div');
        dailySection.id = 'daily-ranking-section';
        dailySection.style.marginBottom = '30px';
        container.parentNode.insertBefore(dailySection, container);
    }

    if (stats.length === 0) {
        dailySection.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">🏆 今日助跑排行榜</h3>
                <p style="margin: 0; opacity: 0.9;">今天还没有结算数据</p>
                <button onclick="settleDailyRanking()"
                        style="margin-top: 15px; padding: 10px 20px; background: white;
                               color: #667eea; border: none; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🎯 结算今日排名
                </button>
            </div>
        `;
        return;
    }

    // 分离盲人和志愿者数据
    const blindStats = stats.filter(s => s.type === 'blind');
    const volunteerStats = stats.filter(s => s.type === 'volunteer');

    const renderRankingList = (statsList, title, gradient) => {
        if (statsList.length === 0) {
            return `<p style="margin: 10px 0; opacity: 0.8;">暂无数据</p>`;
        }
        return `
            <div style="background: ${gradient}; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h4>
                <div>
                    ${statsList.slice(0, 10).map(stat => `
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                    padding: 10px; background: rgba(255,255,255,0.1);
                                    border-radius: 8px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 24px; min-width: 40px;">
                                    ${stat.rank === 1 ? '🥇' : stat.rank === 2 ? '🥈' : stat.rank === 3 ? '🥉' : `#${stat.rank}`}
                                </span>
                                <div>
                                    <div style="font-weight: 600; font-size: 16px;">${stat.username}</div>
                                    <div style="font-size: 12px; opacity: 0.8;">完成 ${stat.count} 次</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 20px; font-weight: 700;">+${stat.points}</div>
                                <div style="font-size: 12px; opacity: 0.8;">积分</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    dailySection.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 20px;">🏆 今日助跑排行榜 (${date})</h3>
                <button onclick="settleDailyRanking()"
                        style="padding: 8px 16px; background: rgba(255,255,255,0.2);
                               color: white; border: 1px solid white; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🔄 重新结算
                </button>
            </div>
            ${renderRankingList(blindStats, '👤 盲人排行榜', 'rgba(255,255,255,0.15)')}
            ${renderRankingList(volunteerStats, '🤝 志愿者排行榜', 'rgba(255,255,255,0.15)')}
        </div>
    `;
}

// 触发每日结算
function settleDailyRanking() {
    if (!confirm('确定要结算今日排名吗？这将根据今天完成的陪跑次数分配积分。')) {
        return;
    }

    fetch('/api/daily-stats/settle', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`结算成功！\n日期：${data.date}\n参与用户：${data.totalUsers}人`);
            // 刷新排行榜
            if (typeof loadVolunteersRatings === 'function') {
                loadVolunteersRatings();
            }
            if (typeof loadDailyRanking === 'function') {
                loadDailyRanking();
            }
        } else {
            alert('结算失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('结算错误:', error);
        alert('结算失败，请稍后重试');
    });
}

// 显示每周排行榜
function displayWeeklyRanking(stats, week) {
    const container = document.getElementById('volunteers-ratings-list');
    if (!container) return;

    let weeklySection = document.getElementById('weekly-ranking-section');
    if (!weeklySection) {
        weeklySection = document.createElement('div');
        weeklySection.id = 'weekly-ranking-section';
        weeklySection.style.marginBottom = '30px';

        const dailySection = document.getElementById('daily-ranking-section');
        if (dailySection) {
            dailySection.parentNode.insertBefore(weeklySection, dailySection.nextSibling);
        } else {
            container.parentNode.insertBefore(weeklySection, container);
        }
    }

    if (stats.length === 0) {
        weeklySection.innerHTML = `
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">📅 本周助跑排行榜</h3>
                <p style="margin: 0; opacity: 0.9;">本周还没有结算数据</p>
                <button onclick="settleWeeklyRanking()"
                        style="margin-top: 15px; padding: 10px 20px; background: white;
                               color: #f5576c; border: none; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🎯 结算本周排名
                </button>
            </div>
        `;
        return;
    }

    // 分离盲人和志愿者数据
    const blindStats = stats.filter(s => s.type === 'blind');
    const volunteerStats = stats.filter(s => s.type === 'volunteer');

    const renderRankingList = (statsList, title, gradient) => {
        if (statsList.length === 0) {
            return `<p style="margin: 10px 0; opacity: 0.8;">暂无数据</p>`;
        }
        return `
            <div style="background: ${gradient}; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h4>
                <div>
                    ${statsList.slice(0, 10).map(stat => `
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                    padding: 10px; background: rgba(255,255,255,0.1);
                                    border-radius: 8px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 24px; min-width: 40px;">
                                    ${stat.rank === 1 ? '🥇' : stat.rank === 2 ? '🥈' : stat.rank === 3 ? '🥉' : `#${stat.rank}`}
                                </span>
                                <div>
                                    <div style="font-weight: 600; font-size: 16px;">${stat.username}</div>
                                    <div style="font-size: 12px; opacity: 0.8;">完成 ${stat.count} 次</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 20px; font-weight: 700;">+${stat.points}</div>
                                <div style="font-size: 12px; opacity: 0.8;">积分</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    weeklySection.innerHTML = `
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 20px;">📅 本周助跑排行榜 (${week})</h3>
                <button onclick="settleWeeklyRanking()"
                        style="padding: 8px 16px; background: rgba(255,255,255,0.2);
                               color: white; border: 1px solid white; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🔄 重新结算
                </button>
            </div>
            ${renderRankingList(blindStats, '👤 盲人排行榜', 'rgba(255,255,255,0.15)')}
            ${renderRankingList(volunteerStats, '🤝 志愿者排行榜', 'rgba(255,255,255,0.15)')}
        </div>
    `;
}

// 触发每周结算
function settleWeeklyRanking() {
    if (!confirm('确定要结算本周排名吗？这将根据本周完成的陪跑次数分配积分。')) {
        return;
    }

    fetch('/api/weekly-stats/settle', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`结算成功！\n周期：${data.week}\n参与用户：${data.totalUsers}人`);
            if (typeof loadWeeklyRanking === 'function') {
                loadWeeklyRanking();
            }
            if (typeof loadVolunteersRatings === 'function') {
                loadVolunteersRatings();
            }
        } else {
            alert('结算失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('结算错误:', error);
        alert('结算失败，请稍后重试');
    });
}

// 显示每月排行榜
function displayMonthlyRanking(stats, month) {
    const container = document.getElementById('volunteers-ratings-list');
    if (!container) return;

    let monthlySection = document.getElementById('monthly-ranking-section');
    if (!monthlySection) {
        monthlySection = document.createElement('div');
        monthlySection.id = 'monthly-ranking-section';
        monthlySection.style.marginBottom = '30px';

        const weeklySection = document.getElementById('weekly-ranking-section');
        if (weeklySection) {
            weeklySection.parentNode.insertBefore(monthlySection, weeklySection.nextSibling);
        } else {
            const dailySection = document.getElementById('daily-ranking-section');
            if (dailySection) {
                dailySection.parentNode.insertBefore(monthlySection, dailySection.nextSibling);
            } else {
                container.parentNode.insertBefore(monthlySection, container);
            }
        }
    }

    if (stats.length === 0) {
        monthlySection.innerHTML = `
            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                        padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">📆 本月助跑排行榜</h3>
                <p style="margin: 0; opacity: 0.9;">本月还没有结算数据</p>
                <button onclick="settleMonthlyRanking()"
                        style="margin-top: 15px; padding: 10px 20px; background: white;
                               color: #fa709a; border: none; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🎯 结算本月排名
                </button>
            </div>
        `;
        return;
    }

    // 分离盲人和志愿者数据
    const blindStats = stats.filter(s => s.type === 'blind');
    const volunteerStats = stats.filter(s => s.type === 'volunteer');

    const renderRankingList = (statsList, title, gradient) => {
        if (statsList.length === 0) {
            return `<p style="margin: 10px 0; opacity: 0.8;">暂无数据</p>`;
        }
        return `
            <div style="background: ${gradient}; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h4>
                <div>
                    ${statsList.slice(0, 10).map(stat => `
                        <div style="display: flex; justify-content: space-between; align-items: center;
                                    padding: 10px; background: rgba(255,255,255,0.1);
                                    border-radius: 8px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 24px; min-width: 40px;">
                                    ${stat.rank === 1 ? '🥇' : stat.rank === 2 ? '🥈' : stat.rank === 3 ? '🥉' : `#${stat.rank}`}
                                </span>
                                <div>
                                    <div style="font-weight: 600; font-size: 16px;">${stat.username}</div>
                                    <div style="font-size: 12px; opacity: 0.8;">完成 ${stat.count} 次</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 20px; font-weight: 700;">+${stat.points}</div>
                                <div style="font-size: 12px; opacity: 0.8;">积分</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    monthlySection.innerHTML = `
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    padding: 20px; border-radius: 15px; color: white; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 20px;">📆 本月助跑排行榜 (${month})</h3>
                <button onclick="settleMonthlyRanking()"
                        style="padding: 8px 16px; background: rgba(255,255,255,0.2);
                               color: white; border: 1px solid white; border-radius: 8px;
                               font-weight: 600; cursor: pointer;">
                    🔄 重新结算
                </button>
            </div>
            ${renderRankingList(blindStats, '👤 盲人排行榜', 'rgba(255,255,255,0.15)')}
            ${renderRankingList(volunteerStats, '🤝 志愿者排行榜', 'rgba(255,255,255,0.15)')}
        </div>
    `;
}

// 触发每月结算
function settleMonthlyRanking() {
    if (!confirm('确定要结算本月排名吗？这将根据本月完成的陪跑次数分配积分。')) {
        return;
    }

    fetch('/api/monthly-stats/settle', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`结算成功！\n月份：${data.month}\n参与用户：${data.totalUsers}人`);
            if (typeof loadMonthlyRanking === 'function') {
                loadMonthlyRanking();
            }
            if (typeof loadVolunteersRatings === 'function') {
                loadVolunteersRatings();
            }
        } else {
            alert('结算失败：' + (data.message || '未知错误'));
        }
    })
    .catch(error => {
        console.error('结算错误:', error);
        alert('结算失败，请稍后重试');
    });
}

// 页面加载时自动加载排行榜
console.log('API集成已完成：所有关键函数已覆盖，包括志愿者接单页面、排行榜、历史记录和地图标记');

// 覆盖个人中心的积分排行榜函数，使用API
function showLeaderboard() {
    // 并行获取用户和运动记录数据
    Promise.all([
        fetch('/api/users').then(response => response.json()),
        fetch('/api/exercise-records').then(response => response.json())
    ])
    .then(([usersData, exerciseData]) => {
        if (!usersData.success || !exerciseData.success) {
            alert('获取排行榜数据失败');
            return;
        }

        const users = usersData.data;
        const exerciseRecords = exerciseData.data;

        if (users.length === 0) {
            alert('暂无用户数据');
            return;
        }

        // 计算盲人和志愿者的不同时间段排行榜
        const blindDailyRanking = calculateRankingFromAPI(users, exerciseRecords, 'daily', 'blind');
        const blindWeeklyRanking = calculateRankingFromAPI(users, exerciseRecords, 'weekly', 'blind');
        const blindMonthlyRanking = calculateRankingFromAPI(users, exerciseRecords, 'monthly', 'blind');

        const volunteerDailyRanking = calculateRankingFromAPI(users, exerciseRecords, 'daily', 'volunteer');
        const volunteerWeeklyRanking = calculateRankingFromAPI(users, exerciseRecords, 'weekly', 'volunteer');
        const volunteerMonthlyRanking = calculateRankingFromAPI(users, exerciseRecords, 'monthly', 'volunteer');

        // 创建模态框
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
            <div style="background: white; border-radius: 20px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; color: #333;">🏆 助跑排行榜</h2>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">×</button>
                </div>

                <!-- 排名规则说明 -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; color: white;">
                    <div style="font-weight: 600; margin-bottom: 8px;">📋 排名规则</div>
                    <div style="font-size: 14px; line-height: 1.6; opacity: 0.95;">
                        • 按助跑距离排名，显示前999位<br>
                        • 超过999位显示为999+<br>
                        • 🥇第一名：金牌 | 🥈第二名：银牌 | 🥉第三名：铜牌<br>
                        • 每日/每周/每月独立排名
                    </div>
                </div>

                <!-- 用户类型切换标签 -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="user-type-tab active" data-type="blind" style="flex: 1; padding: 12px; border: 2px solid #667eea; background: #667eea; color: white; cursor: pointer; font-weight: 600; border-radius: 8px;">
                        👁️ 盲人榜
                    </button>
                    <button class="user-type-tab" data-type="volunteer" style="flex: 1; padding: 12px; border: 2px solid #667eea; background: white; color: #667eea; cursor: pointer; font-weight: 600; border-radius: 8px;">
                        💪 志愿者榜
                    </button>
                </div>

                <!-- 时间段切换标签 -->
                <div style="display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0;">
                    <button class="ranking-tab active" data-period="daily" style="flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-weight: 600; color: #667eea; border-bottom: 3px solid #667eea;">
                        📅 今日
                    </button>
                    <button class="ranking-tab" data-period="weekly" style="flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-weight: 600; color: #999; border-bottom: 3px solid transparent;">
                        📊 本周
                    </button>
                    <button class="ranking-tab" data-period="monthly" style="flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-weight: 600; color: #999; border-bottom: 3px solid transparent;">
                        📈 本月
                    </button>
                </div>

                <!-- 盲人排行榜 -->
                <div id="blindRankings" class="user-type-content" style="display: block;">
                    <div id="blindDailyRanking" class="ranking-content" style="display: block;">
                        ${generateRankingHTMLFromAPI(blindDailyRanking, '今日')}
                    </div>
                    <div id="blindWeeklyRanking" class="ranking-content" style="display: none;">
                        ${generateRankingHTMLFromAPI(blindWeeklyRanking, '本周')}
                    </div>
                    <div id="blindMonthlyRanking" class="ranking-content" style="display: none;">
                        ${generateRankingHTMLFromAPI(blindMonthlyRanking, '本月')}
                    </div>
                </div>

                <!-- 志愿者排行榜 -->
                <div id="volunteerRankings" class="user-type-content" style="display: none;">
                    <div id="volunteerDailyRanking" class="ranking-content" style="display: block;">
                        ${generateRankingHTMLFromAPI(volunteerDailyRanking, '今日')}
                    </div>
                    <div id="volunteerWeeklyRanking" class="ranking-content" style="display: none;">
                        ${generateRankingHTMLFromAPI(volunteerWeeklyRanking, '本周')}
                    </div>
                    <div id="volunteerMonthlyRanking" class="ranking-content" style="display: none;">
                        ${generateRankingHTMLFromAPI(volunteerMonthlyRanking, '本月')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置用户类型标签切换事件
        const userTypeTabs = modal.querySelectorAll('.user-type-tab');
        userTypeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有active类
                userTypeTabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'white';
                    t.style.color = '#667eea';
                });

                // 添加active类到当前标签
                tab.classList.add('active');
                tab.style.background = '#667eea';
                tab.style.color = 'white';

                // 隐藏所有用户类型内容
                modal.querySelectorAll('.user-type-content').forEach(content => {
                    content.style.display = 'none';
                });

                // 显示对应的用户类型排行榜
                const userType = tab.dataset.type;
                modal.querySelector(`#${userType}Rankings`).style.display = 'block';
            });
        });

        // 设置时间段标签切换事件
        const tabs = modal.querySelectorAll('.ranking-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有active类
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.color = '#999';
                    t.style.borderBottom = '3px solid transparent';
                });

                // 添加active类到当前标签
                tab.classList.add('active');
                tab.style.color = '#667eea';
                tab.style.borderBottom = '3px solid #667eea';

                // 获取当前选中的用户类型
                const activeUserType = modal.querySelector('.user-type-tab.active').dataset.type;
                const period = tab.dataset.period;

                // 隐藏当前用户类型下的所有时间段内容
                modal.querySelectorAll(`#${activeUserType}Rankings .ranking-content`).forEach(content => {
                    content.style.display = 'none';
                });

                // 显示对应的排行榜
                const capitalizedPeriod = period.charAt(0).toUpperCase() + period.slice(1);
                modal.querySelector(`#${activeUserType}${capitalizedPeriod}Ranking`).style.display = 'block';
            });
        });

        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    })
    .catch(error => {
        console.error('获取排行榜错误:', error);
        alert('加载排行榜失败，请稍后重试');
    });
}

// 计算排行榜（从API数据）
function calculateRankingFromAPI(users, exerciseRecords, period, userType) {
    const now = new Date();
    let startTime;

    // 计算时间范围
    if (period === 'daily') {
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
    } else if (period === 'monthly') {
        startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    // 计算每个用户在时间范围内的助跑距离
    const rankings = users
        .filter(user => user.type === userType)
        .map(user => {
            let periodDistance = 0;

            exerciseRecords.forEach(record => {
                if (record.status !== 'approved') return;

                const recordDate = new Date(record.submittedAt || record.createdAt);
                if (recordDate >= startTime && recordDate <= now) {
                    if (record.submittedBy === user.username) {
                        periodDistance += parseFloat(record.distance) || 0;
                    }
                }
            });

            return {
                username: user.username || user.name,
                type: user.type,
                periodDistance: periodDistance,
                totalPoints: user.points || 0
            };
        });

    // 按时间段距离降序排序
    rankings.sort((a, b) => b.periodDistance - a.periodDistance);

    return rankings;
}

// 生成排行榜HTML（从API数据）
function generateRankingHTMLFromAPI(rankings, periodName) {
    if (rankings.length === 0) {
        return `
            <div style="text-align: center; color: #999; padding: 60px 20px; font-style: italic;">
                <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                <div>${periodName}暂无用户</div>
            </div>
        `;
    }

    // 计算并列排名
    let currentRank = 1;
    let previousDistance = null;
    let sameRankCount = 0;

    rankings.forEach((user, index) => {
        if (index === 0) {
            user.rank = 1;
            previousDistance = user.periodDistance;
            sameRankCount = 1;
        } else if (user.periodDistance === previousDistance) {
            user.rank = currentRank;
            sameRankCount++;
        } else {
            currentRank += sameRankCount;
            user.rank = currentRank;
            previousDistance = user.periodDistance;
            sameRankCount = 1;
        }
    });

    // 显示前999位
    const topRankings = rankings.slice(0, 999);

    return topRankings.map((user) => {
        const rank = user.rank;
        const displayRank = rank > 999 ? '999+' : rank;
        let rankIcon = '';
        let rankColor = '#666';
        let bgColor = 'white';

        // 前三名特殊样式
        if (rank === 1) {
            rankIcon = '🥇';
            rankColor = '#FFD700';
            bgColor = '#FFF9E6';
        } else if (rank === 2) {
            rankIcon = '🥈';
            rankColor = '#C0C0C0';
            bgColor = '#F5F5F5';
        } else if (rank === 3) {
            rankIcon = '🥉';
            rankColor = '#CD7F32';
            bgColor = '#FFF5EE';
        }

        const typeText = user.type === 'blind' ? '盲人' : '志愿者';
        const typeBadgeColor = user.type === 'blind' ? '#1976d2' : '#7b1fa2';
        const typeBadgeBg = user.type === 'blind' ? '#e3f2fd' : '#f3e5f5';

        return `
            <div style="background: ${bgColor}; border-radius: 12px; padding: 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                        <div style="font-size: 32px; font-weight: 700; color: ${rankColor}; min-width: 50px; text-align: center;">
                            ${rankIcon || displayRank}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 5px;">
                                ${user.username}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; background: ${typeBadgeBg}; color: ${typeBadgeColor};">
                                    ${typeText}
                                </span>
                                <span style="font-size: 13px; color: #999;">
                                    总积分: ${user.totalPoints}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 28px; font-weight: 700; color: #667eea;">
                            ${user.periodDistance.toFixed(2)}
                        </div>
                        <div style="font-size: 12px; color: #999;">
                            ${periodName}助跑(km)
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
