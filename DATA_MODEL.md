# 数据模型

数据库使用 SQLite，结构由 Alembic 迁移管理。

## `papers`

一条记录既可以是用户上传的全文，也可以是联网导入的摘要或元数据。

主要字段：

- 本地文件：`original_filename`、`file_path`、`file_hash`、`file_size`；
- 解析：`page_count`、`extracted_text`、`parse_confidence`、`extraction_warning`、`fulltext_status`；
- 书目：`title`、`normalized_title`、`doi`、`arxiv_id`、`authors_json`、`abstract`、`journal`、`published_date`、`keywords_json`；
- 来源：`landing_url`、`pdf_url`、`oa_status`、`license`、`source_type`；
- 获取状态：`acquisition_status`；
- 审计：`created_at`。

`original_filename`、`file_path`、`file_hash` 允许为空，以支持只保存元数据；此时 `file_size` 为 `0`。`file_hash`、标准化 DOI 和 arXiv ID 用于强去重；标题、第一作者和年份用于无强标识时的保守去重。

## `paper_source_records`

保存同一论文在不同学术来源中的可追溯记录：

- `paper_id`
- `source`
- `external_id`
- `landing_url`
- `pdf_url`
- `is_open_access`
- `license`
- `raw_metadata_json`
- `created_at`
- `updated_at`

`source + external_id` 唯一，外键删除采用级联。

## `paper_visuals`

保存从 PDF 文字层识别出的图表线索和按需分析：

- 归属与定位：`paper_id`、`page_number`；
- 图表信息：`kind`、`label`、`caption`；
- 分析：`analysis_markdown`、`evidence_status`、`provider`、`model_name`；
- 审计：`created_at`、`updated_at`。

`paper_id + page_number + kind + label` 唯一，删除论文时级联删除。分析为空表示只完成了本地图注识别，不能描述为模型已经读取图像。

## `paper_chunks`

保存 Phase 3A 个人论文库检索单元：

- 定位：`paper_id`、`page_number`、`chunk_index`、`section`；
- 证据：`content`、`source_scope`、`parse_confidence`；
- 索引：`content_hash`、`embedding_json`、`embedding_model`；
- 审计：`created_at`。

全文文本块保留 PDF 页码；摘要文本块的页码为空并明确标记 `abstract`。同一论文、内容哈希和嵌入模型组合唯一，删除论文时级联删除全部文本块。

## 其他 Phase 1 表

| 表 | 用途 |
|---|---|
| `analyses` | 论文分析、证据标签、供应商和模型版本 |
| `notes` | 每篇论文的用户笔记 |
| `user_settings` | 非密钥设置、研究方向和首次设置状态 |
| `task_runs` | 任务运行记录 |

## 迁移

- `0001_initial.py`：Phase 1 基础结构；
- `0002_remove_legacy_api_key.py`：不可逆移除旧密钥列；
- `0003_phase2_paper_search.py`：扩展论文元数据、允许无本地文件、增加来源记录及索引。
- `0004_paper_visuals.py`：增加图表图注、页码和按需视觉分析记录。
- `0007_paper_chunks.py`：增加逐页/摘要文本块、来源定位和本地向量索引。

`0003` 使用 SQLite batch migration，并先迁移原有论文标题的标准化值。升级保留现有论文、分析和笔记。降级到 Phase 1 无法表达“仅元数据论文”，因此会删除这类记录；生产操作前必须备份。

API 密钥不进入数据库列。模型网页配置由后端加密保存在本地数据卷；环境变量优先。Semantic Scholar 密钥只从后端环境配置读取。
