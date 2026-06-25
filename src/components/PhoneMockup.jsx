import React, { useState, useEffect } from 'react';

const PHONE_STYLE = {
  width: '240px',
  height: '500px',
  borderRadius: '36px',
  border: '5px solid #3a3a3a',
  background: '#000',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 2px #1a1a1a',
  flexShrink: 0,
};

const NOTCH = {
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100px',
  height: '24px',
  background: '#000',
  borderRadius: '0 0 16px 16px',
  zIndex: 20,
};

function LazyImg({ src, alt, style }) {
  return <img src={src} alt={alt || ''} style={{ ...style }} loading="lazy" />;
}

// ─── INSTAGRAM CAROUSEL ───
export function InstagramCarousel({ images, caption, username = 'terraviva_pet' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const validImages = (images || []).filter(Boolean);

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % validImages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [validImages.length]);

  return (
    <div style={PHONE_STYLE}>
      <div style={NOTCH} />
      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '44px', zIndex: 9, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 18px 4px', fontSize: '0.6rem', fontWeight: 600, color: '#fff' }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.5rem' }}>●●●●</span>
          <span style={{ fontSize: '0.5rem' }}>🔋</span>
        </span>
      </div>
      {/* IG Header */}
      <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, height: '40px', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '7px', background: '#000', zIndex: 8 }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', color: '#fff', fontWeight: 700 }}>TV</div>
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>{username}</span>
      </div>
      {/* Carousel images */}
      <div style={{ position: 'absolute', top: '84px', left: 0, right: 0, height: '230px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${activeIdx * 100}%)`, height: '100%' }}>
          {validImages.map((img, i) => (
            <div key={i} style={{ minWidth: '100%', height: '100%' }}>
              <LazyImg src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>
      {/* Dots */}
      <div style={{ position: 'absolute', top: '318px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '3px', padding: '5px 0' }}>
        {validImages.map((_, i) => (
          <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === activeIdx ? '#3897f0' : 'rgba(255,255,255,0.3)', transition: 'background 0.3s' }} />
        ))}
      </div>
      {/* Actions */}
      <div style={{ position: 'absolute', top: '332px', left: 0, right: 0, display: 'flex', gap: '12px', padding: '0 10px' }}>
        <span style={{ fontSize: '1rem' }}>♡</span>
        <span style={{ fontSize: '1rem' }}>💬</span>
        <span style={{ fontSize: '1rem' }}>↗</span>
      </div>
      {/* Caption */}
      <div style={{ position: 'absolute', top: '356px', left: 0, right: 0, bottom: '26px', padding: '4px 10px', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.58rem', color: '#fff', lineHeight: 1.35, margin: 0 }}>
          <strong>{username}</strong>{' '}
          {caption?.replace(/\*\*/g, '').substring(0, 200)}...
        </p>
      </div>
      {/* Home indicator */}
      <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)' }} />
    </div>
  );
}

// ─── INSTAGRAM STORY ───
// Video/image defines the size — phone wraps around it (object-fit: contain)
export function InstagramStory({ imageSrc, videoSrc, username = 'terraviva_pet' }) {
  return (
    <div style={PHONE_STYLE}>
      <div style={NOTCH} />
      {/* Story content — contain, not cover: video is fully visible */}
      <div style={{ position: 'absolute', inset: '5px', borderRadius: '31px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoSrc ? (
          <video src={videoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted autoPlay loop playsInline />
        ) : imageSrc ? (
          <LazyImg src={imageSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }} />
        )}
      </div>
      {/* Story progress bar - minimal */}
      <div style={{ position: 'absolute', top: '42px', left: '8px', right: '8px', display: 'flex', gap: '2px', zIndex: 21 }}>
        <div style={{ flex: 1, height: '2px', borderRadius: '1px', background: '#fff' }} />
        <div style={{ flex: 1, height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ flex: 1, height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.3)' }} />
      </div>
      {/* Story header - compact */}
      <div style={{ position: 'absolute', top: '50px', left: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 21 }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #fff', background: 'linear-gradient(135deg, #f09433, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.4rem', color: '#fff', fontWeight: 700 }}>TV</span>
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{username}</span>
        <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.6)' }}>2h</span>
      </div>
      {/* Home indicator */}
      <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', zIndex: 21 }} />
    </div>
  );
}

// ─── TIKTOK ───
// Video/image defines the size — phone wraps around it (object-fit: contain)
export function TikTokPhone({ imageSrc, videoSrc, caption, username = '@terraviva_pet' }) {
  return (
    <div style={PHONE_STYLE}>
      <div style={NOTCH} />
      {/* Content — contain: video fully visible, black bars if needed */}
      <div style={{ position: 'absolute', inset: '5px', borderRadius: '31px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {videoSrc ? (
          <video src={videoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted autoPlay loop playsInline />
        ) : imageSrc ? (
          <LazyImg src={imageSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#000' }} />
        )}
      </div>
      {/* TikTok top tabs */}
      <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '16px', zIndex: 21 }}>
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Seguiti</span>
        <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700, borderBottom: '2px solid #fff', paddingBottom: '2px' }}>Per te</span>
      </div>
      {/* Right side actions - compact */}
      <div style={{ position: 'absolute', right: '8px', bottom: '80px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', zIndex: 21 }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.9rem' }}>♡</span>
        </div>
        <span style={{ fontSize: '0.45rem', color: '#fff' }}>24.3K</span>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem' }}>💬</span>
        </div>
        <span style={{ fontSize: '0.45rem', color: '#fff' }}>892</span>
      </div>
      {/* Bottom info - compact */}
      <div style={{ position: 'absolute', bottom: '22px', left: '10px', right: '50px', zIndex: 21 }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', margin: '0 0 3px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{username}</p>
        <p style={{ fontSize: '0.55rem', color: '#fff', lineHeight: 1.25, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.8)', maxHeight: '2.5em', overflow: 'hidden' }}>
          {caption?.replace(/\*\*/g, '').substring(0, 70)}...
        </p>
      </div>
      {/* Home indicator */}
      <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', zIndex: 21 }} />
    </div>
  );
}
