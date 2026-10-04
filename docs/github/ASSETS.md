# 公开版素材与许可

公开版本会包含当前网站实际使用的首页贴图、论文卡片主题插画、储能编年史图片、城市应用教学示意图和校园界面图。这些页面素材属于产品展示的一部分。用户已明确确认：企业照片拥有再分发授权，本次公开版保留全部原图。

## 当前页面素材

- **首页主题与贴图**：[`frontend/public/home-hero/scene-light.webp`](../../frontend/public/home-hero/scene-light.webp)、[`scene-dark.webp`](../../frontend/public/home-hero/scene-dark.webp)、[`title-light.svg`](../../frontend/public/home-hero/title-light.svg)、[`title-dark.svg`](../../frontend/public/home-hero/title-dark.svg)。主题参数和场景贴图见同目录 `city-theme.json`、`scene-layout.json` 与相关纹理图片。这些是当前首页使用的网页贴图；历史归档中的旧 3D 模型、场景源文件和开发实验不属于当前素材清单。
- **论文卡片主题插画**：[`frontend/public/workspace/paper-art/`](../../frontend/public/workspace/paper-art/) 内的 `paper-01.webp` 至 `paper-24.webp`，由论文 ID 分配作为主题插画。页面另使用 [`topics-light.webp`](../../frontend/public/workspace/topics-light.webp) 与 [`topics-dark.webp`](../../frontend/public/workspace/topics-dark.webp) 展示研究主题图案。
- **论文自身封面图**：用户导入本地 PDF 后，应用可生成其页面内插图缩略图供本人资料库卡片展示。这些图像由用户自己的 PDF 派生，保存在本地用户资料，不属于仓库公共素材，也不会随代码发布。
- **储能编年史图片**：[`frontend/lib/chronicle/assets.json`](../../frontend/lib/chronicle/assets.json) 保留图片来源、署名、许可和主题说明；对应展示图片在 [`frontend/public/chronicle/`](../../frontend/public/chronicle/)。
- **储能城市应用示意图**：[`frontend/public/images/storage-city-applications.png`](../../frontend/public/images/storage-city-applications.png) 用图示解释八类典型城市能源场景和三种工况，属于教学示意，不是城市实测数据。
- **校园界面图**：当前功能使用的校园图片位于 [`frontend/public/workspace/campus-header/`](../../frontend/public/workspace/campus-header/) 与 [`frontend/public/workspace/onboarding-campus/`](../../frontend/public/workspace/onboarding-campus/)。
- **GitHub 页面截图**：[`docs/github/screenshots/`](screenshots/) 用于展示应用界面，不是应用运行所需素材。

## 来源与许可

编年史图片的逐项来源、作者/署名、已知许可及来源站点说明保留在 `frontend/lib/chronicle/assets.json`。其他图片按上述当前运行目录保留；本次发布依据用户对企业照片再分发授权的确认保留完整原图。旧素材记录中可能出现来源页未标注开放许可或“仅本地展示”等备注；这些原始来源说明继续保留，不能被解释为 MIT 对第三方内容的授权。复用单项素材时应保留现有署名和来源信息，并遵循用户确认的本次授权范围及素材记录。

根目录 MIT License 只适用于项目代码，不转授第三方摄影、企业/机构标识、字体、图标、模型或其他内容的版权。用户上传的论文、数据和自行生成结果由相应用户管理，不属于仓库素材。
