## 安装方式

1. 下载远程存储库：
```bash
git clone https://gitee.com/fftt52536/g9d.git
cd g9d
```
2. 安装依赖：
```bash
npm install
```
3. 将g9d.sql运行到你的mysql数据库中，数据库名为`g9d`，运行时的编码为`UTF-8`。
4. 编辑config.example.js文件，**并另存为config.js。**

5. 安装过程就结束了。接下来就可以运行网站了！

## 在Windows下配置虚拟域名（选做）

1. 打开`C:\Windows\System32\drivers\etc\hosts`。
2. 添加下面三行：
```
127.0.0.1 g9d.site
0.0.0.0 g9d.site
127.0.0.1 www.g9d.site
```
3. `g9d.site`就应该会成功的指向127.0.0.1。

## 运行网站

1. 配置环境变量。
```bash
set PORT=80
set DEBUG=g9d:*
```

2. 启动服务器。
```bash
npm start
```

3. 打开g9d.site，应该就是你自己本地部署的网站了。