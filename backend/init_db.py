import os
import psycopg
from dotenv import load_dotenv
from argon2 import PasswordHasher

load_dotenv()

ph = PasswordHasher()

def init_db():
    conn = psycopg.connect(
        host=os.getenv("DATABASE_HOST", "localhost"),
        port=os.getenv("DATABASE_PORT", "5432"),
        dbname=os.getenv("DATABASE_NAME", "bi_command_center"),
        user=os.getenv("DATABASE_USER", "postgres"),
        password=os.getenv("DATABASE_PASSWORD", "2466")
    )
    
    with conn.cursor() as cur:
        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP WITH TIME ZONE
            )
        """)
        
        # Create audit_logs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                resource VARCHAR(255),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        """)
        
        # Create notifications table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(100),
                priority VARCHAR(50) DEFAULT 'INFO',
                category VARCHAR(100),
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                read_at TIMESTAMP WITH TIME ZONE,
                related_page VARCHAR(255),
                related_entity VARCHAR(255),
                metadata JSONB
            )
        """)

        # Create alerts_config table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alerts_config (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                metric VARCHAR(255) NOT NULL,
                condition VARCHAR(50) NOT NULL,
                threshold NUMERIC NOT NULL,
                severity VARCHAR(50) DEFAULT 'WARNING',
                is_enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Check if admin user exists
        cur.execute("SELECT id FROM users WHERE email = 'admin@example.com'")
        if cur.fetchone() is None:
            # Create a default admin user
            password_hash = ph.hash("admin123")
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
            """, ("Admin User", "admin@example.com", password_hash, "ADMIN"))
            print("Default admin user created: admin@example.com / admin123")
        
        conn.commit()
    
    conn.close()
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    init_db()
