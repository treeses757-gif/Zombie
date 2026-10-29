// js/spriteSystem.js
// BUG1-FIX1/2/3/4/7: единый скелет, локальные координаты, z-order, анимация от тела.
export const PART_RENDERERS = {};

const rad = (ctx, x, y, r, c0, c1) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
const lin = (ctx, x0, y0, x1, y1, c0, c1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
const circle = (ctx, x, y, r, fill, stroke, lw = 1.5) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
const line = (ctx, x1, y1, x2, y2, color, lw = 2) => { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };

// BUG1-FIX1: аура/нимб рисуются вокруг локального (0,0) — трансформ уже применён
const aura = (ctx, p, t, r, g, b, radius, intensity = 1, sp = 0.003) => {
  const pulse = 1 + Math.sin(t * sp) * 0.15;
  ctx.fillStyle = rad(ctx, 0, 0, radius * pulse, `rgba(${r},${g},${b},${0.5 * intensity})`, `rgba(${r},${g},${b},0)`);
  ctx.beginPath(); ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2); ctx.fill();
};
const halo = (ctx, p, t, color, r = 14, yOff = -32, th = 3) => {
  ctx.save();
  ctx.translate(0, yOff);
  ctx.strokeStyle = color; ctx.lineWidth = th;
  ctx.globalAlpha = 0.75 + Math.sin(t * 0.004) * 0.25;
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};

export const lerpColor = (a, b, t) => {
  const A = a.match(/\d+/g).map(Number), B = b.match(/\d+/g).map(Number);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
};
export const drawGlow = (ctx, x, y, r, color) => {
  ctx.fillStyle = rad(ctx, x, y, r, color, 'transparent');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
};

// BUG1-FIX2: единые скелеты (для справки — размеры совпадают с отрисовкой частей)
// BUG1-FIX7: walkPhase двигает ТОЛЬКО ноги/руки, тело покачивается отдельно
const SHADOW_SIZES = {
  survivor:        { rx: 14, ry: 4,  y: 22 },
  zombie_attacker: { rx: 12, ry: 4,  y: 20 },
  zombie_tank:     { rx: 20, ry: 5,  y: 28 },
  zombie_support:  { rx: 11, ry: 3,  y: 18 }
};

// BUG1-FIX1: базовые тела рисуются в локальных координатах (0,0) = стопы.
// Никакого ctx.translate(p.x, p.y) — всё уже сделано в drawPlayer.
function drawBodyParts(ctx, p, baseDrawFn) {
  const a = p.anim || { walkPhase: 0, attackTimer: 0 };
  const walking = Math.hypot(p.vx || 0, p.vy || 0) > 5;
  const legSwing = walking ? Math.sin(a.walkPhase || 0) * 4 : 0;
  baseDrawFn({ legSwing, walking });
}

