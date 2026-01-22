# 阶段1: 构建前端（需要所有依赖包括devDependencies）
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build

# 阶段2: 生产运行（只需要生产依赖）
FROM node:20-alpine
WORKDIR /app

# 只安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制构建产物和服务器
COPY --from=builder /app/dist ./dist
COPY server.js ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 启动Express服务器
CMD ["node", "server.js"]
