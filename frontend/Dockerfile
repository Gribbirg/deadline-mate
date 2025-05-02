FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json* ./
RUN npm ci

# Копирование исходного кода
COPY . .

# Запуск приложения
EXPOSE 3000
CMD ["npm", "run", "dev"] 