# 盲人陪跑应用 (Next.js 版本)

## 部署到 Netlify

### 1. 推送到 GitHub
```bash
cd blind-companion-next
git init
git add .
git commit -m "Initial commit"
# 创建 GitHub 仓库并推送
```

### 2. 连接 Netlify
1. 访问 [Netlify](https://netlify.com) 并登录
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub 并选择blind-companion-next仓库
4. Netlify 会自动检测 Next.js 项目并配置构建命令

### 3. 配置环境变量
在 Netlify 项目设置中添加：
- 无需额外环境变量（使用文件系统存储）

### 4. 部署
点击 "Deploy site" 等待构建完成

## 本地开发

```bash
cd blind-companion-next
npm install
npm run dev
```

访问 http://localhost:3000

## 官方测试账号
- 用户名：`官方审核员`
- 密码：`10280613xrldyf`

## 功能模块
- 👤 用户注册/登录
- 📋 发布/接收陪跑需求
- 🏃 记录陪跑数据
- ✅ 官方审核
- 🏆 排行榜
- 🛒 积分商城
- 🏅 赛事活动
