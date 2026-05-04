# Paso 1: Preparación
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

# Exponer el puerto
EXPOSE 8080
ENV PORT=8080

# El build se hará al arrancar el contenedor
CMD ["sh", "-c", "npm run build && npm run start"]
