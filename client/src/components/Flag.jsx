import { useState } from 'react';

/** Country flag as an image (flag emojis don't display on Windows). Falls back to the emoji. */
export default function Flag({ code, emoji, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!code || failed) return <span className={`flag-emoji ${className}`}>{emoji}</span>;
  return (
    <img
      className={`flag-img ${className}`}
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w160/${code.toLowerCase()}.png 2x`}
      width={size}
      height={Math.round(size * 0.66)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
