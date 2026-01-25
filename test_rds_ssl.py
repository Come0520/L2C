import psycopg2

def test_rds_connection_with_ssl():
    host = "pgm-uf6aq31y169c8wvluo.pg.rds.aliyuncs.com"
    port = 5432
    database = "postgres"
    username = "postgres"
    password = "I@rds026"
    
    print("=" * 60)
    print("测试 RDS 连接（带 SSL）")
    print("=" * 60)
    print(f"\n主机: {host}")
    print(f"端口: {port}")
    print(f"数据库: {database}")
    print(f"用户名: {username}")
    
    # 尝试不同的 SSL 模式
    ssl_modes = [
        ("disable", None),
        ("allow", None),
        ("prefer", None),
        ("require", None),
    ]
    
    for mode, sslrootcert in ssl_modes:
        print(f"\n尝试 SSL 模式: {mode}")
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=username,
                password=password,
                connect_timeout=10,
                sslmode=mode,
                sslrootcert=sslrootcert
            )
            
            print("✅ 连接成功！")
            
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"PostgreSQL 版本: {version[0]}")
            
            cursor.close()
            conn.close()
            print(f"\n✅ 使用 SSL 模式 '{mode}' 连接成功！")
            return
            
        except psycopg2.Error as e:
            print(f"❌ 失败: {str(e)[:100]}")
        except Exception as e:
            print(f"❌ 失败: {str(e)[:100]}")
    
    print("\n❌ 所有 SSL 模式都失败了")

if __name__ == "__main__":
    test_rds_connection_with_ssl()
