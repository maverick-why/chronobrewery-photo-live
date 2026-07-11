'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

const DEFAULT_HERO_IMAGE_URL =
  '/hero-storefront.jpg'

const PAGE_CSS = `
  :root {
    --bg: #f0f0ee;
    --card: #ffffff;
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
      --bg: #0b0b0c;
      --card: #1c1c1e;
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
    font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
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
`

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function NoticeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2.5" width="10" height="12" rx="1.5" />
      <path d="M6 2.5V1.5a1 1 0 011-1h2a1 1 0 011 1v1" />
      <path d="M6 7h4M6 9.5h4M6 12h2.5" />
    </svg>
  )
}

function AlbumIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <circle cx="5" cy="6" r="1.25" />
      <path d="M14 10.5l-3.5-3-4 3.5-2-1.5-2.5 2" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

// ─── Activity Notice Card ───────────────────────────────────────────────────

const INFO_SECTIONS: { label: string; body: string }[] = [
  { label: '活动时间', body: '2026年8月15日 14:00–23:00' },
  {
    label: '地址',
    body: '深圳市南山区沙河西路智谷产业园 F座107（高德、腾讯地图搜“时光酿造所”可直接导航）',
  },
  {
    label: '停车',
    body: '所有来宾免费停车；如需停放地面车位，请提前报备车牌号，地面停车位数量有限，先到先得',
  },
  {
    label: '入场流程',
    body: '签到领纪念杯（限量100只，独立编号）→ 拍照签名墙 → 逛产品海报墙 → 正门入场',
  },
  {
    label: '今晚你可以',
    body: '品尝首批酒款 · 与酿酒师/主理人交流 · 参与现场互动 · 签名墙留言',
  },
  {
    label: '温馨提示',
    body: '现场照片/视频由摄影师拍摄，后续可能用于品牌宣传及媒体报道，如不希望自己出镜或有其他顾虑，请现场告知摄影师或工作人员；纪念杯遗失不补发；酒后请勿驾车，未成年人禁止饮酒；如需代驾/饮用水请联系工作人员',
  },
]

function NoticeCard() {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="card"
      style={{
        margin: '16px 16px 0',
        borderRadius: 16,
        background: 'var(--card)',
        border: '0.5px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 18px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#f6e9c9',
            color: '#96731f',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NoticeIcon />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>活动须知</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {INFO_SECTIONS.length} 条提示
          </div>
        </div>
        <div style={{ color: 'var(--text-3)' }}>
          <ChevronIcon open={open} />
        </div>
      </div>
      <div
        style={{
          maxHeight: open ? 2000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
        }}
      >
        <div style={{ padding: '0 18px 18px' }}>
          {INFO_SECTIONS.map((section, i) => (
            <div
              key={section.label}
              style={{
                paddingTop: 14,
                marginTop: i === 0 ? 0 : 14,
                borderTop: i === 0 ? 'none' : '0.5px solid var(--border)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  marginBottom: 4,
                }}
              >
                {section.label}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>{section.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* ── Hero ── */}
      <div
        className="fade-in"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          maxHeight: 480,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImageUrl}
          alt="ChronoBrewery 门头"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        {/* Top badges */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <a
            href="/admin/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px 6px 6px',
              borderRadius: 20,
              background: 'rgba(20,18,14,0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f2ead9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 11 11" fill="#1a1712">
                <rect x="0.5" y="0.5" width="4" height="4" rx="0.8" />
                <rect x="6.5" y="0.5" width="4" height="4" rx="0.8" />
                <rect x="0.5" y="6.5" width="4" height="4" rx="0.8" />
                <rect x="6.5" y="6.5" width="4" height="4" rx="0.8" opacity="0.35" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>时光酿造所</span>
          </a>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(220,38,38,0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Bottom overlay copy */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 22px' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.65)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            ChronoBrewery · Photo Live
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 6vw, 34px)',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            活动图片，实时直播
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            点击图片查看大图 · 长按图片保存到手机
          </p>
        </div>
      </div>

      {/* ── Stats / Countdown ── */}
      <div style={{ background: '#1a1712', padding: '16px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                {loading ? '…' : photos.length}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>张照片</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                {formatDate(EVENT_DATETIME.toISOString())}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>活动日期</div>
            </div>
          </div>
          <button
            onClick={fetchPhotos}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            <span className={loading ? 'spin' : ''}>
              <RefreshIcon />
            </span>
            刷新
          </button>
        </div>
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '0.5px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(20px, 6vw, 26px)',
              fontWeight: 700,
              color: '#e8c477',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {countdownMs === null ? '—' : formatCountdown(countdownMs)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>距开场</div>
        </div>
      </div>

      <NoticeCard />

      {/* ── Album Card ── */}
      <div
        className="card"
        style={{
          margin: '16px 16px 0',
          borderRadius: 16,
          background: 'var(--card)',
          border: '0.5px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#e8ecf5',
              color: '#3a4f8a',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlbumIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>活动相册</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {loading ? '加载中…' : `共 ${photos.length} 张 · 按时间倒序`}
            </div>
          </div>
          <button
            onClick={fetchPhotos}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              color: 'var(--text-2)',
              background: 'transparent',
              border: '0.5px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <span className={loading ? 'spin' : ''}>
              <RefreshIcon />
            </span>
          </button>
        </div>
        <div
          style={{
            margin: '0 18px 14px',
            padding: '10px 12px',
            borderRadius: 10,
            background: '#f6e9c9',
            fontSize: 12,
            color: '#96731f',
            lineHeight: 1.5,
          }}
        >
          长按图片保存 · 点击查看大图 · 转发给朋友
        </div>

      {/* ── Main ── */}
      <main style={{ padding: '0 18px 18px' }}>

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
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: '20px 32px 32px',
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
