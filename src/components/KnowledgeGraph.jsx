import React, { useEffect, useRef } from 'react';

export default function KnowledgeGraph({ active }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    width: 0,
    height: 0,
    lastTime: 0,
    nodes: [],
    links: [],
    pulses: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Define Knowledge Graph structure
    const nodeSpecs = [
      { id: 'center', label: 'BRAND DNA', desc: 'Central Knowledge', isCenter: true },
      { id: 'tone', label: 'Tone of Voice', desc: 'Brand Identity', angle: 0 },
      { id: 'pim', label: 'Product PIM', desc: 'Technical Data', angle: 60 },
      { id: 'dam', label: 'DAM Assets', desc: 'Images & Videos', angle: 120 },
      { id: 'manuals', label: 'PDF Manuals', desc: 'Docs Intelligence', angle: 180 },
      { id: 'guidelines', label: 'Guidelines', desc: 'Compliance Rules', angle: 240 },
      { id: 'glossary', label: 'Glossary', desc: 'Terminology', angle: 300 }
    ];

    const linkSpecs = [
      { from: 'tone', to: 'center' },
      { from: 'pim', to: 'center' },
      { from: 'dam', to: 'center' },
      { from: 'manuals', to: 'center' },
      { from: 'guidelines', to: 'center' },
      { from: 'glossary', to: 'center' },
      // Secondary cross-connections
      { from: 'pim', to: 'manuals' },
      { from: 'manuals', to: 'guidelines' },
      { from: 'tone', to: 'glossary' }
    ];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      state.width = rect.width;
      state.height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const cx = state.width / 2;
      const cy = state.height / 2;
      const radius = Math.min(state.width, state.height) * 0.38;

      // Initialize or update node positions
      state.nodes = nodeSpecs.map(spec => {
        let x = cx;
        let y = cy;
        if (!spec.isCenter) {
          const rad = (spec.angle * Math.PI) / 180;
          x = cx + Math.cos(rad) * radius;
          y = cy + Math.sin(rad) * radius * 0.85; // slightly squished oval
        }
        return {
          ...spec,
          x,
          y,
          targetX: x,
          targetY: y,
          // Float properties
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: 0.001 + Math.random() * 0.001,
          sizeW: spec.isCenter ? 180 : 130,
          sizeH: spec.isCenter ? 75 : 55
        };
      });

      state.links = linkSpecs.map(link => {
        return {
          from: state.nodes.find(n => n.id === link.from),
          to: state.nodes.find(n => n.id === link.to)
        };
      });
    }

    window.addEventListener('resize', resize);
    resize();

    function spawnPulse(link) {
      if (!link.from || !link.to) return;
      const direction = Math.random() > 0.4 ? 1 : -1;
      state.pulses.push({
        link,
        progress: direction === 1 ? 0 : 1,
        direction, // 1: from -> to, -1: to -> from
        speed: 0.003 + Math.random() * 0.003,
        color: link.to.isCenter || link.from.isCenter ? '#00aeff' : '#4ade80'
      });
    }

    function update(time) {
      if (!state.lastTime || (time - state.lastTime > 100)) state.lastTime = time;
      const dt = time - state.lastTime;
      state.lastTime = time;

      // Float nodes
      state.nodes.forEach(node => {
        node.floatOffset += node.floatSpeed * dt;
        // Float displacement
        const dx = Math.sin(node.floatOffset) * 6;
        const dy = Math.cos(node.floatOffset) * 6;
        node.x = node.targetX + dx;
        node.y = node.targetY + dy;
      });

      // Update pulses
      for (let i = state.pulses.length - 1; i >= 0; i--) {
        const p = state.pulses[i];
        p.progress += p.direction * p.speed * (dt / 16.67);
        if (p.progress > 1 || p.progress < 0) {
          state.pulses.splice(i, 1);
        }
      }

      // Spawn random pulses
      if (Math.random() < 0.04 && state.links.length > 0) {
        const randomLink = state.links[Math.floor(Math.random() * state.links.length)];
        spawnPulse(randomLink);
      }
    }

    function draw() {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, state.width, state.height);

      // Draw connection lines
      ctx.lineWidth = 2.0;
      state.links.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.from.x, link.from.y);
        ctx.lineTo(link.to.x, link.to.y);
        ctx.strokeStyle = link.to.isCenter || link.from.isCenter ? '#1d2a3a' : '#1b261b';
        ctx.stroke();
      });

      // Draw pulses
      ctx.lineWidth = 2.0;
      state.pulses.forEach(p => {
        const t = p.progress;
        const px = p.link.from.x + (p.link.to.x - p.link.from.x) * t;
        const py = p.link.from.y + (p.link.to.y - p.link.from.y) * t;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 5.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pulse Trail
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(px - (p.link.to.x - p.link.from.x) * p.direction * 0.06, py - (p.link.to.y - p.link.from.y) * p.direction * 0.06);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // Draw Nodes
      state.nodes.forEach(node => {
        const bx = node.x - node.sizeW / 2;
        const by = node.y - node.sizeH / 2;

        ctx.fillStyle = node.isCenter ? '#111b2b' : '#121212';
        ctx.fillRect(bx, by, node.sizeW, node.sizeH);
        ctx.strokeStyle = node.isCenter ? '#00aeff' : '#222222';
        ctx.lineWidth = node.isCenter ? 2.0 : 1.5;
        ctx.strokeRect(bx, by, node.sizeW, node.sizeH);

        // Highlight with shadow if active
        if (node.isCenter) {
          ctx.strokeStyle = '#00aeff';
          ctx.lineWidth = 2.0;
          ctx.shadowColor = '#00aeff';
          ctx.shadowBlur = 10;
          ctx.strokeRect(bx, by, node.sizeW, node.sizeH);
          ctx.shadowBlur = 0;
        }

        // Draw Texts
        ctx.textAlign = 'center';
        if (node.isCenter) {
          ctx.font = '800 15px Figtree, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(node.label, node.x, node.y - 4);

          ctx.font = '800 10px Figtree, sans-serif';
          ctx.fillStyle = '#00aeff';
          ctx.fillText(node.desc, node.x, node.y + 16);
        } else {
          ctx.font = '800 12px Figtree, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(node.label, node.x, node.y - 1);

          ctx.font = '400 8px Figtree, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText(node.desc, node.x, node.y + 12);
        }
      });
    }

    function loop(time) {
      if (active) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width !== state.width || rect.height !== state.height) {
          resize();
        }
        update(time);
        draw();
      }
      animationRef.current = requestAnimationFrame(loop);
    }

    if (active) {
      animationRef.current = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '520px', display: 'block' }}
    />
  );
}
