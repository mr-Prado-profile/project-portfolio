/*
  Particle Squares Canvas
  - grid of squares rendered to a full-screen canvas
  - squares repel/hover when cursor approaches
  - devicePixelRatio aware
*/
(function(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d', { alpha: true });

  // Tunable options - Adapted for the portfolio site
  const config = {
    squareSize: 10,         // base size of each square (px)
    gap: 8,                 // space between squares
    margin: 0,             // padding from edges
    cursorRadius: 120,      // effect radius of cursor (px)
    repelForce: 0.35,       // how strongly squares are pushed
    returnSpeed: 0.06,      // how fast squares return to grid
    maxOffset: 40,          // max displacement allowed
    squareRadius: 2,        // border radius for rounded squares
    squareOpacity: 0.9,     // base opacity
    colorBase: '#f6a623',   // square color (site accent color)
    lightenOnHover: true,   // slightly lighten color when hovered
    densityScale: 1.0       // multiply grid density (1 is default)
  };

  // State
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  let grid = [];
  let animationId = null;
  let mouse = { x: -9999, y: -9999, down: false };
  let running = true;
  let isTouch = false;

  // Helpers
  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    // Use innerHeight to handle mobile address bars better
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    W = vw; H = vh;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    
    // Adjust config for mobile
    if(W < 768) {
        config.squareSize = 9;  // Slightly smaller than desktop (10)
        config.gap = 8;         // Same gap as desktop
        config.cursorRadius = 100; 
        config.densityScale = 1.0; // Keep density high
    } else {
        config.squareSize = 10;
        config.gap = 8;
        config.cursorRadius = 120;
        config.densityScale = 1.0;
    }
    
    // Get color from CSS variable
    const style = getComputedStyle(document.body);
    const square = style.getPropertyValue('--square').trim();
    const accent = style.getPropertyValue('--accent').trim();
    
    if(square) config.colorBase = square;
    else if(accent) config.colorBase = accent;

    buildGrid();
  }

  function buildGrid(){
    grid = [];
    const size = config.squareSize;
    const gap = config.gap;
    const step = Math.round(size + gap);
    const startX = config.margin;
    const startY = config.margin;
    const endX = W - config.margin;
    const endY = H - config.margin;

    // Use fixed density to ensure consistent look across devices
    const density = config.densityScale;

    for(let y = startY; y < endY; y += Math.round(step / density)){
      for(let x = startX; x < endX; x += Math.round(step / density)){
        const jitterX = (Math.random() - 0.5) * 2; // minor jitter so grid isn't too perfect
        const jitterY = (Math.random() - 0.5) * 2;
        grid.push({
          x: x + jitterX,
          y: y + jitterY,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: size * (0.8 + Math.random() * 0.6),
          opacity: config.squareOpacity,
          angle: Math.random() * Math.PI * 2
        });
      }
    }
  }

  function clear(){
    ctx.clearRect(0,0,W,H);
  }

  function draw(){
    if(!running) return;
    clear();
    for(let i=0;i<grid.length;i++){
      const s = grid[i];
      // distance from mouse
      const dx = s.x - mouse.x;
      const dy = s.y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if(dist < config.cursorRadius){
        // repel away from cursor (simple physics)
        const ang = Math.atan2(dy, dx);
        const push = (1 - (dist / config.cursorRadius)) * config.repelForce * (config.cursorRadius / Math.max(dist,1));
        s.vx += Math.cos(ang) * push;
        s.vy += Math.sin(ang) * push;
      }

      // apply velocity
      s.x += s.vx;
      s.y += s.vy;

      // limit to max offset from base
      const offX = s.x - s.baseX;
      const offY = s.y - s.baseY;
      const offDist = Math.sqrt(offX*offX + offY*offY);
      if(offDist > config.maxOffset){
        const ratio = config.maxOffset / offDist;
        s.x = s.baseX + offX * ratio;
        s.y = s.baseY + offY * ratio;
        s.vx *= 0.6; s.vy *= 0.6;
      }

      // pull back to base position
      s.vx += (s.baseX - s.x) * config.returnSpeed;
      s.vy += (s.baseY - s.y) * config.returnSpeed;

      // damp velocities
      s.vx *= 0.88; s.vy *= 0.88;

      // visual flourish: scale based on proximity
      const scale = 1 + Math.max(0, (config.cursorRadius - Math.min(dist, config.cursorRadius)) / config.cursorRadius) * 0.6;
      const drawSize = s.size * scale;

      // color/opacity change when hovered
      let alpha = s.opacity * (1 - Math.min(0.65, (config.cursorRadius - Math.min(dist, config.cursorRadius)) / config.cursorRadius));
      if(dist < config.cursorRadius * 0.3){ alpha = Math.min(1, s.opacity + 0.3); }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle * 0.02);
      ctx.globalAlpha = alpha;
      roundRect(ctx, -drawSize/2, -drawSize/2, drawSize, drawSize, config.squareRadius);
      ctx.fillStyle = config.colorBase;
      ctx.fill();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r){
    const radius = r || 0;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function loop(){
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Input handling
  function onPointerMove(e){
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    isTouch = false;
  }
  
  function onTouchMove(e){
      const rect = canvas.getBoundingClientRect();
      if(e.touches.length > 0){
          mouse.x = e.touches[0].clientX - rect.left;
          mouse.y = e.touches[0].clientY - rect.top;
          isTouch = true;
      }
  }

  function onPointerOut(){ 
      mouse.x = -9999; 
      mouse.y = -9999; 
  }

  // Wire events
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('touchmove', onTouchMove, {passive: true}); // Add touch support
  window.addEventListener('touchstart', onTouchMove, {passive: true});
  window.addEventListener('pointerdown', ()=> mouse.down = true);
  window.addEventListener('pointerup', ()=> mouse.down = false);
  window.addEventListener('pointerleave', onPointerOut);
  window.addEventListener('touchend', onPointerOut);

  // init
  resize();
  loop();

})();
