# 安装与首次运行

本项目通过 Docker Compose 运行 Next.js 前端与 FastAPI 后端。SQLite、个人论文和上传文件保存在本机 Docker 持久卷；克隆仓库后是空的个人资料库，界面与平台素材随代码提供。

## Windows

1. 安装并启动 Docker Desktop。
2. 在项目根目录打开 PowerShell，创建本机配置并首次构建：

   ```powershell
   Copy-Item .env.example .env
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Rebuild
   ```

3. 打开启动器打印的地址。日后启动可运行 `./start.ps1`。

如需把 Docker 前端构建使用的 npm 源临时改为镜像，可在 PowerShell 本次启动前设置：

```powershell
$env:NPM_REGISTRY = 'https://registry.npmmirror.com'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Rebuild
```

也可在本机 `.env` 添加 `NPM_REGISTRY=https://registry.npmmirror.com` 后运行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Rebuild`。默认仍使用官方 `https://registry.npmjs.org`；网络顺畅时无需修改。`-ExecutionPolicy Bypass` 仅用于本次 PowerShell 进程，不修改系统策略。

## Linux

安装 Docker Engine 与 Docker Compose 插件，然后运行：

```bash
cp .env.example .env
docker compose up -d --build
```

Compose 默认使用官方 npm 源；如网络连接缓慢，可在本机 `.env` 中设置 `NPM_REGISTRY=https://registry.npmmirror.com` 后重新构建。前后端镜像构建期间会联网下载依赖。

打开 `http://localhost:3000`。查看服务状态：

```bash
docker compose ps
```

## 默认演示

`.env.example` 默认使用 Mock 模型，不需要 API 密钥。论文搜索使用公开元数据来源，校园资讯读取其已配置的公开来源；实际返回取决于来源站点与当前网络。上传个人 PDF 后，数据保存在本机，不会因为浏览平台演示素材而共享给其他下载者。

## 可选模型与处理能力

- **云端文本模型**：在应用“系统设置”选择供应商并本机填写密钥，或在本机 `.env` 配置后重启服务。不要把 `.env` 发到 GitHub。
- **Ollama 文本模型**：安装 Ollama 并下载自己选择的文本模型，在系统设置填写 Ollama 地址和模型名。Docker 内访问宿主机时使用 `host.docker.internal` 对应地址；Linux 主机需确认 Docker 可访问该主机服务。
- **论文库语义检索**：默认嵌入配置使用 Ollama `bge-m3`。如需语义向量检索，启动可访问的 Ollama 并安装该模型；仅浏览或 Mock 演示时可先不配置。
- **OCR**：到“系统设置 → 文档视觉与 OCR”查看并确认安装本地 OCR 模型，再从论文详情启动识别。首次下载模型会占用额外磁盘空间。
- **Docling**：后端依赖中提供 Docling 可选解析能力；默认 PDF 阅读流程不要求另行启用。

本地模型用电脑的 CPU、内存或 GPU；模型、供应商的安装方式和资源需求请查看各自的官方说明。真实模型处理仅在用户明确配置并触发相应入口时进行。

## 本地开发

需要 Node.js 24、Python 3.12 和 `uv`。克隆代码后，可分别在两个终端运行前端与后端。PowerShell 示例：

```powershell
git clone https://github.com/Viyao691/energy-storage-research-learning-platform.git
cd energy-storage-research-learning-platform
Copy-Item .env.example .env
```

终端一：

```powershell
npm.cmd --prefix frontend ci
$env:BACKEND_API_URL = 'http://127.0.0.1:8000'
npm.cmd --prefix frontend run dev
```

终端二：

```powershell
Set-Location backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt --python .venv
$env:EMBEDDING_BASE_URL = 'http://127.0.0.1:11434'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

前端开发服务器默认在 `http://localhost:3001`，并将 `/backend-api` 请求转发到 `BACKEND_API_URL`。后端默认使用 Mock 文本模型；需要语义向量检索时再安装并运行 Ollama `bge-m3`。如已用 Docker 占用端口，请为开发服务器选择空闲端口。

Windows 本地虚拟环境按 `backend/requirements.txt` 安装；`backend/requirements.lock.txt` 是当前 Linux x86_64、Python 3.12 CPU Docker 环境的解析锁文件，供 Docker 构建复现依赖，不应拿它替换 Windows venv 安装清单。Dockerfile 另从 PyTorch CPU 官方索引安装锁定的 `torch` 与 `torchvision` 版本，不随仓库复制模型权重。

## 停止与数据

Windows 可运行 `./stop.ps1`；Linux/macOS 可在项目根目录运行：

```bash
docker compose down
```

这会停止容器并保留数据库与论文数据卷。不要运行 `docker compose down -v`，除非你确实要删除此项目的本地资料。更多备份与恢复操作见根目录 [BACKUP_RESTORE.md](../../BACKUP_RESTORE.md)。

## 常见地址

- 前端：Windows 使用启动器打印的 URL；其他平台默认 `http://localhost:3000`。
- 后端健康检查：前端地址对应端口之外的后端默认端口 `8000`，路径 `/health`。Windows 启动器会打印可能调整后的端口。
- API 文档：后端地址 `/docs`。

此配置供个人本地源码开发使用。若要开放为多人网站，部署者需要补充账户认证、数据隔离、线上数据库与文件存储策略。
