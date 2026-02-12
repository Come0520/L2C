import os
import psycopg2
from urllib.parse import urlparse

def check_structure():
    # 使用参数形式连接，避免 URL 解析问题
    try:
        connection = psycopg2.connect(
            host="pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com",
            port=5432,
            user="l2c",
            password="I@rds2026",
            database="l2c"
        )
        with connection.cursor() as cursor:
            # 1. 检查 customer_addresses 表结构
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'customer_addresses'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            print("Table: customer_addresses")
            print(f"{'Column':<20} | {'Type':<15} | {'Nullable':<10} | {'Default'}")
            print("-" * 60)
            for col in columns:
                print(f"{col[0]:<20} | {col[1]:<15} | {col[2]:<10} | {col[3]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection:
            connection.close()

if __name__ == "__main__":
    check_structure()
