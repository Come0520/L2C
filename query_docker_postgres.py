import psycopg2

def query_postgres_tables():
    connection_string = "postgresql://l2c_user:l2c_dev_password@localhost:5433/l2c_dev"
    
    print("正在连接到Docker PostgreSQL数据库...")
    print(f"连接字符串: {connection_string}\n")
    
    try:
        connection = psycopg2.connect(
            host="localhost",
            port=5433,
            user="l2c_user",
            password="l2c_dev_password",
            database="l2c_dev"
        )
        
        print("✓ 连接成功！\n")
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename
            """)
            tables = cursor.fetchall()
            
            print(f"找到 {len(tables)} 张表:\n")
            
            if tables:
                for idx, (schema, table) in enumerate(tables, 1):
                    print(f"{idx}. {schema}.{table}")
                
                print(f"\n{'='*80}")
                print(f"总计: {len(tables)} 张表")
                print(f"{'='*80}")
            else:
                print("数据库中没有找到表")
                
    except Exception as e:
        print(f"✗ 连接失败: {str(e)}")
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("\n连接已关闭")

if __name__ == "__main__":
    query_postgres_tables()
