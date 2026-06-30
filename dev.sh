#!/usr/bin/env bash
# -----------------------------------------------------------
# Your Rank — 本地开发一键启停脚本
# 用法: ./dev.sh {start|stop|restart|status|stop-all}
# -----------------------------------------------------------
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_BIN="$BACKEND_DIR/server"
PG_SERVICE="postgresql@16"
BE_PIDFILE="/tmp/yourrank-backend.pid"
FE_PIDFILE="/tmp/yourrank-frontend.pid"
BE_LOGFILE="/tmp/yourrank-backend.log"
FE_LOGFILE="/tmp/yourrank-frontend.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# -----------------------------------------------------------
# 通用：检查某个 PID 是否存活
# -----------------------------------------------------------
is_alive() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 检查端口是否有进程在监听
port_listening() {
  lsof -i ":$1" -sTCP:LISTEN >/dev/null 2>&1
}

# -----------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------
pg_status() {
  if brew services list 2>/dev/null | grep "$PG_SERVICE" | grep -q "started"; then
    echo "running"
  else
    echo "stopped"
  fi
}

pg_start() {
  if [ "$(pg_status)" = "running" ]; then
    warn "PostgreSQL ($PG_SERVICE) 已在运行"
    return 0
  fi
  log "启动 PostgreSQL ($PG_SERVICE)..."
  brew services start "$PG_SERVICE" 2>&1 | tail -1
  for i in $(seq 1 30); do
    if pg_isready -h /opt/homebrew/var/postgresql@16/socket -U yourrank 2>/dev/null; then
      log "PostgreSQL 就绪 ✓"
      return 0
    fi
    sleep 1
  done
  err "PostgreSQL 启动超时"
  return 1
}

pg_stop() {
  if [ "$(pg_status)" = "stopped" ]; then
    warn "PostgreSQL 未运行"
    return 0
  fi
  log "停止 PostgreSQL ($PG_SERVICE)..."
  brew services stop "$PG_SERVICE" 2>&1 | tail -1
}

# -----------------------------------------------------------
# Backend（基于 PID 文件 + 端口检测）
# -----------------------------------------------------------
backend_status() {
  if [ -f "$BE_PIDFILE" ] && is_alive "$(cat "$BE_PIDFILE")"; then
    echo "running"
  elif port_listening 8080; then
    echo "running"
  else
    echo "stopped"
  fi
}

backend_build() {
  if [ -f "$BACKEND_BIN" ]; then
    if [ "$BACKEND_DIR/cmd/server/main.go" -nt "$BACKEND_BIN" ] 2>/dev/null; then
      log "源码有更新，重新构建后端..."
    else
      log "后端二进制已是最新，跳过构建"
      return 0
    fi
  fi
  log "构建后端 (CGO_ENABLED=0)..."
  cd "$BACKEND_DIR"
  CGO_ENABLED=0 go build -o server ./cmd/server
  codesign --sign - --force server 2>/dev/null || true
  log "构建完成"
}

backend_start() {
  if [ "$(backend_status)" = "running" ]; then
    warn "后端已在运行 (端口 8080)"
    return 0
  fi
  backend_build

  log "启动后端 API (http://localhost:8080)..."
  cd "$BACKEND_DIR"
  nohup ./server >> "$BE_LOGFILE" 2>&1 &
  echo $! > "$BE_PIDFILE"

  for i in $(seq 1 10); do
    sleep 1
    if port_listening 8080; then
      log "后端启动成功 (PID: $(cat "$BE_PIDFILE"))"
      if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
        log "健康检查通过: http://localhost:8080/health ✓"
        return 0
      fi
    fi
  done
  err "后端启动失败（等待 10s 未就绪），日志: tail -20 $BE_LOGFILE"
  return 1
}

backend_stop() {
  # 先通过 PID 文件停止
  if [ -f "$BE_PIDFILE" ]; then
    local pid=$(cat "$BE_PIDFILE")
    if is_alive "$pid"; then
      log "停止后端 API (PID: $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      is_alive "$pid" && kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$BE_PIDFILE"
  fi
  # 兜底：通过端口杀
  if port_listening 8080; then
    local pid=$(lsof -i :8080 -sTCP:LISTEN -t 2>/dev/null)
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  fi
  sleep 1
  if port_listening 8080; then
    err "后端停止失败，端口 8080 仍被占用"
  else
    log "后端已停止"
  fi
}

# -----------------------------------------------------------
# Frontend（基于 PID 文件 + 端口检测）
# -----------------------------------------------------------
frontend_status() {
  if [ -f "$FE_PIDFILE" ] && is_alive "$(cat "$FE_PIDFILE")"; then
    echo "running"
  elif port_listening 3000; then
    echo "running"
  else
    echo "stopped"
  fi
}

