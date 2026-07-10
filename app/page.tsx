'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

const DEFAULT_HERO_IMAGE_URL =
  '/无背景logo.png'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photo {
  key: string
  displayKey: string
  downloadKey: string
  originalKey: string
  displayUrl: string
  previewUrl: string
  source: string
  size: number
  uploadedAt: string
}

interface ApiResponse {
  photos: Photo[]
  source: string
  activitySlug: string
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function groupByDate(photos: Photo[]): Record<string, Photo[]> {
  return photos.reduce<Record<string, Photo[]>>((acc, p) => {
    const d = new Date(p.uploadedAt).toDateString()
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})
}

// ─── Countdown ────────────────────────────────────────────────────────────────

const EVENT_DATETIME = new Date('2026-08-15T14:00:00+08:00')

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setRemaining(target.getTime() - Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return remaining
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '已开场'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${days}天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 2.5A7 7 0 1 0 14 8" />
      <path d="M14 2.5V6h-3.5" />
    </svg>
  )
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  onClick,
}: {
  photo: Photo
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        breakInside: 'avoid',
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        border: '0.5px solid var(--border)',
        cursor: 'pointer',
        position: 'relative',
        background: 'var(--surface)',
        transition: 'border-color 0.2s',
        borderColor: hovered ? 'var(--border-hover)' : 'var(--border)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.previewUrl}
        alt=""
        loading="lazy"
        style={{
          width: '100%',
          display: 'block',
          transition: 'transform 0.35s ease',
          transform: hovered ? 'scale(1.025)' : 'scale(1)',
        }}
      />

      {/* Hover overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '36px 12px 12px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.02em',
          }}
        >
          {formatTime(photo.uploadedAt)}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 11px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.95)',
            color: '#111',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          长按保存到手机
        </span>
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: Photo[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const p = photos[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  if (!p) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>
          {index + 1} / {photos.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: '7px 18px',
              borderRadius: 8,
              background: '#fff',
              color: '#111',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            长按保存到手机
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 13,
              padding: '7px 16px',
              borderRadius: 8,
              border: '0.5px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.previewUrl}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '88vw',
          maxHeight: '78vh',
          objectFit: 'contain',
          borderRadius: 6,
          display: 'block',
        }}
      />

      {/* Meta */}
      <div
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {formatTime(p.uploadedAt)} · {formatSize(p.size)}
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          ›
        </button>
      )}
    </div>
  )
}

// ─── Activity Info Block (design preview — content will move to /admin) ───────

const INFO_TEXT = `营业时间：14:00–23:00
地址：深圳市南山区沙河西路智谷产业园 F座107
停车：园区地下车库 B1，蓝色车位免费2小时
今日活动：精酿品鉴 × 现场爵士
备注：18:30 后凭票入场`

const TODAY_LABEL = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

type InfoStyle = 'a' | 'b' | 'c'

function InfoBlockA({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [firstLine, ...restLines] = INFO_TEXT.split('\n')
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '18px 32px',
        borderBottom: '0.5px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          今天 · {TODAY_LABEL}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
          活动信息
          <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
            ⌄
          </span>
        </span>
      </div>
      {!open && (
        <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8 }}>{firstLine}</div>
      )}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.9,
          color: 'var(--text)',
          whiteSpace: 'pre-line',
          maxHeight: open ? 200 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
          marginTop: open ? 6 : 0,
        }}
      >
        {restLines.join('\n')}
      </div>
    </div>
  )
}

