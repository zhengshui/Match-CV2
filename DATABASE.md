# 数据库配置说明

## 概述
这个项目使用PostgreSQL作为数据库，通过Docker容器运行。为了与其他项目共享数据库容器，我们使用以下配置：

- **容器名称**: `match-cv-postgres`
- **数据库名称**: `match_cv2`
- **用户名**: `admin`
- **密码**: `password`
- **端口**: `5432`

## 快速开始

### 1. 启动数据库
```bash
./db.sh start
```

### 2. 运行数据库迁移
```bash
./db.sh migrate
```

### 3. 填充初始数据（可选）
```bash
./db.sh seed
```

## 数据库管理命令

### 基础操作
- `./db.sh start` - 启动PostgreSQL数据库
- `./db.sh stop` - 停止PostgreSQL数据库
- `./db.sh restart` - 重启PostgreSQL数据库
- `./db.sh status` - 查看数据库状态

### 开发操作
- `./db.sh migrate` - 运行数据库迁移
- `./db.sh seed` - 填充初始数据
- `./db.sh reset` - 重置数据库（⚠️ 会删除所有数据）

### 调试和管理
- `./db.sh psql` - 连接到数据库（命令行）
- `./db.sh adminer` - 连接到数据库（命令行）
- `./db.sh logs` - 查看数据库日志

## 环境变量

确保 `.env.local` 文件中包含正确的数据库连接字符串：

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv2
```

## 共享数据库容器

如果你有其他项目需要使用相同的PostgreSQL容器，可以：

1. 确保容器名称一致：`match-cv-postgres`
2. 在其他项目中使用不同的数据库名称
3. 使用相同的用户名和密码：`admin/password`

### 为其他项目创建数据库

```bash
# 连接到PostgreSQL容器
docker exec -it match-cv-postgres psql -U admin -d match_cv

# 创建新数据库
CREATE DATABASE your_project_name;

# 授权用户访问
GRANT ALL PRIVILEGES ON DATABASE your_project_name TO admin;
```

## 故障排除

### 1. 容器无法启动
```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs match-cv-postgres

# 重新创建容器
docker-compose down -v
docker-compose up -d postgres
```

### 2. 数据库连接失败
- 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
- 确保PostgreSQL容器正在运行
- 检查端口 5432 是否被占用

### 3. 迁移失败
```bash
# 重置数据库
./db.sh reset

# 重新运行迁移
./db.sh migrate
```

## 开发工作流

### 日常开发
1. 启动数据库：`./db.sh start`
2. 运行迁移：`./db.sh migrate`
3. 开始开发：`npm run dev`

### 数据库更改
1. 修改 `prisma/schema.prisma`
2. 创建迁移：`npx prisma migrate dev --name your_migration_name`
3. 部署迁移：`./db.sh migrate`

### 数据库调试
1. 连接数据库：`./db.sh psql`
2. 查看表结构：`\d table_name`
3. 查看数据：`SELECT * FROM table_name;`

## 生产环境注意事项

- 在生产环境中使用强密码
- 配置适当的数据库备份策略
- 使用环境变量管理敏感信息
- 考虑使用数据库连接池
