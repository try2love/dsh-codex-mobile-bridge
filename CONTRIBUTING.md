# 维护与验证

运行时源码为 `index.mjs`、`host.mjs`、`cordis.patch.yml`。修改后执行 `npm test`、`npm run pack:local`，并在 Bridge 中执行对应协议回归。测试使用临时目录与本机回环端口，不需要真实账号。

`SOURCE.json` 记录首次导入的来源与哈希，不随代码修改伪造更新。`LICENSE`、`LICENSE.coding-mobile` 保留原作者许可，适配来源为 `2389859005/coding-mobile` 的 `7a8f003` 提交。初始提交为源码导入，不代表保留了上游完整 Git 历史。

Bridge 内置副本暂时继续保留，以保障官方客户端一键安装和网关导出。升级时，在专题分支审查本仓库固定提交，将三个运行时文件、许可证和版本协议字段同步到 Bridge，更新来源锁文件，然后执行 `scripts/check-dsh-plugin-source.py --plugin-repo <本仓库绝对路径>` 和插件回归。不要从浮动 main 自动更新运行中的接入。

`.tmp/dist/` 的 ZIP 和 TGZ 仅包含七个发布文件，固定时间戳和文件顺序保证同一源码得到相同 SHA-256。市场草稿时间戳 0 不能发布：须在获授权实际发布 npm 后替换为真实发布时间并核验公开索引地址。当前没有远程仓库，没有自动发布工作流；package 元信息仍指向来源项目，公开独立仓库时再改为真实地址。
