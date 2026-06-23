import React, { useState, useEffect, useRef } from 'react';
import campaigns from './data.json';
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

  return <video ref={videoRef} loop muted playsinline className={className} style={style} />;
}

export default function App() {
  const [viewMode, setViewMode] = useState('slides'); // slides | wall
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState(null);
  
  // Wall Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [valFilter, setValFilter] = useState('');
  const [benFilter, setBenFilter] = useState('');
  const [perFilter, setPerFilter] = useState('');

  const totalSlides = 14;

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
    "Grazie"
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Space' || e.code === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        setActiveCampaign(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, viewMode]);

  const handleNext = () => {
    if (viewMode === 'slides') {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        setViewMode('wall');
      }
    }
  };

  const handlePrev = () => {
    if (viewMode === 'wall') {
      setViewMode('slides');
      setCurrentSlide(totalSlides - 1);
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
            className={`nav-mode-btn ${viewMode === 'slides' ? 'active' : ''}`}
            onClick={() => setViewMode('slides')}
          >
            Slide Deck
          </button>
          <button 
            id="nav-btn-wall" 
            className={`nav-mode-btn ${viewMode === 'wall' ? 'active' : ''}`}
            onClick={() => setViewMode('wall')}
          >
            Visual Wall
          </button>
        </nav>
      </header>

      <div id="app">
        {/* SLIDES CONTAINER */}
        {viewMode === 'slides' && (
          <div className="slides-container" id="slides-view">
            
            {/* SLIDE 0: Cover */}
            <section className={`slide ${currentSlide === 0 ? 'active' : ''}`} id="slide-0">
              <span className="slide-tag">WMF 2026 Speech Presentation</span>
              <h1 className="slide-title">CONTENT MACHINE</h1>
              <p className="slide-subtitle" style={{ fontSize: '1.8rem', marginTop: '15px' }}>
                Tutti i contenuti che servono. Non solo quelli che riesci a fare.
              </p>
              <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: '10px', letterSpacing: '0.1em' }}>
                On scale. On demand. On brand. On Knowledge.
              </p>
              
              <div className="cover-footer">
                <div className="cover-meta">
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
                        <span class="browser-dot yellow"></span>
                        <span class="browser-dot green"></span>
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
                        <span class="browser-dot yellow"></span>
                        <span class="browser-dot green"></span>
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

            {/* SLIDE 13: Grazie per l'attenzione */}
            <section className={`slide ${currentSlide === 13 ? 'active' : ''}`} id="slide-13" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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

        {/* VISUAL WALL VIEW */}
        {viewMode === 'wall' && (
          <div id="wall-view" style={{ display: 'block' }}>
            {/* Filter toolbar */}
            <div className="wall-filters-bar">
              <div className="filtered-count-label" id="filtered-count">
                Mostrando {filteredCampaigns.length} di {campaigns.length} Varianti
              </div>
              
              <div className="filter-group">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Cerca per angoli, copy, razza..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <select className="filter-select" value={valFilter} onChange={(e) => setValFilter(e.target.value)}>
                  <option value="">Tutti i Valori</option>
                  <option value="Made in Italy">Made in Italy</option>
                  <option value="Naturalità">Naturalità</option>
                  <option value="Risultati visibili">Risultati visibili</option>
                  <option value="Scienza">Scienza</option>
                  <option value="Sostenibilità">Sostenibilità</option>
                  <option value="Trasparenza">Trasparenza</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select className="filter-select" value={benFilter} onChange={(e) => setBenFilter(e.target.value)}>
                  <option value="">Tutti i Benefici</option>
                  <option value="Articolazioni">Articolazioni</option>
                  <option value="Controllo Peso">Controllo Peso</option>
                  <option value="Digestione">Digestione</option>
                  <option value="Energia & Vitalità">Energia & Vitalità</option>
                  <option value="Intolleranze">Intolleranze</option>
                  <option value="Pelo & Cute">Pelo & Cute</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select className="filter-select" value={perFilter} onChange={(e) => setPerFilter(e.target.value)}>
                  <option value="">Tutte le Persone</option>
                  <option value="Dog Sportivo">Dog Sportivo</option>
                  <option value="Eco-Consapevole">Eco-Consapevole</option>
                  <option value="Famiglia Multi-Pet">Famiglia Multi-Pet</option>
                  <option value="Giovane Adottante">Giovane Adottante</option>
                  <option value="Pet Parent Attento">Pet Parent Attento</option>
                  <option value="Senior Owner">Senior Owner</option>
                </select>
              </div>

              <button className="btn-reset-filters" onClick={() => {
                setSearchQuery('');
                setValFilter('');
                setBenFilter('');
                setPerFilter('');
              }}>
                Reset
              </button>
            </div>

            {/* Wall Columns - Feed */}
            <div className="wall-wrapper">
              <main className="wall-feed" id="wall-campaigns-feed">
                {filteredCampaigns.length === 0 ? (
                  <div className="empty-state">
                    <h3>Nessuna variante corrisponde ai filtri selezionati</h3>
                    <p>Prova a modificare i filtri o la query di ricerca.</p>
                  </div>
                ) : (
                  filteredCampaigns.map((camp) => {
                    const orderNum = (camp.order + 1).toString().padStart(2, '0');
                    return (
                      <section key={camp.order} className="wall-campaign-block" id={`campaign-sec-${camp.order}`}>
                        <div className="wall-campaign-header">
                          <h3 className="wall-campaign-title">CAMPAGNA #{orderNum}</h3>
                          <div className="wall-campaign-index">#{orderNum}</div>
                        </div>

                        {/* 3x2 Strategic Angles Grid */}
                        <div className="angles-grid">
                          <div className="angle-cell">
                            <span className="angle-label">Valore di Comunicazione</span>
                            <span className="angle-value">{camp.angle_value}</span>
                          </div>
                          <div className="angle-cell">
                            <span className="angle-label">Beneficio Funzionale</span>
                            <span className="angle-value">{camp.angle_benefit}</span>
                          </div>
                          <div className="angle-cell">
                            <span className="angle-label">Target Persona</span>
                            <span className="angle-value">{camp.angle_persona}</span>
                          </div>
                          <div className="angle-cell">
                            <span className="angle-label">Contesto / Momento</span>
                            <span className="angle-value">{camp.angle_contesto}</span>
                          </div>
                          <div className="angle-cell">
                            <span className="angle-label">Area Geografica (Geo)</span>
                            <span className="angle-value">{camp.angle_geo}</span>
                          </div>
                          <div className="angle-cell">
                            <span className="angle-label">Hook d'Apertura</span>
                            <span className="angle-value">{camp.angle_hook}</span>
                          </div>
                        </div>

                        {/* Media Columns */}
                        <div className="media-columns">
                          {/* Column 1: Static Feed */}
                          <div className="media-column">
                            <div className="media-item">
                              {getChannelHeader('img_feed_1x1')}
                              <div className="media-container aspect-1-1">
                                <LazyImage src={camp.img_feed_1x1} alt="Ad Feed 1:1" className="lazy-image" />
                              </div>
                            </div>
                            <div className="media-item">
                              {getChannelHeader('img_feed_4x5')}
                              <div className="media-container aspect-4-5">
                                <LazyImage src={camp.img_feed_4x5} alt="Ad Mobile Feed 4:5" className="lazy-image" />
                              </div>
                            </div>
                            <div className="media-item">
                              {getChannelHeader('img_banner_16x9')}
                              <div className="media-container aspect-16-9">
                                <LazyImage src={camp.img_banner_16x9} alt="Ad Banner 16:9" className="lazy-image" />
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Stories & Reels */}
                          <div className="media-column">
                            <div className="media-item">
                              {getChannelHeader('img_story_9x16')}
                              <div className="media-container aspect-9-16">
                                <LazyImage src={camp.img_story_9x16} alt="Ad Story Image 9:16" className="lazy-image" />
                              </div>
                            </div>
                            <div className="media-item">
                              {getChannelHeader('video_story_9x16')}
                              <div className="media-container aspect-9-16">
                                <LazyVideo src={camp.video_story_9x16} className="lazy-video" />
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Video Feed */}
                          <div className="media-column">
                            <div className="media-item">
                              {getChannelHeader('video_feed_1x1')}
                              <div className="media-container aspect-1-1">
                                <LazyVideo src={camp.video_feed_1x1} className="lazy-video" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Strategia copy trigger */}
                        <div>
                          <button className="btn-open-strategy" onClick={() => setActiveCampaign(camp)}>
                            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
                              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                            </svg>
                            Leggi Strategia & Ad Copy
                          </button>
                          <div className="campaign-footer-meta">
                            <strong>Razza di riferimento:</strong> {camp.razza} | <strong>Prodotto:</strong> {camp.prodotto}
                          </div>
                        </div>
                      </section>
                    );
                  })
                )}
              </main>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER OVERLAY */}
      <div 
        className={`drawer-overlay ${activeCampaign ? 'active' : ''}`} 
        onClick={() => setActiveCampaign(null)}
      ></div>

      {/* DRAWER DETAIL PANEL */}
      <div className={`drawer ${activeCampaign ? 'active' : ''}`} id="detail-drawer">
        {activeCampaign && (
          <>
            <div className="drawer-header">
              <div className="drawer-title">
                Dettaglio Strategico: Variante #{(activeCampaign.order + 1).toString().padStart(2, '0')}
              </div>
              <button className="btn-close-drawer" onClick={() => setActiveCampaign(null)}>
                <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            
            <div className="drawer-content">
              {/* Strategic Mix info */}
              <div className="drawer-meta-section">
                <h4>Incrocio Angoli Strategici</h4>
                <div className="drawer-meta-grid">
                  <div className="drawer-meta-card">
                    <div className="meta-label">Valore di Comunicazione</div>
                    <div className="meta-val">{activeCampaign.angle_value}</div>
                  </div>
                  <div className="drawer-meta-card">
                    <div className="meta-label">Beneficio Funzionale</div>
                    <div className="meta-val">{activeCampaign.angle_benefit}</div>
                  </div>
                  <div className="drawer-meta-card">
                    <div className="meta-label">Target Persona</div>
                    <div className="meta-val">{activeCampaign.angle_persona}</div>
                  </div>
                  <div className="drawer-meta-card">
                    <div className="meta-label">Contesto / Momento</div>
                    <div className="meta-val">{activeCampaign.angle_contesto}</div>
                  </div>
                  <div className="drawer-meta-card">
                    <div className="meta-label">Area Geografica (Geo)</div>
                    <div className="meta-val">{activeCampaign.angle_geo}</div>
                  </div>
                  <div className="drawer-meta-card">
                    <div className="meta-label">Razza Di Riferimento</div>
                    <div className="meta-val">{activeCampaign.razza}</div>
                  </div>
                </div>
              </div>

              {/* Prodotto */}
              <div className="drawer-meta-section">
                <h4>Prodotto Abbinato</h4>
                <div className="drawer-meta-card" style={{ background: 'none' }}>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.95rem', fontWeight: 600 }}>
                    {activeCampaign.prodotto}
                  </p>
                </div>
              </div>

              {/* Creative Brief */}
              <div className="drawer-brief-section">
                <div className="drawer-section-title">
                  <span>🎯 Creative Brief Strategico</span>
                  <span className="drawer-section-badge">DIREZIONE CREATIVA AI</span>
                </div>
                <div className="brief-block">
                  <div className="brief-item">
                    <div className="brief-label">Messaggio Chiave (Key Message)</div>
                    <div className="brief-value" style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35, color: 'var(--text-main)' }}>
                      {getBriefSection(activeCampaign.creative_brief, 'KEY MESSAGE') || 'Non specificato'}
                    </div>
                  </div>
                  <div className="brief-item">
                    <div className="brief-label">Target Insight</div>
                    <div className="brief-value">
                      {getBriefSection(activeCampaign.creative_brief, 'TARGET INSIGHT') || 'Non specificato'}
                    </div>
                  </div>
                  <div className="brief-item">
                    <div className="brief-label">Direzione Visiva (Visual Direction)</div>
                    <div className="brief-value">
                      {getBriefSection(activeCampaign.creative_brief, 'VISUAL DIRECTION') || 'Non specificato'}
                    </div>
                  </div>
                  <div className="brief-item">
                    <div className="brief-label">Tono di Voce (Tone)</div>
                    <div className="brief-value">
                      {getBriefSection(activeCampaign.creative_brief, 'TONE') || 'Non specificato'}
                    </div>
                  </div>
                  <div className="brief-item">
                    <div className="brief-label">Differenziatore Strategico</div>
                    <div className="brief-value">
                      {getBriefSection(activeCampaign.creative_brief, 'DIFFERENTIATOR') || 'Non specificato'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Copy Previews */}
              <div>
                <div className="drawer-section-title">
                  <span>✍️ Copy Pubblicitario Declinato</span>
                  <span className="drawer-section-badge">Ad Copy / Hooks</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Meta Feed Ad Preview
                    </h4>
                    <div className="preview-box">
                      <div className="preview-headline">"{activeCampaign.headline}"</div>
                      <div className="preview-body">{activeCampaign.body_copy}</div>
                      <div className="preview-cta">{activeCampaign.cta}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Hook d'apertura (Reels/Stories)</span>
                      <span style={{ fontWeight: 600, fontFamily: 'Roboto' }}>Tipo: {activeCampaign.angle_hook}</span>
                    </h4>
                    <div className="preview-box">
                      <div className="preview-script">"{activeCampaign.hook_script}"</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Testo Carousel Narrativo (3 Card)
                    </h4>
                    <div className="carousel-slides-wrapper">
                      {parseCarousel(activeCampaign.carousel_narrative).map((slide) => (
                        <div key={slide.num || Math.random()} className="carousel-slide-box">
                          <div className="carousel-slide-title">Card {slide.num}: {slide.title}</div>
                          <div className="carousel-slide-desc">{slide.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Social Hashtags
                    </h4>
                    <div className="preview-box" style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600, wordSpacing: '4px' }}>
                      {activeCampaign.hashtags}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Agentation Root */}
      <div id="agentation-root"></div>
    </div>
  );
}
