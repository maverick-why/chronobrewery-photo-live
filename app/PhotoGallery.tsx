"use client";

import { useEffect, useMemo, useState } from "react";

type PhotoItem = {
  key: string;
  displayKey: string;
  downloadKey: string;
  originalKey: string;
  displayUrl: string;
  previewUrl: string;
  source: "display" | "originals";
  size: number;
  uploadedAt: string;
};

type PhotosResponse = {
  photos: PhotoItem[];
  source: "display" | "originals";
  activitySlug: string;
  count: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [source, setSource] = useState<"display" | "originals">("display");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPhotos() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/photos?limit=120", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as PhotosResponse | { error?: string } | null;
      if (!response.ok || !data || !("photos" in data)) {
        throw new Error((data && "error" in data && data.error) || "加载图片失败");
      }

      setPhotos(data.photos);
      setSource(data.source);
    } catch (e) {
      const message = e instanceof Error ? e.message : "加载图片失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPhotos();
  }, []);

  const subtitle = useMemo(() => {
    if (source === "display") {
      return "当前展示来自 display 目录（标准浏览流）。";
    }
    return "当前展示来自 originals 回退流（display 尚未生成时自动启用）。";
  }, [source]);

  return (
    <section className="card stack">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div className="stack" style={{ gap: 4 }}>
          <h2 style={{ margin: 0 }}>活动图片</h2>
          <p className="muted" style={{ margin: 0 }}>
            {subtitle}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadPhotos()} type="button">
          刷新列表
        </button>
      </div>

      {loading ? <p className="muted">加载中...</p> : null}
      {error ? (
        <p style={{ color: "#af2934", margin: 0 }}>
          {error}
          {"，请检查 COS 权限、目录和环境变量。"}
        </p>
      ) : null}

      {!loading && !error && !photos.length ? (
        <p className="muted" style={{ margin: 0 }}>
          暂无图片，请先到后台上传。
        </p>
      ) : null}

      {!loading && !error && photos.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 14
          }}
        >
          {photos.map((photo) => (
            <article
              key={photo.key}
              style={{ border: "1px solid #d9e2ef", borderRadius: 12, overflow: "hidden", background: "#fff" }}
            >
              <a href={photo.previewUrl} rel="noreferrer" target="_blank">
                <img
                  alt={photo.key}
                  loading="lazy"
                  src={photo.previewUrl}
                  style={{ display: "block", width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
                />
              </a>
              <div className="stack" style={{ gap: 8, padding: 10 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  {formatDate(photo.uploadedAt)}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {formatSize(photo.size)}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  长按保存到手机
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
