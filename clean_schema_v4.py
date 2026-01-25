import re

def clean_schema_sql_v4():
    input_file = "C:/Users/bigey/Documents/Antigravity/L2C/alibabacloud-rds-openapi-mcp-server/schema.sql"
    output_file = "C:/Users/bigey/Documents/Antigravity/L2C/schema_cleaned_v4.sql"
    
    print("=" * 60)
    print("智能清理 Schema SQL 文件 V4")
    print("=" * 60)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"\n原始文件大小: {len(content)} 字符")
    
    # 移除 pg_dump 的元命令
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # 跳过 pg_dump 元命令（以 \ 开头）
        if line.strip().startswith('\\'):
            continue
        
        # 跳过 SET 命令（除了 search_path）
        if line.strip().upper().startswith('SET ') and 'search_path' not in line.lower():
            continue
        
        # 跳过空行和纯注释行
        if not line.strip() or line.strip().startswith('--'):
            continue
        
        # 处理 CREATE TABLE 语句，添加 IF NOT EXISTS
        if 'CREATE TABLE' in line.upper() and 'IF NOT EXISTS' not in line.upper():
            line = re.sub(r'CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', line, flags=re.IGNORECASE)
        
        # 处理 CREATE TYPE 语句，添加 IF NOT EXISTS
        if 'CREATE TYPE' in line.upper() and 'IF NOT EXISTS' not in line.upper():
            line = re.sub(r'CREATE TYPE', 'CREATE TYPE IF NOT EXISTS', line, flags=re.IGNORECASE)
        
        # 处理 CREATE SCHEMA 语句，添加 IF NOT EXISTS
        if 'CREATE SCHEMA' in line.upper() and 'IF NOT EXISTS' not in line.upper():
            line = re.sub(r'CREATE SCHEMA', 'CREATE SCHEMA IF NOT EXISTS', line, flags=re.IGNORECASE)
        
        # 对于 ALTER TABLE ADD CONSTRAINT，使用 DO 块
        if 'ADD CONSTRAINT' in line.upper() and 'IF NOT EXISTS' not in line.upper():
            # 提取约束名
            constraint_match = re.search(r'ADD CONSTRAINT\s+(\w+)', line, re.IGNORECASE)
            if constraint_match:
                constraint_name = constraint_match.group(1)
                # 提取完整的 ALTER TABLE 语句
                alter_match = re.match(r'(ALTER TABLE.*?ADD CONSTRAINT)', line, re.IGNORECASE)
                if alter_match:
                    alter_part = alter_match.group(1)
                    constraint_part = line[alter_match.end():]
                    # 创建 DO 块
                    do_block = f"""DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '{constraint_name}'
    ) THEN
        {alter_part}{constraint_part};
    END IF;
END $$;"""
                    line = do_block
        
        cleaned_lines.append(line)
    
    cleaned_content = '\n'.join(cleaned_lines)
    
    print(f"清理后文件大小: {len(cleaned_content)} 字符")
    print(f"减少了 {len(content) - len(cleaned_content)} 字符")
    
    # 写入清理后的文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    print(f"\n✅ 清理后的文件已保存到: {output_file}")
    print("\n这个版本会自动处理：")
    print("  - 移除 pg_dump 元命令")
    print("  - 使用 IF NOT EXISTS 避免重复创建表、类型、schema")
    print("  - 使用 DO 块避免重复外键约束")
    print("  - 自动检测表和约束是否已存在")

if __name__ == "__main__":
    clean_schema_sql_v4()
