import re

def clean_schema_sql():
    input_file = "C:/Users/bigey/Documents/Antigravity/L2C/alibabacloud-rds-openapi-mcp-server/schema.sql"
    output_file = "C:/Users/bigey/Documents/Antigravity/L2C/schema_cleaned.sql"
    
    print("=" * 60)
    print("清理 Schema SQL 文件")
    print("=" * 60)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"\n原始文件大小: {len(content)} 字符")
    
    # 移除 pg_dump 的元命令（以 \ 开头的命令）
    lines = content.split('\n')
    cleaned_lines = []
    
    skip_until_semicolon = False
    
    for line in lines:
        # 跳过 pg_dump 元命令
        if line.strip().startswith('\\'):
            continue
        
        # 跳过注释中的元命令
        if '\\unrestrict' in line or '\\restrict' in line:
            continue
        
        # 跳过 SET 命令（可能导致问题）
        if line.strip().upper().startswith('SET ') and 'search_path' not in line.lower():
            continue
        
        # 跳过空行和纯注释行
        if not line.strip() or line.strip().startswith('--'):
            continue
        
        cleaned_lines.append(line)
    
    cleaned_content = '\n'.join(cleaned_lines)
    
    print(f"清理后文件大小: {len(cleaned_content)} 字符")
    print(f"减少了 {len(content) - len(cleaned_content)} 字符")
    
    # 写入清理后的文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    print(f"\n✅ 清理后的文件已保存到: {output_file}")
    print("\n请在 DMS 控制台中执行这个新文件")

if __name__ == "__main__":
    clean_schema_sql()
