import os
import sys
from alibabacloud_rds20140815.client import Client as RdsClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_rds20140815 import models as rds_models
import psycopg2

def get_rds_client(region_id):
    config = open_api_models.Config(
        access_key_id=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID'),
        access_key_secret=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
        region_id=region_id
    )
    return RdsClient(config)

def query_tables_in_database(db_instance_id, db_name, host, port, username, password):
    """查询PostgreSQL数据库中的表数量"""
    try:
        connection = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=db_name,
            connect_timeout=10
        )
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename
            """)
            tables = cursor.fetchall()
            return tables
    except Exception as e:
        print(f"  Error querying database {db_name}: {str(e)}")
        return []
    finally:
        if 'connection' in locals() and connection:
            connection.close()

def main():
    region_id = "cn-shanghai"
    db_instance_id = "pgm-uf6aq31y169c8wvl"
    
    print("正在查询RDS实例详情...")
    client = get_rds_client(region_id)
    
    request = rds_models.DescribeDBInstanceAttributeRequest(
        dbinstance_id=db_instance_id
    )
    
    response = client.describe_dbinstance_attribute(request)
    instance_info = response.body.to_map()
    
    print(f"\n实例信息:")
    print(f"  实例ID: {instance_info.get('DBInstanceId', '')}")
    print(f"  实例名称: {instance_info.get('DBInstanceDescription', '')}")
    print(f"  引擎: {instance_info.get('Engine', '')}")
    print(f"  引擎版本: {instance_info.get('EngineVersion', '')}")
    print(f"  状态: {instance_info.get('DBInstanceStatus', '')}")
    
    net_info = instance_info.get('DBInstanceNetInfo', {}).get('DBInstanceNetInfo', [])
    if net_info:
        for net in net_info:
            if net.get('IPAddressType') == 'Inner' or net.get('ConnectionStringType') == 'Normal':
                print(f"  内网地址: {net.get('ConnectionString', '')}:{net.get('Port', '')}")
            elif net.get('IPAddressType') == 'Public':
                print(f"  公网地址: {net.get('ConnectionString', '')}:{net.get('Port', '')}")
    
    print("\n正在查询数据库列表...")
    
    db_request = rds_models.DescribeDatabasesRequest(
        dbinstance_id=db_instance_id
    )
    
    try:
        db_response = client.describe_databases(db_request)
        
        if not db_response.body.databases or not db_response.body.databases.database:
            print("  该实例没有数据库\n")
            return
        
        databases = db_response.body.databases.database
        print(f"  找到 {len(databases)} 个数据库:")
        
        for db in databases:
            db_dict = db.to_map()
            print(f"    - {db_dict.get('DBName', '')} ({db_dict.get('DBDescription', '无描述')})")
        
        print("\n正在查询表数量...")
        
        total_tables = 0
        for db in databases:
            db_dict = db.to_map()
            db_name = db_dict.get('DBName', '')
            
            tables = query_tables_in_database(
                db_instance_id,
                db_name,
                "pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com",
                1921,
                "postgres",
                os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET', '')
            )
            
            if tables:
                print(f"\n  数据库: {db_name}")
                print(f"  表数量: {len(tables)} 张")
                
                if len(tables) <= 20:
                    print(f"  表列表:")
                    for schema, table in tables:
                        print(f"    - {schema}.{table}")
                else:
                    print(f"  表列表 (前20张):")
                    for schema, table in tables[:20]:
                        print(f"    - {schema}.{table}")
                    print(f"  ... 还有 {len(tables) - 20} 张表")
                
                total_tables += len(tables)
        
        print(f"\n{'='*80}")
        print(f"该实例总计: {total_tables} 张表")
        print(f"{'='*80}\n")
        
    except Exception as e:
        print(f"  查询数据库失败: {str(e)}\n")

if __name__ == "__main__":
    main()
