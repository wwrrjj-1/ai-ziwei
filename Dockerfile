# 阶段1: 构建前端
FROM node:20-alpine AS builder
WORKDIR /app

# 明确设置构建环境为开发模式，确保安装 devDependencies
ENV NODE_ENV=development

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 阶段2: 生产运行
FROM node:20-alpine
WORKDIR /app

# 设置运行环境为生产模式
ENV NODE_ENV=production
ENV PORT=3000

# 只安装生产依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制构建产物和服务器
COPY --from=builder /app/dist ./dist
COPY server.js ./

EXPOSE 3000

# 启动Express服务器
CMD ["node", "server.js"]
