import React, { useEffect, useRef } from 'react';

export default function IntegrationFlow({ active }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    lastTime: 0,
    corePulseVal: 0,
    pulses: [],
  });

  const nodes = {
    inputs: [
      { id: 'pim', label: 'PIM', desc: 'Dati Tecnici', xPct: 0.15, yPct: 0.22 },
      { id: 'dam', label: 'DAM', desc: 'Asset Visual', xPct: 0.15, yPct: 0.50 },
      { id: 'erp', label: 'ERP / CRM', desc: 'Listini & Stock', xPct: 0.15, yPct: 0.78 }
    ],
    core: { id: 'core', label: 'CONTENT MACHINE', desc: 'CORE ENGINE', xPct: 0.5, yPct: 0.5 },
    outputs: [
      { id: 'ecom', label: 'E-COMMERCE', desc: 'Shopify / Magento', xPct: 0.85, yPct: 0.22 },
      { id: 'wall', label: 'VISUAL WALL', desc: 'Proiezione WMF', xPct: 0.85, yPct: 0.50 },
      { id: 'api', label: 'API GATEWAY', desc: 'Headless Delivery', xPct: 0.85, yPct: 0.78 }
    ]
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      state.width = rect.width;
      state.height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      state.centerX = rect.width / 2;
      state.centerY = rect.height / 2;
    }

    window.addEventListener('resize', resize);
    resize();

    function spawnPulse(fromNode, toNode, color, bidirectionalDir = 1) {
      state.pulses.push({
        from: fromNode,
        to: toNode,
        progress: 0,
        speed: 0.005 + Math.random() * 0.004,
        color: color || '#00aeff',
        bidirectionalDir
      });
    }

    function update(time) {
      if (!state.lastTime || (time - state.lastTime > 100)) state.lastTime = time;
      const dt = time - state.lastTime;
      state.lastTime = time;

      if (state.corePulseVal > 0) {
        state.corePulseVal -= 0.002 * dt;
        if (state.corePulseVal < 0) state.corePulseVal = 0;
      }

      for (let i = state.pulses.length - 1; i >= 0; i--) {
        const p = state.pulses[i];
        p.progress += p.speed * (dt / 16.67);

        if (p.progress >= 1) {
          if (p.to === 'core') {
            state.corePulseVal = 1.0;

            setTimeout(() => {
              if (active && Math.random() < 0.75) {
                const outNodes = ['ecom', 'wall', 'api'];
                const target = outNodes[Math.floor(Math.random() * outNodes.length)];
                spawnPulse('core', target, '#00aeff');
              }
            }, 150);
          }
          state.pulses.splice(i, 1);
        }
      }

      if (Math.random() < 0.025) {
        const inputs = ['pim', 'dam', 'erp'];
        const source = inputs[Math.floor(Math.random() * inputs.length)];

        if (source === 'erp') {
          const dir = Math.random() > 0.4 ? 1 : -1;
          if (dir === 1) {
            spawnPulse('erp', 'core', '#00aeff');
          } else {
            spawnPulse('core', 'erp', '#ffffff', -1);
          }
        } else {
          spawnPulse(source, 'core', '#00aeff');
        }
      }
    }

    function draw() {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, state.width, state.height);

      function getCoords(nodeSpec) {
        return {
          x: nodeSpec.xPct * state.width,
          y: nodeSpec.yPct * state.height
        };
      }

      const coreCoords = getCoords(nodes.core);
      const coreW = 160;
      const coreH = 80;

      // Draw connection lines
      ctx.lineWidth = 1.5;

      // Inputs connections
      nodes.inputs.forEach(input => {
        const start = getCoords(input);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(coreCoords.x, coreCoords.y);
        ctx.strokeStyle = '#222222';
        ctx.stroke();
      });

      // Outputs connections
      nodes.outputs.forEach(output => {
        const end = getCoords(output);
        ctx.beginPath();
        ctx.moveTo(coreCoords.x, coreCoords.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = '#222222';
        ctx.stroke();
      });

      // Draw pulses
      state.pulses.forEach(p => {
        let startCoords, endCoords;
        if (p.from === 'core') {
          startCoords = coreCoords;
          const destNode = nodes.outputs.find(n => n.id === p.to) || nodes.inputs.find(n => n.id === p.to);
          endCoords = getCoords(destNode);
        } else {
          const srcNode = nodes.inputs.find(n => n.id === p.from);
          startCoords = getCoords(srcNode);
          endCoords = coreCoords;
        }

        const t = p.progress;
        const px = startCoords.x + (endCoords.x - startCoords.x) * t;
        const py = startCoords.y + (endCoords.y - startCoords.y) * t;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Trail
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(px - (endCoords.x - startCoords.x) * 0.06, py - (endCoords.y - startCoords.y) * 0.06);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // Central Core Box
      const coreX = coreCoords.x - coreW / 2;
      const coreY = coreCoords.y - coreH / 2;

      ctx.fillStyle = '#121212';
      ctx.fillRect(coreX, coreY, coreW, coreH);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1;
      ctx.strokeRect(coreX, coreY, coreW, coreH);

      if (state.corePulseVal > 0) {
        ctx.strokeStyle = `rgba(0, 174, 255, ${state.corePulseVal})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00aeff';
        ctx.shadowBlur = 10 * state.corePulseVal;
        ctx.strokeRect(coreX, coreY, coreW, coreH);
        ctx.shadowBlur = 0;
      }

      ctx.font = '800 10px Figtree, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('CONTENT MACHINE', coreCoords.x, coreCoords.y - 10);

      ctx.font = '800 7px Figtree, sans-serif';
      ctx.fillStyle = '#00aeff';
      ctx.fillText('CORE ENGINE', coreCoords.x, coreCoords.y + 2);

      const statusColor = state.corePulseVal > 0.2 ? '#00aeff' : '#333333';
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(coreCoords.x - 38, coreCoords.y + 16, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '400 7px monospace';
      ctx.fillStyle = state.corePulseVal > 0.2 ? '#ffffff' : '#71717a';
      ctx.textAlign = 'left';
      ctx.fillText(state.corePulseVal > 0.2 ? 'PROCESSING' : 'SYSTEM IDLE', coreCoords.x - 30, coreCoords.y + 18);

      // Input Boxes
      const boxW = 100;
      const boxH = 40;
      ctx.textAlign = 'center';

      nodes.inputs.forEach(input => {
        const coords = getCoords(input);
        const bx = coords.x - boxW / 2;
        const by = coords.y - boxH / 2;

        ctx.fillStyle = '#121212';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, boxW, boxH);

        ctx.font = '800 9px Figtree, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(input.label, coords.x, coords.y - 3);

        ctx.font = '400 7px Figtree, sans-serif';
        ctx.fillStyle = 'rgba(0, 174, 255, 0.7)';
        ctx.fillText(input.desc, coords.x, coords.y + 7);
      });

      // Output Boxes
      nodes.outputs.forEach(output => {
        const coords = getCoords(output);
        const bx = coords.x - boxW / 2;
        const by = coords.y - boxH / 2;

        ctx.fillStyle = '#121212';
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, boxW, boxH);

        ctx.font = '800 9px Figtree, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(output.label, coords.x, coords.y - 3);

        ctx.font = '400 7px Figtree, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(output.desc, coords.x, coords.y + 7);
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
      draw(); // Draw idle state once
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
      style={{ width: '100%', height: '450px', display: 'block' }}
    />
  );
}
