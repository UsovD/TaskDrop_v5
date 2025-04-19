#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sqlite3
import os

DB_PATH = "backend/db.sqlite3"

def delete_all_tasks():
    """Удаляет все задачи из базы данных для тестирования"""
    
    # Проверяем, существует ли файл БД
    if not os.path.exists(DB_PATH):
        print(f"Ошибка: файл базы данных не найден по пути {DB_PATH}")
        return False
    
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Получаем количество задач до удаления
        cursor.execute("SELECT COUNT(*) FROM tasks")
        tasks_count = cursor.fetchone()[0]
        print(f"Найдено {tasks_count} задач в базе данных")
        
        # Удаляем все задачи
        cursor.execute("DELETE FROM tasks")
        conn.commit()
        
        # Проверяем, что задачи действительно удалены
        cursor.execute("SELECT COUNT(*) FROM tasks")
        new_count = cursor.fetchone()[0]
        
        print(f"Удалено {tasks_count} задач. Осталось {new_count} задач.")
        
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
        return False
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        return False

if __name__ == "__main__":
    print("Запуск скрипта очистки базы данных задач...")
    success = delete_all_tasks()
    
    if success:
        print("Очистка базы данных успешно завершена")
    else:
        print("Очистка базы данных завершилась с ошибками") 