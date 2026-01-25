import psycopg2
from psycopg2 import sql

def execute_schema_on_rds():
    host = "pgm-uf6aq31y169c8wvluo.pg.rds.aliyuncs.com"
    port = 5432
    database = "l2c"
    username = "postgres"
    password = "I@rds026"
    
    print("=" * 60)
    print("通过 psycopg2 执行 Schema 到 RDS")
    print("=" * 60)
    print(f"\n主机: {host}")
    print(f"端口: {port}")
    print(f"数据库: {database}")
    print(f"用户名: {username}")
    
    # 读取 schema.sql 文件
    schema_file = "C:/Users/bigey/Documents/Antigravity/L2C/alibabacloud-rds-openapi-mcp-server/schema.sql"
    
    try:
        with open(schema_file, 'r', encoding='utf-8') as f:
            schema_content = f.read()
        
        print(f"\nSchema 文件大小: {len(schema_content)} 字符")
        
        print("\n正在连接到 RDS...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ 连接成功！")
        print("\n正在执行 Schema...")
        
        cursor.execute(schema_content)
        
        print("✅ Schema 执行完成！")
        
        cursor.close()
        conn.close()
        print("\n✅ 连接已关闭")
        
    except FileNotFoundError:
        print(f"\n❌ 错误: 找不到文件 {schema_file}")
    except psycopg2.Error as e:
        print(f"\n❌ 数据库错误: {str(e)}")
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")

if __name__ == "__main__":
    execute_schema_on_rds()
