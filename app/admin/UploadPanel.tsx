"use client";

import { useMemo, useState } from "react";

type UploadPolicyResponse = {
  ok: boolean;
  method: "PUT";
  uploadUrl: string;
  objectKey: string;
  activitySlug: string;
  expiresAt: number;
  headers: Record<string, string>;
};

type UploadStatus = "queued" | "signing" | "uploading" | "success" | "error";

type UploadItem = {
  id: string;
  fileName: string;
  size: number;
  status: UploadStatus;
  progress: number;
  objectKey?: string;
  error?: string;
};

type UploadPanelProps = {
  username: string;
  activitySlug: string;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function statusText(item: UploadItem) {
  switch (item.status) {
    case "queued":
      return "排队中";
    case "signing":
      return "获取上传签名";
    case "uploading":
      return `上传中 ${item.progress}%`;
    case "success":
      return "上传成功";
    case "error":
      return "上传失败";
    default:
      return "未知";
  }
}

function buildItem(file: File, index: number): UploadItem {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    size: file.size,
    status: "queued",
    progress: 0
  };
}

export function UploadPanel({ username, activitySlug }: UploadPanelProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const summary = useMemo(() => {
    const successCount = items.filter((item) => item.status === "success").length;
    const failedCount = items.filter((item) => item.status === "error").length;
    return { successCount, failedCount, total: items.length };
  }, [items]);

  async function requestPolicy(file: File) {
    const response = await fetch("/api/upload-policy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size
      })
    });

    const data = (await response.json().catch(() => null)) as
      | UploadPolicyResponse
      | { error?: string }
      | null;

    if (!response.ok || !data || !("ok" in data)) {
      throw new Error((data && "error" in data && data.error) || "获取上传签名失败");
    }

    return data;
  }

  function setItemPatch(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadWithProgress(file: File, policy: UploadPolicyResponse, onProgress: (p: number) => void) {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(policy.method, policy.uploadUrl, true);

      Object.entries(policy.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }
        const percentage = Math.max(1, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        onProgress(percentage);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        reject(new Error(`上传失败 (${xhr.status})`));
      };

      xhr.onerror = () => reject(new Error("上传网络错误，请检查 COS 跨域和网络配置"));
      xhr.onabort = () => reject(new Error("上传已取消"));
      xhr.send(file);
    });
  }

  async function uploadFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    setGlobalError("");
    const acceptedFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!acceptedFiles.length) {
      setGlobalError("只支持图片文件上传。");
      return;
    }

    const nextItems = acceptedFiles.map((file, index) => buildItem(file, index));
    setItems((prev) => [...nextItems, ...prev]);
    setIsUploading(true);

    try {
      for (let i = 0; i < acceptedFiles.length; i += 1) {
        const file = acceptedFiles[i];
        const itemId = nextItems[i].id;
        try {
          setItemPatch(itemId, { status: "signing" });
          const policy = await requestPolicy(file);
          setItemPatch(itemId, { status: "uploading", progress: 1 });
          await uploadWithProgress(file, policy, (progress) => {
            setItemPatch(itemId, { progress });
          });

          await fetch("/api/photos/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              objectKey: policy.objectKey,
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type || "application/octet-stream"
            })
          }).catch(() => null);

          setItemPatch(itemId, {
            status: "success",
            progress: 100,
            objectKey: policy.objectKey
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "上传失败";
          setItemPatch(itemId, { status: "error", error: message });
        }
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <section className="card stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ margin: 0 }}>摄影师后台上传</h1>
          <p className="muted" style={{ margin: 0 }}>
            当前登录：{username}，上传路径为{" "}
            <code>originals/{activitySlug}/YYYY-MM-DD</code>。
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} type="button">
          退出登录
        </button>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void uploadFiles(Array.from(event.dataTransfer.files));
        }}
        style={{
          border: `2px dashed ${isDragging ? "#0f3f87" : "#d9e2ef"}`,
          borderRadius: 12,
          padding: 20,
          background: isDragging ? "#eef4ff" : "#fbfdff"
        }}
      >
        <div className="stack" style={{ gap: 12 }}>
          <p style={{ margin: 0 }}>
            拖拽图片到这里，或点击选择文件。支持批量上传（单文件最大 50MB）。
          </p>
          <label className="btn btn-primary" style={{ width: "fit-content" }}>
            选择图片
            <input
              accept="image/*"
              disabled={isUploading}
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.currentTarget.value = "";
                void uploadFiles(files);
              }}
              style={{ display: "none" }}
              type="file"
            />
          </label>
          {globalError ? (
            <p style={{ margin: 0, color: "#af2934" }}>{globalError}</p>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              上传后会直接进入腾讯云 COS `originals` 目录；display/download 在 M3 接入自动生成。
            </p>
          )}
        </div>
      </div>

      <div className="muted" style={{ fontSize: 14 }}>
        已处理 {summary.total} 张，成功 {summary.successCount}，失败 {summary.failedCount}
      </div>

      {items.length ? (
        <div className="stack" style={{ gap: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ border: "1px solid #d9e2ef", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong>{item.fileName}</strong>
                <span className="muted">{formatFileSize(item.size)}</span>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {statusText(item)}
                {item.error ? `：${item.error}` : ""}
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 8,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "#edf2f8"
                }}
              >
                <div
                  style={{
                    width: `${item.progress}%`,
                    height: "100%",
                    background: item.status === "error" ? "#af2934" : "#0f3f87",
                    transition: "width 120ms linear"
                  }}
                />
              </div>
              {item.objectKey ? (
                <code style={{ display: "block", marginTop: 8, fontSize: 12 }}>{item.objectKey}</code>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
