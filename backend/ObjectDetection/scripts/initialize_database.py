import psycopg2
from psycopg2 import Error
from pathlib import Path
import yaml
import time
import os
from dotenv import load_dotenv
load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv('DB_NAME'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASSWORD'), 
    "host": os.getenv('DB_HOST'),
    "port": os.getenv('DB_PORT')
}

def get_db_connection(dbname="postgres"):
    try:
        return psycopg2.connect(**{**DB_CONFIG, "dbname": dbname})
    except Error as e:
        print(f"Connection failed: {e}")
        return None

def check_classes_populated():
    conn = cursor = None
    try:
        conn = get_db_connection(DB_CONFIG["dbname"])
        cursor = conn.cursor()
        
        yaml_path = Path(__file__).parents[1] / "YOLO/data/wii_aite_2022_testing.yaml"
        with open(yaml_path, 'r', encoding='utf-8') as f:
            expected_count = len(yaml.safe_load(f).get('names', []))
        
        cursor.execute("SELECT COUNT(*) FROM classes")
        return cursor.fetchone()[0] == expected_count
        
    except Exception as e:
        print(f"Error checking classes: {e}")
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def check_schema_match():
    conn = cursor = None
    try:
        conn = get_db_connection(DB_CONFIG["dbname"])
        cursor = conn.cursor()
        
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        existing_tables = {row[0] for row in cursor.fetchall()}
        required_tables = {'classes', 'images', 'boxes', 'users','annotations'}
        
        if not required_tables.issubset(existing_tables):
            print(f"Missing tables: {required_tables - existing_tables}")
            return False
            
        return 'classes' not in existing_tables or check_classes_populated()

    except Error as e:
        print(f"Error checking schema: {e}")
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def drop_database():
    conn = cursor = None
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute(f"""
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '{DB_CONFIG["dbname"]}'
            AND pid <> pg_backend_pid()
        """)
        
        cursor.execute(f"DROP DATABASE {DB_CONFIG['dbname']}")
        print("Database dropped successfully")
        return True
    except Error as e:
        print(f"Error dropping database: {e}")
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def create_database():
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute(f"CREATE DATABASE {DB_CONFIG['dbname']}")
        print("Database created successfully")
        return True
    except Error as e:
        print(f"Error creating database: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def populate_classes(conn):
    try:
        cursor = conn.cursor()
        yaml_path = Path(__file__).parents[1] / "YOLO/data/wii_aite_2022_testing.yaml"
        
        with open(yaml_path, 'r', encoding='utf-8') as f:
            class_names = yaml.safe_load(f).get('names', [])
            
        if not class_names:
            print("No classes found in YOLO config")
            return False

        for idx, name in enumerate(class_names):
            clean_name = name.encode('ascii', 'ignore').decode('ascii')
            cursor.execute(
                "INSERT INTO classes (id, name) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name",
                (idx, clean_name)
            )
        
        conn.commit()
        print(f"Populated {len(class_names)} classes")
        return True
        
    except Exception as e:
        print(f"Error populating classes: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def create_tables():
    try:
        conn = get_db_connection(DB_CONFIG["dbname"])
        cursor = conn.cursor()

        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path, 'r') as f:
            cursor.execute(f.read())
        
        conn.commit()
        print("Database tables created successfully")

        return populate_classes(conn)
    except Error as e:
        print(f"Error creating tables: {e}")
        return False
    finally:
        if conn: conn.close()

def initialize_database():
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_CONFIG['dbname']}'")
        db_exists = cursor.fetchone() is not None
        
        if db_exists and not check_schema_match():
            print("\nWarning: Database exists with different schema")
            print("Press Enter 3 times to drop and recreate...")
            
            for _ in range(3):
                if input() != "":
                    print("Operation cancelled")
                    return False
                time.sleep(0.5)
                
            return drop_database() and create_database() and create_tables()
                
        return db_exists or (create_database() and create_tables())
            
    except Error as e:
        print(f"Error initializing database: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    initialize_database()