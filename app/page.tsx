import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>ChronoBrewery 活动图片直播平台</h1>
        <p className="muted" style={{ margin: 0 }}>
          M1 初始化完成：当前为首页骨架，后续将在 M3 接入真实图片列表（display）与预览下载。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/admin/login">
            摄影师后台登录
          </Link>
          <a className="btn btn-secondary" href="/api/photos">
            查看图片 API（占位）
          </a>
        </div>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>一句话定义</h2>
        <p className="muted" style={{ margin: 0 }}>
          摄影师上传原图后，系统自动生成前台浏览图与带水印下载图；嘉宾可在首页按时间查看并下载。
        </p>
      </section>
    </main>
  );
}
