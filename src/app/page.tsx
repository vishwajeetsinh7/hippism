'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
    const timer = setTimeout(() => {
      router.push('/menu')
    }, 2800)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0d2318 0%, #1a4731 35%, #2D5A3D 65%, #1e3d2a 100%)',
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: 'absolute', top: '-20%', right: '-20%',
          width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(196,136,58,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-15%', left: '-15%',
          width: '50%', height: '50%',
          background: 'radial-gradient(circle, rgba(61,122,85,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Mountain silhouette SVG */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          opacity: 0.08, pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="180">
          <path d="M0 200 L80 90 L130 130 L200 40 L260 120 L310 70 L380 140 L430 80 L480 110 L480 200 Z" fill="white" />
        </svg>
      </div>

      {/* Main content */}
      <div
        className="relative z-10 text-center px-8"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Logo mark */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              width: 90, height: 90,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '28px',
              margin: '0 auto 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L44 38H4L24 4Z" stroke="#D4A373" strokeWidth="2" strokeLinejoin="round" fill="none"/>
              <path d="M14 38L24 18L34 38" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              <circle cx="24" cy="4" r="2" fill="#D4A373"/>
              <path d="M4 38H44" stroke="#D4A373" strokeWidth="1" opacity="0.5"/>
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="font-playfair"
          style={{
            fontSize: '38px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            marginBottom: '8px',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          Hippism
          <span style={{ display: 'block', color: '#D4A373' }}>Escape</span>
        </h1>

        {/* Location tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '5px 14px',
            marginTop: '12px',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '12px' }}>📍</span>
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              fontFamily: 'DM Sans, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            Old Manali, Himachal Pradesh
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '24px',
          }}
        >
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              letterSpacing: '0.15em',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 400,
              textTransform: 'uppercase',
            }}
          >
            Good Food &nbsp;•&nbsp; Good Vibes &nbsp;•&nbsp; Mountain Escape
          </p>
        </div>

        {/* Loading dots */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '6px', height: '6px',
                background: '#D4A373',
                borderRadius: '999px',
                animation: `bounce-gentle 1.2s ${i * 0.2}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