function InfoBlockB({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [firstLine, ...restLines] = INFO_TEXT.split('\n')
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '22px 32px',
        cursor: 'pointer',
        background: 'linear-gradient(160deg,#1a1712,#2b2318)',
        color: '#f2ead9',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#c9a35f', textTransform: 'uppercase', marginBottom: 10 }}>
        ChronoBrewery · 时光酿造所
      </div>
      {!open && (
        <div style={{ fontSize: 13, color: '#e9e2d3' }}>{firstLine}</div>
      )}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.9,
          color: '#e9e2d3',
          whiteSpace: 'pre-line',
          maxHeight: open ? 200 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
        }}
      >
        {restLines.join('\n')}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#c9a35f', display: 'flex', justifyContent: 'space-between' }}>
        <span>今天 · {TODAY_LABEL}</span>
        <span>{open ? '收起' : '展开'}</span>
      </div>
    </div>
  )
}

function InfoBlockC({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [firstLine, ...restLines] = INFO_TEXT.split('\n')
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '18px 32px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--text)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bg)',
          fontSize: 13,
        }}
      >
        i
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          今天 · {TODAY_LABEL}
        </div>
        {!open && (
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 6 }}>{firstLine}</div>
        )}
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.9,
            color: 'var(--text)',
            whiteSpace: 'pre-line',
            maxHeight: open ? 200 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.25s ease',
            marginTop: open ? 6 : 0,
          }}
        >
          {restLines.join('\n')}
        </div>
      </div>
    </div>
  )
}

