import React, { useState, useEffect, useRef } from 'react';
import campaignData from './data.json';
import editorialData from './data_editorial.json';
const campaigns = (campaignData.dataset || []).map(item => ({
  order: item.order,
  ...(item.data?.it || {})
}));
const masterRefAsset = (campaignData.assets || []).find(a => a.tagName === '##master_adv_reference##')?.value || '';
const productBagAsset = (campaignData.assets || []).find(a => a.tagName === '##product_bag##')?.value || '';
const firstProduct = campaigns[0] || {};
import IntegrationFlow from './components/IntegrationFlow';
import KnowledgeGraph from './components/KnowledgeGraph';
import { InstagramCarousel, InstagramStory, TikTokPhone } from './components/PhoneMockup';
import { PaintBrush, Package, Brain, Target, Lightbulb, UserFocus, MapPin, Anchor, Warning, BookOpen, Images, PencilLine, Crosshair, SlidersHorizontal, CaretCircleRight, PawPrint, Clock, Megaphone, Globe, Newspaper, MusicNote } from '@phosphor-icons/react';


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
  const [wallStep, setWallStep] = useState(0); // 0 to 32 (UC1)
  const [editWallStep, setEditWallStep] = useState(0); // 0 to 5 (UC2 carousel)
  const [manualActiveCampaign, setManualActiveCampaign] = useState(null);
  const [manualActiveView, setManualActiveView] = useState('concept'); // 'concept' | 'assets' | 'texts'
  const [delayedShowOverlay, setDelayedShowOverlay] = useState(false);
  
  // Wall Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [valFilter, setValFilter] = useState('');
  const [benFilter, setBenFilter] = useState('');
  const [perFilter, setPerFilter] = useState('');
  const [uc1ImageIdx, setUc1ImageIdx] = useState(0);
  const [uc2ImageIdx, setUc2ImageIdx] = useState(0);

  const totalSlides = 20;
  const featuredCampaignOrders = [0, 1, 2, 4, 5, 11, 13, 8];

  // Editorial contents (UC2) — only filled rows
  const editorialContents = editorialData.dataset
    .filter(item => item.data.it?.social_caption)
    .map(item => ({ order: item.order, ...item.data.it }));
  const editorialLangs = (editorialData.languages || []).map(l => l.code);

  // Editorial steps: 6 Italian contents + 5 translations of Content 0 (it, en, es, fr, de)
  const editorialSteps = [
    { order: 0, lang: 'it' },
    { order: 1, lang: 'it' },
    { order: 2, lang: 'it' },
    { order: 3, lang: 'it' },
    { order: 4, lang: 'it' },
    { order: 5, lang: 'it' },
    { order: 0, lang: 'en' },
    { order: 0, lang: 'es' },
    { order: 0, lang: 'fr' },
    { order: 0, lang: 'de' },
    { order: 0, lang: 'it' }
  ];

  // Slide Names mapping for future use/nav
  const slideNames = [
    "Copertina",
    "websolute",
    "Artigiani vs Architetti",
    "Il Problema Reale",
    "Iper-Personalizzazione & KB",
    "Time to Content & Sistemi",
    "Compliance & ROI",
    "A Chi Serve in Azienda",
    "Il Dataset: Valore",
    "Use Case",
    "ADV Angles",
    "Combinatoria & Output",
    "Il Ciclo Ricorsivo",
    "Piattaforma UC1",
    "Visual Wall UC1",
    "Organic Editorial",
    "Editorial: Numeri & Lingue",
    "Piattaforma UC2",
    "Visual Wall UC2",
    "Grazie"
  ];

  // Derive focused and active dashboards based on wallStep
  let focusedCampaign = null;
  let showConceptDashboard = false;
  let showAssetsDashboard = false;
  let showTextsDashboard = false;

  if (currentSlide === 14 && wallStep > 0 && wallStep <= 32) {
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

  // UC2 Editorial: sequential steps with translations
  const currentStep = (currentSlide === 18 && editorialSteps[editWallStep]) ? editorialSteps[editWallStep] : null;
  const currentEditorial = currentStep ? (() => {
    const rawItem = editorialData.dataset.find(item => item.order === currentStep.order);
    return rawItem ? {
      order: rawItem.order,
      lang: currentStep.lang,
      ...(rawItem.data[currentStep.lang] || rawItem.data.it)
    } : null;
  })() : null;

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
  const gridRef2 = useRef(null);
  const slide1VideoRef = useRef(null);
  const [gridTransform, setGridTransform] = useState({ transform: 'translate(0px, 0px) scale(1)' });
  const [editGridTransform, setEditGridTransform] = useState({ transform: 'translate(0px, 0px) scale(1)' });

  useEffect(() => {
    if (currentSlide === 1 && slide1VideoRef.current) {
      slide1VideoRef.current.currentTime = 0;
      slide1VideoRef.current.play().catch(() => {});
    }
  }, [currentSlide]);

  // UC1 screenshot slide: alternate images every 2 seconds
  useEffect(() => {
    if (currentSlide !== 13) return;
    const interval = setInterval(() => {
      setUc1ImageIdx(prev => (prev === 0 ? 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // UC2 screenshot slide: alternate images every 2 seconds
  useEffect(() => {
    if (currentSlide !== 17) return;
    const interval = setInterval(() => {
      setUc2ImageIdx(prev => (prev === 0 ? 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  useEffect(() => {
    const updateTransform = () => {
      if (currentSlide === 14 && focusedCampaign) {
        const card = document.getElementById(`campaign-card-${focusedCampaign.order}`);
        const grid = gridRef.current;
        if (card && grid) {
          const gridRect = grid.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          
          // Card center relative to the grid element (before any transform)
          // We need the position in the grid's own coordinate space
          const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
          const cardCenterY = card.offsetTop + card.offsetHeight / 2;
          
          // Container (viewport) center
          const container = grid.parentElement;
          const containerRect = container.getBoundingClientRect();
          const viewCenterX = containerRect.width / 2;
          const viewCenterY = containerRect.height / 2;
          
          const scaleFactor = 2.8;
          
          // After scaling with origin at card center, the card stays at its position.
          // We translate the scaled grid so the card center aligns with viewport center.
          const translateX = viewCenterX - cardCenterX;
          const translateY = viewCenterY - cardCenterY;
          
          setGridTransform({
            transformOrigin: `${cardCenterX}px ${cardCenterY}px`,
            transform: `translate(${translateX}px, ${translateY}px) scale(${scaleFactor})`
          });
        }
      } else {
        setGridTransform({ transform: 'translate(0px, 0px) scale(1)', transformOrigin: 'center center' });
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
  }, [currentSlide, wallStep, manualActiveCampaign, editWallStep]);

  const handleNext = () => {
    if (currentSlide === 14) {
      if (wallStep < 32) {
        setWallStep(prev => prev + 1);
      } else {
        setWallStep(0);
        setCurrentSlide(15);
      }
    } else if (currentSlide === 18) {
      if (editWallStep < editorialSteps.length - 1) {
        setEditWallStep(prev => prev + 1);
      } else {
        setEditWallStep(0);
        setCurrentSlide(19);
      }
    } else if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide === 14) {
      if (wallStep > 0) {
        setWallStep(prev => prev - 1);
      } else {
        setCurrentSlide(13);
      }
    } else if (currentSlide === 15) {
      setCurrentSlide(14);
      setWallStep(32);
    } else if (currentSlide === 18) {
      if (editWallStep > 0) {
        setEditWallStep(prev => prev - 1);
      } else {
        setCurrentSlide(17);
      }
    } else if (currentSlide === 19) {
      setCurrentSlide(18);
      setEditWallStep(editorialSteps.length - 1);
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
        </div>
        <div className="brand-title-wrap">
          <span className="brand-title">CONTENT MACHINE</span>
        </div>
      </header>

      <div id="app">
        {/* SLIDES CONTAINER */}
        {true && (
          <div className="slides-container" id="slides-view">
            
            {/* SLIDE 0: Cover */}
            <section className={`slide ${currentSlide === 0 ? 'active' : ''}`} id="slide-0">
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1.2fr 1fr 1fr', gap: '40px', alignItems: 'center' }}>
                {/* Column 1: Left */}
                <div className="slide-content-left" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  height: '100%', 
                  minHeight: '760px',
                  padding: '30px 0'
                }}>
                  <div>
                    <span className="slide-tag">WMF 2026 Speech Presentation</span>
                    <h1 className="slide-title" style={{ fontSize: 'clamp(2rem, 4.2vw, 4.8rem)', lineHeight: 1.05 }}>CONTENT MACHINE</h1>
                    <p className="slide-subtitle" style={{ fontSize: '1.45rem', marginTop: '20px', maxWidth: '100%', lineHeight: 1.4 }}>
                      Tutti i contenuti che servono. Non solo quelli che riesci a fare.
                    </p>
                    <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: '20px', letterSpacing: '0.1em' }}>
                      On scale. On demand. On brand. On Knowledge.
                    </p>
                  </div>
                  
                  <div className="cover-meta" style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                    <div className="meta-item">
                      <div className="meta-label">Evento</div>
                      <div className="meta-val" style={{ fontSize: '1.1rem', fontWeight: 600 }}>WMF 2026</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Location</div>
                      <div className="meta-val" style={{ fontSize: '1.1rem', fontWeight: 600 }}>BolognaFiere</div>
                    </div>
                    <div className="meta-item">
                      <div className="meta-label">Data</div>
                      <div className="meta-val" style={{ fontSize: '1.1rem', fontWeight: 600 }}>24 - 26 Giugno 2026</div>
                    </div>
                  </div>
                </div>                 {/* Column 2: Center */}
                {/* Column 2: Center */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="speaker-card" style={{
                    background: 'rgba(15, 15, 15, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '40px 24px',
                    width: '100%',
                    height: '100%',
                    minHeight: '760px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    textAlign: 'center'
                  }}>
                    <div className="speaker-photo-container" style={{
                      position: 'relative',
                      width: '260px',
                      height: '260px',
                      borderRadius: '50%',
                      padding: '4px',
                      background: 'linear-gradient(135deg, var(--accent) 0%, rgba(0, 174, 255, 0.2) 100%)',
                      boxShadow: '0 0 25px var(--accent-glow)',
                      overflow: 'hidden',
                      flexShrink: 0
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
                        marginBottom: '8px'
                      }}>Relatore</span>
                      <h3 className="speaker-name" style={{
                        fontFamily: 'Figtree',
                        fontSize: '2.3rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        margin: '0',
                        textTransform: 'none',
                        lineHeight: 1.05
                      }}>Claudio Tonti</h3>
                      <p className="speaker-title" style={{
                        fontFamily: 'Roboto',
                        fontSize: '1.05rem',
                        color: 'var(--text-sec)',
                        fontWeight: 500,
                        marginTop: '12px',
                        lineHeight: 1.3
                      }}>
                        VP of AI & Innovation, co-founder<br />
                        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem' }}>websolute</span><br />
                        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1.05rem', marginTop: '10px', display: 'inline-block' }}>Autore di "Dialogo sulla Soglia"</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 3: Right */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="book-promo-card" style={{
                    background: 'rgba(15, 15, 15, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    padding: '40px 24px',
                    width: '100%',
                    height: '100%',
                    minHeight: '760px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <img 
                        src="assets/dialogo_sulla_soglia_.jpg" 
                        alt="Copertina Dialogo sulla Soglia" 
                        style={{
                          width: '320px',
                          height: '480px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }} 
                      />
                    </div>
                    
                    <div>
                      <h4 style={{
                        fontFamily: 'Figtree',
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0',
                        textTransform: 'none',
                        lineHeight: 1.15
                      }}>"Dialogo sulla Soglia"</h4>
                      <p style={{
                        fontFamily: 'Roboto',
                        fontSize: '0.9rem',
                        color: 'var(--text-sec)',
                        marginTop: '8px',
                        lineHeight: 1.3
                      }}>
                        Un confronto filosofico ed etico tra uomo e AI.
                      </p>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '15px', 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '8px 16px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      width: '100%'
                    }}>
                      <div style={{
                        background: '#ffffff',
                        padding: '4px',
                        borderRadius: '6px',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https%3A%2F%2Famzn.eu%2Fd%2F0caKA0Gf" alt="QR Code Amazon" style={{
                          width: '100%',
                          height: '100%',
                          display: 'block'
                        }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{
                          fontFamily: 'Roboto',
                          fontSize: '0.7rem',
                          color: '#ffffff',
                          fontWeight: 500,
                          display: 'block'
                        }}>Ordina su Amazon:</span>
                        <span style={{
                          fontFamily: 'Roboto',
                          fontSize: '0.75rem',
                          color: 'var(--accent)',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}>amzn.eu/d/0caKA0Gf</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

            {/* SLIDE 1: websolute video */}
            <section className={`slide ${currentSlide === 1 ? 'active' : ''}`} id="slide-1" style={{ padding: 0, position: 'relative', overflow: 'hidden', background: '#000' }}>
              <video ref={slide1VideoRef} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                <source src="https://www.websolute.com/oven/media/AI-first%20Digital%20Agency%20-%20Vision%20to%20Growth%20-%20cut.webm" type="video/webm" />
              </video>
            </section>

            {/* SLIDE 2: Da Artigiani a Architetti */}
            <section className={`slide ${currentSlide === 2 ? 'active' : ''}`} id="slide-2">
              <span className="slide-tag">La Rivoluzione del Contenuto</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)', lineHeight: 1.05, marginBottom: '20px' }}>
                    Da Artigiani a Architetti di Contenuti
                  </h2>
                  <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.6rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px' }}>
                    Il nuovo paradigma per la produzione di contenuti aziendali.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
                  <p className="concept-intro" style={{ borderLeft: 'none', paddingLeft: 0, fontSize: '2rem', lineHeight: 1.4, color: '#ffffff', fontWeight: 400 }}>
                    Content Machine trasforma radicalmente il modo in cui le aziende producono contenuti.
                  </p>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.45rem', color: 'var(--text-sec)', fontWeight: 300, lineHeight: 1.6 }}>
                    Non più creazione manuale, uno per uno, ma progettazione di sistemi intelligenti che generano migliaia di contenuti di qualità, iper-personalizzati, on demand.
                  </p>
                  <div className="takeaway-box" style={{ marginTop: '15px', fontSize: '1.5rem', padding: '16px 20px' }}>
                    È il passaggio dall'artigianato del singolo contenuto all'architettura scalabile di ecosistemi di contenuti.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 3: Il Problema Reale */}
            <section className={`slide ${currentSlide === 3 ? 'active' : ''}`} id="slide-3">
              <span className="slide-tag">La Quantità Mancante</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)', lineHeight: 1.05, marginBottom: '20px' }}>
                    Il Problema Reale
                  </h2>
                  <p className="concept-intro" style={{ fontSize: '2.1rem', color: '#ffffff', borderLeft: '3px solid var(--accent)', paddingLeft: '20px', lineHeight: 1.4 }}>
                    Le aziende oggi producono solo una frazione del contenuto che sarebbe realmente utile.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
                  <ul className="bullet-list" style={{ marginTop: 0, paddingLeft: 0, listStyle: 'none' }}>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Limitazioni linguistiche
                      </strong> 
                      Descrizioni prodotto tradotte solo in 3 lingue invece di 15.
                    </li>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Campagne generiche
                      </strong> 
                      Nessuna declinazione locale o contestuale per i diversi dealer o aree.
                    </li>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Visual standard
                      </strong> 
                      Nessuna personalizzazione per mercati, opzioni o varianti di prodotto.
                    </li>
                  </ul>
                  <div className="takeaway-box" style={{ borderLeft: '3px solid #ff4a4a', marginTop: '15px', fontSize: '1.5rem', padding: '16px 20px' }}>
                    Il problema non è la qualità di ciò che fate, ma la quantità di ciò che non riuscite a fare.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 4: Iper-Personalizzazione & Knowledge Base */}
            <section className={`slide ${currentSlide === 4 ? 'active' : ''}`} id="slide-4">
              <span className="slide-tag">Personalizzazione & Proprietary DNA</span>
              <div className="slide-layout-split">
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)', lineHeight: 1.05, marginBottom: '20px' }}>
                    Ogni Contenuto al Posto Giusto
                  </h2>
                  <p className="concept-intro" style={{ fontSize: '1.8rem', color: '#ffffff', lineHeight: 1.4 }}>Iper-personalizzazione sistematica basata sul vostro DNA aziendale proprietario.</p>
                  <ul className="bullet-list" style={{ marginTop: '20px' }}>
                    <li style={{ fontSize: '1.35rem', marginBottom: '15px' }}><strong>Targetizzazione totale:</strong> Contenuti ad-hoc per mercato, lingua, target, canale fino al singolo rivenditore locale.</li>
                    <li style={{ fontSize: '1.35rem', marginBottom: '15px' }}><strong>Apprendimento proprietario:</strong> L'AI impara dai vostri contenuti esistenti (tone of voice, terminologia tecnica, stile visivo), non da Internet.</li>
                  </ul>
                  <div className="takeaway-box" style={{ marginTop: '20px', fontSize: '1.5rem', padding: '16px 20px' }}>
                    La vostra knowledge base proprietaria diventa il DNA di ogni contenuto generato. È la vostra intelligenza, amplificata.
                  </div>
                </div>
                <div className="slide-media-right" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <KnowledgeGraph active={currentSlide === 4} />
                </div>
              </div>
            </section>

            {/* SLIDE 5: Time to Content & Sistemi */}
            <section className={`slide ${currentSlide === 5 ? 'active' : ''}`} id="slide-5">
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
                  <IntegrationFlow active={currentSlide === 5} />
                </div>
              </div>
            </section>

            {/* SLIDE 6: Controllo, Compliance & ROI */}
            <section className={`slide ${currentSlide === 6 ? 'active' : ''}`} id="slide-6">
              <span className="slide-tag">Sicurezza, Garanzia & ROI</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left">
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)', lineHeight: 1.05, marginBottom: '20px' }}>
                    Compliance & ROI Concreto
                  </h2>
                  <p className="concept-intro" style={{ fontSize: '2.1rem', color: '#ffffff', borderLeft: '3px solid var(--accent)', paddingLeft: '20px', lineHeight: 1.4 }}>
                    Scalabilità sicura nel pieno rispetto dei regolamenti e della privacy.
                  </p>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
                  <ul className="bullet-list" style={{ marginTop: 0, paddingLeft: 0, listStyle: 'none' }}>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        AI Act Compliant
                      </strong> 
                      Dati proprietari isolati e mai condivisi con LLM pubblici.
                    </li>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Osservabilità & Audit
                      </strong> 
                      Tracciabilità completa con reasoning e log di approvazione per ciascun run.
                    </li>
                    <li style={{ marginBottom: '20px', fontSize: '1.35rem' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Efficienza ROI
                      </strong> 
                      Riduzione dei costi operativi e sblocco del backlog di contenuti.
                    </li>
                  </ul>
                  <div className="takeaway-box" style={{ marginTop: '15px', fontSize: '1.5rem', padding: '16px 20px' }}>
                    Svolgere 100x the volume di contenuti con lo stesso budget o ridurre gli investimenti a parità di output.
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 7: A Chi Serve in Azienda */}
            <section className={`slide ${currentSlide === 7 ? 'active' : ''}`} id="slide-7">
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

            {/* SLIDE 8: Progetto & Knowledge Base */}
            <section className={`slide ${currentSlide === 8 ? 'active' : ''}`} id="slide-8">
              <span className="slide-tag">Architettura e Valore</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)', lineHeight: 1.05, marginBottom: '15px' }}>
                Il Dataset: L'Unità di Valore
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: '1.45rem', marginBottom: '20px' }}>
                Il dataset è la "struttura di contenuto" configurabile da cui nascono output coerenti e ripetibili.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '15px', marginTop: '2vh' }}>
                
                {/* 01. Input */}
                <div className="workflow-card" style={{ flex: 1, minHeight: '280px', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="step-num" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.8, marginBottom: '15px' }}>01</div>
                    <h3 className="step-title" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Input</h3>
                    <p className="step-desc" style={{ fontSize: '1.15rem', color: 'var(--text-sec)', lineHeight: 1.45 }}>
                      Testi, numeri, immagini, PDF, tabelle e flag, con analisi AI vision e comprensione documenti.
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)', padding: '0 10px' }}>+</div>

                {/* 02. Mental Model */}
                <div className="workflow-card" style={{ flex: 1, minHeight: '280px', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="step-num" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.8, marginBottom: '15px' }}>02</div>
                    <h3 className="step-title" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Mental Model</h3>
                    <p className="step-desc" style={{ fontSize: '1.15rem', color: 'var(--text-sec)', lineHeight: 1.45 }}>
                      Prompting parametrico, regole, dipendenze logiche e sequenze di round che definiscono il ragionamento.
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)', padding: '0 10px' }}>+</div>

                {/* 03. Knowledge Base */}
                <div className="workflow-card" style={{ flex: 1, minHeight: '280px', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="step-num" style={{ fontSize: '3.5rem', color: 'var(--accent)', opacity: 0.8, marginBottom: '15px' }}>03</div>
                    <h3 className="step-title" style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Knowledge Base</h3>
                    <p className="step-desc" style={{ fontSize: '1.15rem', color: 'var(--text-sec)', lineHeight: 1.45 }}>
                      Manuali, schede storiche, cataloghi, dati PIM, asset DAM e policy commerciali e di brand.
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#00ffaa', padding: '0 10px' }}>=</div>

                {/* 04. Output */}
                <div className="workflow-card" style={{ flex: 1, minHeight: '280px', padding: '30px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '2px solid #00ffaa', boxShadow: '0 0 20px rgba(0, 255, 170, 0.15)' }}>
                  <div>
                    <div className="step-num" style={{ fontSize: '3.5rem', color: '#00ffaa', opacity: 0.8, marginBottom: '15px' }}>04</div>
                    <h3 className="step-title" style={{ fontSize: '1.6rem', marginBottom: '12px', color: '#00ffaa' }}>Output</h3>
                    <p className="step-desc" style={{ fontSize: '1.15rem', color: 'var(--text-sec)', lineHeight: 1.45 }}>
                      Testi, HTML, immagini generate, calcoli numerici, flag booleani con dipendenze tra campi.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* SLIDE 9: Use Case Cover (Display 10) */}
            <section className={`slide ${currentSlide === 9 ? 'active' : ''}`} id="slide-9" style={{ overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span className="slide-tag" style={{ marginBottom: '20px', display: 'inline-block' }}>Parte 2</span>
                <h2 className="slide-title" style={{ fontSize: 'clamp(4rem, 8vw, 8rem)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  Use Case
                </h2>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.4rem', color: 'var(--text-sec)', marginTop: '20px', fontWeight: 300 }}>
                  Content Machine in azione su progetti reali
                </p>
              </div>
            </section>

            {/* SLIDE 10: ADV Angles — Use Case 1 (Display 11) */}
            <section className={`slide ${currentSlide === 10 ? 'active' : ''}`} id="slide-10">
              <span className="slide-tag">Use Case 1 — TerraViva Pet</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', lineHeight: 1.05 }}>
                    ADV Angles
                  </h2>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.15rem', color: 'var(--text-sec)', fontWeight: 300, lineHeight: 1.4 }}>
                    Partiamo dalla <strong style={{ color: '#fff' }}>creatività dell'agenzia</strong> e la decliniamo automaticamente in decine di varianti, una per ogni micro-target.
                  </p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', maxWidth: '340px' }}>
                    <img src="assets/terraviva_master_adv.png" alt="Creatività di riferimento — TerraViva Pet" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '340px' }}>
                    <PaintBrush size={16} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Creatività master di riferimento
                  </p>
                  <div className="takeaway-box" style={{ fontSize: '0.95rem', padding: '8px 14px', borderLeft: '3px solid #ff9f43' }}>
                    <Warning size={16} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '4px', color: '#ff9f43' }} />
                    Progetti reali sotto NDA — caso simulato end-to-end.
                  </div>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
                    Le 6 dimensioni di variazione
                  </h3>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1rem', color: 'var(--text-sec)', fontWeight: 300, lineHeight: 1.4, marginBottom: '2px' }}>
                    Un <strong style={{ color: '#fff' }}>Angle</strong> è la prospettiva con cui presenti il prodotto. Combinando queste 6 dimensioni, la stessa offerta diventa decine di creatività uniche.
                  </p>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} weight="duotone" /> Valore di Comunicazione</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Naturalità, performance, sostenibilità, convenienza...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={20} weight="duotone" /> Beneficio Funzionale</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Pelo & cute, digestione, energia, controllo del peso...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><UserFocus size={20} weight="duotone" /> Target Persona</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Giovane neoadottante, cinofilo esperto, famiglia con bambini...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} weight="duotone" /> Contesto d'Uso</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Momento della pappa, passeggiata al parco, check-up dal vet...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} weight="duotone" /> Geolocalizzazione</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Nord Italia, attico moderno; Sud, masseria con giardino...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><PawPrint size={20} weight="duotone" /> Razza Protagonista</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Labrador Retriever, Maine Coon, Beagle, Siamese...</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 11: Dalla Combinatoria alla Campagna (Display 12) */}
            <section className={`slide ${currentSlide === 11 ? 'active' : ''}`} id="slide-11">
              <span className="slide-tag">Use Case 1 — Selezione & Output</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', marginBottom: '2vh' }}>
                Dalla Combinatoria alla Campagna
              </h2>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.25rem', color: 'var(--text-sec)', maxWidth: '900px', lineHeight: 1.5, fontWeight: 300, marginBottom: '3vh' }}>
                6 dimensioni generano <strong style={{ color: '#fff' }}>1.846.800 combinazioni teoriche</strong>. 
                Con la tecnica della <strong style={{ color: 'var(--accent)' }}>coppia prevalente</strong> — ogni riga guidata da una coppia dominante Valore × Beneficio, 
                con le altre dimensioni come variazione secondaria — selezioniamo <strong style={{ color: '#fff' }}>48 angoli ad alta rilevanza</strong>.
              </p>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-val">1.8M</div>
                  <div className="metric-label">Combinazioni Teoriche</div>
                  <p className="metric-desc">6 Valori × 6 Benefici × 19 Persona × 6 Contesti × 30 Geo × 15 Razze</p>
                </div>
                <div className="metric-card" style={{ border: '2px solid var(--accent)' }}>
                  <div className="metric-val" style={{ color: 'var(--accent)' }}>48</div>
                  <div className="metric-label">Campagne Selezionate</div>
                  <p className="metric-desc">Coppie prevalenti Valore × Beneficio, ciascuna declinata su persona, contesto e hook specifici.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">192</div>
                  <div className="metric-label">Immagini Statiche</div>
                  <p className="metric-desc">4 formati per campagna (1:1, 4:5, 9:16, 16:9) pronti per ogni piattaforma.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">96</div>
                  <div className="metric-label">Video Generati</div>
                  <p className="metric-desc">Loop 6s in formato 1:1 e 9:16 per Stories, Reels e feed.</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">144</div>
                  <div className="metric-label">Card Carousel</div>
                  <p className="metric-desc">3 schede narrative per campagna (Hook, Soluzione, CTA).</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">770+</div>
                  <div className="metric-label">Asset Totali Pronti</div>
                  <p className="metric-desc">Immagini, video, testi, copy e hashtag esportabili in un click.</p>
                </div>
              </div>
            </section>

            {/* SLIDE 12: Il Ciclo Ricorsivo (Display 13) */}
            <section className={`slide ${currentSlide === 12 ? 'active' : ''}`} id="slide-12">
              <span className="slide-tag">Use Case 1 — Ottimizzazione Continua</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', marginBottom: '2vh' }}>
                Il Ciclo Ricorsivo
              </h2>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.25rem', color: 'var(--text-sec)', maxWidth: '900px', lineHeight: 1.5, fontWeight: 300, marginBottom: '4vh' }}>
                La selezione delle 48 coppie <strong style={{ color: '#fff' }}>non è statica</strong>. 
                Content Machine si connette <strong style={{ color: 'var(--accent)' }}>via MCP ai dati analytics</strong> delle campagne live, 
                creando un loop di ottimizzazione continua.
              </p>

              <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '0', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Step 1 */}
                <div style={{ flex: 1, padding: '22px 18px', background: 'rgba(18,18,18,0.6)', border: '1px solid var(--border)', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Crosshair size={34} weight="duotone" style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>1. Selezione</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
                    Scelta delle 48 coppie prevalenti guidata da strategia e insight analytics
                  </p>
                </div>
                <CaretCircleRight size={30} weight="duotone" style={{ color: 'var(--accent)', flexShrink: 0, margin: '0 6px', alignSelf: 'center' }} />
                {/* Step 2 */}
                <div style={{ flex: 1, padding: '22px 18px', background: 'rgba(18,18,18,0.6)', border: '1px solid var(--border)', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <SlidersHorizontal size={34} weight="duotone" style={{ color: '#00ffaa', marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>2. Generazione</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
                    Content Machine produce 770+ asset per le 48 campagne selezionate
                  </p>
                </div>
                <CaretCircleRight size={30} weight="duotone" style={{ color: '#00ffaa', flexShrink: 0, margin: '0 6px', alignSelf: 'center' }} />
                {/* Step 3 */}
                <div style={{ flex: 1, padding: '22px 18px', background: 'rgba(18,18,18,0.6)', border: '1px solid var(--border)', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Images size={34} weight="duotone" style={{ color: '#ff9f43', marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>3. Distribuzione</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
                    Creatività distribuite su Meta, Google, TikTok e altri canali ADV
                  </p>
                </div>
                <CaretCircleRight size={30} weight="duotone" style={{ color: '#ff9f43', flexShrink: 0, margin: '0 6px', alignSelf: 'center' }} />
                {/* Step 4 */}
                <div style={{ flex: 1, padding: '22px 18px', background: 'rgba(18,18,18,0.6)', border: '1px solid var(--border)', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <BookOpen size={34} weight="duotone" style={{ color: '#e879f9', marginBottom: '8px' }} />
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>4. Analytics</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
                    Performance misurata via <strong style={{ color: '#e879f9' }}>connettore MCP</strong> — alimenta il ciclo successivo
                  </p>
                </div>
              </div>

              {/* Feedback loop arrow */}
              <div style={{ width: '100%', maxWidth: '1200px', margin: '14px auto 0', textAlign: 'center', position: 'relative' }}>
                <div style={{ border: '2px dashed var(--accent)', borderTop: 'none', borderRadius: '0 0 20px 20px', height: '36px', margin: '0 60px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-4px', top: '-8px', color: 'var(--accent)', fontSize: '1.4rem' }}>▲</div>
                  <span style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg)', padding: '0 16px', fontFamily: 'Figtree, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                    Feedback Loop — Ogni ciclo affina la selezione
                  </span>
                </div>
              </div>

              <div className="takeaway-box" style={{ marginTop: '18px', fontSize: '1.1rem', padding: '12px 20px', maxWidth: '900px' }}>
                Processo <strong>human-in-the-loop</strong>: il team aggiorna la creatività master, sceglie le nuove coppie con i dati di efficacia reali — e Content Machine può supportare anche la generazione del dataset di partenza.
              </div>
            </section>

            {/* SLIDE 13: Use Case 1 — Screenshot Progetto (New) */}
            <section className={`slide ${currentSlide === 13 ? 'active' : ''}`} id="slide-13">
              <span className="slide-tag">Use Case 1 — Piattaforma</span>
              <h2 className="slide-title" style={{ fontSize: '2rem', marginBottom: '15px', textTransform: 'uppercase' }}>
                Configurazione & Dataset di Input
              </h2>
              <div style={{ position: 'relative', flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, marginTop: '2vh' }}>
                <img 
                  src="assets/use_case1_mm.png" 
                  alt="Use Case 1 Mental Model" 
                  style={{ 
                    position: 'absolute', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    opacity: uc1ImageIdx === 0 ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: uc1ImageIdx === 0 ? 2 : 1
                  }} 
                />
                <img 
                  src="assets/use_case1_dataset.png" 
                  alt="Use Case 1 Dataset" 
                  style={{ 
                    position: 'absolute', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    opacity: uc1ImageIdx === 1 ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: uc1ImageIdx === 1 ? 2 : 1
                  }} 
                />
              </div>
            </section>

            {/* SLIDE 14: Visual Wall UC1 (Case Study Grid) */}
            <section className={`slide ${currentSlide === 14 ? 'active' : ''} slide-visual-wall`} id="slide-14">
              <span className="slide-tag">Use Case 1 — Visual Wall</span>
              <h2 className="slide-title" style={{ fontSize: '2rem', marginBottom: '15px', textTransform: 'uppercase' }}>
                Matrice dei Risultati Generati
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
                          <LazyImage src={camp.img_feed_1x1 || camp.img_feed_4x5 || camp.img_banner_16x9} alt="" className="thumb-lazy-image" />
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

            {/* SLIDE 15: Use Case 2 — Organic Editorial (Display 15) */}
            <section className={`slide ${currentSlide === 15 ? 'active' : ''}`} id="slide-15">
              <span className="slide-tag">Use Case 2 — TerraViva Pet</span>
              <div className="slide-layout-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="slide-content-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                  <h2 className="slide-title" style={{ fontSize: 'clamp(2.2rem, 4vw, 4rem)', lineHeight: 1.05 }}>
                    Organic Editorial Plan
                  </h2>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.15rem', color: 'var(--text-sec)', fontWeight: 300, lineHeight: 1.4 }}>
                    Dalla stessa piattaforma, un workflow diverso: <strong style={{ color: '#fff' }}>contenuti editoriali educativi</strong> per i canali social organici. Stesso brand, nuova angolazione.
                  </p>
                  <p className="concept-intro" style={{ fontSize: '1.4rem', color: '#ffffff', lineHeight: 1.3 }}>
                    Ogni razza ha esigenze diverse. Ogni contenuto parla a un bisogno specifico.
                  </p>
                  <div className="takeaway-box" style={{ fontSize: '0.95rem', padding: '8px 14px', borderLeft: '3px solid #00ffaa' }}>
                    <Newspaper size={16} weight="duotone" style={{ verticalAlign: 'middle', marginRight: '4px', color: '#00ffaa' }} />
                    Stesso processo ricorsivo del Use Case 1, applicato ai contenuti editoriali.
                  </div>
                </div>
                <div className="slide-content-right" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '4vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'Figtree, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
                    Le 5 dimensioni editoriali
                  </h3>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} weight="duotone" /> Argomento</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Cura del pelo, digestione, articolazioni, sviluppo cuccioli...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} weight="duotone" /> Angolo Editoriale</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Consiglio dell'Esperto, Curiosità sulla Razza, Miti da Sfatare...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Megaphone size={20} weight="duotone" /> Canale Social</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Instagram Carousel, Reels/TikTok, Facebook, LinkedIn...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><PawPrint size={20} weight="duotone" /> Razza Protagonista</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Golden Retriever, Bulldog Francese, Maine Coon, Siamese...</p>
                  </div>
                  <div className="workflow-card" style={{ padding: '10px 14px', minHeight: 'auto' }}>
                    <h3 className="step-title" style={{ fontSize: '1.1rem', marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><MusicNote size={20} weight="duotone" /> Tono di Voce</h3>
                    <p className="step-desc" style={{ fontSize: '0.9rem' }}>Scientifico-Autorevole, Coinvolgente-Leggero, Empatico-Amichevole</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SLIDE 16: Editorial — Numeri & Localizzazione (Display 16) */}
            <section className={`slide ${currentSlide === 16 ? 'active' : ''}`} id="slide-16">
              <span className="slide-tag">Use Case 2 — Output & Localizzazione</span>
              <h2 className="slide-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', marginBottom: '2vh' }}>
                Dalla Redazione alla Scala Globale
              </h2>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '1.25rem', color: 'var(--text-sec)', maxWidth: '900px', lineHeight: 1.5, fontWeight: 300, marginBottom: '3vh' }}>
                5 dimensioni generano <strong style={{ color: '#fff' }}>54.000 combinazioni teoriche</strong>. 
                Selezioniamo <strong style={{ color: 'var(--accent)' }}>30 contenuti editoriali</strong>, ciascuno con 12 asset pronti per la pubblicazione. 
                Poi Content Machine <strong style={{ color: '#00ffaa' }}>localizza tutto in 6 lingue</strong>.
              </p>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-val">54K</div>
                  <div className="metric-label">Combinazioni Teoriche</div>
                  <p className="metric-desc">30 Argomenti × 5 Angoli × 4 Canali × 30 Razze × 3 Toni</p>
                </div>
                <div className="metric-card" style={{ border: '2px solid var(--accent)' }}>
                  <div className="metric-val" style={{ color: 'var(--accent)' }}>30</div>
                  <div className="metric-label">Contenuti Selezionati</div>
                  <p className="metric-desc">Scelti con la tecnica della coppia prevalente Argomento × Razza</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">360</div>
                  <div className="metric-label">Asset per Lingua</div>
                  <p className="metric-desc">Caption, brief, carousel, story, video, voiceover per ogni contenuto</p>
                </div>
                <div className="metric-card" style={{ border: '2px solid #00ffaa' }}>
                  <div className="metric-val" style={{ color: '#00ffaa' }}>6</div>
                  <div className="metric-label">Lingue</div>
                  <p className="metric-desc">IT, EN, ES, FR, DE, PT — localizzazione culturale, non simple traduzione</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val">2.160</div>
                  <div className="metric-label">Asset Totali Localizzati</div>
                  <p className="metric-desc">360 asset × 6 lingue = piano editoriale globale pronto</p>
                </div>
                <div className="metric-card">
                  <div className="metric-val" style={{ fontSize: '2.5rem' }}>
                    <Globe size={40} weight="duotone" style={{ color: '#e879f9' }} />
                  </div>
                  <div className="metric-label">Localizzazione Culturale</div>
                  <p className="metric-desc">Roma → Madrid, Milano → Lyon, Toscana → Provence — adattamento geo e tono</p>
                </div>
              </div>
            </section>

            {/* SLIDE 17: Use Case 2 — Screenshot Progetto (New) */}
            <section className={`slide ${currentSlide === 17 ? 'active' : ''}`} id="slide-17">
              <span className="slide-tag">Use Case 2 — Piattaforma</span>
              <h2 className="slide-title" style={{ fontSize: '2rem', marginBottom: '15px', textTransform: 'uppercase' }}>
                Configurazione & Dataset di Input
              </h2>
              <div style={{ position: 'relative', flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, marginTop: '2vh' }}>
                <img 
                  src="assets/use_case2_mm.png" 
                  alt="Use Case 2 Mental Model" 
                  style={{ 
                    position: 'absolute', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    opacity: uc2ImageIdx === 0 ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: uc2ImageIdx === 0 ? 2 : 1
                  }} 
                />
                <img 
                  src="assets/use_case2_dataset.png" 
                  alt="Use Case 2 Dataset" 
                  style={{ 
                    position: 'absolute', 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                    opacity: uc2ImageIdx === 1 ? 1 : 0,
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: uc2ImageIdx === 1 ? 2 : 1
                  }} 
                />
              </div>
            </section>

            {/* SLIDE 18: UC2 — Carrellata Contenuti Editoriali (Display 17) */}
            <section className={`slide ${currentSlide === 18 ? 'active' : ''}`} id="slide-18">
              {currentEditorial && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                    <span className="slide-tag" style={{ position: 'relative', top: 0 }}>
                      Use Case 2 — Contenuto {currentEditorial.order + 1}/6 ({currentEditorial.lang.toUpperCase()})
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                        #{(currentEditorial.order + 1).toString().padStart(2, '0')} — {currentEditorial.argomento}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sec)' }}>·</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{currentEditorial.razza}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sec)' }}>·</span>
                      <span style={{ fontSize: '0.75rem', color: '#e879f9' }}>{currentEditorial.editorial_angle}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {editorialSteps.map((_, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === editWallStep ? 'var(--accent)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', flex: 1, width: '100%', minHeight: 0 }}>
                    {/* Left: 3 iPhones */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <InstagramCarousel 
                          images={[currentEditorial.carousel_img_1, currentEditorial.carousel_img_2, currentEditorial.carousel_img_3, currentEditorial.carousel_img_4]}
                          caption={currentEditorial.social_caption}
                        />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carousel</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <InstagramStory 
                          imageSrc={currentEditorial.story_img}
                          videoSrc={currentEditorial.story_video}
                        />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e879f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Story</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <TikTokPhone 
                          imageSrc={currentEditorial.tiktok_img}
                          videoSrc={currentEditorial.tiktok_video}
                          caption={currentEditorial.social_caption}
                        />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ffaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TikTok</span>
                      </div>
                    </div>

                    {/* Right: Text panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '8px' }}>
                      {/* Input angles */}
                      <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontFamily: 'Figtree', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Dimensioni di Input</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {[
                            { label: 'Argomento', value: currentEditorial.argomento, color: 'var(--accent)' },
                            { label: 'Angolo', value: currentEditorial.editorial_angle, color: '#e879f9' },
                            { label: 'Canale', value: currentEditorial.canale_social, color: '#ff9f43' },
                            { label: 'Razza', value: currentEditorial.razza, color: '#00ffaa' },
                            { label: 'Tono', value: currentEditorial.tono_voce, color: 'var(--text-sec)' },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--text-sec)', fontWeight: 500 }}>{label}</span>
                              <span style={{ color, fontWeight: 600 }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Social Caption */}
                      <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontFamily: 'Figtree', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>Social Caption</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.4, margin: 0, maxHeight: '80px', overflow: 'auto' }}>
                          {currentEditorial.social_caption?.replace(/\*\*/g, '').substring(0, 300)}
                        </p>
                      </div>

                      {/* Editorial Brief */}
                      <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontFamily: 'Figtree', fontSize: '0.8rem', fontWeight: 700, color: '#00ffaa', marginBottom: '6px' }}>Editorial Brief</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.4, margin: 0, maxHeight: '70px', overflow: 'auto' }}>
                          {currentEditorial.editorial_brief?.substring(0, 250)}
                        </p>
                      </div>

                      {/* Voiceover Script */}
                      <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontFamily: 'Figtree', fontSize: '0.8rem', fontWeight: 700, color: '#e879f9', marginBottom: '6px' }}>Reels Voiceover</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.4, margin: 0, maxHeight: '60px', overflow: 'auto' }}>
                          {currentEditorial.reels_voiceover_script?.substring(0, 200)}
                        </p>
                      </div>

                      {/* Visual Brief */}
                      <div style={{ background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontFamily: 'Figtree', fontSize: '0.8rem', fontWeight: 700, color: '#ff9f43', marginBottom: '6px' }}>Visual Brief</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.4, margin: 0, maxHeight: '50px', overflow: 'auto' }}>
                          {currentEditorial.visual_brief_overlay?.substring(0, 180)}
                        </p>
                      </div>

                      {/* Languages */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '4px 0' }}>
                        {[
                          { code: 'it', flag: '🇮🇹', label: 'IT' },
                          { code: 'en', flag: '🇬🇧', label: 'EN' },
                          { code: 'es', flag: '🇪🇸', label: 'ES' },
                          { code: 'fr', flag: '🇫🇷', label: 'FR' },
                          { code: 'de', flag: '🇩🇪', label: 'DE' },
                          { code: 'pt', flag: '🇵🇹', label: 'PT' }
                        ].map((langItem) => {
                          const isActive = currentEditorial.lang === langItem.code;
                          return (
                            <span 
                              key={langItem.code} 
                              style={{ 
                                padding: '3px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.65rem', 
                                fontWeight: 600, 
                                background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.06)', 
                                color: isActive ? '#000' : 'var(--text-sec)', 
                                border: '1px solid var(--border)' 
                              }}
                            >
                              {langItem.flag} {langItem.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* SLIDE 19: Grazie per l'attenzione (Display 18) */}
            <section className={`slide ${currentSlide === 19 ? 'active' : ''}`} id="slide-19">
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <span className="slide-tag" style={{ marginBottom: '20px' }}>Websolute Content Machine</span>
                <h2 className="slide-title" style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', textAlign: 'center', maxWidth: '100%' }}>
                  Grazie per l'attenzione
                </h2>
              </div>
            </section>

            {/* BOTTOM BAR (SLIDE DECK CONTROLS) */}
            <div className="bottom-bar" id="presentation-controls">
              <div className="slide-counter" id="slide-counter-left" style={{ textAlign: 'left', width: '120px' }}>
                Slide {currentSlide + 1}
              </div>
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
                    <Crosshair size={18} weight="duotone" style={{ marginRight: '5px' }} /> Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    <Images size={18} weight="duotone" style={{ marginRight: '5px' }} /> Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    <PencilLine size={18} weight="duotone" style={{ marginRight: '5px' }} /> Strategia & Copy
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
                    <Crosshair size={18} weight="duotone" style={{ marginRight: '5px' }} /> Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    <Images size={18} weight="duotone" style={{ marginRight: '5px' }} /> Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    <PencilLine size={18} weight="duotone" style={{ marginRight: '5px' }} /> Strategia & Copy
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
                    <Crosshair size={18} weight="duotone" style={{ marginRight: '5px' }} /> Concept
                  </button>
                  <button 
                    className={`db-tab-btn ${showAssetsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('assets');
                    }}
                  >
                    <Images size={18} weight="duotone" style={{ marginRight: '5px' }} /> Declinazioni
                  </button>
                  <button 
                    className={`db-tab-btn ${showTextsDashboard ? 'active' : ''}`}
                    onClick={() => {
                      setManualActiveCampaign(focusedCampaign);
                      setManualActiveView('texts');
                    }}
                  >
                    <PencilLine size={18} weight="duotone" style={{ marginRight: '5px' }} /> Strategia & Copy
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
                <h3 className="db-col-title"><Crosshair size={22} weight="duotone" style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Creative Brief</h3>
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
                <h3 className="db-col-title"><PencilLine size={22} weight="duotone" style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Ad Copy Pubblicitario</h3>
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
                <h3 className="db-col-title"><SlidersHorizontal size={22} weight="duotone" style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Carousel & Hashtags</h3>
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
