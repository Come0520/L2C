import psycopg2
import json

def get_rds_schema():
    connection = psycopg2.connect(
        host="pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com",
        port=5432,
        user="l2c",
        password="I@rds2026",
        database="l2c"
    )
    
    schema = {}
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename
            """)
            tables = cursor.fetchall()
            
            for schema_name, table_name in tables:
                full_name = f"{schema_name}.{table_name}"
                
                cursor.execute("""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale
                    FROM information_schema.columns
                    WHERE table_schema = %s AND table_name = %s
                    ORDER BY ordinal_position
                """, (schema_name, table_name))
                
                columns = cursor.fetchall()
                
                schema[full_name] = {
                    'schema': schema_name,
                    'table': table_name,
                    'columns': []
                }
                
                for col in columns:
                    schema[full_name]['columns'].append({
                        'name': col[0],
                        'type': col[1],
                        'nullable': col[2] == 'YES',
                        'default': col[3],
                        'max_length': col[4],
                        'precision': col[5],
                        'scale': col[6]
                    })
                
                cursor.execute("""
                    SELECT 
                        constraint_name,
                        constraint_type
                    FROM information_schema.table_constraints
                    WHERE table_schema = %s AND table_name = %s
                """, (schema_name, table_name))
                
                constraints = cursor.fetchall()
                schema[full_name]['constraints'] = [
                    {'name': c[0], 'type': c[1]} for c in constraints
                ]
                
                cursor.execute("""
                    SELECT 
                        tc.constraint_name,
                        kcu.column_name,
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND tc.table_schema = %s
                        AND tc.table_name = %s
                """, (schema_name, table_name))
                
                foreign_keys = cursor.fetchall()
                schema[full_name]['foreign_keys'] = [
                    {
                        'constraint': fk[0],
                        'column': fk[1],
                        'ref_schema': fk[2],
                        'ref_table': fk[3],
                        'ref_column': fk[4]
                    } for fk in foreign_keys
                ]
                
                cursor.execute("""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE schemaname = %s AND tablename = %s
                """, (schema_name, table_name))
                
                indexes = cursor.fetchall()
                schema[full_name]['indexes'] = [
                    {'name': idx[0], 'definition': idx[1]} for idx in indexes
                ]
                
                cursor.execute(f"""
                    SELECT COUNT(*) FROM "{schema_name}"."{table_name}"
                """)
                
                row_count = cursor.fetchone()[0]
                schema[full_name]['row_count'] = row_count
                
    finally:
        connection.close()
    
    return schema

def save_schema(schema, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

def main():
    print("正在查询阿里云RDS数据库的表结构...\n")
    rds_schema = get_rds_schema()
    
    print(f"✓ 查询完成，找到 {len(rds_schema)} 张表\n")
    
    save_schema(rds_schema, 'rds_schema.json')
    print("✓ RDS数据库结构已保存到 rds_schema.json\n")
    
    print("表列表:")
    for idx, table_name in enumerate(sorted(rds_schema.keys()), 1):
        table_info = rds_schema[table_name]
        print(f"{idx:3d}. {table_name} ({len(table_info['columns'])} 列, {table_info['row_count']} 行)")

if __name__ == "__main__":
    main()