function ActivityInfo() {
  const [style, setStyle] = useState<InfoStyle>('a')
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Preview-only style switcher — removed once a style is picked */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 32px',
          background: '#fffbe6',
          borderBottom: '0.5px solid var(--border)',
          fontSize: 11,
        }}
      >
        <span style={{ color: '#997a00', marginRight: 4 }}>预览方案：</span>
        {(['a', 'b', 'c'] as InfoStyle[]).map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              border: '0.5px solid var(--border)',
              background: style === s ? '#111' : 'transparent',
              color: style === s ? '#fff' : 'var(--text-2)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {style === 'a' && <InfoBlockA open={open} onToggle={() => setOpen((o) => !o)} />}
      {style === 'b' && <InfoBlockB open={open} onToggle={() => setOpen((o) => !o)} />}
      {style === 'c' && <InfoBlockC open={open} onToggle={() => setOpen((o) => !o)} />}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lbIndex, setLbIndex] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos?limit=100')
      if (!res.ok) throw new Error('fetch failed')
      const data: ApiResponse = await res.json()
      setPhotos(data.photos)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
    intervalRef.current = setInterval(fetchPhotos, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchPhotos])

  const grouped = groupByDate(photos)
  const dateKeys = Object.keys(grouped)
  const heroImageUrl = process.env.NEXT_PUBLIC_HERO_IMAGE_URL || DEFAULT_HERO_IMAGE_URL
  const countdownMs = useCountdown(EVENT_DATETIME)

  return (
    <>
      <style>{`
        :root {
          --bg: #fafafa;
          --surface: #f0efed;
          --border: rgba(0,0,0,0.08);
          --border-hover: rgba(0,0,0,0.18);
          --text: #111;
          --text-2: #555;
          --text-3: #999;
          --nav-bg: rgba(250,250,250,0.88);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #111;
            --surface: #1c1c1e;
            --border: rgba(255,255,255,0.08);
            --border-hover: rgba(255,255,255,0.2);
            --text: #f0f0f0;
            --text-2: #aaa;
            --text-3: #555;
            --nav-bg: rgba(17,17,17,0.88);
          }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: var(--bg); }
        body {
          font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadein 0.4s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; display: inline-block; }
      `}</style>

      {/* ── Nav ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '0.5px solid var(--border)',
          padding: '0 32px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: 'var(--text)',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="var(--bg)">
              <rect x="0.5" y="0.5" width="4" height="4" rx="0.8" />
              <rect x="6.5" y="0.5" width="4" height="4" rx="0.8" />
              <rect x="0.5" y="6.5" width="4" height="4" rx="0.8" />
              <rect x="6.5" y="6.5" width="4" height="4" rx="0.8" opacity="0.35" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em' }}>
            时光酿造所
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 300 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>活动图片直播</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Live</span>
          </div>
          <a
            href="/admin/login"
            style={{
              fontSize: 12,
              color: 'var(--text-3)',
              textDecoration: 'none',
              padding: '5px 10px',
              borderRadius: 6,
              border: '0.5px solid var(--border)',
            }}
          >
            摄影师登录
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div
        className="fade-in"
        style={{
          padding: '44px 32px 28px',
          borderBottom: '0.5px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt="ChronoBrewery 门头"
            style={{
              width: 'min(100%, 560px)',
              height: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          ChronoBrewery · Photo Live
        </div>
        <h1
          style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 1.12,
            marginBottom: 12,
          }}
        >
          活动图片
          <span style={{ color: 'var(--text-3)' }}>，实时直播</span>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-2)',
            lineHeight: 1.65,
            maxWidth: 400,
            marginBottom: 28,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          点击图片查看大图，长按图片即可保存到手机。
        </p>

        <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: loading ? '…' : String(photos.length), l: '张照片' },
            {
              n: formatDate(EVENT_DATETIME.toISOString()),
              l: '活动日期',
            },
            {
              n: countdownMs === null ? '—' : formatCountdown(countdownMs),
              l: '距开场',
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                paddingRight: 28,
                marginRight: 28,
                borderRight: i < 2 ? '0.5px solid var(--border)' : 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
                {s.n}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <ActivityInfo />

      {/* ── Toolbar ── */}
      <div
        style={{
          padding: '12px 32px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {loading ? '加载中…' : `共 ${photos.length} 张 · 按时间倒序`}
        </span>
        <button
          onClick={fetchPhotos}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-2)',
            background: 'transparent',
            border: '0.5px solid var(--border)',
            borderRadius: 6,
            padding: '5px 12px',
            cursor: 'pointer',
          }}
        >
          <span className={loading ? 'spin' : ''}>
            <RefreshIcon />
          </span>
          刷新
        </button>
      </div>

      {/* ── Main ── */}
      <main style={{ padding: '24px 32px 64px' }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ columns: 3, gap: 10 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  breakInside: 'avoid',
                  marginBottom: 10,
                  borderRadius: 10,
                  background: 'var(--surface)',
                  height: 180 + (i % 3) * 60,
                  border: '0.5px solid var(--border)',
                  opacity: 1 - i * 0.07,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 15, marginBottom: 12 }}>加载失败</div>
            <button
              onClick={fetchPhotos}
              style={{
                fontSize: 13,
                padding: '7px 18px',
                borderRadius: 7,
                border: '0.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>◻</div>
            <div style={{ fontSize: 14 }}>暂无照片</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>摄影师上传后将在此显示</div>
          </div>
        )}

        {/* Photos grouped by date */}
        {!loading && !error && photos.length > 0 &&
          dateKeys.map((dateKey) => {
            const dayPhotos = grouped[dateKey]
            return (
              <div key={dateKey} style={{ marginBottom: 40 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-2)',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDate(dayPhotos[0].uploadedAt)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-3)',
                      padding: '2px 8px',
                      borderRadius: 10,
                      border: '0.5px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dayPhotos.length} 张
                  </span>
                  <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                </div>

                <div style={{ columns: 3, gap: 10 }}>
                  {dayPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.key}
                      photo={photo}
                      onClick={() => setLbIndex(photos.indexOf(photo))}
                    />
                  ))}
                </div>
              </div>
            )
          })
        }
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '0.5px solid var(--border)',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          © 2026 时光酿造所 · ChronoBrewery
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', opacity: 0.5 }}>
          Powered by Tencent Cloud COS · 数据万象
        </span>
      </footer>

      {/* ── Lightbox ── */}
      {lbIndex !== null && (
        <Lightbox
          photos={photos}
          index={lbIndex}
          onClose={() => setLbIndex(null)}
          onPrev={() => setLbIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setLbIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))}
        />
      )}
    </>
  )
}
