# API 设计

除 `/health` 外，接口前缀均为 `/api/v1`。OpenAPI 单一事实源为 `backend/openapi.json`（由 `backend/scripts/export_openapi.py` 从 `create_app()` 导出），前端类型由 `npm run generate:types` 从该文件生成（`frontend/lib/api.generated.d.ts`）。修改响应结构时应更新 `backend/app/schemas.py` 中的响应模型，再重新导出与生成，不要手写前端类型。

## 核心路由总览

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/health` | 后端与数据库健康检查 |
| GET/POST | `/api/v1/settings` | 读取脱敏配置、更新后端配置 |
| POST | `/api/v1/settings/test-model` | 测试当前模型连接 |
| GET | `/api/v1/settings/models` | 获取当前供应商可用模型的脱敏列表 |
| GET | `/api/v1/diagnostics` | 前后端、数据库、模型、学术来源、存储等诊断 |
| POST | `/api/v1/onboarding/complete` | 完成首次设置 |
| GET | `/api/v1/sources/status` | 四个学术来源的启用与连接状态 |
| GET | `/api/v1/search/papers` | 多源论文搜索 |
| POST | `/api/v1/papers/import` | 按来源 ID 核验并导入论文 |
| POST | `/api/v1/papers/upload` | 校验、解析并上传 PDF |
| GET | `/api/v1/papers` | 分页论文列表 |
| GET | `/api/v1/papers/{id}` | 论文、最新分析与笔记（`PaperDetailResponse`） |
| PATCH | `/api/v1/papers/{id}/state` | 更新收藏/已读状态 |
| POST | `/api/v1/papers/{id}/analysis/{report_type}` | 独立生成快速理解/通俗理解/审稿人速解 |
| POST | `/api/v1/papers/{id}/claims/rebuild` | 建立或更新结论—证据映射 |
| GET | `/api/v1/papers/{id}/claims` | 读取结论—证据映射 |
| GET | `/api/v1/papers/{id}/file` | 在浏览器中读取本地 PDF（支持 `?variant=ocr`） |
| GET | `/api/v1/papers/{id}/visuals` | 获取图表图注、页码和已有解读 |
| GET | `/api/v1/papers/{id}/pages/{page}/image` | 获取受限尺寸的本地页面 PNG |
| GET/POST/DELETE | `/api/v1/papers/{id}/visuals/{visual_id}/crops` | 图表裁切区域的读取、保存与删除 |
| GET | `/api/v1/crops/{crop_id}/image` | 已保存裁切区域的 PNG |
| POST | `/api/v1/papers/{id}/visuals/{visual_id}/analyze` | 按需分析所选图表所在页面 |
| POST | `/api/v1/crops/{crop_id}/analyze` | 按需分析已保存裁切区域 |
| POST | `/api/v1/crops/{crop_id}/extract-data` | 提取裁切图表的近似结构化数据 |
| POST | `/api/v1/papers/{id}/knowledge/ask` | 限定当前论文的检索问答 |
| POST | `/api/v1/papers/{id}/external-compare` | 与外部公开摘要/元数据比较 |
| PUT | `/api/v1/papers/{id}/note` | 保存个人笔记 |
| DELETE | `/api/v1/papers/{id}` | 完整标题确认后永久删除论文 |
| GET/POST | `/api/v1/knowledge/status`、`/reindex`、`/ask` | 论文库索引状态、重建与问答 |
| GET/POST/DELETE | `/api/v1/knowledge/conversations` | 已保存问答会话 |
| POST | `/api/v1/knowledge/compare` | 2–6 篇论文比较 |
| GET/POST/DELETE | `/api/v1/comparisons/saved` | 已保存比较 |
| GET/POST/PATCH/DELETE | `/api/v1/research/subscriptions` | 本地研究订阅 |
| POST | `/api/v1/research/subscriptions/{id}/run` | 手动触发订阅检索 |
| GET | `/api/v1/research/runs`、`/recommendations`、`/notifications`、`/status` | 运行记录、推荐、通知与状态 |
| GET/POST/PATCH/DELETE | `/api/v1/learning/*` | 学习中心（详见下方） |
| GET/POST | `/api/v1/document-ai/status`、`/models/install` | 本地 OCR 模型状态与安装 |
| POST | `/api/v1/papers/{id}/ocr-runs` | 启动本地 OCR（auto/full） |
| GET | `/api/v1/ocr-runs/{id}`、`/papers/{id}/ocr-runs` | 查询 OCR 任务 |
| POST | `/api/v1/ocr-runs/{id}/cancel` | 取消 OCR 任务 |
| POST | `/api/v1/papers/{id}/pages/{page}/cloud-enhance` | 单页云端视觉增强（须确认） |
| GET | `/api/v1/scientific-recipes` | 固定科研配方注册表 |
| GET/POST/PATCH | `/api/v1/papers/{id}/scientific-datasets`、`/scientific-datasets/{id}` | 科研数据集 |
| POST | `/api/v1/scientific-datasets/{id}/analyses` | 运行固定科研配方 |
| GET | `/api/v1/scientific-analyses/{id}`、`/{id}/export` | 分析结果与可复现 ZIP |

旧版聚合入口 `POST /api/v1/papers/{id}/analyze` 已停用（返回 410）；三种理解报告必须分别通过 `POST /papers/{id}/analysis/{report_type}` 生成。

## 模型与密钥

论文业务只依赖 `ModelProvider`。供应商 SDK 或 HTTP 细节不进入业务服务。密钥只由后端读取：优先环境变量，其次后端本地加密存储；API 响应只返回 `configured` 与 `last4`。前端不加载任何密钥。Mock 是默认实现；Ollama 通过 `/api/tags` 与 `/api/chat` 提供无密钥本地文本与按需页面视觉；DeepSeek 与 OpenAI-compatible 当前仅文本；OpenAI 视觉适配器只在用户主动选择页面后调用 Responses API。

## 图表分析约束

图表分析先核验图表属于当前论文、论文具有合法本地 PDF，并检查 `ModelProvider.supports_vision`。不支持视觉的供应商返回清晰 409；失败不写入伪分析。图像分析只发送当前选中页、论文标题、对应图注与截断后的当前页文字；Ollama 在本机处理，云端模式明确提示隐私与费用。无法可靠辨认的坐标、图例、子图或条件必须写"无法确认"，不得猜测。

## 学习中心（Phase 5）

`/api/v1/learning` 前缀，覆盖：

- 资格与候选：`GET /eligible-papers`、`GET /paper-candidates`；
- 学习包：`GET /overview`、`GET/POST /packs`、`GET/DELETE /packs/{id}`、`POST /packs/{id}/generate-cards`、`POST /packs/{id}/generate-quiz`、`GET /packs/{id}/versions`、`POST /packs/{id}/versions`、`POST /packs/{id}/activate`、`POST /packs/{id}/archive`、`GET /pack-comparisons`、`GET /packs/{id}/export`；
- 卡片与掌握：`PATCH /cards/{id}`、`PATCH /cards/{id}/mastery`；
- 自测：`POST /questions/{id}/attempts`、`PATCH /attempts/{id}/self-rating`、`POST /attempts/{id}/feedback`；
- 薄弱项：`POST /packs/{id}/weaknesses`、`PATCH /weaknesses/{id}`、`/weaknesses/{id}/resolve`、`/weaknesses/{id}/reopen`、`POST /weaknesses/{id}/plan-task`；
- 计划：`PUT /packs/{id}/plan`、`PATCH /plan-tasks/{id}`；
- 复习：`GET /review-queue`、`POST /cards/{id}/review`、`PATCH /review-states/{id}`；
- 分析：`GET /analytics?days=7|30|90`；
- 排序：`PATCH /packs/{id}/cards/order`、`/questions/order`、`/plan/tasks/order`。

学习响应模型见 `backend/app/schemas.py`（`Learning*Response` 系列）。掌握状态只能由用户主动确认；生成、答题与计划完成不会自动改变掌握。复习间隔为固定 1/3/7/30 天，按 `USER_TIMEZONE`（默认 `Asia/Shanghai`）的本地日期计算。

## 混合 OCR 与科研数据（Phase 6）

- OCR：原生文字优先；`POST /papers/{id}/ocr-runs` 启动自动或完整本地 OCR，任务异步执行，`GET /ocr-runs/{id}` 轮询进度；完成后生成受管衍生 PDF，`GET /papers/{id}/file?variant=ocr` 可读取。首次模型下载必须在设置页明确确认。
- 云端增强：`POST /papers/{id}/pages/{page}/cloud-enhance` 只上传用户确认的单页与局部文字；结果标记为"待人工确认"，低置信度不得参与计算。
- 科研数据：数据集经人工确认后才允许运行固定白名单配方（`GET /scientific-recipes`）；缺少单位、比例尺、扫描速率等必要条件时拒绝定量结果；`GET /scientific-analyses/{id}/export` 提供 CSV、方法参数、图表、Markdown 报告与固定重跑脚本，不含论文全文与密钥。

## 安全响应约束

- API 密钥只返回 `configured` 与 `last4`；学术来源密钥只返回是否配置。
- 验证错误返回中文 `detail`。
- 重复上传返回 HTTP 409，并包含已有 `paper_id`。
- 上游错误和下载错误不回传原始异常、内部地址或密钥。
- 删除论文（论文/订阅/学习包/会话/比较）要求完整名称/标题二次确认，不精确匹配时返回 409。
