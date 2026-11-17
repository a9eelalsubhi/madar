/* سماء الليل: نجوم تلمع بهدوء، وشهاب نادر */
(function () {
  'use strict';
  const cv = document.getElementById('stars');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, stars = [], shoot = null, last = 0;
  const TINTS = ['255,255,255', '255,240,214', '214,228,255', '255,214,236'];

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(W * H / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H * .92,
      r: Math.random() < .08 ? 1.4 + Math.random() * .8 : .4 + Math.random() * .8,
      a: .25 + Math.random() * .6, s: .4 + Math.random() * 1.4, p: Math.random() * 6.28,
      c: TINTS[(Math.random() * TINTS.length) | 0]
    }));
    if (reduce) draw(0);
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = reduce ? s.a : s.a * (.55 + .45 * Math.sin(t / 1000 * s.s + s.p));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')'; ctx.fill();
      if (s.r > 1.4) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, 6.283); ctx.fillStyle = 'rgba(' + s.c + ',' + (a * .08).toFixed(3) + ')'; ctx.fill(); }
    }
    if (shoot) {
      const k = (t - shoot.t0) / shoot.d;
      if (k > 1) shoot = null;
      else {
        const x = shoot.x + shoot.dx * k, y = shoot.y + shoot.dy * k, f = Math.sin(k * Math.PI);
        const g = ctx.createLinearGradient(x, y, x - shoot.dx * .18, y - shoot.dy * .18);
        g.addColorStop(0, 'rgba(255,255,255,' + (.8 * f) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - shoot.dx * .18, y - shoot.dy * .18); ctx.stroke();
      }
    }
  }
  function loop(t) {
    if (!document.hidden) {
      if (t - last > 50) { // ٢٠ إطار بالثانية يكفي للمعان، أخف على الجهاز
        if (!shoot && Math.random() < .0015) shoot = { x: W * (.3 + Math.random() * .6), y: H * Math.random() * .35, dx: -(160 + Math.random() * 200), dy: 70 + Math.random() * 90, t0: t, d: 900 };
        draw(t); last = t;
      }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('resize', size);
  size();
  if (!reduce) requestAnimationFrame(loop);
})();
