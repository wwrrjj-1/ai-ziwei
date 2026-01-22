# 使用 Node.js 运行时
FROM node:20-alpine

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建好的前端文件和服务器
COPY dist/ ./dist/
COPY server.js ./

# 暴露端口
EXPOSE 3000

# 启动 Express 服务器
CMD ["node", "server.js"]
