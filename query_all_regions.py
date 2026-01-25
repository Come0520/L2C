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
    common_regions = [
        "cn-hangzhou",
        "cn-shanghai",
        "cn-beijing",
        "cn-shenzhen",
        "cn-guangzhou",
        "cn-chengdu",
        "cn-hongkong",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-southeast-3",
        "ap-southeast-5",
        "ap-northeast-1",
        "us-east-1",
        "us-west-1",
        "eu-central-1",
        "me-east-1"
    ]
    
    print("正在查询各个区域的RDS实例...\n")
    
    found_instances = []
    
    for region_id in common_regions:
        try:
            client = get_rds_client(region_id)
            request = rds_models.DescribeDBInstancesRequest(
                region_id=region_id,
                page_size=100
            )
            
            response = client.describe_dbinstances(request)
            
            if response.body.items and response.body.items.dbinstance:
                instances = response.body.items.dbinstance
                print(f"✓ {region_id}: 找到 {len(instances)} 个实例")
                
                for instance in instances:
                    instance_dict = instance.to_map()
                    found_instances.append({
                        'region': region_id,
                        'id': instance_dict.get('DBInstanceId', ''),
                        'name': instance_dict.get('DBInstanceDescription', ''),
                        'engine': instance_dict.get('Engine', ''),
                        'status': instance_dict.get('DBInstanceStatus', ''),
                        'host': instance_dict.get('ConnectionString', ''),
                        'port': instance_dict.get('Port', '')
                    })
        except Exception as e:
            print(f"✗ {region_id}: 查询失败 - {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"总计找到 {len(found_instances)} 个RDS实例:\n")
    
    if not found_instances:
        print("未找到任何RDS实例")
        print("\n请确认:")
        print("1. AccessKey是否有RDS访问权限")
        print("2. 是否有RDS实例")
        print("3. 实例是否在上述区域之外")
        return
    
    for idx, instance in enumerate(found_instances, 1):
        print(f"{idx}. 区域: {instance['region']}")
        print(f"   实例ID: {instance['id']}")
        print(f"   实例名称: {instance['name']}")
        print(f"   引擎: {instance['engine']}")
        print(f"   状态: {instance['status']}")
        if instance['host']:
            print(f"   连接地址: {instance['host']}:{instance['port']}")
        print()

if __name__ == "__main__":
    main()
