import { useState } from 'react';
import { imageUrl } from '../backgrounds';

/**
 * Photo by Unsplash id, or any image URL via `src` (e.g. Wikipedia), that never shows a broken-image icon:
 * fades in when loaded, falls back to a soft gradient if it can't load.
 * size: true = 1920px, false = 1080px, 'thumb' = 240px
 */
export default function Img({ id, src: directSrc, size = false, alt = '', className = '', ...rest }) {
  const [state, setState] = useState('loading');
  if ((!id && !directSrc) || state === 'error') return <span className={`img-fallback ${className}`} aria-hidden="true" />;
  return (
    <img
      src={directSrc || imageUrl({ id }, size)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className} img-${state}`}
      onLoad={() => setState('ok')}
      onError={() => setState('error')}
      {...rest}
    />
  );
}
