FROM python:3.10-slim

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование проекта
COPY . .

# Expose порт для Django
EXPOSE 8000

# Запуск команды
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "deadline_mate.wsgi:application"] 