function drawSurvivorBase(ctx, p, time) {
  drawBodyParts(ctx, p, ({ legSwing }) => {
    // Ноги
    ctx.fillStyle = '#111827';
    ctx.fillRect(-7 + legSwing, 12, 5, 14);
    ctx.fillRect(2 - legSwing, 12, 5, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8 + legSwing, 24, 7, 4);
    ctx.fillRect(1 - legSwing, 24, 7, 4);
    // Торс
    ctx.fillStyle = lin(ctx, -10, -8, 10, 16, '#2563eb', '#0f172a');
    rr(ctx, -9, -8, 18, 24, 4); ctx.fill();
    line(ctx, 0, -8, 0, 16, '#1e3a8a', 1);
    // Руки
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-11, -6, 4, 16);
    ctx.fillRect(7, -6, 4, 16);
    // Голова
    ctx.fillStyle = rad(ctx, 0, -18, 8, '#fde4c4', '#d4a574');
    ctx.beginPath(); ctx.arc(0, -18, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2f1a';
    ctx.beginPath(); ctx.arc(0, -20, 7, Math.PI, 0); ctx.fill();
    const ex = Math.cos(p.angle || 0) * 2, ey = Math.sin(p.angle || 0) * 2;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(ex, -18 + ey, 1.4, 0, Math.PI * 2); ctx.fill();
    // Пистолет
    ctx.save();
    ctx.translate(9, 2);
    ctx.rotate(p.angle || 0);
    ctx.fillStyle = '#333'; ctx.fillRect(0, -2, 10, 4);
    ctx.fillStyle = '#555'; ctx.fillRect(0, -2, 4, 5);
    if (p.anim && p.anim.attackTimer > 100) {
      const f = 0.7 + Math.sin(time * 0.04) * 0.3;
      ctx.fillStyle = `rgba(250,204,21,${f})`;
      ctx.beginPath(); ctx.arc(12, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });
}

function drawAttackerBase(ctx, p, time) {
  drawBodyParts(ctx, p, ({ legSwing }) => {
    ctx.fillStyle = '#0f5132';
    ctx.fillRect(-6 + legSwing, 10, 5, 13);
    ctx.fillRect(2 - legSwing, 10, 5, 13);
    ctx.fillStyle = lin(ctx, -8, -6, 8, 14, '#4d7c0f', '#14532d');
    rr(ctx, -7, -6, 14, 22, 3); ctx.fill();
    ctx.fillStyle = rad(ctx, 0, -14, 7, '#65a30d', '#365314');
    ctx.beginPath(); ctx.arc(0, -14, 6.5, 0, Math.PI * 2); ctx.fill();
    const atk = p.anim && p.anim.attackTimer > 0 ? 4 : 0;
    for (let i = 0; i < 3; i++) {
      line(ctx, -9, -2 + i * 2, -14 - atk, -3 + i * 3, '#fbbf24', 1.5);
      line(ctx, 9, -2 + i * 2, 14 + atk, -3 + i * 3, '#fbbf24', 1.5);
    }
    const ex = Math.cos(p.angle || 0) * 2, ey = Math.sin(p.angle || 0) * 2;
    ctx.fillStyle = '#ff3030';
    ctx.beginPath(); ctx.arc(ex, -14 + ey, 1.5, 0, Math.PI * 2); ctx.fill();
    if (atk > 0) { ctx.fillStyle = 'rgba(239,68,68,0.5)'; circle(ctx, 0, 0, 20); }
  });
}

function drawTankBase(ctx, p, time) {
  drawBodyParts(ctx, p, ({ legSwing }) => {
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-10 + legSwing * 0.5, 12, 8, 16);
    ctx.fillRect(2 - legSwing * 0.5, 12, 8, 16);
    ctx.fillStyle = lin(ctx, -16, -12, 16, 20, '#71717a', '#27272a');
    rr(ctx, -15, -12, 30, 28, 5); ctx.fill();
    ctx.fillStyle = '#52525b';
    ctx.beginPath(); ctx.arc(-13, -8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rad(ctx, 0, -22, 10, '#a1a1aa', '#3f3f46');
    ctx.beginPath(); ctx.arc(0, -22, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(-3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -22, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#52525b';
    ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
    rr(ctx, -26, -8, 10, 24, 3); ctx.fill(); ctx.stroke();
  });
}

function drawSupportBase(ctx, p, time) {
  drawBodyParts(ctx, p, ({ legSwing }) => {
    ctx.fillStyle = lin(ctx, -10, -6, 10, 16, '#7c3aed', '#4c1d95');
    poly(ctx, [[-9 + legSwing * 0.3, 16], [9 - legSwing * 0.3, 16], [7, -6], [-7, -6]]); ctx.fill();
    ctx.fillStyle = rad(ctx, 0, -16, 7, '#a78bfa', '#6d28d9');
    ctx.beginPath(); ctx.arc(0, -16, 6.5, 0, Math.PI * 2); ctx.fill();
    const f = 0.6 + Math.sin(time * 0.008) * 0.4;
    ctx.save(); ctx.translate(9, 2);
    ctx.fillStyle = rad(ctx, 0, 0, 6, `rgba(74,222,128,${f})`, '#14532d');
    poly(ctx, [[0, -6], [4, 0], [0, 6], [-4, 0]]); ctx.fill();
    ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(-2, -16, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, -16, 1.4, 0, Math.PI * 2); ctx.fill();
  });
}

// ============ 120 РЕНДЕРЕРОВ (без изменений — работают в локальных координатах) ============
// Все PART_RENDERERS используют p.x/p.y, которые при lp={...player,x:0,y:0} становятся 0.
// Поэтому ctx.translate(p.x, p.y) → translate(0,0) = no-op; всё рисуется локально.
PART_RENDERERS["hat_01"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 22); ctx.fillStyle = lin(ctx, -9, -4, 9, 4, '#78350f', '#1c0a00'); rr(ctx, -9, -4, 18, 8, 2); ctx.fill(); ctx.fillStyle = '#451a03'; rr(ctx, -11, 2, 22, 2, 1); ctx.fill(); ctx.restore(); };
PART_RENDERERS["torso_jacket"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = lin(ctx, -10, -8, 10, 16, '#7c2d12', '#431407'); rr(ctx, -10, -8, 20, 24, 4); ctx.fill(); line(ctx, -8, -6, 0, 10, '#1c0a00', 1); line(ctx, 8, -6, 0, 10, '#1c0a00', 1); ctx.restore(); };
PART_RENDERERS["boots_sprint"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const g = 0.5 + Math.sin(t * 0.005) * 0.3; ctx.fillStyle = `rgba(59,130,246,${g})`; ctx.fillRect(-8, 24, 6, 6); ctx.fillRect(2, 24, 6, 6); ctx.restore(); };
PART_RENDERERS["helmet_tactical"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = lin(ctx, -8, -28, 8, -18, '#4b5563', '#1f2937'); rr(ctx, -8, -28, 16, 10, 3); ctx.fill(); ctx.fillStyle = 'rgba(34,211,238,0.6)'; rr(ctx, -7, -24, 14, 3, 1); ctx.fill(); ctx.restore(); };
PART_RENDERERS["belt_ammo"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#78350f'; ctx.fillRect(-10, 10, 20, 4); ctx.fillStyle = '#fbbf24'; for (let i = -8; i < 8; i += 3) ctx.fillRect(i, 9, 1.5, 6); ctx.restore(); };
PART_RENDERERS["radio_shoulder"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#1e3a8a'; rr(ctx, 8, -10, 5, 7, 1); ctx.fill(); line(ctx, 10.5, -10, 10.5, -18, '#60a5fa', 1); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(10.5, -18, 1.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
PART_RENDERERS["flashlight_cone"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 16); ctx.rotate(p.angle || 0); const g = ctx.createLinearGradient(0, 0, 140, 0); g.addColorStop(0, 'rgba(255,255,180,0.35)'); g.addColorStop(1, 'rgba(255,255,180,0)'); ctx.fillStyle = g; poly(ctx, [[5, -3], [140, -28], [140, 28], [5, 3]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["base_sandbags"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y + 22); ctx.fillStyle = '#a8a29e'; for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) { const x = Math.cos(a) * 30, y = Math.sin(a) * 12; rr(ctx, x - 6, y - 3, 12, 6, 2); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["toolbox_pack"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#b45309'; rr(ctx, -10, -2, 20, 12, 2); ctx.fill(); ctx.fillStyle = '#fbbf24'; ctx.fillRect(-1, 3, 2, 4); ctx.restore(); };
PART_RENDERERS["jetpack_back"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#4b5563'; rr(ctx, -6, -8, 4, 14, 1); ctx.fill(); rr(ctx, 2, -8, 4, 14, 1); ctx.fill(); const f = 0.6 + Math.sin(t * 0.02) * 0.4; ctx.fillStyle = `rgba(251,146,60,${f})`; circle(ctx, -4, 9, 3); circle(ctx, 4, 9, 3); ctx.restore(); };
PART_RENDERERS["weapon_mauser"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#1f2937'; ctx.fillRect(0, -2, 18, 4); ctx.fillStyle = '#78716c'; ctx.fillRect(18, -1, 4, 2); ctx.fillStyle = '#eab308'; ctx.fillRect(4, -2.5, 2, 5); ctx.restore(); };
PART_RENDERERS["weapon_shotgun"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#374151'; rr(ctx, -6, -3, 20, 6, 2); ctx.fill(); ctx.fillStyle = '#6b7280'; ctx.fillRect(14, -2, 8, 4); ctx.restore(); };
PART_RENDERERS["weapon_smg"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#1f2937'; ctx.fillRect(0, -2, 12, 3); ctx.fillRect(0, 1, 12, 3); ctx.fillStyle = '#4b5563'; ctx.fillRect(12, -1, 3, 2); ctx.fillRect(12, 1, 3, 2); ctx.restore(); };
PART_RENDERERS["weapon_sniper"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, -2, 28, 4); ctx.fillStyle = '#4b5563'; ctx.fillRect(6, -4, 8, 2); ctx.fillStyle = '#ef4444'; ctx.fillRect(10, -3.5, 1.5, 1.5); ctx.restore(); };
PART_RENDERERS["weapon_launcher"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 4, p.y - 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#3f3f46'; rr(ctx, 0, -5, 20, 10, 2); ctx.fill(); ctx.fillStyle = '#78716c'; ctx.fillRect(20, -3, 4, 6); ctx.fillStyle = '#dc2626'; ctx.fillRect(3, -3, 3, 6); ctx.fillRect(8, -3, 3, 6); ctx.restore(); };
PART_RENDERERS["weapon_flamethrower"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#1e40af'; rr(ctx, -8, 0, 5, 10, 2); ctx.fill(); ctx.save(); ctx.translate(8, 2); ctx.rotate(p.angle || 0); ctx.fillStyle = '#374151'; ctx.fillRect(0, -2, 12, 4); const f = 0.6 + Math.sin(t * 0.02) * 0.4; ctx.fillStyle = `rgba(251,146,60,${f})`; poly(ctx, [[12, -3], [26, -7], [26, 7], [12, 3]]); ctx.fill(); ctx.restore(); ctx.restore(); };
PART_RENDERERS["weapon_crossbow"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(16, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(8, 0, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.strokeStyle = '#1c0a00'; ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(8, 6); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["minion_hound"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x - 22 + Math.sin(t * 0.005) * 4, p.y + 20); ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(8, -2, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(9, -2.5, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
PART_RENDERERS["minion_shooter"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 24, p.y + 10); ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-4, -8, 8, 16); ctx.fillStyle = '#fde4c4'; ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(2, -4, 10, 2); ctx.restore(); };
PART_RENDERERS["minion_shieldman"] = (ctx, p) => { ctx.save(); ctx.translate(p.x - 26, p.y + 6); ctx.fillStyle = '#4b5563'; ctx.fillRect(-5, -8, 10, 18); ctx.fillStyle = '#fde4c4'; ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#78716c'; rr(ctx, -12, -6, 6, 14, 2); ctx.fill(); ctx.restore(); };
PART_RENDERERS["muzzle_double"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 22, p.y + 2); const f = 0.5 + Math.sin(t * 0.03) * 0.5; ctx.fillStyle = `rgba(250,204,21,${f})`; circle(ctx, 0, -3, 4); circle(ctx, 0, 3, 4); ctx.restore(); };
PART_RENDERERS["muzzle_explosive"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 22, p.y + 2); const f = 0.6 + Math.sin(t * 0.04) * 0.4; ctx.fillStyle = `rgba(249,115,22,${f})`; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t * 0.01; circle(ctx, Math.cos(a) * 6, Math.sin(a) * 6, 3); } ctx.restore(); };
PART_RENDERERS["laser_sight"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 14, p.y); ctx.rotate(p.angle || 0); ctx.strokeStyle = `rgba(239,68,68,${0.5 + Math.sin(t * 0.01) * 0.3})`; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 0); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); };
PART_RENDERERS["trail_blue"] = (ctx, p, t, s) => { if (!s?.isMoving) return; ctx.save(); for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(59,130,246,${0.4 / i})`; circle(ctx, p.x - i * 5, p.y + 8, 4 - i * 0.6); } ctx.restore(); };
PART_RENDERERS["blood_drip"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(220,38,38,0.8)'; for (let i = 0; i < 3; i++) { const dy = (t * 0.05 + i * 40) % 60; ctx.beginPath(); ctx.arc(-4 + i * 4, 10 + dy * 0.5, 1.5, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["mark_target"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y - 40 + Math.sin(t * 0.005) * 3); ctx.fillStyle = '#facc15'; poly(ctx, [[0, 0], [8, 12], [-8, 12]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["smoke_barrel"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 18, p.y - 2); for (let i = 0; i < 3; i++) { const t0 = (t * 0.002 + i * 0.3) % 1; ctx.fillStyle = `rgba(200,200,200,${(1 - t0) * 0.5})`; circle(ctx, t0 * 20, -t0 * 25, 3 + t0 * 6); } ctx.restore(); };
PART_RENDERERS["crit_flash"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 22, p.y); const f = 0.7 + Math.sin(t * 0.04) * 0.3; ctx.fillStyle = `rgba(250,204,21,${f})`; poly(ctx, [[0, -8], [4, -2], [10, 0], [4, 2], [0, 8], [-4, 2], [-10, 0], [-4, -2]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["rocket_signal"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x - 10, p.y - 20 - (t * 0.03) % 60); ctx.fillStyle = '#dc2626'; poly(ctx, [[0, -10], [5, 0], [3, 8], [-3, 8], [-5, 0]]); ctx.fill(); const f = 0.5 + Math.sin(t * 0.03) * 0.5; ctx.fillStyle = `rgba(251,146,60,${f})`; poly(ctx, [[-3, 8], [3, 8], [0, 20]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["freeze_tint"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(96,165,250,0.18)'; circle(ctx, 0, 0, 22); ctx.strokeStyle = 'rgba(191,219,254,0.5)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + t * 0.001; line(ctx, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 20, Math.sin(a) * 20, 'rgba(191,219,254,0.5)', 1); } ctx.restore(); };
PART_RENDERERS["claws_sharp"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#f3f4f6', 2); line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#f3f4f6', 2); } ctx.restore(); };
PART_RENDERERS["claws_bloody"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#7f1d1d', 2); line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#7f1d1d', 2); } ctx.fillStyle = 'rgba(220,38,38,0.9)'; for (let i = 0; i < 4; i++) { const y = (t * 0.04 + i * 30) % 40; circle(ctx, -16, 6 + y * 0.5, 1.5); } ctx.restore(); };
PART_RENDERERS["claws_poison"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#4ade80', 2); line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#4ade80', 2); } const f = 0.5 + Math.sin(t * 0.01) * 0.5; ctx.fillStyle = `rgba(74,222,128,${f})`; circle(ctx, -16, 8, 2); circle(ctx, 16, 8, 2); ctx.restore(); };
PART_RENDERERS["aura_berserk"] = (ctx, p, t) => { if (p.hp > p.maxHp * 0.5) return; aura(ctx, p, t, 220, 38, 38, 45, 0.9); };
PART_RENDERERS["blur_rush"] = (ctx, p, t, s) => { if (!s?.isMoving) return; ctx.save(); for (let i = 1; i <= 4; i++) { ctx.fillStyle = `rgba(239,68,68,${0.3 / i})`; circle(ctx, p.x - i * 6, p.y, 6 - i); } ctx.restore(); };
PART_RENDERERS["jump_shockwave"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y + 24); const r = 10 + Math.sin(t * 0.005) * 10; ctx.strokeStyle = 'rgba(120,53,15,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["combo_flash"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 12, p.y); const f = (Math.sin(t * 0.04) + 1) * 0.5; ctx.fillStyle = `rgba(250,204,21,${f})`; circle(ctx, 0, -6, 3); circle(ctx, 0, 0, 4); circle(ctx, 0, 6, 3); ctx.restore(); };
PART_RENDERERS["wave_circular"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); const r = 20 + ((t * 0.1) % 150); ctx.strokeStyle = `rgba(249,115,22,${1 - r / 170})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["claws_white_glow"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const f = 0.6 + Math.sin(t * 0.01) * 0.4; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; for (let i = 0; i < 3; i++) { line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, `rgba(255,255,255,${f})`, 2.5); line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, `rgba(255,255,255,${f})`, 2.5); } ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["grab_hands"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 20, p.y); ctx.fillStyle = '#65a30d'; for (let i = 0; i < 4; i++) ctx.fillRect(-4 + i * 3, -6 - (i % 2) * 2, 2, 12); ctx.restore(); };
PART_RENDERERS["roar_waves"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { const r = 20 + i * 20 + ((t * 0.1) % 30); ctx.strokeStyle = `rgba(249,115,22,${0.5 - i * 0.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["acid_spit"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 6, p.y - 14); ctx.rotate(p.angle || 0); ctx.fillStyle = 'rgba(74,222,128,0.8)'; for (let i = 0; i < 4; i++) circle(ctx, 8 + i * 6 + (t * 0.05 + i * 8) % 30, (i % 2 - 0.5) * 3, 2); ctx.restore(); };
PART_RENDERERS["drop_from_above"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y - 60 + Math.sin(t * 0.004) * 5); line(ctx, 0, 0, 0, 40, 'rgba(220,38,38,0.6)', 1); ctx.fillStyle = '#dc2626'; poly(ctx, [[-6, 0], [0, -8], [6, 0]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["phase_ghost"] = (ctx, p, t) => { ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 0.008) * 0.2; circle(ctx, p.x, p.y, 22, null, '#a855f7', 2); ctx.restore(); };
PART_RENDERERS["aura_rage_red"] = (ctx, p, t) => aura(ctx, p, t, 220, 38, 38, 40, 1, 0.008);
PART_RENDERERS["rats_minions"] = (ctx, p, t) => { for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(p.x - 20 + i * 40, p.y + 22 + Math.sin(t * 0.01 + i) * 3); ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -1, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } };
PART_RENDERERS["teeth_yellow"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 12); ctx.fillStyle = '#fde047'; for (let i = -2; i <= 2; i++) { poly(ctx, [[i * 2 - 1, -3], [i * 2, 2], [i * 2 + 1, -3]]); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["rock_thrown"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x + 30, p.y - 20 - (t * 0.05) % 40); ctx.fillStyle = '#78716c'; poly(ctx, [[-5, -5], [5, -5], [6, 4], [-6, 4]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["fear_waves_purple"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); const r = 20 + ((t * 0.1) % 80); ctx.strokeStyle = `rgba(168,85,247,${0.6 - r / 130})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["dark_aura_execute"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 10, p.y); const f = 0.6 + Math.sin(t * 0.005) * 0.4; ctx.fillStyle = `rgba(10,10,10,${f})`; circle(ctx, 0, 0, 10); circle(ctx, 0, 0, 10, null, `rgba(120,53,255,${f})`, 1.5); ctx.restore(); };
PART_RENDERERS["sparks_regen_green"] = (ctx, p, t) => { ctx.save(); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t * 0.003; const y = (t * 0.05 + i * 20) % 50; ctx.fillStyle = `rgba(74,222,128,${1 - y / 50})`; circle(ctx, p.x + Math.cos(a) * 15, p.y + 20 - y, 1.5); } ctx.restore(); };
PART_RENDERERS["eyes_night_glow"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y - 14); const f = 0.6 + Math.sin(t * 0.008) * 0.4; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8; ctx.fillStyle = `rgba(253,224,71,${f})`; circle(ctx, -2, 0, 2); circle(ctx, 2, 0, 2); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["plates_gray_thick"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#71717a'; ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { rr(ctx, -7, -4 + i * 6, 14, 5, 1); ctx.fill(); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["trails_red_speed"] = (ctx, p, t, s) => { if (!s?.isMoving) return; ctx.save(); for (let i = 1; i <= 4; i++) { line(ctx, p.x - i * 6, p.y + 8 - i, p.x - i * 6, p.y + 8 + i, `rgba(220,38,38,${0.5 / i})`, 2); } ctx.restore(); };
PART_RENDERERS["spikes_body"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#52525b'; for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) { const x1 = Math.cos(a) * 12, y1 = Math.sin(a) * 12; const x2 = Math.cos(a) * 18, y2 = Math.sin(a) * 18; poly(ctx, [[x1 - 1, y1 - 1], [x2, y2], [x1 + 1, y1 + 1]]); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["slime_ground"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y + 24); const f = 0.5 + Math.sin(t * 0.005) * 0.3; ctx.fillStyle = `rgba(74,222,128,${f * 0.6})`; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
PART_RENDERERS["threads_blood"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + Math.sin(t * 0.003) * 0.2; line(ctx, 0, 0, Math.cos(a) * 30, Math.sin(a) * 30, 'rgba(220,38,38,0.6)', 1); } ctx.restore(); };
PART_RENDERERS["aura_revive_green"] = (ctx, p, t) => { if (p.alive) return; aura(ctx, p, t, 74, 222, 128, 30, 0.8); };
PART_RENDERERS["bone_counter"] = (ctx, p) => { ctx.save(); ctx.translate(p.x - 12, p.y + 8); ctx.fillStyle = '#fafaf9'; for (let i = 0; i < 3; i++) ctx.fillRect(-1 + i * 4, -1, 2, 5); ctx.restore(); };
PART_RENDERERS["headband_red"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 20); ctx.fillStyle = '#dc2626'; rr(ctx, -8, -2, 16, 3, 1); ctx.fill(); line(ctx, 8, -1, 14, -3, '#dc2626', 2); ctx.restore(); };
PART_RENDERERS["shield_bigger"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = lin(ctx, -30, -12, -18, 20, '#78716c', '#27272a'); ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -32, -14, 14, 34, 4); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["shield_spiked"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#52525b'; rr(ctx, -26, -8, 10, 24, 3); ctx.fill(); ctx.fillStyle = '#a8a29e'; for (let i = 0; i < 4; i++) { poly(ctx, [[-26, -6 + i * 6], [-34, -4 + i * 6], [-26, -2 + i * 6]]); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["plates_bone"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#f5f5f4'; ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { rr(ctx, -12 + i * 2, -8 + i * 6, 24 - i * 4, 5, 2); ctx.fill(); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["horns_helm"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 26); ctx.fillStyle = '#e5e7eb'; poly(ctx, [[-8, 0], [-14, -12], [-6, -2]]); ctx.fill(); poly(ctx, [[8, 0], [14, -12], [6, -2]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["fists_massive"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); circle(ctx, -14, 6, 8, '#52525b', '#18181b', 2); circle(ctx, 14, 6, 8, '#52525b', '#18181b', 2); ctx.restore(); };
PART_RENDERERS["fist_glow_orange"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 14, p.y + 6); const f = 0.6 + Math.sin(t * 0.01) * 0.4; ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12; circle(ctx, 0, 0, 6, `rgba(249,115,22,${f})`); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["tires_shoulders"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); circle(ctx, -14, -8, 8, '#18181b'); circle(ctx, 14, -8, 8, '#18181b'); circle(ctx, -14, -8, 4, null, '#3f3f46', 1); circle(ctx, 14, -8, 4, null, '#3f3f46', 1); ctx.restore(); };
PART_RENDERERS["shields_dual"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#52525b'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -28, -8, 10, 24, 3); ctx.fill(); ctx.stroke(); rr(ctx, 18, -8, 10, 24, 3); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["skin_stone"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(82,82,91,0.35)'; rr(ctx, -15, -12, 30, 28, 5); ctx.fill(); ctx.strokeStyle = 'rgba(24,24,27,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) line(ctx, -10 + i * 6, -8, -8 + i * 6, 10, 'rgba(24,24,27,0.6)', 1); ctx.restore(); };
PART_RENDERERS["shield_fire"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x - 21, p.y); const f = 0.6 + Math.sin(t * 0.02) * 0.4; ctx.fillStyle = `rgba(251,146,60,${f})`; rr(ctx, -5, -12, 10, 24, 3); ctx.fill(); ctx.fillStyle = `rgba(250,204,21,${f * 0.7})`; rr(ctx, -3, -8, 6, 16, 2); ctx.fill(); ctx.restore(); };
PART_RENDERERS["aura_ally_blue"] = (ctx, p, t) => aura(ctx, p, t, 59, 130, 246, 60, 0.5);
PART_RENDERERS["cracks_ground"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y + 24); ctx.strokeStyle = 'rgba(120,53,15,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; line(ctx, 0, 0, Math.cos(a) * 20, Math.sin(a) * 8, 'rgba(120,53,15,0.8)', 2); } ctx.restore(); };
PART_RENDERERS["wall_summon"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 20); ctx.fillStyle = '#52525b'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -25, -30, 50, 30, 3); ctx.fill(); ctx.stroke(); for (let i = 0; i < 5; i++) line(ctx, -25 + i * 10, -30, -25 + i * 10, 0, '#27272a', 1); ctx.restore(); };
PART_RENDERERS["fog_red_rage"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + t * 0.001; ctx.fillStyle = `rgba(220,38,38,${0.15 + Math.sin(t * 0.005 + i) * 0.05})`; circle(ctx, Math.cos(a) * 15, Math.sin(a) * 15, 20); } ctx.restore(); };
PART_RENDERERS["shield_boomerang"] = (ctx, p, t) => { ctx.save(); const a = (t * 0.003) % (Math.PI * 2); ctx.translate(p.x - 26 + Math.cos(a) * 30, p.y - Math.sin(a) * 30); ctx.fillStyle = '#52525b'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -5, -10, 10, 20, 3); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["shield_slam_flash"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x - 26, p.y); const f = 0.6 + Math.sin(t * 0.04) * 0.4; ctx.fillStyle = `rgba(250,204,21,${f})`; circle(ctx, 0, 0, 15); ctx.restore(); };
PART_RENDERERS["statue_gray"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(120,113,108,0.4)'; rr(ctx, -16, -24, 32, 50, 5); ctx.fill(); ctx.strokeStyle = 'rgba(24,24,27,0.5)'; ctx.lineWidth = 1; rr(ctx, -16, -24, 32, 50, 5); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["shield_mirror"] = (ctx, p) => { ctx.save(); ctx.translate(p.x - 21, p.y); ctx.fillStyle = lin(ctx, -5, -10, 5, 10, '#e0f2fe', '#0ea5e9'); ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 2; rr(ctx, -5, -12, 10, 24, 3); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["threads_violet_absorb"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + t * 0.002; ctx.strokeStyle = 'rgba(168,85,247,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 20, Math.sin(a) * 20 + 5, Math.cos(a) * 40, Math.sin(a) * 40); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["glow_red_charge"] = (ctx, p, t) => { const f = 0.5 + Math.sin(t * 0.01) * 0.5; aura(ctx, p, t, 220, 38, 38, 35 + f * 15, 0.8, 0.01); };
PART_RENDERERS["rings_violet_legs"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y + 20); for (let i = 0; i < 3; i++) { const r = 10 + i * 5 + ((t * 0.02) % 10); ctx.strokeStyle = `rgba(168,85,247,${0.6 - i * 0.15})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["pulse_green_regen"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const r = 20 + Math.sin(t * 0.005) * 8; ctx.strokeStyle = `rgba(74,222,128,${0.5 + Math.sin(t * 0.005) * 0.3})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["eyes_lantern"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y - 22); const f = 0.7 + Math.sin(t * 0.008) * 0.3; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12; circle(ctx, -3, 0, 2.5, `rgba(253,224,71,${f})`); circle(ctx, 3, 0, 2.5, `rgba(253,224,71,${f})`); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["plates_double"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#52525b'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1; rr(ctx, -13, -10, 26, 8, 2); ctx.fill(); ctx.stroke(); rr(ctx, -13, -1, 26, 8, 2); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["shield_always"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#71717a'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -27, -9, 11, 26, 3); ctx.fill(); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["aura_yellow_team"] = (ctx, p, t) => aura(ctx, p, t, 250, 204, 21, 70, 0.35);
PART_RENDERERS["helm_closed"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y - 22); ctx.fillStyle = '#3f3f46'; rr(ctx, -10, -6, 20, 12, 3); ctx.fill(); ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; rr(ctx, -10, -6, 20, 12, 3); ctx.stroke(); line(ctx, -8, 0, 8, 0, '#dc2626', 1); ctx.restore(); };
PART_RENDERERS["body_heavy_lean"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(63,63,70,0.5)'; poly(ctx, [[-16, 20], [16, 20], [20, -8], [-20, -8]]); ctx.fill(); ctx.restore(); };
PART_RENDERERS["shield_repair"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x - 21, p.y); const f = 0.5 + Math.sin(t * 0.006) * 0.5; ctx.strokeStyle = `rgba(74,222,128,${f})`; ctx.lineWidth = 2; rr(ctx, -6, -12, 12, 24, 3); ctx.stroke(); line(ctx, -3, -8, 3, -2, `rgba(74,222,128,${f})`, 2); ctx.restore(); };
PART_RENDERERS["body_massive"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(82,82,91,0.35)'; rr(ctx, -19, -16, 38, 34, 7); ctx.fill(); ctx.restore(); };
PART_RENDERERS["crystal_green_hand"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 12, p.y + 2); const f = 0.6 + Math.sin(t * 0.008) * 0.4; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10; ctx.fillStyle = `rgba(74,222,128,${f})`; poly(ctx, [[0, -8], [5, 0], [0, 8], [-5, 0]]); ctx.fill(); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["threads_green_ally"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.sin(t * 0.002) * 0.3; ctx.strokeStyle = 'rgba(74,222,128,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 20, Math.sin(a) * 20 + 5, Math.cos(a) * 50, Math.sin(a) * 50); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["fog_green_poison"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y + 10); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + t * 0.001; ctx.fillStyle = `rgba(74,222,128,${0.15 + Math.sin(t * 0.005 + i) * 0.05})`; circle(ctx, Math.cos(a) * 25, Math.sin(a) * 15, 22); } ctx.restore(); };
PART_RENDERERS["orb_heal_flying"] = (ctx, p, t) => { ctx.save(); const a = (t * 0.002) % (Math.PI * 2); ctx.translate(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30); const f = 0.6 + Math.sin(t * 0.01) * 0.4; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 12; circle(ctx, 0, 0, 5, `rgba(74,222,128,${f})`); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["barrier_yellow"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const f = 0.4 + Math.sin(t * 0.005) * 0.2; circle(ctx, 0, 0, 22, `rgba(250,204,21,${f * 0.5})`, `rgba(250,204,21,${f + 0.3})`, 2); ctx.restore(); };
PART_RENDERERS["aura_red_ally"] = (ctx, p, t) => aura(ctx, p, t, 220, 38, 38, 35, 0.4);
PART_RENDERERS["light_green_revive"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const f = 0.4 + Math.sin(t * 0.006) * 0.4; const g = ctx.createLinearGradient(0, -100, 0, 20); g.addColorStop(0, `rgba(74,222,128,0)`); g.addColorStop(1, `rgba(74,222,128,${f})`); ctx.fillStyle = g; ctx.fillRect(-10, -100, 20, 120); ctx.restore(); };
PART_RENDERERS["threads_black_curse"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + t * 0.001; ctx.strokeStyle = 'rgba(10,10,10,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 25, Math.sin(a) * 25 + 5, Math.cos(a) * 50, Math.sin(a) * 50); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["fireflies_glow"] = (ctx, p, t) => { ctx.save(); for (let i = 0; i < 3; i++) { const a = t * 0.002 + i * 2; const x = p.x + Math.cos(a) * 25; const y = p.y - 10 + Math.sin(a * 1.3) * 20; const f = 0.6 + Math.sin(t * 0.005 + i) * 0.4; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10; circle(ctx, x, y, 2, `rgba(253,224,71,${f})`); ctx.shadowBlur = 0; } ctx.restore(); };
PART_RENDERERS["threads_green_symbiosis"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const a = Math.sin(t * 0.002) * 0.3; ctx.strokeStyle = 'rgba(74,222,128,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30, -20 + a * 10, 60, -10); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["wave_green_mass"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); const r = 20 + ((t * 0.15) % 80); ctx.strokeStyle = `rgba(74,222,128,${0.6 - r / 130})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["portal_violet"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y - 20); for (let i = 0; i < 2; i++) { const r = 10 + i * 5; ctx.strokeStyle = `rgba(168,85,247,${0.6 - i * 0.2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, t * 0.002 + i, t * 0.002 + i + Math.PI * 1.5); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["bubbles_gold_all"] = (ctx, p, t) => { ctx.save(); for (let i = 0; i < 3; i++) { const y = -((t * 0.02 + i * 20) % 40); const x = (i - 1) * 10 + Math.sin(t * 0.005 + i) * 5; ctx.fillStyle = `rgba(250,204,21,${0.5 - (-y / 80) * 0.5})`; circle(ctx, p.x + x, p.y + y, 4); } ctx.restore(); };
PART_RENDERERS["trails_blue_speed"] = (ctx, p, t, s) => { if (!s?.isMoving) return; ctx.save(); for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(59,130,246,${0.4 / i})`; circle(ctx, p.x - i * 6, p.y + 15, 3 - i * 0.4); } ctx.restore(); };
PART_RENDERERS["flash_white_cleanse"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); const f = 0.5 + Math.sin(t * 0.05) * 0.5; ctx.fillStyle = `rgba(255,255,255,${f})`; circle(ctx, 0, 0, 20); ctx.restore(); };
PART_RENDERERS["fog_green_big"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y + 5); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t * 0.001; ctx.fillStyle = `rgba(74,222,128,${0.12 + Math.sin(t * 0.004 + i) * 0.04})`; circle(ctx, Math.cos(a) * 40, Math.sin(a) * 25, 35); } ctx.restore(); };
PART_RENDERERS["minion_small_rise"] = (ctx, p) => { ctx.save(); ctx.translate(p.x + 25, p.y + 15); ctx.fillStyle = '#4d7c0f'; ctx.fillRect(-4, 0, 8, 12); circle(ctx, 0, -4, 4, '#65a30d'); ctx.restore(); };
PART_RENDERERS["portals_dual_rings"] = (ctx, p, t) => { ctx.save(); for (let s = 0; s < 2; s++) { const x = p.x + (s === 0 ? -20 : 20); const y = p.y - 20; ctx.strokeStyle = 'rgba(168,85,247,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8, t * 0.003 + s, t * 0.003 + s + Math.PI * 1.7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 4, -t * 0.003, -t * 0.003 + Math.PI * 1.5); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["wall_fire"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 20, p.y); const f = 0.6 + Math.sin(t * 0.02) * 0.4; for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(251,146,60,${f})`; poly(ctx, [[-5, -20 + i * 10], [0, -28 + i * 10], [5, -20 + i * 10], [3, -14 + i * 10], [-3, -14 + i * 10]]); ctx.fill(); } ctx.restore(); };
PART_RENDERERS["snowflakes_slow"] = (ctx, p, t) => { ctx.save(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t * 0.001; circle(ctx, p.x + Math.cos(a) * 25, p.y + Math.sin(a) * 25, 1.5, 'rgba(191,219,254,0.7)'); } ctx.restore(); };
PART_RENDERERS["aura_green_passive"] = (ctx, p, t) => aura(ctx, p, t, 74, 222, 128, 32, 0.3);
PART_RENDERERS["clock_blue_shoulder"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x + 10, p.y - 8); circle(ctx, 0, 0, 6, 'rgba(15,23,42,0.8)', '#60a5fa', 2); const a = t * 0.003; line(ctx, 0, 0, Math.cos(a) * 4, Math.sin(a) * 4, '#60a5fa', 1.5); ctx.restore(); };
PART_RENDERERS["rings_expanding"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 3; i++) { const r = 15 + i * 8 + ((t * 0.03) % 15); ctx.strokeStyle = `rgba(74,222,128,${0.5 - i * 0.13})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
PART_RENDERERS["thread_symbiotic"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const a = Math.sin(t * 0.002) * 0.4; ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -15 + a * 5, -40, -10); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["halo_green_poison_immune"] = (ctx, p, t) => halo(ctx, p, t, 'rgba(74,222,128,0.8)', 12, -32, 2.5);
PART_RENDERERS["transparency_stealth"] = (ctx, p) => { ctx.save(); ctx.globalAlpha = 0.5; circle(ctx, p.x, p.y, 22, null, 'rgba(200,200,255,0.3)', 1.5); ctx.restore(); };
PART_RENDERERS["double_flash_echo"] = (ctx, p, t, s) => { if (!s?.isAttacking) return; ctx.save(); ctx.translate(p.x, p.y); const f = 0.5 + Math.sin(t * 0.05) * 0.5; ctx.fillStyle = `rgba(255,255,255,${f})`; circle(ctx, -10, 0, 8); circle(ctx, 10, 0, 8); ctx.restore(); };
PART_RENDERERS["crystal_blue_chest"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); const f = 0.6 + Math.sin(t * 0.007) * 0.4; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10; ctx.fillStyle = `rgba(56,189,248,${f})`; poly(ctx, [[0, -6], [5, 0], [0, 8], [-5, 0]]); ctx.fill(); ctx.shadowBlur = 0; ctx.restore(); };
PART_RENDERERS["mantle_violet"] = (ctx, p) => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = 'rgba(168,85,247,0.6)'; poly(ctx, [[-12, -6], [12, -6], [15, 22], [-15, 22]]); ctx.fill(); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1; poly(ctx, [[-12, -6], [12, -6], [15, 22], [-15, 22]]); ctx.stroke(); ctx.restore(); };
PART_RENDERERS["fog_red_teamrage"] = (ctx, p, t) => { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + t * 0.001; ctx.fillStyle = `rgba(220,38,38,${0.12 + Math.sin(t * 0.005 + i) * 0.05})`; circle(ctx, Math.cos(a) * 30, Math.sin(a) * 20, 28); } ctx.restore(); };

// ============ База ============
export function drawBase(ctx, base, time) {
  if (!base) return;
  ctx.save();
  ctx.translate(base.x, base.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 70, 100, 25, 0, 0, Math.PI * 2); ctx.fill();
  const destroyed = base.hp <= 0;
  ctx.fillStyle = destroyed ? '#3f3f46' : lin(ctx, -60, -60, 60, 60, '#a8a29e', '#57534e');
  ctx.fillRect(-60, -60, 120, 120);
  ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 3;
  ctx.strokeRect(-60, -60, 120, 120);
  ctx.strokeStyle = 'rgba(24,24,27,0.7)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const n = (i * 73856093) & 0x7fffffff;
    const x0 = -50 + (n % 100), y0 = -50 + ((n >> 8) % 100);
    ctx.beginPath(); ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (n % 20) - 10, y0 + (n >> 4) % 30);
    ctx.stroke();
  }
  ctx.fillStyle = '#292524'; ctx.fillRect(-12, -110, 24, 55);
  ctx.fillStyle = '#44403c'; ctx.fillRect(-18, -112, 36, 6);
  const ang = time * 0.001;
  ctx.save(); ctx.translate(0, -95); ctx.rotate(ang);
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 100, 0);
  g.addColorStop(0, 'rgba(254,243,199,0.35)');
  g.addColorStop(1, 'rgba(254,243,199,0)');
  ctx.fillStyle = g;
  poly(ctx, [[5, -4], [100, -40], [100, 40], [5, 4]]); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#a8a29e'; ctx.strokeStyle = '#57534e'; ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 72, y = Math.sin(a) * 72;
    rr(ctx, x - 10, y - 6, 20, 12, 3); ctx.fill(); ctx.stroke();
  }
  const pct = Math.max(0, Math.min(1, base.hp / base.maxHp));
  const barW = 100, barH = 8;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(-barW / 2, -130, barW, barH);
  const col = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';
  ctx.fillStyle = col;
  ctx.fillRect(-barW / 2, -130, barW * pct, barH);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(-barW / 2, -130, barW, barH);
  ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(base.hp)}/${base.maxHp}`, 0, -134);
  if (destroyed) {
    for (let i = 0; i < 4; i++) {
      const t0 = (time * 0.002 + i * 0.25) % 1;
      ctx.fillStyle = `rgba(120,120,120,${(1 - t0) * 0.4})`;
      circle(ctx, -20 + i * 15, -60 - t0 * 80, 12 + t0 * 15);
      ctx.fillStyle = `rgba(251,146,60,${(1 - t0) * 0.7})`;
      circle(ctx, -20 + i * 15, -50 - t0 * 30, 5 - t0 * 4);
    }
  }
  ctx.restore();
}

export function getPartsForPlayer(player) {
  if (!player) return [];
  if (player.visualLayers && player.visualLayers.length) return player.visualLayers;
  const parts = [];
  for (const up of player.upgrades || []) {
    if (up?.visual?.part) parts.push({ part: up.visual.part, layer: up.visual.layer ?? 5 });
  }
  if (parts.length === 0 && player.visualParts) {
    for (const part of player.visualParts) parts.push({ part, layer: 5 });
  }
  return parts.sort((a, b) => a.layer - b.layer);
}

// BUG1-FIX1/3: ОДИН translate на весь drawPlayer, все части — в локальных координатах.
export function drawPlayer(ctx, player, time, state = {}) {
  if (!player) return;

  const anim = player.anim || { walkPhase: 0, attackTimer: 0, hurtTimer: 0, deathTimer: 0 };
  const isDead = !player.alive;
  const walking = Math.hypot(player.vx || 0, player.vy || 0) > 5;
  const wp = anim.walkPhase || 0;

  const idleBob = Math.sin(time * 0.003) * 1.5;
  const bodyTilt = walking ? Math.sin(wp * 2) * 0.05 : 0;
  let lunge = 0;
  if (anim.attackTimer > 0) {
    const prog = 1 - anim.attackTimer / 150;
    lunge = prog < 0.4 ? -prog * 8 : (prog - 0.4) * 15;
  }
  const hurtShake = anim.hurtTimer > 0 ? Math.sin(time * 0.05) * 3 : 0;

  // BUG1-FIX3: тень отдельно (в мировых координатах, не под наклоном тела)
  const sh = SHADOW_SIZES[player.role] || SHADOW_SIZES.survivor;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + sh.y, sh.rx, sh.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(player.x, player.y);

  if (isDead && anim.deathTimer > 0) {
    ctx.globalAlpha = Math.max(0.3, anim.deathTimer / 500);
    ctx.rotate((1 - anim.deathTimer / 500) * Math.PI / 2);
  }

  ctx.translate(
    Math.cos(player.angle || 0) * lunge + hurtShake,
    idleBob + Math.sin(player.angle || 0) * lunge
  );
  ctx.rotate(bodyTilt);

  // BUG1-FIX1: передаём lp с x=0,y=0, чтобы все PART_RENDERERS рисовали локально
  const lp = { ...player, x: 0, y: 0 };

  switch (player.role) {
    case 'survivor':        drawSurvivorBase(ctx, lp, time); break;
    case 'zombie_attacker': drawAttackerBase(ctx, lp, time); break;
    case 'zombie_tank':     drawTankBase(ctx, lp, time); break;
    case 'zombie_support':  drawSupportBase(ctx, lp, time); break;
    default:                drawSurvivorBase(ctx, lp, time);
  }

  // BUG1-FIX3: детали в порядке layer
  const parts = getPartsForPlayer(player);
  for (const { part } of parts) {
    const fn = PART_RENDERERS[part];
    if (fn) {
      ctx.save();
      try { fn(ctx, lp, time, state); } catch (e) { console.error('[PART]', part, e); }
      ctx.restore();
    }
  }
  ctx.restore();

  // FIX: hurt overlay (в мировых координатах)
  if (anim.hurtTimer > 0) {
    ctx.save();
    ctx.globalAlpha = (anim.hurtTimer / 200) * 0.5;
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 5, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // BUG1-FIX8: отладочный маркер (раскомментируйте для проверки)
  // ctx.strokeStyle = 'lime'; ctx.lineWidth = 2;
  // ctx.strokeRect(player.x - 15, player.y - 30, 30, 50);
  // ctx.fillStyle = 'red';
  // ctx.beginPath(); ctx.arc(player.x, player.y - 18, 3, 0, Math.PI * 2); ctx.fill();
}