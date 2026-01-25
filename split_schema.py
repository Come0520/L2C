import os

def split_schema_sql():
    input_file = "C:/Users/bigey/Documents/Antigravity/L2C/alibabacloud-rds-openapi-mcp-server/schema.sql"
    output_dir = "C:/Users/bigey/Documents/Antigravity/L2C/schema_parts"
    
    print("=" * 60)
    print("拆分 Schema SQL 文件")
    print("=" * 60)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"\n原始文件大小: {len(content)} 字符")
    
    # 按分号拆分 SQL 语句
    lines = content.split('\n')
    statements = []
    current_statement = []
    in_statement = False
    
    for line in lines:
        # 跳过 pg_dump 元命令
        if line.strip().startswith('\\'):
            continue
        
        # 检测是否在 SQL 语句中
        if line.strip().upper().startswith(('CREATE', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'GRANT', 'REVOKE')):
            in_statement = True
        
        # 如果在语句中，添加到当前语句
        if in_statement:
            current_statement.append(line)
        
        # 检测语句结束（分号）
        if line.strip().endswith(';'):
            in_statement = False
            if current_statement:
                statements.append('\n'.join(current_statement))
                current_statement = []
    
    # 添加最后一个语句
    if current_statement:
        statements.append('\n'.join(current_statement))
    
    print(f"\n找到 {len(statements)} 个 SQL 语句")
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 计算每个文件包含的语句数量（10%）
    total_statements = len(statements)
    statements_per_file = max(1, total_statements // 10)
    
    print(f"\n将拆分为 10 个文件，每个文件约 {statements_per_file} 个语句")
    
    # 拆分文件
    for i in range(10):
        start_idx = i * statements_per_file
        end_idx = start_idx + statements_per_file if i < 9 else total_statements
        
        part_statements = statements[start_idx:end_idx]
        part_content = '\n\n'.join(part_statements)
        
        output_file = os.path.join(output_dir, f"part_{i+1}.sql")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(part_content)
        
        print(f"  - part_{i+1}.sql: {len(part_statements)} 个语句, {len(part_content)} 字符")
    
    print(f"\n✅ 拆分完成！文件保存在: {output_dir}")
    print("\n执行顺序：")
    for i in range(1, 11):
        print(f"  {i}. part_{i}.sql")

if __name__ == "__main__":
    split_schema_sql()