frontend_start() {
  if [ "$(frontend_status)" = "running" ]; then
    warn "前端已在运行 (端口 3000)"
    return 0
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log "安装前端依赖..."
    (cd "$FRONTEND_DIR" && npm install) || { err "依赖安装失败"; return 1; }
  fi

  log "启动前端 Vite (http://localhost:3000)..."
  cd "$FRONTEND_DIR"
  nohup npm run dev >> "$FE_LOGFILE" 2>&1 &
  echo $! > "$FE_PIDFILE"

  for i in $(seq 1 10); do
    sleep 1
    if port_listening 3000; then
      log "前端启动成功 (http://localhost:3000) ✓"
      return 0
    fi
  done
  err "前端启动失败（等待 10s 未就绪），日志: tail -20 $FE_LOGFILE"
  return 1
}

frontend_stop() {
  if [ -f "$FE_PIDFILE" ]; then
    local pid=$(cat "$FE_PIDFILE")
    if is_alive "$pid"; then
      log "停止前端 Vite (PID: $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      is_alive "$pid" && kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$FE_PIDFILE"
  fi
  # 兜底：通过端口杀 vite 子进程
  if port_listening 3000; then
    local pid=$(lsof -i :3000 -sTCP:LISTEN -t 2>/dev/null)
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  fi
  # 再清理可能残留的 vite/node 进程
  pkill -f 'node_modules/.bin/vite' 2>/dev/null || true
  sleep 1
  if port_listening 3000; then
    err "前端停止失败，端口 3000 仍被占用"
  else
    log "前端已停止"
  fi
}

# -----------------------------------------------------------
# 组合命令
# -----------------------------------------------------------
cmd_status() {
  echo ""
  echo "=========================================="
  echo " Your Rank 本地服务状态"
  echo "=========================================="

  printf "  %-18s : " "PostgreSQL"
  if [ "$(pg_status)" = "running" ]; then
    echo -e "${GREEN}运行中${NC}"
  else
    echo -e "${RED}已停止${NC}"
  fi

  printf "  %-18s : " "Backend API"
  if [ "$(backend_status)" = "running" ]; then
    echo -e "${GREEN}运行中${NC} (http://localhost:8080)"
  else
    echo -e "${RED}已停止${NC}"
  fi

  printf "  %-18s : " "Frontend Vite"
  if [ "$(frontend_status)" = "running" ]; then
    echo -e "${GREEN}运行中${NC} (http://localhost:3000)"
  else
    echo -e "${RED}已停止${NC}"
  fi

  echo "=========================================="
  if [ "$(backend_status)" = "running" ]; then
    echo ""
    curl -sf http://localhost:8080/health >/dev/null 2>&1 \
      && echo -e "  健康检查: ${GREEN}✓${NC}" \
      || echo -e "  健康检查: ${RED}✗${NC}"
  fi
  echo ""
}

cmd_start() {
  echo ""
  echo "=========================================="
  echo " 启动 Your Rank 本地开发环境"
  echo "=========================================="
  echo ""
  pg_start
  backend_start
  frontend_start
  echo ""
  echo "=========================================="
  echo " 全部启动完成！"
  echo "   前端:   http://localhost:3000"
  echo "   后端:   http://localhost:8080"
  echo "   日志:   $BE_LOGFILE"
  echo "          $FE_LOGFILE"
  echo "=========================================="
  echo ""
}

cmd_stop() {
  echo ""
  echo "=========================================="
  echo " 停止 Your Rank 本地开发环境"
  echo "=========================================="
  echo ""
  frontend_stop
  backend_stop
  echo ""
  echo "=========================================="
  warn "PostgreSQL 保留运行（手动停止: brew services stop $PG_SERVICE）"
  echo "=========================================="
  echo ""
}

cmd_stop_all() {
  echo ""
  frontend_stop
  backend_stop
  pg_stop
  echo ""
  log "所有服务已停止（含数据库）"
  echo ""
}

# -----------------------------------------------------------
# 入口
# -----------------------------------------------------------
case "${1:-start}" in
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  stop-all)
    cmd_stop_all
    ;;
  restart)
    cmd_stop
    echo ""
    cmd_start
    ;;
  status)
    cmd_status
    ;;
  *)
    echo "用法: $0 {start|stop|stop-all|restart|status}"
    echo ""
    echo "  start    启动全部（PostgreSQL + 后端 + 前端）"
    echo "  stop     停止后端 + 前端（保留 PG）"
    echo "  stop-all 停止全部（含 PostgreSQL）"
    echo "  restart  重新启动后端 + 前端"
    echo "  status   查看各服务状态"
    echo ""
    exit 1
    ;;
esac
