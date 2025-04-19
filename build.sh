#!/bin/bash

# Выводим текущую директорию и содержимое
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Выводим версию Node.js и NPM
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Устанавливаем зависимости
echo "Installing dependencies..."
npm install

# Если package.json не существует, выводим ошибку и выходим
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. This is not a Node.js project."
  exit 1
fi

# Выводим содержимое package.json
echo "package.json contents:"
cat package.json

# Выводим установленные пакеты
echo "Installed packages:"
npm list --depth=0

# Запускаем сборку
echo "Building project..."
npm run build

# Проверяем, что сборка прошла успешно
if [ $? -ne 0 ]; then
  echo "Error: Build failed."
  exit 1
fi

# Выводим содержимое dist
echo "Build output (dist):"
ls -la dist

echo "Build completed successfully!" 