# Paso 1: Construcción
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Paso 2: Ejecución
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
# Asegúrate de que tu app escuche en el puerto definido por la variable de entorno PORT
EXPOSE 8080
CMD ["node", "dist/index.js"]
