import { motion } from 'framer-motion';

/** Stylised side-view car drawn in SVG, tinted per car. Wheels spin on hover. */
export default function CarIllustration({ color = '#22d3ee', type = 'Sedan', hovered }) {
  const gid = `body-${color.replace('#', '')}`;
  const tall = ['SUV', 'MUV', 'Luxury'].includes(type);
  const body = tall
    ? 'M20 92 L28 64 Q34 50 52 48 L92 46 Q110 28 140 26 L206 26 Q228 28 242 46 L268 50 Q288 54 292 72 L294 92 Z'
    : type === 'Hatchback'
      ? 'M22 94 L30 72 Q36 60 54 58 L96 54 Q118 34 150 34 L196 36 Q222 40 236 58 L266 66 Q282 72 284 94 Z'
      : 'M18 94 L26 74 Q32 64 50 62 L98 58 Q124 36 156 36 L196 38 Q224 42 240 60 L276 66 Q292 72 294 94 Z';
  const wheelY = 94;

  return (
    <svg viewBox="0 0 312 128" className="car-svg" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.85" />
          <stop offset="1" stopColor="#1e293b" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <motion.ellipse cx="156" cy="116" rx="130" ry="7" fill="#000" opacity="0.35" style={{ originX: "50%" }} animate={{ scaleX: hovered ? 1.08 : 1 }} />
      <motion.g animate={{ y: hovered ? [-1, 1, -1] : 0 }} transition={{ duration: 0.4, repeat: hovered ? Infinity : 0 }}>
        <path d={body} fill={`url(#${gid})`} stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        <path d={tall ? 'M100 48 Q114 32 140 31 L170 31 L170 48 Z' : 'M106 58 Q126 40 154 40 L170 40 L170 58 Z'} fill="url(#glass)" />
        <path d={tall ? 'M178 31 L204 31 Q224 33 236 48 L178 48 Z' : 'M178 40 L194 40 Q216 43 230 58 L178 58 Z'} fill="url(#glass)" />
        <rect x={tall ? 270 : 272} y={tall ? 60 : 72} width="16" height="6" rx="3" fill="#fef9c3" />
        <rect x="22" y={tall ? 66 : 78} width="10" height="6" rx="3" fill="#f87171" />
        <line x1="174" y1={tall ? 52 : 62} x2="174" y2="88" stroke="rgba(0,0,0,0.25)" />
      </motion.g>
      {[78, 236].map((cx) => (
        <motion.g key={cx} animate={{ rotate: hovered ? 360 : 0 }} transition={{ duration: 0.6, repeat: hovered ? Infinity : 0, ease: 'linear' }}>
          <circle cx={cx} cy={wheelY} r="17" fill="#0f172a" stroke="#334155" strokeWidth="3" />
          <circle cx={cx} cy={wheelY} r="8" fill="#94a3b8" />
          <line x1={cx - 8} y1={wheelY} x2={cx + 8} y2={wheelY} stroke="#0f172a" strokeWidth="2" />
          <line x1={cx} y1={wheelY - 8} x2={cx} y2={wheelY + 8} stroke="#0f172a" strokeWidth="2" />
        </motion.g>
      ))}
    </svg>
  );
}
