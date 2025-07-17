#!/bin/bash

# Database Management Script for Match-CV2

set -e

# 设置数据库连接环境变量
export DATABASE_URL="postgresql://admin:password@localhost:5432/match_cv2"

function start_db() {
    echo "🚀 Starting PostgreSQL database with Docker..."
    docker-compose up -d postgres
    
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # 检查并创建match_cv2数据库
    echo "🔍 Checking if database exists..."
    DB_EXISTS=$(docker exec match-cv-postgres psql -U admin -d match_cv -tAc "SELECT 1 FROM pg_database WHERE datname='match_cv2'" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo "� Creating database match_cv2..."
        docker exec match-cv-postgres psql -U admin -d match_cv -c "CREATE DATABASE match_cv2;"
        echo "✅ Database match_cv2 created successfully"
    else
        echo "✅ Database match_cv2 already exists"
    fi
    
    echo "✅ Database is ready!"
    echo "📊 Database URL: postgresql://admin:password@localhost:5432/match_cv2"
    echo "   Server: localhost:5432"
    echo "   Username: admin"
    echo "   Password: password"
    echo "   Database: match_cv2"
}

function stop_db() {
    echo "🛑 Stopping PostgreSQL database..."
    docker-compose down
    echo "✅ Database stopped!"
}

function restart_db() {
    echo "🔄 Restarting PostgreSQL database..."
    docker-compose down
    docker-compose up -d postgres
    echo "✅ Database restarted!"
}

function reset_db() {
    echo "⚠️  This will destroy all data in the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Removing database volume..."
        docker-compose down -v
        echo "🚀 Starting fresh database..."
        docker-compose up -d postgres
        echo "✅ Database reset complete!"
    else
        echo "❌ Database reset cancelled."
    fi
}

function migrate_db() {
    echo "🔄 Running database migrations..."
    npm run db:migrate
    echo "✅ Migrations complete!"
}

function seed_db() {
    echo "🌱 Seeding database with initial data..."
    npm run db:seed
    echo "✅ Database seeded!"
}

function adminer() {
    echo "� Connecting to database via psql..."
    docker exec -it match-cv-postgres psql -U admin -d match_cv2
}

function logs() {
    echo "📄 Showing database logs..."
    docker-compose logs -f postgres
}

function status() {
    echo "📊 Database Status:"
    docker-compose ps
}

function psql_connect() {
    echo "💻 Connecting to database via psql..."
    docker exec -it match-cv-postgres psql -U admin -d match_cv2
}

case "$1" in
    start)
        start_db
        ;;
    stop)
        stop_db
        ;;
    restart)
        restart_db
        ;;
    reset)
        reset_db
        ;;
    migrate)
        migrate_db
        ;;
    seed)
        seed_db
        ;;
    adminer)
        adminer
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    psql)
        psql_connect
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|reset|migrate|seed|adminer|logs|status|psql}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the PostgreSQL database"
        echo "  stop     - Stop the PostgreSQL database"
        echo "  restart  - Restart the PostgreSQL database"
        echo "  reset    - Reset the database (destroys all data)"
        echo "  migrate  - Run database migrations"
        echo "  seed     - Seed the database with initial data"
        echo "  adminer  - Connect to database via psql"
        echo "  logs     - Show database logs"
        echo "  status   - Show database status"
        echo "  psql     - Connect to database via psql"
        exit 1
        ;;
esac
