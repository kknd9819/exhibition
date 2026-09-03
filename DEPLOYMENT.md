# 会展中枢部署说明

本文用于在另一台 Windows 机器部署当前分支 `feature/springboot-mysql-migration`。

## 1. 压缩包内容

压缩包包含完整项目源码：

- `app`、`components`、`public`：前端页面、组件和静态资源
- `backend`：JDK 8 + Spring Boot + MyBatis-Plus 后端
- `db`：服务端查询描述和原始数据结构
- `scripts`：初始化、启动、备份和冒烟检查脚本
- `backend/src/main/resources/db/migration`：Flyway 建表与种子数据
- `.env.example`、`README-LOCAL.md`：环境变量和本地运行说明

压缩包不包含公共库和本机构建产物，目标机需要重新生成 `node_modules`、`backend/target`、`.next`、`dist` 和 Maven 本地依赖缓存。

## 2. 目标机环境

- Windows 10/11 或 Windows Server
- PowerShell 7
- JDK 8，必须包含 `javac`
- Node.js 22.13 或更高版本
- pnpm
- MySQL 8.0.39

检查版本：

```powershell
java -version
javac -version
node --version
pnpm --version
mysql --version
```

## 3. 解压与安装依赖

```powershell
Expand-Archive .\会展系统2-springboot-mysql-<commit>.zip -DestinationPath .\会展系统2
Set-Location .\会展系统2
pnpm install --frozen-lockfile
```

后端首次构建时，`backend\mvnw.cmd` 会下载 Maven 和 Maven 依赖。网络受限时，请提前配置 Maven 镜像或准备本地 Maven 缓存。

## 4. 初始化 MySQL

### 使用 Docker

```powershell
Set-Location .\backend
docker compose up -d mysql
docker compose ps
```

容器使用 MySQL 8.0.39，默认数据库名为 `exhibition`，默认示例账号为 `exhibition`。正式环境请修改 compose 文件中的密码。

### 使用已有 MySQL

使用管理员账号执行：

```sql
CREATE DATABASE exhibition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'exhibition'@'%' IDENTIFIED BY '替换为强密码';
GRANT ALL PRIVILEGES ON exhibition.* TO 'exhibition'@'%';
FLUSH PRIVILEGES;
```

数据库保持为空即可。后端第一次启动时 Flyway 会自动执行 `V1__schema.sql` 和 `V2__seed.sql`。

## 5. 配置后端

在启动后端的 PowerShell 会话中设置环境变量：

```powershell
$env:MYSQL_URL='jdbc:mysql://127.0.0.1:3306/exhibition?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true'
$env:MYSQL_USER='exhibition'
$env:MYSQL_PASSWORD='替换为数据库密码'
$env:INTERNAL_QUERY_TOKEN='替换为随机长字符串'
$env:ALPHA_SHOW_OTP='false'
$env:FILE_STORAGE_ROOT='D:\exhibition-data\files'
```

`INTERNAL_QUERY_TOKEN` 必须同时提供给前端服务端进程。正式环境建议通过 Windows 服务管理器、容器 Secret 或 CI/CD Secret 注入，避免写入源码。

## 6. 构建与启动后端

```powershell
Set-Location .\backend
.\mvnw.cmd test
.\mvnw.cmd package
java -jar .\target\exhibition-backend-1.0.0-SNAPSHOT.jar
```

确认后端：

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/system/ping
```

返回 `status: UP` 后再启动前端。后端默认端口为 `8080`，可用 `SERVER_PORT` 覆盖。

## 7. 启动前端

开发或内网验收环境：

```powershell
Set-Location ..
$env:BACKEND_PUBLIC_URL='http://127.0.0.1:8080'
$env:BACKEND_INTERNAL_URL='http://127.0.0.1:8080'
$env:INTERNAL_QUERY_TOKEN='与后端相同的随机值'
pnpm dev:lan
```

访问 `http://localhost:3000/`。也可以使用 `.\scripts\start-local.ps1` 自动检查并启动后端与前端。

## 8. 生产运行与网关

构建前端：

```powershell
pnpm build
pnpm start
```

生产环境请由 Nginx、IIS 或其他网关完成以下转发：

- `/` 转发到前端 `127.0.0.1:3000`
- `/api/` 转发到后端 `127.0.0.1:8080`

必须转发 `Host`、`X-Forwarded-Proto`、`X-Forwarded-For`，并允许 Cookie 往返。前端 SSR 进程的 `BACKEND_INTERNAL_URL` 应指向后端内网地址。生产服务器本身不提供 Vite 开发代理，缺少网关转发时直接访问生产进程的 `/api` 会得到 404。

## 9. 冒烟检查

```powershell
.\scripts\smoke-local.ps1 -BaseUrl http://localhost:3000
```

该脚本检查登录入口、公开门户、议程、新闻、资料、展商、报名、企业工作台和数据资产页面。

## 10. 备份与恢复

目标机安装 MySQL 客户端工具后执行：

```powershell
.\scripts\backup-local.ps1
```

备份目录包含 `exhibition.sql` 和 `manifest.json`。恢复前先做完整性检查：

```powershell
.\scripts\recovery-drill-local.ps1 -BackupDirectory .\outputs\backups\mysql-backup-<时间戳>
```

文件上传内容位于 `FILE_STORAGE_ROOT`，数据库备份和文件目录需要分别纳入备份策略。

## 11. 常见问题

- 首页显示 `This page couldn't load`：检查 8080 后端和 MySQL 3306，再确认浏览器访问的是 3000 端口。
- Flyway 报数据库不支持：确认使用 MySQL 8.0.x，并确认 `flyway-mysql` 依赖已下载。
- `/api` 返回 404：生产模式缺少网关转发；开发模式请使用 `pnpm dev:lan`。
- 内部查询返回 403：前端服务与后端的 `INTERNAL_QUERY_TOKEN` 不一致。
- 上传失败：检查 `FILE_STORAGE_ROOT` 是否存在且运行账号有写权限。
