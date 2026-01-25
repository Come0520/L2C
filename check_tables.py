import psycopg2

def check_tables():
    host = "pgm-uf6aq31y169c8wvluo.pg.rds.aliyuncs.com"
    port = 5432
    database = "l2c"
    username = "postgres"
    password = "I@rds026"
    
    print("=" * 60)
    print("检查 RDS 中的表")
    print("=" * 60)
    
    try:
        print("\n正在连接到 RDS...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password,
            connect_timeout=10
        )
        
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ 连接成功！")
        
        print("\n正在查询所有表...")
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        """)
        
        tables = cursor.fetchall()
        
        print(f"\n找到 {len(tables)} 个表:")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        print("\n✅ 查询完成")
        
    except psycopg2.Error as e:
        print(f"\n❌ 数据库错误: {str(e)}")
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")

if __name__ == "__main__":
    check_tables()
