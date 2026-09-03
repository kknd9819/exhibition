# 会展中枢：本地运行说明

## 技术架构

- 前端：React 19、Next.js 16、vinext、TypeScript
- 后端：JDK 1.8、Spring Boot 2.7.18、MyBatis-Plus 3.5.5
- 数据库：MySQL 8.0.39，字符集 `utf8mb4`
- 数据迁移：Flyway
- Excel 导入：Apache POI

前端继续使用原有 `/api/...` 地址。开发环境由 Vite 将 `/api` 转发到 `http://127.0.0.1:8080`；生产环境应由网关完成相同转发。服务端渲染通过带内部凭据的只读 SQL 通道查询 MySQL，该通道只接受单条 `SELECT` 并校验数据表白名单。

## 目录

- `app`、`components`：前端页面和组件
- `backend`：Spring Boot 后端项目
- `backend/src/main/resources/db/migration`：MySQL 建表与演示数据
- `backend/src/main/resources/api-contract.json`：迁移前的 107 条 HTTP 方法契约
- `db/schema.ts`：服务端渲染使用的类型化查询描述

## 环境要求

- JDK 8，`JAVA_HOME` 指向 JDK 根目录，且 `javac -version` 可用
- Node.js 22.13 或更高版本
- pnpm
- MySQL 8.0.39（兼容 JDK 8 / Spring Boot 2.7 的固定版本）
- Windows PowerShell 7

Maven 已通过 `backend/mvnw.cmd` 随项目提供。

## 初始化 MySQL

已安装 Docker 时可执行：

```powershell
Set-Location .\backend
docker compose up -d mysql
```

也可使用已有 MySQL 8，并创建空数据库与账号：

```sql
CREATE DATABASE exhibition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'exhibition'@'%' IDENTIFIED BY 'exhibition';
GRANT ALL PRIVILEGES ON exhibition.* TO 'exhibition'@'%';
```

Spring Boot 首次启动时由 Flyway 自动创建 82 张业务表并写入脱敏演示数据。

## 环境变量

默认值适用于本机 Alpha。部署环境应覆盖密码和内部查询凭据：

```powershell
$env:MYSQL_URL='jdbc:mysql://127.0.0.1:3306/exhibition?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true'
$env:MYSQL_USER='exhibition'
$env:MYSQL_PASSWORD='exhibition'
$env:INTERNAL_QUERY_TOKEN='替换为足够长的随机值'
$env:BACKEND_INTERNAL_URL='http://127.0.0.1:8080'
$env:BACKEND_PUBLIC_URL='http://127.0.0.1:8080'
```

正式环境应将 `ALPHA_SHOW_OTP=false`，避免验证码出现在接口响应中。

## 启动

安装前端依赖后执行：

```powershell
pnpm install
.\scripts\start-local.ps1
```

脚本会检查 JDK 8 和 MySQL 端口，构建并启动 Spring Boot，确认 `/api/system/ping` 可用后启动前端。

也可以分别启动：

```powershell
Set-Location .\backend
.\mvnw.cmd spring-boot:run
```

```powershell
pnpm dev:lan
```

## 访问入口

- 管理后台：`http://localhost:3000/`
- 员工登录：`http://localhost:3000/login`
- 公开门户：`http://localhost:3000/exhibition/2026-morocco`
- 企业工作台：`http://localhost:3000/company-workspace/login`
- 后端连通检查：`http://localhost:8080/api/system/ping`

员工 Alpha 账号为 `15000000001`、`15000000002`、`15000000003`。企业账号示例为 `13800002048` 和 `+212600000889`。`ALPHA_SHOW_OTP=true` 时，验证码随发送接口响应返回。

## 生产网关示例

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
    proxy_pass http://127.0.0.1:3000;
}
```

内部查询端点 `/api/internal/query` 应限制为前端服务所在内网访问，并配置独立随机凭据。

## 构建与检查

```powershell
Set-Location .\backend
.\mvnw.cmd test
.\mvnw.cmd package
Set-Location ..
pnpm lint
pnpm build
.\scripts\smoke-local.ps1
```

## Git 保护点

- 原项目完整快照：`backup/pre-springboot-migration-20260903`
- Java/MySQL 迁移分支：`feature/springboot-mysql-migration`
- 原项目快照提交：`1ce7d17`
