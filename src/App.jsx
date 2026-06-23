import React, { useState, useEffect, useRef } from 'react';
import campaignData from './data.json';
const campaigns = (campaignData.dataset || []).map(item => ({
  order: item.order,
  ...(item.data?.it || {})
}));
const masterRefAsset = (campaignData.assets || []).find(a => a.tagName === '##master_adv_reference##')?.value || '';
const productBagAsset = (campaignData.assets || []).find(a => a.tagName === '##product_bag##')?.value || '';
import IntegrationFlow from './components/IntegrationFlow';


// Helper component for lazy-loaded images
function LazyImage({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '300px 0px' });

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return <img ref={imgRef} src={loaded ? src : ''} alt={alt} className={className} style={style} />;
}

// Helper component for lazy-loaded and auto-paused videos
function LazyVideo({ src, className, style }) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (!loaded) setLoaded(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.1 });

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [loaded]);

  useEffect(() => {
    if (loaded && videoRef.current && src) {
      videoRef.current.src = src;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [loaded, src]);

  return <video ref={videoRef} loop muted playsInline className={className} style={style} />;
}

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wallStep, setWallStep] = useState(0); // 0 to 32
  const [manualActiveCampaign, setManualActiveCampaign] = useState(null);
  const [manualActiveView, setManualActiveView] = useState('concept'); // 'concept' | 'assets' | 'texts'
  const [delayedShowOverlay, setDelayedShowOverlay] = useState(false);
  
  // Wall Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [valFilter, setValFilter] = useState('');
  const [benFilter, setBenFilter] = useState('');
  const [perFilter, setPerFilter] = useState('');

  const totalSlides = 15;
  const featuredCampaignOrders = [0, 1, 2, 4, 5, 11, 13, 8];

  // Slide Names mapping for future use/nav
  const slideNames = [
    "Copertina",
    "Artigiani vs Architetti",
    "Il Problema Reale",
    "Iper-Personalizzazione & KB",
    "Time to Content & Sistemi",
    "Compliance & ROI",
    "A Chi Serve in Azienda",
    "Il Dataset: Valore",
    "Multilingue & Vision",
    "Matrice ADV Angles",
    "Il Processo ADV",
    "La Forza dei Numeri",
    "Futuri Workflow",
    "Visual Wall Case Study",
    "Grazie"
  ];

  // Derive focused and active dashboards based on wallStep
  let focusedCampaign = null;
  let showConceptDashboard = false;
  let showAssetsDashboard = false;
  let showTextsDashboard = false;

  if (currentSlide === 13 && wallStep > 0 && wallStep <= 32) {
    const index = Math.floor((wallStep - 1) / 4);
    const subStep = (wallStep - 1) % 4;
    if (index < featuredCampaignOrders.length) {
      const featuredOrder = featuredCampaignOrders[index];
      const camp = campaigns.find(c => c.order === featuredOrder) || null;
      if (subStep === 0) {
        focusedCampaign = camp;
        showConceptDashboard = true;
      } else if (subStep === 1) {
        focusedCampaign = camp;
        showAssetsDashboard = true;
      } else if (subStep === 2) {
        focusedCampaign = camp;
        showTextsDashboard = true;
      } else if (subStep === 3) {
        focusedCampaign = null; // zoom out (full grid)
      }
    }
  }

  // Handle manual clicks
  if (manualActiveCampaign) {
    focusedCampaign = manualActiveCampaign;
    if (manualActiveView === 'concept') {
      showConceptDashboard = true;
    } else if (manualActiveView === 'assets') {
      showAssetsDashboard = true;
    } else {
      showTextsDashboard = true;
    }
  }


  useEffect(() => {
    if (focusedCampaign) {
      const timer = setTimeout(() => {
        setDelayedShowOverlay(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setDelayedShowOverlay(false);
    }
  }, [focusedCampaign]);

  // Dynamically load Agentation bundle only on localhost/127.0.0.1
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const script = document.createElement('script');
      script.src = './assets/agentation-bundle.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const gridRef = useRef(null);
  const [gridTransform, setGridTransform] = useState({ transform: 'translate(0px, 0px) scale(1)' });

  useEffect(() => {
    const updateTransform = () => {
      if (currentSlide === 13 && focusedCampaign) {
        const card = document.getElementById(`campaign-card-${focusedCampaign.order}`);
        const grid = gridRef.current;
        if (card && grid) {
          const gridRect = grid.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          
          // Card center relative to grid origin
          const cardCenterX = cardRect.left + cardRect.width / 2 - gridRect.left;
          const cardCenterY = cardRect.top + cardRect.height / 2 - gridRect.top;
          
          // Grid center relative to grid origin
          const gridCenterX = gridRect.width / 2;
          const gridCenterY = gridRect.height / 2;
          
          const translateX = gridCenterX - cardCenterX;
          const translateY = gridCenterY - cardCenterY;
          
          const scaleFactor = 2.8;
          
          setGridTransform({
            transform: `translate(${translateX}px, ${translateY}px) scale(${scaleFactor})`
          });
        }
      } else {
        setGridTransform({ transform: 'translate(0px, 0px) scale(1)' });
      }
    };

    updateTransform();
    const timer = setTimeout(updateTransform, 50);

    window.addEventListener('resize', updateTransform);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTransform);
    };
  }, [currentSlide, wallStep, focusedCampaign]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      const isNextKey = ['ArrowRight', 'ArrowDown', 'PageDown', 'Space', 'Enter'].includes(e.key) || e.code === 'Space';
      const isPrevKey = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key);

      if (manualActiveCampaign !== null) {
        if (isNextKey || isPrevKey || e.key === 'Escape') {
          e.preventDefault();
          setManualActiveCampaign(null);
        }
        return;
      }

      if (isNextKey) {
        e.preventDefault();
        handleNext();
      } else if (isPrevKey) {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, wallStep, manualActiveCampaign]);

  const handleNext = () => {
    if (currentSlide === 13) {
      if (wallStep < 32) {
        setWallStep(prev => prev + 1);
      } else {
        setWallStep(0);
        setCurrentSlide(14);
      }
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 13) {
      if (wallStep > 0) {
        setWallStep(prev => prev - 1);
      } else {
        setCurrentSlide(12);
      }
    } else if (currentSlide === 14) {
      setCurrentSlide(13);
      setWallStep(32);
    } else if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };


  // Brief text parser
  const getBriefSection = (briefText, sectionName) => {
    if (!briefText) return '';
    const regex = new RegExp(sectionName + '\\s*:\\s*([\\s\\S]*?)(?=(?:KEY MESSAGE|TARGET INSIGHT|VISUAL DIRECTION|TONE|DIFFERENTIATOR)\\s*:|$)', 'i');
    const match = briefText.match(regex);
    return match ? match[1].trim() : '';
  };

  // Carousel parser
  const parseCarousel = (carouselText) => {
    if (!carouselText) return [];
    const cardRegex = /CARD\s*(\d+)\s*TITLE\s*:\s*([\s\S]*?)\nCARD\s*\1\s*TEXT\s*:\s*([\s\S]*?)(?=(?:CARD\s*\d+\s*TITLE\s*:|$))/gi;
    const slides = [];
    let match;
    while ((match = cardRegex.exec(carouselText + '\n')) !== null) {
      slides.push({
        num: match[1],
        title: match[2].trim(),
        text: match[3].trim()
      });
    }
    if (slides.length === 0) {
      return carouselText.split('\n').filter(line => line.trim()).map((line, idx) => ({
        num: idx + 1,
        title: `Slide ${idx + 1}`,
        text: line
      }));
    }
    return slides;
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(camp => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
                         camp.razza.toLowerCase().includes(query) ||
                         camp.prodotto.toLowerCase().includes(query) ||
                         camp.angle_geo.toLowerCase().includes(query) ||
                         camp.angle_value.toLowerCase().includes(query) ||
                         camp.angle_benefit.toLowerCase().includes(query) ||
                         camp.angle_persona.toLowerCase().includes(query) ||
                         camp.headline.toLowerCase().includes(query) ||
                         camp.creative_brief.toLowerCase().includes(query);
                         
    const matchesValue = !valFilter || camp.angle_value === valFilter;
    const matchesBenefit = !benFilter || camp.angle_benefit === benFilter;
    const matchesPersona = !perFilter || camp.angle_persona === perFilter;
    
    return matchesQuery && matchesValue && matchesBenefit && matchesPersona;
  });

  const getChannelHeader = (format) => {
    let logoSvg = null;
    let channelLabel = '';
    let ratioLabel = '';
    
    const metaIcon = <svg viewBox="0 0 24 24" className="channel-logo-svg"><path fill="currentColor" d="M16.924 3.617a6.837 6.837 0 0 0-4.924 2.115 6.837 6.837 0 0 0-4.924-2.115C3.125 3.617 0 6.742 0 10.617c0 4.195 3.754 7.644 9.176 11.233.722.478 1.637.478 2.359 0 5.422-3.589 9.176-7.038 9.176-11.233 0-3.875-3.125-7-7-7zm-4.924 16.326c-.328-.163-.642-.35-.935-.558-4.48-3.08-7.565-5.918-7.565-8.768 0-2.481 1.969-4.5 4.5-4.5 1.579 0 3.013.916 3.705 2.368a.501.501 0 0 0 .89 0c.692-1.452 2.126-2.368 3.705-2.368 2.531 0 4.5 2.019 4.5 4.5 0 2.85-3.085 5.688-7.565 8.768a12.593 12.593 0 0 1-.935.558z"/></svg>;
    const instagramIcon = <svg viewBox="0 0 24 24" className="channel-logo-svg"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
    const youtubeIcon = <svg viewBox="0 0 24 24" className="channel-logo-svg"><path fill="currentColor" d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.983.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.983 24 12 24 12s0-3.983-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    const tiktokIcon = <svg viewBox="0 0 24 24" className="channel-logo-svg"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.05 1.62 4.2 1.22 1.4 2.97 2.2 4.88 2.44v3.88c-1.89-.04-3.75-.58-5.38-1.57-.05 2.49-.02 4.97-.03 7.46-.03 1.94-.48 3.86-1.39 5.56-1.9 3.51-5.71 5.76-9.71 5.61-3.99-.16-7.7-2.72-9.21-6.42-1.56-3.83-.81-8.38 1.93-11.45 2.54-2.85 6.49-3.99 10.18-3.08.02 1.31.01 2.61.02 3.91-2.22-.64-4.68-.11-6.42 1.35-1.74 1.46-2.5 3.84-2 6.07.49 2.21 2.33 3.97 4.56 4.38 2.45.45 5.03-.68 6.06-2.92.51-.95.73-2.02.72-3.11-.02-3.55-.01-7.1-.02-10.65z"/></svg>;
    
    switch (format) {
      case 'img_feed_1x1':
        logoSvg = instagramIcon;
        channelLabel = 'Meta Ads Feed';
        ratioLabel = '1:1 QUADRATO';
        break;
      case 'img_feed_4x5':
        logoSvg = metaIcon;
        channelLabel = 'Meta Mobile Feed';
        ratioLabel = '4:5 VERTICALE';
        break;
      case 'img_story_9x16':
        logoSvg = instagramIcon;
        channelLabel = 'Instagram Story';
        ratioLabel = '9:16 STORY';
        break;
      case 'img_banner_16x9':
        logoSvg = youtubeIcon;
        channelLabel = 'Google Display';
        ratioLabel = '16:9 BANNER';
        break;
      case 'video_feed_1x1':
        logoSvg = metaIcon;
        channelLabel = 'Video Loop Social';
        ratioLabel = '1:1 FEED VIDEO';
        break;
      case 'video_story_9x16':
        logoSvg = tiktokIcon;
        channelLabel = 'Reels / TikTok Ads';
        ratioLabel = '9:16 VIDEO LOOP';
        break;
      default:
        break;
    }
    
    return (
      <div className="media-header">
        {logoSvg}
        <span className="channel-title">{channelLabel}</span>
        <span className="ratio-badge">{ratioLabel}</span>
      </div>
    );
  };

  const progressPercent = (currentSlide / (totalSlides - 1)) * 100;

  return (
    <div>
      {/* HEADER */}
      <header>
        <div className="brand">
          <div className="brand-logo-container">
            <span className="brand-logo-dot"></span>
            <span className="brand-agency">websolute</span>
          </div>
          <div className="brand-divider"></div>
          <div className="brand-title-wrap">
            <span className="brand-title">CONTENT MACHINE</span>
          </div>
        </div>
        <nav id="view-mode-nav">
          <button 
            id="nav-btn-slides" 
            className={`nav-mode-btn ${currentSlide !== 13 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(0)}
          >
            Slide Deck
          </button>
          <button 
            id="nav-btn-wall" 
            className={`nav-mode-btn ${currentSlide === 13 ? 'active' : ''}`}
            onClick={() => {
              setCurrentSlide(13);
              setWallStep(0);
            }}
          >
            Visual Wall
          </button>
        </nav>
      </header>

      <div id="app">
        {/* SLIDES CONTAINER */}
        {true && (
          <div className="slides-container" id="slides-view">
            
            {/* SLIDE 0: Cover */}
            <section className={`slide ${currentSlide === 0 ? 'active' : ''}`} id="slide-0">
              <div className="slide-layout-split" style={{ alignItems: 'center' }}>
                <div className="slide-content-left">
                  <span className="slide-tag">WMF 2026 Speech Presentation</span>
                  <h1 className="slide-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', lineHeight: 1.05 }}>CONTENT MACHINE</h1>
                  <p className="slide-subtitle" style={{ fontSize: '1.6rem', marginTop: '15px', maxWidth: '100%' }}>
                    Tutti i contenuti che servono. Non solo quelli che riesci a fare.
                  </p>
                  <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: '15px', letterSpacing: '0.1em' }}>
                    On scale. On demand. On brand. On Knowledge.
                  </p>
                  
                  <div className="cover-meta" style={{ marginTop: '40px', display: 'flex', gap: '30px' }}>
                    <div className="meta-item">
                      <div className="meta-label">Evento</div>
                      <div className="meta-val">WMF 2026</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Location</div>
                      <div className="meta-val">BolognaFiere</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Data</div>
                      <div className="meta-val">24 - 26 Giugno 2026</div>
                    </div>
                  </div>
                </div>

                <div className="slide-content-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="speaker-card" style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '30px 24px',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '360px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    <div className="speaker-photo-container" style={{
                      position: 'relative',
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      padding: '4px',
                      background: 'linear-gradient(135deg, var(--accent) 0%, rgba(0, 174, 255, 0.2) 100%)',
                      boxShadow: '0 0 25px var(--accent-glow)',
                      overflow: 'hidden'
                    }}>
                      <img src="assets/claudio_tonti.jpg" alt="Claudio Tonti" style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block'
                      }} />
                    </div>
                    <div>
                      <span className="speaker-label" style={{
                        fontFamily: 'Roboto',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>Relatore</span>
                      <h3 className="speaker-name" style={{
                        fontFamily: 'Figtree',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0',
                        textTransform: 'none',
                        letterSpacing: '-0.01em'
                      }}>Claudio Tonti</h3>
                      <p className="speaker-title" style={{
                        fontFamily: 'Roboto',
                        fontSize: '0.95rem',
                        color: 'var(--text-sec)',
                        fontWeight: 500,
                        marginTop: '6px',
                        lineHeight: 1.3
                      }}>
                        Chief AI Officer & Board Member<br />
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>websolute</span>
                      </p>
                      <div style={{
                        width: '40px',
                        height: '2px',
                        background: 'var(--border)',
                        margin: '12px auto'
                      }}></div>
                      <p className="speaker-bio" style={{
                        fontFamily: 'Roboto',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        fontWeight: 400
                      }}>
                        Digital Strategy • AI Product Designer • Innovation Director
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 1: Da Artigiani a Architetti */}
            <section className={`slide ${currentSlide === 1 ? 'active' : ''}`} id="slide-1">
              <span className="slide-tag">La Rivoluzione del Contenuto</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)', lineHeight: 1.1, marginBottom: '20px' }}>
                    Da Artigiani a Architetti di Contenuti
                  </h2>
                  <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px' }}>
                    Il nuovo paradigma per la produzione di contenuti aziendali.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                  <p className="concept-intro" style={{ borderLeft: 'none', paddingLeft: 0, fontSize: '1.45rem', lineHeight: 1.4, color: '#ffffff', fontWeight: 400 }}>
                    Content Machine trasforma radicalmente il modo in cui le aziende producono contenuti.
                  </p>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.1rem', color: 'var(--text-sec)', fontWeight: 300, lineHeight: 1.6 }}>
                    Non più creazione manuale, uno per uno, ma progettazione di sistemi intelligenti che generano migliaia di contenuti di qualità, iper-personalizzati, on demand.
                  </p>
                  <div className="takeaway-box" style={{ marginTop: '10px' }}>
                    È il passaggio dall'artigianato del singolo contenuto all'architettura scalabile di ecosistemi di contenuti.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 2: Il Problema Reale */}
            <section className={`slide ${currentSlide === 2 ? 'active' : ''}`} id="slide-2">
              <span className="slide-tag">La Quantità Mancante</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)', lineHeight: 1.1, marginBottom: '20px' }}>
                    Il Problema Reale
                  </h2>
                  <p className="concept-intro" style={{ fontSize: '1.6rem', color: '#ffffff', borderLeft: '3px solid var(--accent)', paddingLeft: '20px' }}>
                    Le aziende oggi producono solo una frazione del contenuto che sarebbe realmente utile.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                  <ul className="bullet-list" style={{ marginTop: 0, paddingLeft: 0, listStyle: 'none' }}>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Limitazioni linguistiche
                      </strong> 
                      Descrizioni prodotto tradotte solo in 3 lingue invece di 15.
                    </li>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Campagne generiche
                      </strong> 
                      Nessuna declinazione locale o contestuale per i diversi dealer o aree.
                    </li>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Visual standard
                      </strong> 
                      Nessuna personalizzazione per mercati, opzioni o varianti di prodotto.
                    </li>
                  </ul>
                  <div className="takeaway-box" style={{ borderLeft: '3px solid #ff4a4a', marginTop: '10px' }}>
                    Il problema non è la qualità di ciò che fate, ma la quantità di ciò che non riuscite a fare.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 3: Iper-Personalizzazione & Knowledge Base */}
            <section className={`slide ${currentSlide === 3 ? 'active' : ''}`} id="slide-3">
              <span className="slide-tag">Personalizzazione & Proprietary DNA</span>
              <div className="slide-layout-split">
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.8vw, 3.8rem)', marginBottom: '20px' }}>
                    Ogni Contenuto al Posto Giusto
                  </h2>
                  <p className="concept-intro">Iper-personalizzazione sistematica basata sul vostro DNA aziendale proprietario.</p>
                  <ul className="bullet-list">
                    <li><strong>Targetizzazione totale:</strong> Contenuti ad-hoc per mercato, lingua, target, canale fino al singolo rivenditore locale.</li>
                    <li><strong>Apprendimento proprietario:</strong> L'AI impara dai vostri contenuti esistenti (tone of voice, terminologia tecnica, stile visivo), non da Internet.</li>
                  </ul>
                  <div className="takeaway-box">
                    La vostra knowledge base proprietaria diventa il DNA di ogni contenuto generato. È la vostra intelligenza, amplificata.
                  </div>
                </div>
                <div className="slide-media-right" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  <div className="browser-mockup">
                    <div className="browser-header">
                      <div className="browser-dots">
                        <span className="browser-dot red"></span>
                        <span className="browser-dot yellow"></span>
                        <span className="browser-dot green"></span>
                      </div>
                      <div className="browser-address">contentmachine.websolute.it/knowledge-base</div>
                    </div>
                    <div className="browser-body">
                      {currentSlide === 3 ? (
                        <LazyVideo src="assets/videos/screen_kb.mp4" className="lazy-video" />
                      ) : (
                        <div className="browser-fallback">
                          <div className="fallback-logo">Knowledge Base</div>
                          <p className="fallback-text">Ospita la registrazione dello schermo salvando il video come <strong>screen_kb.mp4</strong> in assets/videos/.</p>
                          <div className="fallback-grid">
                            <div className="fallback-grid-cell">DATA.PDF</div>
                            <div className="fallback-grid-cell">BRAND.TXT</div>
                            <div className="fallback-grid-cell">TONE.CSV</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 4: Time to Content & Sistemi */}
            <section className={`slide ${currentSlide === 4 ? 'active' : ''}`} id="slide-4">
              <span className="slide-tag">Time to Market & Integrazione</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.8vw, 3.8rem)', marginBottom: '20px' }}>
                    Da Settimane a Minuti
                  </h2>
                  <p className="concept-intro">Abbattimento radicale del tempo di rilascio e integrazione profonda.</p>
                  <ul className="bullet-list">
                    <li><strong>Time to Content:</strong> Dataset configurati, generati in 10 lingue, revisionati e pubblicati in ore invece di mesi.</li>
                    <li><strong>Integrazione Bidirezionale:</strong> Collegamento a PIM per dati tecnici, DAM per immagini, ERP per prezzi e CRM per segmentazione.</li>
                  </ul>
                  <div className="takeaway-box">
                    Non un tool isolato, ma il motore di contenuti della vostra infrastruttura digitale.
                  </div>
                </div>
                <div className="slide-media-right" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <IntegrationFlow active={currentSlide === 4} />
                </div>
              </div>
            </section>

            {/* SLIDE 5: Controllo, Compliance & ROI */}
            <section className={`slide ${currentSlide === 5 ? 'active' : ''}`} id="slide-5">
              <span className="slide-tag">Sicurezza, Garanzia & ROI</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.5rem)', lineHeight: 1.1, marginBottom: '20px' }}>
                    Compliance & ROI Concreto
                  </h2>
                  <p className="concept-intro" style={{ fontSize: '1.6rem', color: '#ffffff', borderLeft: '3px solid var(--accent)', paddingLeft: '20px' }}>
                    Scalabilità sicura nel pieno rispetto dei regolamenti e della privacy.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
                  <ul className="bullet-list" style={{ marginTop: 0, paddingLeft: 0, listStyle: 'none' }}>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        AI Act Compliant
                      </strong> 
                      Dati proprietari isolati e mai condivisi con LLM pubblici.
                    </li>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Osservabilità & Audit
                      </strong> 
                      Tracciabilità completa con reasoning e log di approvazione per ciascun run.
                    </li>
                    <li style={{ marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Efficienza ROI
                      </strong> 
                      Riduzione dei costi operativi e sblocco del backlog di contenuti.
                    </li>
                  </ul>
                  <div className="takeaway-box" style={{ marginTop: '10px' }}>
                    Svolgere 100x the volume di contenuti con lo stesso budget o ridurre gli investimenti a parità di output.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 6: A Chi Serve in Azienda */}
            <section className={`slide ${currentSlide === 6 ? 'active' : ''}`} id="slide-6">
              <span className="slide-tag">Adozione Trasversale</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 3.2rem)', marginBottom: '10px' }}>
                A Chi Serve in Azienda
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: '1rem', maxWidth: '80%', marginBottom: '10px' }}>
                Content Machine automatizza la creazione, il controllo e l'aggiornamento di testi, immagini e HTML.
              </p>
              
              <div className="slide-grid-5">
                <div className="dept-card">
                  <div className="dept-icon-wrapper">
                    <LazyImage src="assets/pptx_media/image20.png" className="dept-icon" alt="Marketing" />
                  </div>
                  <h3 className="dept-title">Marketing & Sales</h3>
                  <p className="dept-desc">Schede prodotto, landing, visual, SEO, ofertas e materiali multilingua coerenti.</p>
                </div>
                <div className="dept-card">
                  <div className="dept-icon-wrapper">
                    <LazyImage src="assets/pptx_media/image24.png" className="dept-icon" alt="Customer Service" />
                  </div>
                  <h3 className="dept-title">Customer Service</h3>
                  <p className="dept-desc">FAQ, knowledge base e risposte standardizzate estratte direttamente da policy e documenti.</p>
                </div>
                <div className="dept-card">
                  <div className="dept-icon-wrapper">
                    <LazyImage src="assets/pptx_media/image22.png" className="dept-icon" alt="Tech Writing" />
                  </div>
                  <h3 className="dept-title">Product & Technical</h3>
                  <p className="dept-desc">Manuali di istruzione, guide HTML, specifiche tecniche generate da file PDF complessi.</p>
                </div>
                <div className="dept-card">
                  <div className="dept-icon-wrapper">
                    <LazyImage src="assets/pptx_media/image23.png" className="dept-icon" alt="Operations" />
                  </div>
                  <h3 className="dept-title">Operations & Qualità</h3>
                  <p className="dept-desc">Generazione di report, checklist, controlli automatici ed estrazione di dati booleani.</p>
                </div>
                <div className="dept-card">
                  <div className="dept-icon-wrapper">
                    <LazyImage src="assets/pptx_media/image21.png" className="dept-icon" alt="HR" />
                  </div>
                  <h3 className="dept-title">HR & Internal Comms</h3>
                  <p className="dept-desc">Localizzazione e formattazione di policy, guide aziendali e materiali formativi interni.</p>
                </div>
              </div>
            </section>

            {/* SLIDE 7: Il Dataset: L'Unità di Valore */}
            <section className={`slide ${currentSlide === 7 ? 'active' : ''}`} id="slide-7">
              <span className="slide-tag">Architettura e Valore</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.8vw, 3.8rem)', marginBottom: '20px' }}>
                Il Dataset: L'Unità di Valore
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: '1.1rem', marginBottom: '30px' }}>
                Il dataset è la "struttura di contenuto" configurabile da cui nascono output coerenti e ripetibili.
              </p>
              
              <div className="workflow-grid" style={{ marginTop: '10px' }}>
                <div className="workflow-card" style={{ minHeight: '240px', padding: '24px' }}>
                  <div>
                    <div className="step-num">01</div>
                    <h3 className="step-title">Input</h3>
                    <p className="step-desc">Testi, numeri, immagini, PDF, tabelle e flag, con analisi AI vision e comprensione documenti.</p>
                  </div>
                </div>
                <div className="workflow-card" style={{ minHeight: '240px', padding: '24px' }}>
                  <div>
                    <div className="step-num">02</div>
                    <h3 className="step-title">Output</h3>
                    <p className="step-desc">Testi, HTML, immagini generate, calcoli numerici, flag booleani con dipendenze tra campi.</p>
                  </div>
                </div>
                <div className="workflow-card" style={{ minHeight: '240px', padding: '24px' }}>
                  <div>
                    <div className="step-num">03</div>
                    <h3 className="step-title">Mental Model</h3>
                    <p className="step-desc">Prompting parametrico, regole, dipendenze logiche e sequenze di round che definiscono il ragionamento.</p>
                  </div>
                </div>
                <div className="workflow-card" style={{ minHeight: '240px', padding: '24px' }}>
                  <div>
                    <div className="step-num">04</div>
                    <h3 className="step-title">Knowledge Base</h3>
                    <p className="step-desc">Manuali, schede storiche, cataloghi, dati PIM, asset DAM e policy commerciali e di brand.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 8: Traduzione, Vision & Intelligence */}
            <section className={`slide ${currentSlide === 8 ? 'active' : ''}`} id="slide-8">
              <span className="slide-tag">Funzionalità Avanzate</span>
              <div className="slide-layout-split">
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.8vw, 3.8rem)', marginBottom: '20px' }}>
                    Multilingue Aware & Vision
                  </h2>
                  <p className="concept-intro">Elaborazione intelligente di testi, lingue e asset visivi integrata.</p>
                  <ul className="bullet-list">
                    <li><strong>Localizzazione Aware:</strong> La traduzione rispetta tono, stile, terminologia specifica (glossario) e convenzioni locali del brand.</li>
                    <li><strong>Vision Specializzata:</strong> Analisi di immagini con prompt per materiali, finiture, colori, guidando descrizioni e copy coerenti.</li>
                    <li><strong>PDF & Document Intelligence:</strong> Estrazione automatica di testi, numeri e tabelle da manuali e schede tecniche complesse.</li>
                  </ul>
                </div>
                <div className="slide-media-right" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  <div className="browser-mockup">
                    <div className="browser-header">
                      <div className="browser-dots">
                        <span className="browser-dot red"></span>
                        <span className="browser-dot yellow"></span>
                        <span className="browser-dot green"></span>
                      </div>
                      <div className="browser-address">contentmachine.websolute.it/document-intelligence</div>
                    </div>
                    <div className="browser-body">
                      {currentSlide === 8 ? (
                        <LazyVideo src="assets/videos/screen_vision.mp4" className="lazy-video" />
                      ) : (
                        <div className="browser-fallback">
                          <div className="fallback-logo">Vision & Docs</div>
                          <p className="fallback-text">Ospita la registrazione dello schermo salvando il video come <strong>screen_vision.mp4</strong> in assets/videos/.</p>
                          <div className="fallback-grid">
                            <div className="fallback-grid-cell">VISION</div>
                            <div className="fallback-grid-cell">OCR</div>
                            <div className="fallback-grid-cell">GLOSSARY</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 9: Caso di Studio: La Matrice */}
            <section className={`slide ${currentSlide === 9 ? 'active' : ''}`} id="slide-9">
              <span className="slide-tag">Caso Studio — ADV Angles Matrice</span>
              <div className="grid-matrix">
                <div className="matrix-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', marginBottom: '20px' }}>
                    L'Iper-personalizzazione di TerraViva Pet
                  </h2>
                  <p className="matrix-intro">Incrociare le variabili per parlare a ciascun target in base ad angoli specifici di razza, valore, beneficio, contesto e geolocalizzazione.</p>
                  
                  <div className="matrix-formula">
                    <div className="formula-item">23 Razze</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">6 Valori</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">6 Benefici</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">6 Target Persona</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">6 Contesti</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">30 Località</div>
                    <div className="formula-operator">×</div>
                    <div className="formula-item">6 Hooks</div>
                  </div>
                </div>
                <div className="matrix-right">
                  <div className="matrix-stat">
                    <div className="matrix-number">2.7M+</div>
                    <div className="matrix-desc">Combinazioni creative potenziali</div>
                  </div>
                  <div className="matrix-stat" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    <div className="matrix-number" style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}>3 minuti</div>
                    <div className="matrix-desc">Tempo di esecuzione per 30 campagne multicanale complete</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 10: Il Processo Operativo */}
            <section className={`slide ${currentSlide === 10 ? 'active' : ''}`} id="slide-10">
              <span className="slide-tag">Caso Studio — ADV Angles Flusso</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', marginBottom: '4vh' }}>
                Il Processo ADV Angles
              </h2>
              
              <div className="workflow-grid">
                <div className="workflow-card">
                  <div>
                    <div className="step-num">01</div>
                    <h3 className="step-title">Definizione Matrice</h3>
                    <p className="step-desc">Configurazione e invio dei parametri strategici di incrocio nel dataset (Excel/JSON).</p>
                  </div>
                  <div className="step-pill-list">
                    <span className="step-pill">Input parameters</span>
                  </div>
                </div>
                <div className="workflow-card">
                  <div>
                    <div className="step-num">02</div>
                    <h3 className="step-title">Strategia Brief</h3>
                    <p className="step-desc">Gemini scrive un Creative Brief strategico fondendo in modo coerente tutti gli angoli scelti.</p>
                  </div>
                  <div className="step-pill-list">
                    <span className="step-pill">Direzione Creativa</span>
                  </div>
                </div>
                <div className="workflow-card">
                  <div>
                    <div className="step-num">03</div>
                    <h3 className="step-title">AI Copywriting</h3>
                    <p className="step-desc">Generazione immediata e parallela di Headline, Body Copy, CTA e sceneggiature per Stories e Carousel.</p>
                  </div>
                  <div className="step-pill-list">
                    <span className="step-pill">Copy Multi-Formato</span>
                  </div>
                </div>
                <div className="workflow-card">
                  <div>
                    <div className="step-num">04</div>
                    <h3 className="step-title">Art Direction</h3>
                    <p className="step-desc">Generazione dei visual (DALL-E 3 o Gemini) coerenti con razza, prodotto e linea guida grafica.</p>
                  </div>
                  <div className="step-pill-list">
                    <span className="step-pill">Aspect Ratios (4)</span>
                  </div>
                </div>
                <div className="workflow-card">
                  <div>
                    <div className="step-num">05</div>
                    <h3 className="step-title">Video Gen</h3>
                    <p className="step-desc">Declinazione dei visual statici in brevi video in loop di 6 secondi pronti per Stories e Reels.</p>
                  </div>
                  <div className="step-pill-list">
                    <span className="step-pill">Loops 1:1 & 9:16</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 11: La Forza dei Numeri */}
            <section className={`slide ${currentSlide === 11 ? 'active' : ''}`} id="slide-11">
              <span className="slide-tag">Caso Studio — ADV Angles Numeri</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', marginBottom: '4vh' }}>
                La Forza dei Numeri (Singolo Run)
              </h2>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-val">30</div>
                  <div className="metric-label">Campagne Pubblicitarie</div>
                  <p className="metric-desc">Trenta micro-segmenti ad-hoc generati contemporaneamente per cani e gatti.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">120</div>
                  <div className="metric-label">Immagini Statistiche</div>
                  <p className="metric-desc">Visual generati ad alta risoluzione declinati in 4 formati (1:1, 4:5, 9:16, 16:9) per ogni campagna.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">60</div>
                  <div className="metric-label">Video Generati</div>
                  <p className="metric-desc">Asset video in loop da 6 secondi pronti per Stories e Reels in formato 1:1 e 9:16.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">90</div>
                  <div className="metric-label">Card Narrative Carousel</div>
                  <p className="metric-desc">Copy di Carousel a 3 schede per ciascun segmento (Problema/Hook, Soluzione, Prova/CTA).</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">210</div>
                  <div className="metric-label">Testi e Copy Declinati</div>
                  <p className="metric-desc">Headline, Body Copy, CTA, Script Hook e Hashtags pronti all'uso.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">480+</div>
                  <div className="metric-label">Asset Totali Pronti</div>
                  <p className="metric-desc">Un archivio completo esportabile in un click pronto per essere inserito su Meta Business Manager.</p>
                </div>
              </div>
            </section>

            {/* SLIDE 12: Futuri Workflow & Altri Esempi */}
            <section className={`slide ${currentSlide === 12 ? 'active' : ''}`} id="slide-12">
              <span className="slide-tag">Piattaforma Estensibile</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', marginBottom: '20px' }}>
                Futuri Workflow & Altri Esempi
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: '1.1rem', marginBottom: '30px' }}>
                Il dataset è una struttura aperta adattabile a qualsiasi flusso di lavoro aziendale.
              </p>
              
              <div className="metrics-grid">
                <div className="metric-card" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Figtree', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px' }}>
                    01. Organic Editorial Plan
                  </h3>
                  <p className="metric-desc" style={{ fontSize: '0.9rem' }}>
                    Creazione automatica di calendari editoriali per newsletter, post social e articoli di blog partendo dalle linee guida di brand e temi mensili.
                  </p>
                </div>
                <div className="metric-card" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Figtree', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px' }}>
                    02. E-Commerce PIM Enrichment
                  </h3>
                  <p className="metric-desc" style={{ fontSize: '0.9rem' }}>
                    Generazione automatica e arricchimento di schede prodotto, testi SEO e traduzioni in 15 lingue integrate con PIM/DAM aziendali.
                  </p>
                </div>
                <div className="metric-card" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Figtree', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px' }}>
                    03. Custom Workflows
                  </h3>
                  <p className="metric-desc" style={{ fontSize: '0.9rem' }}>
                    Qualsiasi combinazione personalizzata di input (PDF, DB) ed output (documenti legali, FAQ, HTML) configurabile tramite mental model.
                  </p>
                </div>
              </div>
            </section>

            {/* SLIDE 13: Visual Wall (Case Study Grid) */}
            <section className={`slide ${currentSlide === 13 ? 'active' : ''} slide-visual-wall`} id="slide-13">
              <span className="slide-tag">Visual Wall — Database delle Campagne</span>
              <h2 className="slide-title" style={{ fontSize: '2rem', marginBottom: '15px', textTransform: 'uppercase' }}>
                Matrice dei Risultati Generati (30 Varianti)
              </h2>
              
              <div className="wall-dense-grid-container">
                <div 
                  ref={gridRef}
                  className={`wall-dense-grid ${focusedCampaign ? 'zoomed' : ''}`}
                  style={gridTransform}
                >
                  {campaigns.map((camp) => {
                    const orderNum = (camp.order + 1).toString().padStart(2, '0');
                    const isFocused = focusedCampaign?.order === camp.order;
                    return (
                      <div 
                        key={camp.order} 
                        className={`wall-card-thumb ${isFocused ? 'focused' : ''} ${focusedCampaign ? (isFocused ? '' : 'not-focused') : ''}`}
                        id={`campaign-card-${camp.order}`}
                        onClick={() => {
                          setManualActiveCampaign(camp);
                          setManualActiveView('concept');
                        }}
                      >
                        <div className="wall-card-thumb-img-wrapper">
                          <LazyImage src={camp.img_feed_1x1} alt="" className="thumb-lazy-image" />
                          <div className="wall-card-thumb-badge">
                            #{orderNum}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SLIDE 14: Grazie per l'attenzione */}
            <section className={`slide ${currentSlide === 14 ? 'active' : ''}`} id="slide-14" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span className="slide-tag" style={{ marginBottom: '20px' }}>Websolute Content Machine</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', textAlign: 'center', maxWidth: '100%' }}>
                Grazie per l'attenzione
              </h2>
            </section>

            {/* BOTTOM BAR (SLIDE DECK CONTROLS) */}
            <div className="bottom-bar" id="presentation-controls">
              <div className="slide-counter" style={{ textAlign: 'left', width: '80px' }}></div>
              <div className="slide-progress-wrapper">
                <div className="slide-progress-bar" id="slide-progress-bar" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="slide-nav-arrows">
                <button className="nav-btn" onClick={handlePrev} title="Slide precedente (Freccia Sinistra)">
                  <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </button>
                <button className="nav-btn" onClick={handleNext} title="Slide successiva (Freccia Destra / Spazio)">
                  <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </button>
              </div>
              <div className="slide-counter" id="slide-counter-num">
                {currentSlide + 1} / {totalSlides}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* CONCEPT DASHBOARD OVERLAY */}
      {showConceptDashboard && focusedCampaign && (
        <div className={`dashboard-overlay ${delayedShowOverlay ? 'active' : ''}`}>
          <div className="dashboard-container">
            <div className="db-header">
              <div className="db-header-left" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div>
                  <span className="db-tag">CAMPAGNA #{(focusedCampaign.order + 1).toString().padStart(2, '0')} — CONCEPT & CONIUGAZIONE</span>
                  <h2 className="db-title">{focusedCampaign.razza} — {focusedCampaign.angle_persona}</h2>
                </div>
                <div className="db-toggle-tabs">
                  <button 
                    className={`db-tab-btn ${showConceptDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('concept');
                    }}
                  >
                    🎯 Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    🖼️ Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    ✍️ Strategia & Copy
                  </button>
                </div>
              </div>
              <button className="db-close-btn" onClick={() => {
                if (manualActiveCampaign) {
                  setManualActiveCampaign(null);
                } else {
                  const index = Math.floor((wallStep - 1) / 4);
                  setWallStep(index * 4 + 4);
                }
              }}>
                &times;
              </button>
            </div>

            <div className="db-angles-row">
              <div className="db-angle-badge"><strong>Valore:</strong> {focusedCampaign.angle_value}</div>
              <div className="db-angle-badge"><strong>Beneficio:</strong> {focusedCampaign.angle_benefit}</div>
              <div className="db-angle-badge"><strong>Persona:</strong> {focusedCampaign.angle_persona}</div>
              <div className="db-angle-badge"><strong>Contesto:</strong> {focusedCampaign.angle_contesto}</div>
              <div className="db-angle-badge"><strong>Geo:</strong> {focusedCampaign.angle_geo}</div>
              <div className="db-angle-badge"><strong>Hook:</strong> {focusedCampaign.angle_hook}</div>
            </div>

            <div className="db-concept-grid">
              <div className="db-concept-card">
                <div className="db-asset-lbl">1. Creatività di Riferimento (Master Reference)</div>
                <div className="db-concept-media-container">
                  <LazyImage src={masterRefAsset} alt="Style Reference" className="db-lazy-media" />
                </div>
              </div>
              
              <div className="db-concept-operator">+</div>

              <div className="db-concept-card">
                <div className="db-asset-lbl">2. ADV Angles (Angoli Strategici)</div>
                <div className="db-concept-angles-container">
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Valore di Comunicazione</div>
                    <div className="concept-angle-box-val">{focusedCampaign.angle_value}</div>
                  </div>
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Beneficio Funzionale</div>
                    <div className="concept-angle-box-val">{focusedCampaign.angle_benefit}</div>
                  </div>
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Target Persona</div>
                    <div className="concept-angle-box-val">{focusedCampaign.angle_persona}</div>
                  </div>
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Contesto d'Uso</div>
                    <div className="concept-angle-box-val">{focusedCampaign.angle_contesto}</div>
                  </div>
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Geolocalizzazione</div>
                    <div className="concept-angle-box-val">{focusedCampaign.angle_geo}</div>
                  </div>
                  <div className="concept-angle-box">
                    <div className="concept-angle-box-lbl">Razza Protagonista</div>
                    <div className="concept-angle-box-val">{focusedCampaign.razza}</div>
                  </div>
                </div>
              </div>

              <div className="db-concept-operator">=</div>

              <div className="db-concept-card highlighted">
                <div className="db-asset-lbl">3. Campagna Coniugata (1:1 Feed Image)</div>
                <div className="db-concept-media-container">
                  <LazyImage src={focusedCampaign.img_feed_1x1} alt="Generated 1:1 Feed" className="db-lazy-media" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSET DASHBOARD OVERLAY */}
      {showAssetsDashboard && focusedCampaign && (
        <div className={`dashboard-overlay ${delayedShowOverlay ? 'active' : ''}`}>
          <div className="dashboard-container">
            <div className="db-header">
              <div className="db-header-left" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div>
                  <span className="db-tag">CAMPAGNA #{(focusedCampaign.order + 1).toString().padStart(2, '0')} — DECLINAZIONI FORMATI</span>
                  <h2 className="db-title">{focusedCampaign.razza} — {focusedCampaign.angle_persona}</h2>
                </div>
                <div className="db-toggle-tabs">
                  <button 
                    className={`db-tab-btn ${showConceptDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('concept');
                    }}
                  >
                    🎯 Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    🖼️ Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    ✍️ Strategia & Copy
                  </button>
                </div>
              </div>
              <button className="db-close-btn" onClick={() => {
                if (manualActiveCampaign) {
                  setManualActiveCampaign(null);
                } else {
                  const index = Math.floor((wallStep - 1) / 4);
                  setWallStep(index * 4 + 4);
                }
              }}>
                &times;
              </button>
            </div>

            <div className="db-angles-row">
              <div className="db-angle-badge"><strong>Valore:</strong> {focusedCampaign.angle_value}</div>
              <div className="db-angle-badge"><strong>Beneficio:</strong> {focusedCampaign.angle_benefit}</div>
              <div className="db-angle-badge"><strong>Persona:</strong> {focusedCampaign.angle_persona}</div>
              <div className="db-angle-badge"><strong>Contesto:</strong> {focusedCampaign.angle_contesto}</div>
              <div className="db-angle-badge"><strong>Geo:</strong> {focusedCampaign.angle_geo}</div>
              <div className="db-angle-badge"><strong>Hook:</strong> {focusedCampaign.angle_hook}</div>
            </div>

            <div className="db-assets-grid-4">
              <div className="db-asset-card">
                <div className="db-asset-lbl">4:5 Mobile Feed</div>
                <div className="db-asset-media-container aspect-4-5">
                  <LazyImage src={focusedCampaign.img_feed_4x5} alt="" className="db-lazy-media" />
                </div>
              </div>
              <div className="db-asset-card">
                <div className="db-asset-lbl">9:16 Story Image</div>
                <div className="db-asset-media-container aspect-9-16">
                  <LazyImage src={focusedCampaign.img_story_9x16} alt="" className="db-lazy-media" />
                </div>
              </div>
              <div className="db-asset-card">
                <div className="db-asset-lbl">9:16 Story Video</div>
                <div className="db-asset-media-container aspect-9-16">
                  <LazyVideo src={focusedCampaign.video_story_9x16} className="db-lazy-media" />
                </div>
              </div>
              <div className="db-asset-column-stacked">
                <div className="db-asset-card stacked">
                  <div className="db-asset-lbl">1:1 Feed Video</div>
                  <div className="db-asset-media-container aspect-1-1">
                    <LazyVideo src={focusedCampaign.video_feed_1x1} className="db-lazy-media" />
                  </div>
                </div>
                <div className="db-asset-card stacked">
                  <div className="db-asset-lbl">16:9 Display Banner</div>
                  <div className="db-asset-media-container aspect-16-9">
                    <LazyImage src={focusedCampaign.img_banner_16x9} alt="" className="db-lazy-media" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRATEGIA & TESTI DASHBOARD OVERLAY */}
      {showTextsDashboard && focusedCampaign && (
        <div className={`dashboard-overlay ${delayedShowOverlay ? 'active' : ''}`}>
          <div className="dashboard-container">
            <div className="db-header">
              <div className="db-header-left" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div>
                  <span className="db-tag">CAMPAGNA #{(focusedCampaign.order + 1).toString().padStart(2, '0')} — STRATEGIA & COPY</span>
                  <h2 className="db-title">{focusedCampaign.razza} — {focusedCampaign.angle_persona}</h2>
                </div>
                <div className="db-toggle-tabs">
                  <button 
                    className={`db-tab-btn ${showConceptDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('concept');
                    }}
                  >
                    🎯 Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    🖼️ Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    ✍️ Strategia & Copy
                  </button>
                </div>
              </div>
              <button className="db-close-btn" onClick={() => {
                if (manualActiveCampaign) {
                  setManualActiveCampaign(null);
                } else {
                  const index = Math.floor((wallStep - 1) / 4);
                  setWallStep(index * 4 + 4);
                }
              }}>
                &times;
              </button>
            </div>

            <div className="db-texts-columns">
              <div className="db-text-col">
                <h3 className="db-col-title">🎯 Creative Brief</h3>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Messaggio Chiave</div>
                  <div className="db-card-section-val highlight">{getBriefSection(focusedCampaign.creative_brief, 'KEY MESSAGE')}</div>
                </div>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Target Insight</div>
                  <div className="db-card-section-val">{getBriefSection(focusedCampaign.creative_brief, 'TARGET INSIGHT')}</div>
                </div>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Direzione Visiva</div>
                  <div className="db-card-section-val">{getBriefSection(focusedCampaign.creative_brief, 'VISUAL DIRECTION')}</div>
                </div>
                <div className="db-card-section-split">
                  <div className="db-card-section">
                    <div className="db-card-section-lbl">Tono di Voce</div>
                    <div className="db-card-section-val">{getBriefSection(focusedCampaign.creative_brief, 'TONE')}</div>
                  </div>
                  <div className="db-card-section">
                    <div className="db-card-section-lbl">Differenziatore</div>
                    <div className="db-card-section-val">{getBriefSection(focusedCampaign.creative_brief, 'DIFFERENTIATOR')}</div>
                  </div>
                </div>
              </div>

              <div className="db-text-col">
                <h3 className="db-col-title">✍️ Ad Copy Pubblicitario</h3>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Headline</div>
                  <div className="db-card-section-val copy-quote">"{focusedCampaign.headline}"</div>
                </div>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Body Copy</div>
                  <div className="db-card-section-val pre-wrap">{focusedCampaign.body_copy}</div>
                </div>
                <div className="db-card-section-split">
                  <div className="db-card-section" style={{ flex: 1 }}>
                    <div className="db-card-section-lbl">Call to Action (CTA)</div>
                    <div className="db-card-section-val cta-badge">{focusedCampaign.cta}</div>
                  </div>
                  <div className="db-card-section" style={{ flex: 1.5 }}>
                    <div className="db-card-section-lbl">Tipo di Hook</div>
                    <div className="db-card-section-val">{focusedCampaign.angle_hook}</div>
                  </div>
                </div>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Script Hook d'Apertura (Reels/Stories)</div>
                  <div className="db-card-section-val copy-quote">"{focusedCampaign.hook_script}"</div>
                </div>
              </div>

              <div className="db-text-col">
                <h3 className="db-col-title">🎠 Carousel & Hashtags</h3>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Narrativa Carousel Social</div>
                  <div className="db-carousel-slides">
                    {parseCarousel(focusedCampaign.carousel_narrative).map((slide, sIdx) => (
                      <div key={sIdx} className="db-carousel-slide-box">
                        <div className="db-carousel-slide-title">Card {slide.num}: {slide.title}</div>
                        <div className="db-carousel-slide-text">{slide.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="db-card-section">
                  <div className="db-card-section-lbl">Hashtags Consigliati</div>
                  <div className="db-hashtags-box">{focusedCampaign.hashtags}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agentation Root */}
      <div id="agentation-root"></div>
    </div>
  );
}
