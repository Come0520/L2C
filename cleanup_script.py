#!/usr/bin/env python3
"""
L2C 项目清理脚本
使用 Python 完成文件移动操作，避免 shell 命令执行问题
"""

import os
import shutil
from pathlib import Path

# 定义基础路径
BASE_DIR = Path(__file__).parent
SLIDEBOARD_DIR = BASE_DIR / "slideboard-frontend"

def move_test_routes():
    """移动测试路由到 tests/manual-routes/"""
    print("=== 移动测试路由 ===")
    
    test_routes = [
        "custom-config-test",
        "responsive-test", 
        "simple-test",
        "special-features-test",
        "tailwind-test",
        "test"
    ]
    
    src_base = SLIDEBOARD_DIR / "src" / "app"
    dest_base = SLIDEBOARD_DIR / "tests" / "manual-routes"
    
    for route in test_routes:
        src = src_base / route
        dest = dest_base / route
        
        if src.exists():
            print(f"✓ 移动 {src.relative_to(BASE_DIR)} -> {dest.relative_to(BASE_DIR)}")
            shutil.move(str(src), str(dest))
        else:
            print(f"⊘ 跳过 {route} (不存在)")

def archive_demo_modules():
    """归档未使用的演示模块"""
    print("\n=== 归档演示模块 ===")
    
    locale_modules = ["demo", "present"]
    app_modules = ["gifts"]
    
    # 归档 [locale] 目录下的模块
    src_base = SLIDEBOARD_DIR / "src" / "app" / "[locale]"
    dest_base = SLIDEBOARD_DIR / "archives" / "modules"
    
    for module in locale_modules:
        src = src_base / module
        dest = dest_base / module
        
        if src.exists():
            print(f"✓ 移动 {src.relative_to(BASE_DIR)} -> {dest.relative_to(BASE_DIR)}")
            shutil.move(str(src), str(dest))
        else:
            print(f"⊘ 跳过 {module} (不存在)")
    
    # 归档 app 根目录下的 gifts
    for module in app_modules:
        src = SLIDEBOARD_DIR / "src" / "app" / module
        dest = dest_base / module
        
        if src.exists():
            print(f"✓ 移动 {src.relative_to(BASE_DIR)} -> {dest.relative_to(BASE_DIR)}")
            shutil.move(str(src), str(dest))
        else:
            print(f"⊘ 跳过 {module} (不存在)")

def check_supabase():
    """检查 Supabase 配置"""
    print("\n=== 检查 Supabase 配置 ===")
    
    supabase_dir = SLIDEBOARD_DIR / "supabase"
    
    if supabase_dir.exists():
        seed_file = supabase_dir / "seed.sql"
        if seed_file.exists():
            dest = BASE_DIR / "supabase" / "seed.sql"
            print(f"✓ 复制 {seed_file.relative_to(BASE_DIR)} -> {dest.relative_to(BASE_DIR)}")
            shutil.copy2(str(seed_file), str(dest))
            
            print(f"✓ 删除 {supabase_dir.relative_to(BASE_DIR)}/")
            shutil.rmtree(str(supabase_dir))
        else:
            print("⊘ seed.sql 不存在")
    else:
        print("⊘ supabase 文件夹不存在 (已在 L2C 根目录)")

def verify_results():
    """验证清理结果"""
    print("\n=== 验证清理结果 ===")
    
    manual_routes = SLIDEBOARD_DIR / "tests" / "manual-routes"
    archives = SLIDEBOARD_DIR / "archives" / "modules"
    
    print("\n测试路由:")
    if manual_routes.exists():
        for item in manual_routes.iterdir():
            print(f"  - {item.name}")
    else:
        print("  (目录不存在)")
    
    print("\n归档模块:")
    if archives.exists():
        for item in archives.iterdir():
            print(f"  - {item.name}")
    else:
        print("  (目录不存在)")

def main():
    print("=" * 50)
    print("L2C 项目清理脚本")
    print("=" * 50)
    print()
    
    try:
        move_test_routes()
        archive_demo_modules()
        check_supabase()
        verify_results()
        
        print("\n" + "=" * 50)
        print("清理完成！")
        print("=" * 50)
        print("\n后续步骤:")
        print("1. 运行 'npm run build' 验证构建")
        print("2. 检查是否有导入路径需要更新")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
