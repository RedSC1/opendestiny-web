# 静态工具站

无需账号、服务器、数据库或运行时 npm。所有记录和偏好仅保存在访问者当前浏览器的当前站点存储里。跨域名、跨端口或换设备不会自动同步，清理浏览器网站数据会删除记录。

## 当前功能

- 塔罗：使用站内 vendor 的牌堆逻辑和 WebP 资源，完成翻牌后自动保存问题、牌阵、牌面、位置和正逆位；可以回看、逐条删除或确认清空。
- 八字、紫微：使用 npm 发布的 `bazi-lite`、`ziwei-lite` 与 `js-ephemeris-lite` 生成计算代码；保存最后一次成功排盘的完整输入、设置和结果，支持重开命例。保存后的表单编辑不会混入旧结果。
- 首页：自动按最近 30 个 UTC 自然日的工具打开次数推荐，同分按稳定目录顺序选择；支持手动固定任意工具。
- 万年历、气朔：已经接入统一工作台，并使用 npm 发布的历法计算内核生成浏览器端代码。

## 本地开发

依赖位置见 LOCAL-PACKAGES.md。修改八字或紫微内核后：

```sh
npm run prepare:tools
npm run dev
```

prepare:tools 从相邻的 webpage 与 OpenDestiny/tarot 同步界面，再输出本站适配版本。适配逻辑在 scripts/prepare-tools.mjs；覆盖样式在 tool-src/tool-theme.css；历史、命例存储逻辑在 public/shared。生成的 public/tools 可直接随站点发布，访问者不需要相邻源码目录。

```sh
npm test
npm run build
npm run preview
```

最终静态目录为 **dist/client**，预览默认 http://127.0.0.1:4174/。

## GitHub Pages 或其他静态托管

上传 dist/client 的全部内容（含 .nojekyll），以站点根路径提供服务，例如绑定 tools.redsc1.com 的 GitHub Pages，或用户名根站点。当前交付按根路径构建；尚未支持 /仓库名/ 形式的项目子路径，不要直接套用该目录结构。

不需要上传 dist/server，也不需要 npm 登录或服务器进程。仓库已提交生成后的静态工具文件，GitHub Actions 可以直接运行 `npm ci` 与 `npm run build`。`npm run prepare:tools` 的计算内核来自 npm；页面迁移和塔罗 vendor 刷新仍需要旧页面与塔罗的相邻源码目录。

## Vercel

仓库根目录的 `vercel.json` 已把框架预设设为 Other，并指定运行 `npm run build` 后发布 `dist/client`。连接 GitHub 仓库后无需在 Vercel 控制台另填构建命令或输出目录；推送到生产分支会触发新的静态部署。

## 验证范围

自动测试覆盖记录隔离清空、重复保存更新、存储不足、损坏数据保留、命例字段恢复和首页推荐规则。静态导出、资源路径和主要页面截图已经检查。WebMCP 提供记录数量和首页偏好接口，已在模拟注册环境测试；未在支持 WebMCP 的真实浏览器验证。
