# Backup and Restore

## 默认 Harness 备份

Docker Desktop 已运行且系统可以正常打开时，在项目根目录执行：

```powershell
.\backup.ps1
```

默认备份当前 Harness 实际使用的 `local_state\energy-data`。脚本会短暂停止后端以取得一致的 SQLite 与论文文件快照，完成或失败后恢复原先运行的后端。前端不会被修改。

每次成功会在 `backups\` 生成三个同名工件：

- `energy-copilot-<时间>.tar.gz`：数据归档；
- `.tar.gz.sha256`：归档 SHA-256；
- `.tar.gz.manifest.json`：数据库快速检查、Alembic 版本、论文文件数量与引用完整性清单。

`.env`、`runtime-secret.key`、`runtime-secrets.json`、缓存、嵌套备份和未完成的 `.partial` 文件不会进入归档。密钥需按现有安全流程另行保管，不能上传到 Git。

只有旧版标准 Compose 的命名卷需要显式使用：

```powershell
.\backup.ps1 -Standard
```

## 默认 Harness 恢复

恢复会替换当前 `local_state\energy-data`，不要把它当作日常导入功能。运行：

```powershell
.\restore.ps1 -BackupFile .\backups\energy-copilot-<时间>.tar.gz
```

脚本在停止应用和改动当前数据前依次检查：SHA-256、清单、归档成员路径与类型、SQLite、Alembic 版本，以及数据库引用的论文文件。预检失败或取消确认时，当前数据不会改变。

预检通过后，脚本会显示归档、目标目录和恢复前快照路径，并要求完整输入归档文件名。随后它会停止 Harness、创建 `recovery-before-restore-<时间>.tar.gz` 恢复前快照，再替换并重新验证数据。只有最终验证成功才重新启动系统；若替换阶段失败，系统保持停止并显示恢复前快照位置，避免继续写入不完整数据。

旧版命名卷恢复同样必须显式指定：

```powershell
.\restore.ps1 -BackupFile .\backups\energy-copilot-<时间>.tar.gz -Standard
```

自动化或已人工核对文件名的受控操作可以传入 `-ConfirmRestore <归档文件名>`；日常手动恢复不要跳过交互确认。
