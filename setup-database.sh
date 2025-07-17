#!/bin/bash

# 设置数据库配置脚本
# 这个脚本会在共享的PostgreSQL容器中创建match_cv2数据库

echo "🚀 正在设置数据库..."

# 检查PostgreSQL容器是否运行
if ! docker ps | grep -q "match-cv-postgres"; then
    echo "❌ PostgreSQL容器未运行，正在启动..."
    docker-compose up -d postgres
    echo "⏳ 等待PostgreSQL容器启动..."
    sleep 5
fi

# 检查数据库是否存在，如果不存在则创建
echo "🔍 检查数据库是否存在..."
DB_EXISTS=$(docker exec match-cv-postgres psql -U admin -d match_cv -tAc "SELECT 1 FROM pg_database WHERE datname='match_cv2'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📝 创建数据库 match_cv2..."
    docker exec match-cv-postgres psql -U admin -d match_cv -c "CREATE DATABASE match_cv2;"
    echo "✅ 数据库 match_cv2 创建成功"
else
    echo "✅ 数据库 match_cv2 已存在"
fi

# 运行Prisma迁移
echo "🔄 运行Prisma迁移..."
npx prisma migrate deploy

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

echo "🎉 数据库设置完成！"
echo ""
echo "📝 数据库信息:"
echo "   - 主机: localhost:5432"
echo "   - 数据库: match_cv2"
echo "   - 用户: admin"
echo "   - 密码: password"
echo ""
echo "💡 提示: 可以使用以下命令查看数据库:"
echo "   docker exec -it match-cv-postgres psql -U admin -d match_cv2"
