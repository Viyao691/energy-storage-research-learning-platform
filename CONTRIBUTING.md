# Contributing

请保持 local-first、中文可用性和可追溯性。不要提交 `.env`、PDF 数据、数据库、API 密钥或真实用户笔记。新数据库字段必须带 Alembic migration；新模型供应商必须实现 `ModelProvider`；为行为改动运行与改动对应的定向检查，依赖或容器配置变化时再运行相关 build。不要把未执行的测试或构建写成通过。完整架构和资料边界见 `AGENTS.md`，安装与开发见 `docs/github/SETUP.md`。
