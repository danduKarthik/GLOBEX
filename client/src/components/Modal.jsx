import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { imageUrl } from '../backgrounds';

/** Animated real-photo header (slow zoom + pan, loops gently). */
function PhotoBanner({ banner, onClose }) {
  return (
    <div className="modal-banner">
      <motion.img
        src={imageUrl(banner.photo, false)}
        alt=""
        initial={{ scale: 1.08, x: '-2%' }}
        animate={{ scale: 1.22, x: '2%' }}
        transition={{ duration: 14, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }}
      />
      <div className="modal-banner-shade" />
      <span className="banner-shine" />
      <div className="modal-banner-text">
        <motion.h3 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>{banner.title}</motion.h3>
        {banner.subtitle && (
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>{banner.subtitle}</motion.p>
        )}
      </div>
      <motion.button className="banner-close" onClick={onClose} whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }} aria-label="Close">
        <X size={18} />
      </motion.button>
    </div>
  );
}

/**
 * Light dialog. Optional `banner` = { photo, title, subtitle } shows an animated photo header.
 * Optional `footer` is pinned to the bottom (price + main action), the body scrolls.
 */
export default function Modal({ open, onClose, title, children, wide, banner, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className={`modal light ${wide ? 'modal-wide' : ''} ${banner ? 'has-banner' : ''}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            role="dialog"
            aria-modal="true"
          >
            {banner ? (
              <PhotoBanner banner={banner} onClose={onClose} />
            ) : (
              <div className="modal-head">
                <h3>{title}</h3>
                <motion.button className="icon-btn" onClick={onClose} whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }} aria-label="Close">
                  <X size={18} />
                </motion.button>
              </div>
            )}
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
