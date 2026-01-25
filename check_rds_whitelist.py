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
    
    print("正在查询RDS实例的网络配置...")
    client = get_rds_client(region_id)
    
    request = rds_models.DescribeDBInstanceAttributeRequest(
        dbinstance_id=db_instance_id
    )
    
    response = client.describe_dbinstance_attribute(request)
    instance_info = response.body.to_map()
    
    print(f"\n实例信息:")
    print(f"  实例ID: {instance_info.get('DBInstanceId', '')}")
    print(f"  引擎: {instance_info.get('Engine', '')}")
    print(f"  引擎版本: {instance_info.get('EngineVersion', '')}")
    print(f"  状态: {instance_info.get('DBInstanceStatus', '')}")
    
    net_info = instance_info.get('DBInstanceNetInfo', {}).get('DBInstanceNetInfo', [])
    if net_info:
        print(f"\n网络配置:")
        for net in net_info:
            print(f"  连接类型: {net.get('ConnectionStringType', '')}")
            print(f"  IP类型: {net.get('IPAddressType', '')}")
            print(f"  连接地址: {net.get('ConnectionString', '')}")
            print(f"  端口: {net.get('Port', '')}")
            print()
    
    print("正在查询IP白名单...")
    
    whitelist_request = rds_models.DescribeDBInstanceIPArrayListRequest(
        dbinstance_id=db_instance_id
    )
    
    try:
        whitelist_response = client.describe_dbinstanceiparraylist(whitelist_request)
        whitelist_info = whitelist_response.body.to_map()
        
        if whitelist_info.get('Items') and whitelist_info['Items'].get('DBInstanceIPArray'):
            ip_arrays = whitelist_info['Items']['DBInstanceIPArray']
            print(f"\n找到 {len(ip_arrays)} 个IP白名单组:")
            
            for ip_array in ip_arrays:
                print(f"\n  组名: {ip_array.get('DBInstanceIPArrayName', '')}")
                print(f"  安全组: {ip_array.get('SecurityIPList', '')}")
                print(f"  IP类型: {ip_array.get('IPArrayAttribute', '')}")
                
                security_ips = ip_array.get('SecurityIPList', '')
                if security_ips:
                    print(f"  允许的IP: {security_ips}")
        else:
            print("\n未找到IP白名单配置")
            
    except Exception as e:
        print(f"  查询白名单失败: {str(e)}")

if __name__ == "__main__":
    main()
