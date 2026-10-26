// js/spriteSystem.js
// Полная процедурная система визуализации всех 120 улучшений на Canvas.
// Экспортирует PART_RENDERERS (120 функций), drawPlayer, drawBase, getPartsForPlayer.

// ============================================================
// 1. ХЕЛПЕРЫ
// ============================================================
const lin = (ctx, x0, y0, x1, y1, c0, c1) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
};
const rad = (ctx, x, y, r, c0, c1) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
};
const rr = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
const poly = (ctx, pts) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
};
const circle = (ctx, x, y, r, fill, stroke, lw = 1.5) => {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
};
const line = (ctx, x1, y1, x2, y2, color, lw = 2) => {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
};
// Универсальная пульсирующая аура
const aura = (ctx, p, t, r, g, b, radius, intensity = 1, sp = 0.003) => {
  ctx.save();
  ctx.translate(p.x, p.y);
  const pulse = 1 + Math.sin(t * sp) * 0.15;
  const grd = rad(ctx, 0, 0, radius * pulse,
    `rgba(${r},${g},${b},${0.55 * intensity})`,
    `rgba(${r},${g},${b},0)`);
  grd.addColorStop(0.55, `rgba(${r},${g},${b},${0.18 * intensity})`);
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
// Универсальный "нимб" над головой
const halo = (ctx, p, t, color, radius = 14, yOffset = -32, thickness = 3) => {
  ctx.save();
  ctx.translate(p.x, p.y + yOffset);
  ctx.strokeStyle = color; ctx.lineWidth = thickness;
  ctx.globalAlpha = 0.75 + Math.sin(t * 0.004) * 0.25;
  ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export function lerpColor(a, b, t) {
  const A = a.match(/\d+/g).map(Number);
  const B = b.match(/\d+/g).map(Number);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
export function drawGlow(ctx, x, y, r, color) {
  const g = rad(ctx, x, y, r, color, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// ============================================================
// 2. БАЗОВЫЕ ТЕЛА
// ============================================================
function drawSurvivorBase(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 22, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(-7, 12, 5, 14); ctx.fillRect(2, 12, 5, 14);
  ctx.fillStyle = lin(ctx, -10, -8, 10, 16, '#2563eb', '#0f172a');
  rr(ctx, -9, -8, 18, 24, 4); ctx.fill();
  line(ctx, 0, -8, 0, 16, '#1e3a8a', 1);
  ctx.fillStyle = rad(ctx, 0, -18, 8, '#fde4c4', '#d4a574');
  ctx.beginPath(); ctx.arc(0, -18, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a2f1a';
  ctx.beginPath(); ctx.arc(0, -20, 7, Math.PI, 0); ctx.fill();
  const ax = Math.cos(p.angle || 0);
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(ax * 2, -18, 1.4, 0, Math.PI * 2); ctx.fill();
  // Пистолет по умолчанию
  ctx.save(); ctx.translate(8, 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#333'; ctx.fillRect(0, -2, 10, 4);
  ctx.fillStyle = '#555'; ctx.fillRect(0, -2, 4, 5);
  ctx.restore();
  ctx.restore();
}

function drawAttackerBase(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 20, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f5132';
  ctx.fillRect(-6, 10, 5, 13); ctx.fillRect(2, 10, 5, 13);
  ctx.fillStyle = lin(ctx, -8, -6, 8, 14, '#4d7c0f', '#14532d');
  rr(ctx, -7, -6, 14, 22, 3); ctx.fill();
  ctx.fillStyle = rad(ctx, 0, -14, 7, '#65a30d', '#365314');
  ctx.beginPath(); ctx.arc(0, -14, 6.5, 0, Math.PI * 2); ctx.fill();
  // Базовые когти
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    line(ctx, -9, -2 + i * 2, -14, -3 + i * 3, '#fbbf24', 1.5);
    line(ctx, 9, -2 + i * 2, 14, -3 + i * 3, '#fbbf24', 1.5);
  }
  const ax = Math.cos(p.angle || 0);
  ctx.fillStyle = '#ff3030';
  ctx.beginPath(); ctx.arc(ax * 2, -14, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTankBase(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 28, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-10, 12, 8, 16); ctx.fillRect(2, 12, 8, 16);
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
  // Базовый щит
  ctx.fillStyle = '#52525b';
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -26, -8, 10, 24, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawSupportBase(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 18, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lin(ctx, -10, -6, 10, 16, '#7c3aed', '#4c1d95');
  poly(ctx, [[-9, 16], [9, 16], [7, -6], [-7, -6]]); ctx.fill();
  ctx.fillStyle = rad(ctx, 0, -16, 7, '#a78bfa', '#6d28d9');
  ctx.beginPath(); ctx.arc(0, -16, 6.5, 0, Math.PI * 2); ctx.fill();
  // Кристалл в руке
  ctx.save(); ctx.translate(9, 2);
  ctx.fillStyle = rad(ctx, 0, 0, 6, '#4ade80', '#14532d');
  poly(ctx, [[0, -6], [4, 0], [0, 6], [-4, 0]]); ctx.fill();
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath(); ctx.arc(-2, -16, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -16, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ============================================================
// 3. СЛОВАРЬ РЕНДЕРЕРОВ (120)
// ============================================================
export const PART_RENDERERS = {};

// -------- ВЫЖИВШИЙ (30) --------
PART_RENDERERS["hat_01"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 22);
  ctx.fillStyle = lin(ctx, -9, -4, 9, 4, '#78350f', '#1c0a00');
  rr(ctx, -9, -4, 18, 8, 2); ctx.fill();
  ctx.fillStyle = '#451a03'; rr(ctx, -11, 2, 22, 2, 1); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["torso_jacket"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = lin(ctx, -10, -8, 10, 16, '#7c2d12', '#431407');
  rr(ctx, -10, -8, 20, 24, 4); ctx.fill();
  line(ctx, -8, -6, 0, 10, '#1c0a00', 1);
  line(ctx, 8, -6, 0, 10, '#1c0a00', 1);
  ctx.restore();
};
PART_RENDERERS["boots_sprint"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const g = 0.5 + Math.sin(t * 0.005) * 0.3;
  ctx.fillStyle = `rgba(59,130,246,${g})`;
  ctx.fillRect(-8, 24, 6, 6); ctx.fillRect(2, 24, 6, 6);
  ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-8, 24, 6, 6); ctx.strokeRect(2, 24, 6, 6);
  ctx.restore();
};
PART_RENDERERS["helmet_tactical"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = lin(ctx, -8, -28, 8, -18, '#4b5563', '#1f2937');
  rr(ctx, -8, -28, 16, 10, 3); ctx.fill();
  ctx.fillStyle = 'rgba(34,211,238,0.6)';
  rr(ctx, -7, -24, 14, 3, 1); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["belt_ammo"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#78350f'; ctx.fillRect(-10, 10, 20, 4);
  ctx.fillStyle = '#fbbf24';
  for (let i = -8; i < 8; i += 3) ctx.fillRect(i, 9, 1.5, 6);
  ctx.restore();
};
PART_RENDERERS["radio_shoulder"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#1e3a8a'; rr(ctx, 8, -10, 5, 7, 1); ctx.fill();
  line(ctx, 10.5, -10, 10.5, -18, '#60a5fa', 1);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(10.5, -18, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["flashlight_cone"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 16); ctx.rotate(p.angle || 0);
  const grd = ctx.createLinearGradient(0, 0, 140, 0);
  grd.addColorStop(0, 'rgba(255,255,180,0.35)');
  grd.addColorStop(1, 'rgba(255,255,180,0)');
  ctx.fillStyle = grd;
  poly(ctx, [[5, -3], [140, -28], [140, 28], [5, 3]]); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["base_sandbags"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 22);
  ctx.fillStyle = '#a8a29e';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const x = Math.cos(a) * 30, y = Math.sin(a) * 12;
    rr(ctx, x - 6, y - 3, 12, 6, 2); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["toolbox_pack"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#b45309'; rr(ctx, -10, -2, 20, 12, 2); ctx.fill();
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1;
  rr(ctx, -10, -2, 20, 12, 2); ctx.stroke();
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(-1, 3, 2, 4);
  ctx.restore();
};
PART_RENDERERS["jetpack_back"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#4b5563';
  rr(ctx, -6, -8, 4, 14, 1); ctx.fill();
  rr(ctx, 2, -8, 4, 14, 1); ctx.fill();
  const f = 0.6 + Math.sin(t * 0.02) * 0.4;
  ctx.fillStyle = `rgba(251,146,60,${f})`;
  ctx.beginPath(); ctx.arc(-4, 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["weapon_mauser"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#1f2937'; ctx.fillRect(0, -2, 18, 4);
  ctx.fillStyle = '#78716c'; ctx.fillRect(18, -1, 4, 2);
  ctx.fillStyle = '#eab308'; ctx.fillRect(4, -2.5, 2, 5);
  ctx.restore();
};
PART_RENDERERS["weapon_shotgun"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#374151'; rr(ctx, -6, -3, 20, 6, 2); ctx.fill();
  ctx.fillStyle = '#6b7280'; ctx.fillRect(14, -2, 8, 4);
  ctx.fillStyle = '#7c2d12'; ctx.fillRect(-6, -1, 8, 2);
  ctx.restore();
};
PART_RENDERERS["weapon_smg"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, -2, 12, 3); ctx.fillRect(0, 1, 12, 3);
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(12, -1, 3, 2); ctx.fillRect(12, 1, 3, 2);
  ctx.restore();
};
PART_RENDERERS["weapon_sniper"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, -2, 28, 4);
  ctx.fillStyle = '#4b5563'; ctx.fillRect(6, -4, 8, 2);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(10, -3.5, 1.5, 1.5);
  ctx.restore();
};
PART_RENDERERS["weapon_launcher"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 4, p.y - 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#3f3f46'; rr(ctx, 0, -5, 20, 10, 2); ctx.fill();
  ctx.fillStyle = '#78716c'; ctx.fillRect(20, -3, 4, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(3, -3, 3, 6); ctx.fillRect(8, -3, 3, 6);
  ctx.restore();
};
PART_RENDERERS["weapon_flamethrower"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#1e40af'; rr(ctx, -8, 0, 5, 10, 2); ctx.fill();
  ctx.save(); ctx.translate(8, 2); ctx.rotate(p.angle || 0);
  ctx.fillStyle = '#374151'; ctx.fillRect(0, -2, 12, 4);
  const f = 0.6 + Math.sin(t * 0.02) * 0.4;
  ctx.fillStyle = `rgba(251,146,60,${f})`;
  poly(ctx, [[12, -3], [26, -7], [26, 7], [12, 3]]); ctx.fill();
  ctx.fillStyle = `rgba(250,204,21,${f * 0.8})`;
  poly(ctx, [[12, -1.5], [22, -3.5], [22, 3.5], [12, 1.5]]); ctx.fill();
  ctx.restore(); ctx.restore();
};
PART_RENDERERS["weapon_crossbow"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 8, p.y + 2); ctx.rotate(p.angle || 0);
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(16, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 0, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.strokeStyle = '#1c0a00';
  ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(8, 6); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["minion_hound"] = (ctx, p, t) => {
  ctx.save();
  ctx.translate(p.x - 22 + Math.sin(t * 0.005) * 4, p.y + 20);
  ctx.fillStyle = '#78350f';
  ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(9, -2.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["minion_shooter"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 24, p.y + 10);
  ctx.fillStyle = '#1e3a8a'; ctx.fillRect(-4, -8, 8, 16);
  ctx.fillStyle = '#fde4c4';
  ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(2, -4, 10, 2);
  ctx.restore();
};
PART_RENDERERS["minion_shieldman"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 26, p.y + 6);
  ctx.fillStyle = '#4b5563'; ctx.fillRect(-5, -8, 10, 18);
  ctx.fillStyle = '#fde4c4';
  ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#78716c'; rr(ctx, -12, -6, 6, 14, 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["muzzle_double"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 22, p.y + 2);
  const f = 0.5 + Math.sin(t * 0.03) * 0.5;
  ctx.fillStyle = `rgba(250,204,21,${f})`;
  ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["muzzle_explosive"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 22, p.y + 2);
  const f = 0.6 + Math.sin(t * 0.04) * 0.4;
  ctx.fillStyle = `rgba(249,115,22,${f})`;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 0.01;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["laser_sight"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 14, p.y); ctx.rotate(p.angle || 0);
  ctx.strokeStyle = `rgba(239,68,68,${0.5 + Math.sin(t * 0.01) * 0.3})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};
PART_RENDERERS["trail_blue"] = (ctx, p, t, s) => {
  if (!s || !s.isMoving) return;
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    ctx.fillStyle = `rgba(59,130,246,${0.4 / i})`;
    circle(ctx, p.x - i * 5, p.y + 8, 4 - i * 0.6);
  }
  ctx.restore();
};
PART_RENDERERS["blood_drip"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(220,38,38,0.8)';
  for (let i = 0; i < 3; i++) {
    const dy = ((t * 0.05 + i * 40) % 60);
    ctx.beginPath(); ctx.arc(-4 + i * 4, 10 + dy * 0.5, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["mark_target"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 40 + Math.sin(t * 0.005) * 3);
  ctx.fillStyle = '#facc15';
  poly(ctx, [[0, 0], [8, 12], [-8, 12]]); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
  poly(ctx, [[0, 0], [8, 12], [-8, 12]]); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["smoke_barrel"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 18, p.y - 2);
  for (let i = 0; i < 3; i++) {
    const t0 = (t * 0.002 + i * 0.3) % 1;
    ctx.fillStyle = `rgba(200,200,200,${(1 - t0) * 0.5})`;
    circle(ctx, t0 * 20, -t0 * 25, 3 + t0 * 6);
  }
  ctx.restore();
};
PART_RENDERERS["crit_flash"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 22, p.y);
  const f = 0.7 + Math.sin(t * 0.04) * 0.3;
  ctx.fillStyle = `rgba(250,204,21,${f})`;
  poly(ctx, [[0, -8], [4, -2], [10, 0], [4, 2], [0, 8], [-4, 2], [-10, 0], [-4, -2]]);
  ctx.fill();
  ctx.restore();
};
PART_RENDERERS["rocket_signal"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 10, p.y - 20 - (t * 0.03) % 60);
  ctx.fillStyle = '#dc2626';
  poly(ctx, [[0, -10], [5, 0], [3, 8], [-3, 8], [-5, 0]]); ctx.fill();
  const f = 0.5 + Math.sin(t * 0.03) * 0.5;
  ctx.fillStyle = `rgba(251,146,60,${f})`;
  poly(ctx, [[-3, 8], [3, 8], [0, 20]]); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["freeze_tint"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(96,165,250,0.18)';
  circle(ctx, 0, 0, 22);
  ctx.strokeStyle = 'rgba(191,219,254,0.5)'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.001;
    line(ctx, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 20, Math.sin(a) * 20, 'rgba(191,219,254,0.5)', 1);
  }
  ctx.restore();
};

// -------- АТАКУЮЩИЙ ЗОМБИ (30) --------
PART_RENDERERS["claws_sharp"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#f3f4f6', 2);
    line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#f3f4f6', 2);
  }
  ctx.restore();
};
PART_RENDERERS["claws_bloody"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#7f1d1d', 2);
    line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#7f1d1d', 2);
  }
  ctx.fillStyle = 'rgba(220,38,38,0.9)';
  for (let i = 0; i < 4; i++) {
    const y = ((t * 0.04 + i * 30) % 40);
    circle(ctx, -16, 6 + y * 0.5, 1.5);
  }
  ctx.restore();
};
PART_RENDERERS["claws_poison"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, '#4ade80', 2);
    line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, '#4ade80', 2);
  }
  const f = 0.5 + Math.sin(t * 0.01) * 0.5;
  ctx.fillStyle = `rgba(74,222,128,${f})`;
  circle(ctx, -16, 8, 2); circle(ctx, 16, 8, 2);
  ctx.restore();
};
PART_RENDERERS["aura_berserk"] = (ctx, p, t) => {
  if (p.hp > p.maxHp * 0.5) return;
  aura(ctx, p, t, 220, 38, 38, 45, 0.9);
};
PART_RENDERERS["blur_rush"] = (ctx, p, t, s) => {
  if (!s || !s.isMoving) return;
  ctx.save();
  for (let i = 1; i <= 4; i++) {
    ctx.fillStyle = `rgba(239,68,68,${0.3 / i})`;
    circle(ctx, p.x - i * 6, p.y, 6 - i);
  }
  ctx.restore();
};
PART_RENDERERS["jump_shockwave"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 24);
  const r = 10 + Math.sin(t * 0.005) * 10;
  ctx.strokeStyle = 'rgba(120,53,15,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["combo_flash"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 12, p.y);
  const f = (Math.sin(t * 0.04) + 1) * 0.5;
  ctx.fillStyle = `rgba(250,204,21,${f})`;
  circle(ctx, 0, -6, 3); circle(ctx, 0, 0, 4); circle(ctx, 0, 6, 3);
  ctx.restore();
};
PART_RENDERERS["wave_circular"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const r = 20 + ((t * 0.1) % 150);
  ctx.strokeStyle = `rgba(249,115,22,${1 - r / 170})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["claws_white_glow"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.6 + Math.sin(t * 0.01) * 0.4;
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
  ctx.strokeStyle = `rgba(255,255,255,${f})`; ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    line(ctx, -9, -2 + i * 2, -18, -4 + i * 3, `rgba(255,255,255,${f})`, 2.5);
    line(ctx, 9, -2 + i * 2, 18, -4 + i * 3, `rgba(255,255,255,${f})`, 2.5);
  }
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["grab_hands"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 20, p.y);
  ctx.fillStyle = '#65a30d';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-4 + i * 3, -6 - (i % 2) * 2, 2, 12);
  }
  ctx.restore();
};
PART_RENDERERS["roar_waves"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    const r = 20 + i * 20 + ((t * 0.1) % 30);
    ctx.strokeStyle = `rgba(249,115,22,${0.5 - i * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["acid_spit"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 6, p.y - 14); ctx.rotate(p.angle || 0);
  ctx.fillStyle = 'rgba(74,222,128,0.8)';
  for (let i = 0; i < 4; i++) {
    circle(ctx, 8 + i * 6 + (t * 0.05 + i * 8) % 30, (i % 2 - 0.5) * 3, 2);
  }
  ctx.restore();
};
PART_RENDERERS["drop_from_above"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 60 + Math.sin(t * 0.004) * 5);
  ctx.strokeStyle = 'rgba(220,38,38,0.6)'; ctx.lineWidth = 1;
  line(ctx, 0, 0, 0, 40, 'rgba(220,38,38,0.6)', 1);
  ctx.fillStyle = '#dc2626';
  poly(ctx, [[-6, 0], [0, -8], [6, 0]]); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["phase_ghost"] = (ctx, p, t) => {
  ctx.save(); ctx.globalAlpha = 0.4 + Math.sin(t * 0.008) * 0.2;
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
  circle(ctx, p.x, p.y, 22, null, '#a855f7', 2);
  ctx.restore();
};
PART_RENDERERS["aura_rage_red"] = (ctx, p, t) => aura(ctx, p, t, 220, 38, 38, 40, 1, 0.008);
PART_RENDERERS["rats_minions"] = (ctx, p, t) => {
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.translate(p.x - 20 + i * 40, p.y + 22 + Math.sin(t * 0.01 + i) * 3);
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
};
PART_RENDERERS["teeth_yellow"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 12);
  ctx.fillStyle = '#fde047';
  for (let i = -2; i <= 2; i++) {
    poly(ctx, [[i * 2 - 1, -3], [i * 2, 2], [i * 2 + 1, -3]]); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["rock_thrown"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x + 30, p.y - 20 - (t * 0.05) % 40);
  ctx.fillStyle = '#78716c';
  poly(ctx, [[-5, -5], [5, -5], [6, 4], [-6, 4]]); ctx.fill();
  ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["fear_waves_purple"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const r = 20 + ((t * 0.1) % 80);
  ctx.strokeStyle = `rgba(168,85,247,${0.6 - r / 130})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["dark_aura_execute"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 10, p.y);
  const f = 0.6 + Math.sin(t * 0.005) * 0.4;
  ctx.fillStyle = `rgba(10,10,10,${f})`;
  circle(ctx, 0, 0, 10);
  ctx.strokeStyle = `rgba(120,53,255,${f})`; ctx.lineWidth = 1.5;
  circle(ctx, 0, 0, 10, null, `rgba(120,53,255,${f})`, 1.5);
  ctx.restore();
};
PART_RENDERERS["sparks_regen_green"] = (ctx, p, t) => {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 0.003;
    const y = ((t * 0.05 + i * 20) % 50);
    ctx.fillStyle = `rgba(74,222,128,${1 - y / 50})`;
    circle(ctx, p.x + Math.cos(a) * 15, p.y + 20 - y, 1.5);
  }
  ctx.restore();
};
PART_RENDERERS["eyes_night_glow"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 14);
  const f = 0.6 + Math.sin(t * 0.008) * 0.4;
  ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8;
  ctx.fillStyle = `rgba(253,224,71,${f})`;
  circle(ctx, -2, 0, 2); circle(ctx, 2, 0, 2);
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["plates_gray_thick"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#71717a';
  ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    rr(ctx, -7, -4 + i * 6, 14, 5, 1); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["trails_red_speed"] = (ctx, p, t, s) => {
  if (!s || !s.isMoving) return;
  ctx.save();
  for (let i = 1; i <= 4; i++) {
    ctx.strokeStyle = `rgba(220,38,38,${0.5 / i})`;
    ctx.lineWidth = 2;
    line(ctx, p.x - i * 6, p.y + 8 - i, p.x - i * 6, p.y + 8 + i, `rgba(220,38,38,${0.5 / i})`, 2);
  }
  ctx.restore();
};
PART_RENDERERS["spikes_body"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#52525b';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    const x1 = Math.cos(a) * 12, y1 = Math.sin(a) * 12;
    const x2 = Math.cos(a) * 18, y2 = Math.sin(a) * 18;
    poly(ctx, [[x1 - 1, y1 - 1], [x2, y2], [x1 + 1, y1 + 1]]); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["slime_ground"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 24);
  const f = 0.5 + Math.sin(t * 0.005) * 0.3;
  ctx.fillStyle = `rgba(74,222,128,${f * 0.6})`;
  ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["threads_blood"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.sin(t * 0.003) * 0.2;
    line(ctx, 0, 0, Math.cos(a) * 30, Math.sin(a) * 30, 'rgba(220,38,38,0.6)', 1);
  }
  ctx.restore();
};
PART_RENDERERS["aura_revive_green"] = (ctx, p, t) => {
  if (p.alive) return;
  aura(ctx, p, t, 74, 222, 128, 30, 0.8);
};
PART_RENDERERS["bone_counter"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 12, p.y + 8);
  ctx.fillStyle = '#fafaf9';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-1 + i * 4, -1, 2, 5);
  }
  ctx.restore();
};
PART_RENDERERS["headband_red"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 20);
  ctx.fillStyle = '#dc2626';
  rr(ctx, -8, -2, 16, 3, 1); ctx.fill();
  line(ctx, 8, -1, 14, -3, '#dc2626', 2);
  ctx.restore();
};

// -------- ТАНК (30) --------
PART_RENDERERS["shield_bigger"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = lin(ctx, -30, -12, -18, 20, '#78716c', '#27272a');
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -32, -14, 14, 34, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["shield_spiked"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#52525b'; rr(ctx, -26, -8, 10, 24, 3); ctx.fill();
  ctx.fillStyle = '#a8a29e';
  for (let i = 0; i < 4; i++) {
    poly(ctx, [[-26, -6 + i * 6], [-34, -4 + i * 6], [-26, -2 + i * 6]]); ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["plates_bone"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#f5f5f4';
  ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    rr(ctx, -12 + i * 2, -8 + i * 6, 24 - i * 4, 5, 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["horns_helm"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 26);
  ctx.fillStyle = '#e5e7eb';
  poly(ctx, [[-8, 0], [-14, -12], [-6, -2]]); ctx.fill();
  poly(ctx, [[8, 0], [14, -12], [6, -2]]); ctx.fill();
  ctx.strokeStyle = '#78716c'; ctx.lineWidth = 1;
  poly(ctx, [[-8, 0], [-14, -12], [-6, -2]]); ctx.stroke();
  poly(ctx, [[8, 0], [14, -12], [6, -2]]); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["fists_massive"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#52525b';
  circle(ctx, -14, 6, 8, '#52525b', '#18181b', 2);
  circle(ctx, 14, 6, 8, '#52525b', '#18181b', 2);
  ctx.restore();
};
PART_RENDERERS["fist_glow_orange"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 14, p.y + 6);
  const f = 0.6 + Math.sin(t * 0.01) * 0.4;
  ctx.shadowColor = '#f97316'; ctx.shadowBlur = 12;
  circle(ctx, 0, 0, 6, `rgba(249,115,22,${f})`);
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["tires_shoulders"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#18181b';
  circle(ctx, -14, -8, 8, '#18181b');
  circle(ctx, 14, -8, 8, '#18181b');
  ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 1;
  circle(ctx, -14, -8, 4, null, '#3f3f46', 1);
  circle(ctx, 14, -8, 4, null, '#3f3f46', 1);
  ctx.restore();
};
PART_RENDERERS["shields_dual"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#52525b'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -28, -8, 10, 24, 3); ctx.fill(); ctx.stroke();
  rr(ctx, 18, -8, 10, 24, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["skin_stone"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(82,82,91,0.35)';
  rr(ctx, -15, -12, 30, 28, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(24,24,27,0.6)'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    line(ctx, -10 + i * 6, -8, -8 + i * 6, 10, 'rgba(24,24,27,0.6)', 1);
  }
  ctx.restore();
};
PART_RENDERERS["shield_fire"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 21, p.y);
  const f = 0.6 + Math.sin(t * 0.02) * 0.4;
  ctx.fillStyle = `rgba(251,146,60,${f})`;
  rr(ctx, -5, -12, 10, 24, 3); ctx.fill();
  ctx.fillStyle = `rgba(250,204,21,${f * 0.7})`;
  rr(ctx, -3, -8, 6, 16, 2); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["aura_ally_blue"] = (ctx, p, t) => aura(ctx, p, t, 59, 130, 246, 60, 0.5);
PART_RENDERERS["cracks_ground"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 24);
  ctx.strokeStyle = 'rgba(120,53,15,0.8)'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    line(ctx, 0, 0, Math.cos(a) * 20, Math.sin(a) * 8, 'rgba(120,53,15,0.8)', 2);
  }
  ctx.restore();
};
PART_RENDERERS["wall_summon"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 20);
  ctx.fillStyle = '#52525b';
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -25, -30, 50, 30, 3); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    line(ctx, -25 + i * 10, -30, -25 + i * 10, 0, '#27272a', 1);
  }
  ctx.restore();
};
PART_RENDERERS["fog_red_rage"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * 0.001;
    ctx.fillStyle = `rgba(220,38,38,${0.15 + Math.sin(t * 0.005 + i) * 0.05})`;
    circle(ctx, Math.cos(a) * 15, Math.sin(a) * 15, 20);
  }
  ctx.restore();
};
PART_RENDERERS["shield_boomerang"] = (ctx, p, t) => {
  ctx.save();
  const a = (t * 0.003) % (Math.PI * 2);
  ctx.translate(p.x - 26 + Math.cos(a) * 30, p.y - Math.sin(a) * 30);
  ctx.fillStyle = '#52525b';
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -5, -10, 10, 20, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["shield_slam_flash"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x - 26, p.y);
  const f = 0.6 + Math.sin(t * 0.04) * 0.4;
  ctx.fillStyle = `rgba(250,204,21,${f})`;
  circle(ctx, 0, 0, 15);
  ctx.restore();
};
PART_RENDERERS["statue_gray"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(120,113,108,0.4)';
  rr(ctx, -16, -24, 32, 50, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(24,24,27,0.5)'; ctx.lineWidth = 1;
  rr(ctx, -16, -24, 32, 50, 5); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["shield_mirror"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 21, p.y);
  ctx.fillStyle = lin(ctx, -5, -10, 5, 10, '#e0f2fe', '#0ea5e9');
  ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 2;
  rr(ctx, -5, -12, 10, 24, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  rr(ctx, -3, -10, 2, 20, 1); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["threads_violet_absorb"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.002;
    ctx.strokeStyle = 'rgba(168,85,247,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 20, Math.sin(a) * 20 + 5, Math.cos(a) * 40, Math.sin(a) * 40);
    ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["glow_red_charge"] = (ctx, p, t) => {
  const f = 0.5 + Math.sin(t * 0.01) * 0.5;
  aura(ctx, p, t, 220, 38, 38, 35 + f * 15, 0.8, 0.01);
};
PART_RENDERERS["rings_violet_legs"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 20);
  for (let i = 0; i < 3; i++) {
    const r = 10 + i * 5 + ((t * 0.02) % 10);
    ctx.strokeStyle = `rgba(168,85,247,${0.6 - i * 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["pulse_green_regen"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const r = 20 + Math.sin(t * 0.005) * 8;
  ctx.strokeStyle = `rgba(74,222,128,${0.5 + Math.sin(t * 0.005) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["eyes_lantern"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 22);
  const f = 0.7 + Math.sin(t * 0.008) * 0.3;
  ctx.shadowColor = '#fde047'; ctx.shadowBlur = 12;
  circle(ctx, -3, 0, 2.5, `rgba(253,224,71,${f})`);
  circle(ctx, 3, 0, 2.5, `rgba(253,224,71,${f})`);
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["plates_double"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#52525b';
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1;
  rr(ctx, -13, -10, 26, 8, 2); ctx.fill(); ctx.stroke();
  rr(ctx, -13, -1, 26, 8, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["shield_always"] = (ctx, p, t) => {
  // Дублирует базовый щит — подчёркиваем
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#71717a'; ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -27, -9, 11, 26, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["aura_yellow_team"] = (ctx, p, t) => aura(ctx, p, t, 250, 204, 21, 70, 0.35);
PART_RENDERERS["helm_closed"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 22);
  ctx.fillStyle = '#3f3f46'; rr(ctx, -10, -6, 20, 12, 3); ctx.fill();
  ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2;
  rr(ctx, -10, -6, 20, 12, 3); ctx.stroke();
  line(ctx, -8, 0, 8, 0, '#dc2626', 1);
  ctx.restore();
};
PART_RENDERERS["body_heavy_lean"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(63,63,70,0.5)';
  poly(ctx, [[-16, 20], [16, 20], [20, -8], [-20, -8]]); ctx.fill();
  ctx.restore();
};
PART_RENDERERS["shield_repair"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x - 21, p.y);
  const f = 0.5 + Math.sin(t * 0.006) * 0.5;
  ctx.strokeStyle = `rgba(74,222,128,${f})`;
  ctx.lineWidth = 2;
  rr(ctx, -6, -12, 12, 24, 3); ctx.stroke();
  line(ctx, -3, -8, 3, -2, `rgba(74,222,128,${f})`, 2);
  line(ctx, 3, -8, -3, -2, `rgba(74,222,128,${f})`, 2);
  ctx.restore();
};
PART_RENDERERS["body_massive"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(82,82,91,0.35)';
  rr(ctx, -19, -16, 38, 34, 7); ctx.fill();
  ctx.restore();
};

// -------- ПОМОГАЮЩИЙ (30) --------
PART_RENDERERS["crystal_green_hand"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 12, p.y + 2);
  const f = 0.6 + Math.sin(t * 0.008) * 0.4;
  ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(74,222,128,${f})`;
  poly(ctx, [[0, -8], [5, 0], [0, 8], [-5, 0]]); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1;
  poly(ctx, [[0, -8], [5, 0], [0, 8], [-5, 0]]); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["threads_green_ally"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.sin(t * 0.002) * 0.3;
    ctx.strokeStyle = 'rgba(74,222,128,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 20, Math.sin(a) * 20 + 5, Math.cos(a) * 50, Math.sin(a) * 50);
    ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["fog_green_poison"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 10);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.001;
    const x = Math.cos(a) * 25, y = Math.sin(a) * 15;
    ctx.fillStyle = `rgba(74,222,128,${0.15 + Math.sin(t * 0.005 + i) * 0.05})`;
    circle(ctx, x, y, 22);
  }
  ctx.restore();
};
PART_RENDERERS["orb_heal_flying"] = (ctx, p, t) => {
  ctx.save();
  const a = (t * 0.002) % (Math.PI * 2);
  ctx.translate(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30);
  const f = 0.6 + Math.sin(t * 0.01) * 0.4;
  ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 12;
  circle(ctx, 0, 0, 5, `rgba(74,222,128,${f})`);
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["barrier_yellow"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.4 + Math.sin(t * 0.005) * 0.2;
  ctx.strokeStyle = `rgba(250,204,21,${f + 0.3})`; ctx.lineWidth = 2;
  circle(ctx, 0, 0, 22, null, `rgba(250,204,21,${f + 0.3})`, 2);
  ctx.fillStyle = `rgba(250,204,21,${f * 0.5})`;
  circle(ctx, 0, 0, 22);
  ctx.restore();
};
PART_RENDERERS["aura_red_ally"] = (ctx, p, t) => aura(ctx, p, t, 220, 38, 38, 35, 0.4);
PART_RENDERERS["light_green_revive"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.4 + Math.sin(t * 0.006) * 0.4;
  const grd = ctx.createLinearGradient(0, -100, 0, 20);
  grd.addColorStop(0, `rgba(74,222,128,0)`);
  grd.addColorStop(1, `rgba(74,222,128,${f})`);
  ctx.fillStyle = grd;
  ctx.fillRect(-10, -100, 20, 120);
  ctx.restore();
};
PART_RENDERERS["threads_black_curse"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + t * 0.001;
    ctx.strokeStyle = 'rgba(10,10,10,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 25, Math.sin(a) * 25 + 5, Math.cos(a) * 50, Math.sin(a) * 50);
    ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["fireflies_glow"] = (ctx, p, t) => {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const a = t * 0.002 + i * 2;
    const x = p.x + Math.cos(a) * 25;
    const y = p.y - 10 + Math.sin(a * 1.3) * 20;
    const f = 0.6 + Math.sin(t * 0.005 + i) * 0.4;
    ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10;
    circle(ctx, x, y, 2, `rgba(253,224,71,${f})`);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
};
PART_RENDERERS["threads_green_symbiosis"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const a = Math.sin(t * 0.002) * 0.3;
  ctx.strokeStyle = 'rgba(74,222,128,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(30, -20 + a * 10, 60, -10);
  ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["wave_green_mass"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const r = 20 + ((t * 0.15) % 80);
  ctx.strokeStyle = `rgba(74,222,128,${0.6 - r / 130})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["portal_violet"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y - 20);
  for (let i = 0; i < 2; i++) {
    const r = 10 + i * 5;
    ctx.strokeStyle = `rgba(168,85,247,${0.6 - i * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, t * 0.002 + i, t * 0.002 + i + Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["bubbles_gold_all"] = (ctx, p, t) => {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const y = -((t * 0.02 + i * 20) % 40);
    const x = (i - 1) * 10 + Math.sin(t * 0.005 + i) * 5;
    ctx.fillStyle = `rgba(250,204,21,${0.5 - (-y / 80) * 0.5})`;
    circle(ctx, p.x + x, p.y + y, 4);
  }
  ctx.restore();
};
PART_RENDERERS["trails_blue_speed"] = (ctx, p, t, s) => {
  if (!s || !s.isMoving) return;
  ctx.save();
  for (let i = 1; i <= 3; i++) {
    ctx.fillStyle = `rgba(59,130,246,${0.4 / i})`;
    circle(ctx, p.x - i * 6, p.y + 15, 3 - i * 0.4);
  }
  ctx.restore();
};
PART_RENDERERS["flash_white_cleanse"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.5 + Math.sin(t * 0.05) * 0.5;
  ctx.fillStyle = `rgba(255,255,255,${f})`;
  circle(ctx, 0, 0, 20);
  ctx.restore();
};
PART_RENDERERS["fog_green_big"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y + 5);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 0.001;
    ctx.fillStyle = `rgba(74,222,128,${0.12 + Math.sin(t * 0.004 + i) * 0.04})`;
    circle(ctx, Math.cos(a) * 40, Math.sin(a) * 25, 35);
  }
  ctx.restore();
};
PART_RENDERERS["minion_small_rise"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 25, p.y + 15);
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(-4, 0, 8, 12);
  circle(ctx, 0, -4, 4, '#65a30d');
  ctx.restore();
};
PART_RENDERERS["portals_dual_rings"] = (ctx, p, t) => {
  ctx.save();
  for (let s = 0; s < 2; s++) {
    const x = p.x + (s === 0 ? -20 : 20);
    const y = p.y - 20;
    ctx.strokeStyle = 'rgba(168,85,247,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, t * 0.003 + s, t * 0.003 + s + Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, -t * 0.003, -t * 0.003 + Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["wall_fire"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 20, p.y);
  const f = 0.6 + Math.sin(t * 0.02) * 0.4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(251,146,60,${f})`;
    poly(ctx, [[-5, -20 + i * 10], [0, -28 + i * 10], [5, -20 + i * 10], [3, -14 + i * 10], [-3, -14 + i * 10]]);
    ctx.fill();
  }
  ctx.restore();
};
PART_RENDERERS["snowflakes_slow"] = (ctx, p, t) => {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.001;
    const x = p.x + Math.cos(a) * 25;
    const y = p.y + Math.sin(a) * 25;
    ctx.fillStyle = 'rgba(191,219,254,0.7)';
    circle(ctx, x, y, 1.5);
  }
  ctx.restore();
};
PART_RENDERERS["aura_green_passive"] = (ctx, p, t) => aura(ctx, p, t, 74, 222, 128, 32, 0.3);
PART_RENDERERS["clock_blue_shoulder"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x + 10, p.y - 8);
  ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
  circle(ctx, 0, 0, 6, 'rgba(15,23,42,0.8)', '#60a5fa', 2);
  const a = t * 0.003;
  line(ctx, 0, 0, Math.cos(a) * 4, Math.sin(a) * 4, '#60a5fa', 1.5);
  ctx.restore();
};
PART_RENDERERS["rings_expanding"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 3; i++) {
    const r = 15 + i * 8 + ((t * 0.03) % 15);
    ctx.strokeStyle = `rgba(74,222,128,${0.5 - i * 0.13})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
};
PART_RENDERERS["thread_symbiotic"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const a = Math.sin(t * 0.002) * 0.4;
  ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-20, -15 + a * 5, -40, -10);
  ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["halo_green_poison_immune"] = (ctx, p, t) => halo(ctx, p, t, 'rgba(74,222,128,0.8)', 12, -32, 2.5);
PART_RENDERERS["transparency_stealth"] = (ctx, p, t) => {
  ctx.save(); ctx.globalAlpha = 0.5;
  circle(ctx, p.x, p.y, 22, null, 'rgba(200,200,255,0.3)', 1.5);
  ctx.restore();
};
PART_RENDERERS["double_flash_echo"] = (ctx, p, t, s) => {
  if (!s || !s.isAttacking) return;
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.5 + Math.sin(t * 0.05) * 0.5;
  ctx.fillStyle = `rgba(255,255,255,${f})`;
  circle(ctx, -10, 0, 8);
  circle(ctx, 10, 0, 8);
  ctx.restore();
};
PART_RENDERERS["crystal_blue_chest"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  const f = 0.6 + Math.sin(t * 0.007) * 0.4;
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(56,189,248,${f})`;
  poly(ctx, [[0, -6], [5, 0], [0, 8], [-5, 0]]); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
};
PART_RENDERERS["mantle_violet"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(168,85,247,0.6)';
  poly(ctx, [[-12, -6], [12, -6], [15, 22], [-15, 22]]); ctx.fill();
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1;
  poly(ctx, [[-12, -6], [12, -6], [15, 22], [-15, 22]]); ctx.stroke();
  ctx.restore();
};
PART_RENDERERS["fog_red_teamrage"] = (ctx, p, t) => {
  ctx.save(); ctx.translate(p.x, p.y);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.001;
    ctx.fillStyle = `rgba(220,38,38,${0.12 + Math.sin(t * 0.005 + i) * 0.05})`;
    circle(ctx, Math.cos(a) * 30, Math.sin(a) * 20, 28);
  }
  ctx.restore();
};

// ============================================================
// 4. БАЗОВЫЕ ЭКСПОРТЫ (API)
// ============================================================
// Рисует базу выжившего (для game.js: стены/точка защиты)
export function drawBase(ctx, base, time) {
  ctx.save();
  ctx.translate(base.x, base.y);
  const pulse = 1 + Math.sin(time * 0.002) * 0.05;
  // Платформа
  ctx.fillStyle = lin(ctx, -60, -20, 60, 30, '#78350f', '#1c0a00');
  rr(ctx, -60, -20, 120, 50, 8); ctx.fill();
  ctx.strokeStyle = '#0a0a0f'; ctx.lineWidth = 3;
  rr(ctx, -60, -20, 120, 50, 8); ctx.stroke();
  // Мешки с песком
  ctx.fillStyle = '#a8a29e';
  for (let i = 0; i < 6; i++) {
    const x = -55 + i * 20;
    rr(ctx, x, -25, 18, 8, 3); ctx.fill();
  }
  // Центральный маркер
  ctx.fillStyle = `rgba(250,204,21,${0.6 + Math.sin(time * 0.005) * 0.3})`;
  circle(ctx, 0, 10, 12 * pulse);
  ctx.restore();
}

// Собирает все visual.part выбранных улучшений в порядке слоёв
export function getPartsForPlayer(player) {
  if (!player || !player.upgrades) return [];
  const parts = [];
  const list = Array.isArray(player.upgrades) ? player.upgrades : Object.values(player.upgrades);
  for (const up of list) {
    if (up && up.visual && up.visual.part) {
      parts.push({ part: up.visual.part, layer: up.visual.layer || 5 });
    }
  }
  parts.sort((a, b) => a.layer - b.layer);
  return parts;
}

// Главная функция: рисует базовое тело + все слои улучшений
export function drawPlayer(ctx, player, time, state = {}) {
  if (!player) return;
  // 1. База по роли
  switch (player.role) {
    case 'survivor':          drawSurvivorBase(ctx, player, time); break;
    case 'zombie_attacker':   drawAttackerBase(ctx, player, time); break;
    case 'zombie_tank':       drawTankBase(ctx, player, time); break;
    case 'zombie_support':    drawSupportBase(ctx, player, time); break;
    default:                  drawSurvivorBase(ctx, player, time);
  }
  // 2. Слои улучшений
  const parts = player.visualLayers || getPartsForPlayer(player);
  for (const { part } of parts) {
    const fn = PART_RENDERERS[part];
    if (fn) {
      ctx.save();
      try { fn(ctx, player, time, state); } catch (e) { /* защита от сбоев */ }
      ctx.restore();
    }
  }
}