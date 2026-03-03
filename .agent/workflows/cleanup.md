---
description: 深度清理项目工作区（移除所有临时日志、调试脚本和打包文件）
---

# 🧹 深度清理工作区 (Workspace Cleanup)

该工作流用于快速、安全地清理开发过程中遗留的各类“垃圾”文件，确保代码库和 Docker 构建环境的绝对整洁。

## 1. 自动清理日志与临时文件

- 此步骤将删除根目录下所有的 `*.txt`, `*.log` 文件（保留必要的 README 等）。
  // turbo-all
  `Get-ChildItem -Path . -File -Filter "*.txt" | Where-Object { $_.Name -notmatch "CMakeLists\.txt|robots\.txt" } | Remove-Item -Force -ErrorAction SilentlyContinue`
  `Get-ChildItem -Path . -File -Filter "*.log" | Remove-Item -Force -ErrorAction SilentlyContinue`

## 2. 自动清理调试脚本

- 删除 `test-*.ts`, `tmp-*.ts`, `check-*.ts`, `tmp_*.ps1` 等一次性脚本。
  `Get-ChildItem -Path . -File | Where-Object { $_.Name -match "^(test|check|tmp|fix)[-_].*\.(ts|js|ps1|sql|py|mjs)$" } | Remove-Item -Force -ErrorAction SilentlyContinue`

## 3. 自动清理残余测试报告与打包文件

- 删除 `*.tar.gz`, `*report*.json`, `*errors*.json` 等。
  `Get-ChildItem -Path . -File | Where-Object { $_.Name -match "report.*\.json|errors.*\.json|\.tar\.gz$" } | Remove-Item -Force -ErrorAction SilentlyContinue`

## 4. 检查敏感文件

- 检查是否有裸露的 `.pem`, `.key` 密钥，若有则移入 `secrets`。
  `if (!(Test-Path -Path "secrets")) { New-Item -ItemType Directory -Force -Path "secrets" | Out-Null; Set-Content -Path "secrets\.gitignore" -Value "*" }; Get-ChildItem -Path . -File -Filter "*.pem", "*.key" | Move-Item -Destination "secrets" -ErrorAction SilentlyContinue`

## 5. 完成提示

- 您可以使用 `git status` 检查当前保持干净的工作区。
  `Write-Host "✅ 工作区清理完成！Docker Context 已经最优化。" -ForegroundColor Green`
