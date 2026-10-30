# 我们这一家 · 家庭相册

面向手机和电脑的家庭照片、MP4 相册。按网站所有者的要求，无账号登录；任何访问者都可以查看、创建成员、上传和删除内容。

## 部署到 Cloudflare Pages

1. 将本目录的文件上传到 GitHub 仓库 `qq951545420-png/family-album` 的 `main` 分支。
2. Cloudflare Pages 连接该仓库；框架选 `None`，不设置构建命令，输出目录填 `/`。
3. 首次部署即可浏览已导入的 10 张照片和 1 个 MP4。
4. 开启修改：创建只允许此仓库 **Contents: Read and write** 的 GitHub fine-grained personal access token；在 Pages 项目的 **Settings → Variables and Secrets** 中添加加密变量 `GITHUB_TOKEN`，然后重新部署。不要把令牌写进仓库或网页。

默认仓库配置在 `_worker.js`。如需换仓库，可设置 `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`。

## 文件与行为

- `index.html`、`style.css`、`app.js`：相册页面。
- `_worker.js`：Pages advanced-mode API，服务端使用令牌保存文件。
- `_routes.json`：仅 API、媒体请求经过 Worker。
- `state.json`：成员和照片说明。照片、MP4 文件保存在仓库根目录。
- 初始日期根据原始文件名整理，原始文件没有改动。
- 支持 JPG、PNG、WebP、GIF、MP4；单文件最多 20 MiB。
- 上传先流式创建 GitHub blob，再将照片和相册说明通过同一个 Git 提交保存，避免中途失败产生半条记录。
- 同时编辑会自动重试，并保留其他人的更新。保存使用 `[Skip CI]` 前缀，避免每次修改触发 Pages 重建。Worker 从 GitHub 读取最新相册。
- 无令牌时只提供浏览，不会将修改冒充为已保存。
- 移除成员会把照片转入“家庭共享”。删除照片会移除仓库当前版本；Git 历史可能保留旧版本，不是彻底抹除。
- MP4 是否可播放取决于编码。此次导入的视频已检测为 H.264/AAC。
- 本方案不需要 R2、付费数据库、独立服务器或购买域名。免费套餐和 GitHub API 有额度限制。

此网站没有访问身份验证，这是所有者明确选择的共享方式。发布后不要在此相册存放需要保密的资料。
