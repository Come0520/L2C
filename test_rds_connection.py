import psycopg2

def test_rds_connection():
    host = "pgm-uf6aq31y169c8wvluo.pg.rds.aliyuncs.com"
    port = 5432
    database = "postgres"
    username = "postgres"
    password = "I@rds026"
    
    print("=" * 60)
    print("测试 RDS 连接")
    print("=" * 60)
    print(f"\n主机: {host}")
    print(f"端口: {port}")
    print(f"数据库: {database}")
    print(f"用户名: {username}")
    
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
        
        print("✅ 连接成功！")
        
        cursor = conn.cursor()
        
        print("\n正在查询数据库列表...")
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        databases = cursor.fetchall()
        
        print("\n数据库列表:")
        for db in databases:
            print(f"  - {db[0]}")
        
        cursor.close()
        conn.close()
        print("\n✅ 连接已关闭")
        
    except psycopg2.Error as e:
        print(f"\n❌ 数据库错误: {str(e)}")
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")

if __name__ == "__main__":
    test_rds_connection()
