# Deployment

## Docker Compose

Compose 使用两个服务：`frontend` 暴露 3000，`backend` 暴露 8000。SQLite 数据和论文文件位于命名卷 `energy_copilot_data`，容器重建不会清空它。

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

后端启动时会应用数据库迁移。仅绑定本机端口时适用于个人电脑；不要在未设置反向代理、HTTPS、认证和可靠备份的情况下直接暴露到公网。

## 云端升级路径

生产部署应将 SQLite 替换为 PostgreSQL、卷替换为 S3 兼容存储、前置 HTTPS 反向代理，并添加鉴权、任务队列、监控与密钥管理。接口边界已经为这些替换保留空间，但这些能力属于 Phase 7。
