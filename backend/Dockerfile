# ==========================================
# Stage 1: Build dashboard and server
# ==========================================
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 拷贝依赖配置以利用 Docker 缓存
COPY dashboard/package.json dashboard/pnpm-lock.yaml ./dashboard/
COPY backend/package.json backend/pnpm-lock.yaml ./backend/

# 安装依赖
RUN pnpm --dir dashboard install --frozen-lockfile --ignore-scripts --node-linker=hoisted
RUN pnpm --dir backend install --frozen-lockfile --ignore-scripts --node-linker=hoisted

# 拷贝源码
COPY dashboard/ ./dashboard/
COPY backend/ ./backend/

# 1. 编译 Dashboard SPA (输出至 backend/public/dashboard)
RUN cd dashboard && ./node_modules/.bin/vite build

# 2. 编译 Backend TypeScript 源码 (输出至 backend/dist)
RUN cd backend && NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/tsc -p tsconfig.json


# ==========================================
# Stage 2: Clean Production Runner
# ==========================================
FROM node:24-bookworm-slim AS runner

WORKDIR /app

# 安装底层系统依赖（git、ripgrep、curl），这些是 Claude Code 运行及执行 MCP 工具所必需的
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ripgrep \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 全局安装 pnpm、tsx 运行时以及 Claude Code CLI 工具
RUN npm install -g pnpm tsx @anthropic-ai/claude-code

# 仅拷贝后端 package 配置文件安装生产依赖
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --node-linker=hoisted

# 从 builder 拷贝构建产物
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public

# 创建默认持久化文件夹
RUN mkdir -p data knowledge-base

# 声明端口
EXPOSE 8000

# 默认生产环境变量
ENV NODE_ENV=production
ENV KNOVANA_HOST=0.0.0.0
ENV KNOVANA_PORT=8000
ENV KNOVANA_DB_PATH=/app/data/knovana.db
ENV KNOVANA_KB_ROOT=/app/knowledge-base

# 启动服务
CMD ["tsx", "dist/server.js"]
