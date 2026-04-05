import Link from "next/link";
import { PhotoGallery } from "./PhotoGallery";

export default function HomePage() {
  return (
    <main className="container stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>ChronoBrewery 活动图片直播平台</h1>
        <p className="muted" style={{ margin: 0 }}>
          M3 已接入图片流：优先展示 display 目录，若无衍生图则自动回退 originals。
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" href="/admin/login">
            摄影师后台登录
          </Link>
          <a className="btn btn-secondary" href="/api/photos?limit=20">
            查看图片 API
          </a>
        </div>
      </section>

      <PhotoGallery />

      <section className="card stack">
        <h2 style={{ margin: 0 }}>一句话定义</h2>
        <p className="muted" style={{ margin: 0 }}>
          摄影师上传原图后，系统自动生成前台浏览图与带水印下载图；嘉宾可在首页按时间查看并下载。
        </p>
      </section>
    </main>
  );
}
