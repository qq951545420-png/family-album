# 我们这一家 · 家庭相册

面向手机和电脑的家庭照片、MP4 相册。按网站所有者的要求，无账号登录；任何访问者都可以查看、创建成员、上传和删除内容。

## 部署到 Cloudflare Pages

1. 将本目录的文件上传到 GitHub 仓库 `qq951545420-png/family-album` 的 `main` 分支。
2. Cloudflare Pages 连接该仓库；框架选 `None`，不设置构建命令，输出目录填 `/`。
3. 首次部署即可浏览已导入的 10 张照片和 1 个 MP4。
4. 开启修改：创建只允许此仓库 **Contents: Read and write** 的 GitHub fine-grained personal access token；在 Pages 项目的 **Settings → Variables and Secrets** 中添加加密变量 `GITHUB_TOKEN`，然后重新部署。不要把令牌写进仓库或网页。

默认仓库配置在 `_worker.js`。如需换仓库，可设置 `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`。

## 文件与行为

- `index.html`、`style.css`、`app.js`：留白美术馆风格的相册页面。
- `motion.js`：封面滚动视差、相片逐批浮现、照片展开与阅读进度；使用浏览器原生能力，不引入第三方动效库。支持系统“减少动态效果”设置，手机使用更轻的位移。
- `_worker.js`：Pages advanced-mode API，服务端使用令牌保存文件。
- `_routes.json`：仅 API、媒体请求经过 Worker。
- `state.json`：成员和照片说明。照片、MP4 文件保存在仓库根目录。
- 初始日期根据原始文件名整理，原始文件没有改动。
- 支持 JPG、PNG、WebP、GIF、MP4；单文件最多 20 MiB。
- 上传先流式创建 GitHub blob，再将照片和相册说明通过同一个 Git 提交保存，避免中途失败产生半条记录。
- 同时编辑会自动重试，并保留其他人的更新。保存使用 `[Skip CI]` 前缀，避免每次修改触发 Pages 重建。Worker 从 GitHub 读取最新相册。
- 无令牌时只提供浏览，不会将修改冒充为已保存。
- 写入令牌失效时，会从公开 GitHub 仓库读取最新相册以继续浏览；公开读取可能存在短暂缓存。
- 媒体优先读取 Cloudflare 已部署资源，并使用边缘缓存；上传后尚未随部署发布的文件才回源 GitHub。媒体 URL 使用唯一文件名，浏览器可缓存一天。
- 新上传照片额外生成最长边 720 像素的 JPEG 预览图，原图保留；预览图和原图在同一个提交中保存、删除。列表不会提前下载视频。
- 旧版上传的照片在打开大图后，会在后台补充预览图；补充操作只修改该照片的预览字段，保留原图和其他家人的并发更新。
- 上传进度来自浏览器实际传输字节；传输结束后单独显示等待 GitHub 保存的阶段。请求设置超时，并用上传标识防止重试产生重复照片。
- 移除成员会把照片转入“家庭共享”。删除照片会移除仓库当前版本；Git 历史可能保留旧版本，不是彻底抹除。
- MP4 是否可播放取决于编码。此次导入的视频已检测为 H.264/AAC。
- 本方案不需要 R2、付费数据库、独立服务器或购买域名。免费套餐和 GitHub API 有额度限制。

此网站没有访问身份验证，这是所有者明确选择的共享方式。发布后不要在此相册存放需要保密的资料。

## 背景音乐

以下曲目均由 Kevin MacLeod (https://incompetech.com/) 创作，使用 Creative Commons Attribution 4.0 授权：https://creativecommons.org/licenses/by/4.0/ 。音乐控件保留曲名、作者、原曲来源、授权及改动说明。

- Carefree — https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037
- Almost New — https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1800008
- Relaxing Piano Music — https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500075

本站版本经 96 kbps MP3 压缩及音量降低，Relaxing Piano Music 节选前 4 分钟并添加结尾淡出。原曲下载来源为作者官方网站的 mp3-royaltyfree 目录。首次点击“播放音乐”才加载音频，每轮随机排序，轮次之间避免连续重复；可点下一首及调节音量。播放相册视频时暂停背景音乐，结束或关闭视频后恢复。离开页面时暂停，返回时仅在此前主动播放过的情况下恢复；重新打开网站不会自动播放。

音乐作为家庭影像相册的背景，不需要外部音乐 API 或付费账号。免费授权说明：https://web.incompetech.com/music/royalty-free/licenses/ 。
