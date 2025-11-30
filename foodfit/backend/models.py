"""
Database models and initialization for FoodFit.
Creates SQLite database with tables for preferences, orders, and snacks.
"""

import sqlite3
import json
from typing import Dict, List, Any, Optional
from pathlib import Path

DB_PATH = Path(__file__).parent / "database.db"


def get_connection():
    """Get a database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """
    Initialize the database with required tables if they don't exist.
    This function is called automatically on first import.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Table: preferences
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            requested_calories INTEGER NOT NULL,
            likes TEXT,
            dislikes TEXT,
            allergies TEXT,
            plan_type TEXT,
            menu_json TEXT,
            total_calories INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Table: orders
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preference_id INTEGER,
            user_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            delivery_time TEXT,
            items_json TEXT,
            total_calories INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (preference_id) REFERENCES preferences(id)
        )
    """)

    # Table: snacks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS snacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            description TEXT,
            image TEXT
        )
    """)

    # Table: menu_history - tracks daily menus to avoid repeats
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS menu_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preference_id INTEGER NOT NULL,
            day_number INTEGER NOT NULL,
            menu_json TEXT NOT NULL,
            total_calories INTEGER,
            total_proteins INTEGER,
            total_fats INTEGER,
            total_carbs INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (preference_id) REFERENCES preferences(id),
            UNIQUE(preference_id, day_number)
        )
    """)

    # Seed snacks if table is empty
    cursor.execute("SELECT COUNT(*) FROM snacks")
    if cursor.fetchone()[0] == 0:
        default_snacks = [
            ("Грецький йогурт", 150, "Натуральний грецький йогурт з ягодами", ""),
            ("Змішані горіхи", 200, "Мікс мигдалю, волоського горіха та кеш'ю", ""),
            ("Фруктовий мікс", 120, "Свіжі ягоди та фрукти", ""),
            ("Хумус з морквою", 180, "Хумус з паличками моркви", ""),
            ("Протеїновий батончик", 250, "Батончик з високим вмістом білка", ""),
        ]
        cursor.executemany(
            "INSERT INTO snacks (name, calories, description, image) VALUES (?, ?, ?, ?)",
            default_snacks
        )

    conn.commit()
    conn.close()


def save_preferences(
    user_name: str,
    requested_calories: int,
    likes: str,
    dislikes: str,
    allergies: str,
    plan_type: str,
    menu: Dict[str, Any],
    total_calories: int,
) -> int:
    """Save user preferences and return the record ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO preferences (user_name, requested_calories, likes, dislikes, allergies, plan_type, menu_json, total_calories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_name,
        requested_calories,
        likes,
        dislikes,
        allergies,
        plan_type,
        json.dumps(menu, ensure_ascii=False),
        total_calories,
    ))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def fetch_snacks() -> List[Dict[str, Any]]:
    """Fetch all snacks from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, calories, description, image FROM snacks")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "calories": row["calories"],
            "description": row["description"] or "",
            "image": row["image"] or "",
        }
        for row in rows
    ]


def save_order(
    preference_id: Optional[int],
    user_name: str,
    phone: str,
    address: str,
    delivery_time: str,
    items: List[Dict[str, Any]],
    total_calories: int,
) -> int:
    """Save an order and return the order ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO orders (preference_id, user_name, phone, address, delivery_time, items_json, total_calories)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        preference_id,
        user_name,
        phone,
        address,
        delivery_time,
        json.dumps(items, ensure_ascii=False),
        total_calories,
    ))
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return order_id


def get_menu_history(preference_id: int, days_back: int = 10) -> List[Dict[str, Any]]:
    """Get menu history for a preference, returns last N days."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT day_number, menu_json, total_calories, total_proteins, total_fats, total_carbs
        FROM menu_history
        WHERE preference_id = ?
        ORDER BY day_number DESC
        LIMIT ?
    """, (preference_id, days_back))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "day_number": row["day_number"],
            "menu": json.loads(row["menu_json"]),
            "total_calories": row["total_calories"],
            "total_proteins": row["total_proteins"],
            "total_fats": row["total_fats"],
            "total_carbs": row["total_carbs"],
        }
        for row in rows
    ]


def save_menu_day(
    preference_id: int,
    day_number: int,
    menu: Dict[str, Any],
    total_calories: int,
    total_proteins: int,
    total_fats: int,
    total_carbs: int,
) -> None:
    """Save a day's menu to history."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO menu_history 
        (preference_id, day_number, menu_json, total_calories, total_proteins, total_fats, total_carbs)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        preference_id,
        day_number,
        json.dumps(menu, ensure_ascii=False),
        total_calories,
        total_proteins,
        total_fats,
        total_carbs,
    ))
    conn.commit()
    conn.close()


def get_next_day_number(preference_id: int) -> int:
    """Get the next day number for a preference."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT MAX(day_number) as max_day
        FROM menu_history
        WHERE preference_id = ?
    """, (preference_id,))
    row = cursor.fetchone()
    conn.close()
    return (row["max_day"] or 0) + 1


# Initialize database on import
init_database()

