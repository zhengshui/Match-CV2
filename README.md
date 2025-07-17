# Match-CV2 - AI简历匹配系统

Match-CV2 是一个基于人工智能的智能招聘工具，通过自动化简历分析和候选人-职位匹配，提高早期招聘阶段的效率。

## 项目特色

### 🎯 核心功能
- **智能简历解析**：支持PDF、Word、文本格式简历的结构化信息提取
- **AI驱动匹配**：多维度评分引擎，提供详细匹配解释
- **智能筛选**：批量处理，优先级推荐和淘汰建议
- **自动标签**：智能候选人标签和决策支持
- **自定义评分**：企业可配置的评估策略

### 🚀 技术优势
- 高精度的简历信息抽取
- 语义化的职位-候选人匹配
- 批量处理大规模候选人数据
- 实时评分和排序功能

## 技术栈

- **前端框架**：Next.js 15 (App Router)
- **身份认证**：NextAuth.js 5.0
- **编程语言**：TypeScript (严格模式)
- **样式框架**：Tailwind CSS 4.0
- **数据库**：计划集成 Prisma/Drizzle ORM
- **AI集成**：OpenAI/Claude API

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境变量配置
创建 `.env.local` 文件并配置以下变量：
```env
AUTH_SECRET=your-auth-secret
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-key
UPLOAD_SECRET=your-upload-secret
```

### 开发命令
```bash
# 启动开发服务器
npm run dev --turbo

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run check          # 运行 lint 和 typecheck
npm run lint           # ESLint 检查
npm run typecheck      # TypeScript 类型检查

# 代码格式化
npm run format:check   # 检查格式
npm run format:write   # 应用格式化
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── auth/          # 身份认证
│   ├── dashboard/         # 主应用面板
│   ├── auth/             # 认证页面
│   └── layout.tsx        # 根布局
├── components/           # 可复用 UI 组件
│   ├── ui/              # 基础 UI 组件
│   ├── forms/           # 表单组件
│   └── charts/          # 数据可视化
├── lib/                 # 工具函数和配置
│   ├── auth.ts          # 认证工具
│   ├── db.ts           # 数据库连接
│   ├── ai.ts           # AI 服务集成
│   └── utils.ts        # 通用工具
├── server/             # 服务端逻辑
│   ├── auth/           # 认证配置
│   ├── api/            # API 层
│   └── services/       # 业务逻辑服务
├── types/              # TypeScript 类型定义
└── styles/             # 全局样式
```

## 主要功能模块

### 📄 简历处理
- 多格式文件上传支持
- AI驱动的文本提取和结构化
- 技能、经验、教育背景自动识别

### 🎯 智能匹配
- 语义化职位描述分析
- 多维度候选人评分
- 匹配度解释和建议

### 📊 数据分析
- 候选人池分析
- 匹配趋势统计
- 招聘效率报告

### 🔧 系统管理
- 用户权限管理
- 评分策略配置
- 数据导入导出

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

项目维护者：[您的姓名]
邮箱：[您的邮箱]

---

*基于 [T3 Stack](https://create.t3.gg/) 构建*
