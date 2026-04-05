# ChronoBrewery 活动图片直播平台

本仓库用于管理 `ChronoBrewery` 活动图片直播平台需求文档（v1）及后续开发代码。

## 项目一句话

摄影师上传原图后，系统自动生成前台浏览图（`display`）和带水印高清下载图（`download`）；嘉宾在首页按时间查看并下载。

## 目标范围（v1）

- 单活动（`default`）
- 单后台账号
- 摄影师后台登录与上传
- 首页图片时间倒序浏览
- 预览与下载
- 自动生成 `display` / `download`

## 文档目录

- `docs/chronobrewery_photo_requirements_v1.docx`：原始需求文档
- `docs/chronobrewery_photo_requirements_v1.txt`：纯文本提取版
- `docs/vercel_setup.md`：Vercel 配置与上线步骤

## 技术方向（文档定义）

- 前端与轻量后端：Next.js 14（App Router + API Routes）
- 存储与处理：腾讯云 COS + 数据万象（CI）
- 部署：Vercel + GitHub
- 域名：`photo.dbbrewbeer.com`（后台入口 `/admin`）

## 环境变量（建议）

- `TENCENT_COS_BUCKET`
- `TENCENT_COS_REGION`
- `TENCENT_SECRET_ID`
- `TENCENT_SECRET_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ACTIVITY_SLUG`

复制模板后填写：

```bash
cp .env.example .env.local
```

## 本地启动

```bash
npm install
npm run dev
```

访问：

- 前台：`http://localhost:3000`
- 登录：`http://localhost:3000/admin/login`
- 后台：`http://localhost:3000/admin`

## 当前实现状态（M1）

- 已完成：Next.js 14 初始化、基础页面骨架、登录 session、API 路由占位
- 待完成：腾讯云 COS 临时授权、上传与处理链路、真实图片列表和下载

## 里程碑（建议）

1. M1：项目初始化（仓库、Vercel、Next.js、环境变量骨架）
2. M2：后台登录与上传
3. M3：图片处理与首页浏览/下载
4. M4：域名联调与上线
