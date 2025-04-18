#!/bin/bash

# Установка зависимостей
echo "🛠 Установка зависимостей..."
npm install

# Проверка наличия Vite
echo "🔍 Проверка наличия Vite..."
if [ ! -f "./node_modules/.bin/vite" ]; then
  echo "❌ Vite не найден, установка локально..."
  npm install vite
fi

# Запуск сборки с явным путем к Vite
echo "🚀 Запуск сборки..."
./node_modules/.bin/vite build

# Проверка успешности сборки
if [ $? -eq 0 ]; then
  echo "✅ Сборка успешно завершена!"
else
  echo "❌ Ошибка при сборке!"
  exit 1
fi
