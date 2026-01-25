import os
import sys
from alibabacloud_rds20140815.client import Client as RdsClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_rds20140815 import models as rds_models

def get_rds_client(region_id):
    config = open_api_models.Config(
        access_key_id=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_ID'),
        access_key_secret=os.environ.get('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
        region_id=region_id
    )
    return RdsClient(config)

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
            if net.get('ConnectionStringType') == 'Normal':
                print(f"  连接地址: {net.get('ConnectionString', '')}:{net.get('Port', '')}")
    
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
        
        print(f"\n{'='*80}")
        print(f"该实例总计: {len(databases)} 个数据库")
        print(f"{'='*80}\n")
        
        print("\n注意: 要查询每个数据库中的表数量，需要:")
        print("1. 提供数据库的连接用户名和密码")
        print("2. 或者使用阿里云RDS控制台的'数据管理'功能")
        print("3. 或者使用MCP服务器的query_sql工具(需要数据库连接信息)")
        
    except Exception as e:
        print(f"  查询数据库失败: {str(e)}\n")

if __name__ == "__main__":
    main()
