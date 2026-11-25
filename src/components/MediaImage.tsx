import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { resolveMediaUrl } from '../lib/media';
import { AdaptiveLogo } from './AdaptiveLogo';

export type MediaBrandMark = 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface MediaImageProps {
  imageKey?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
  brandMark?: MediaBrandMark;
}

const BRAND_MARK_POSITION_CLASSES: Record<Exclude<MediaBrandMark, 'none'>, string> = {
  'top-left': 'top-2.5 left-2.5',
  'top-right': 'top-2.5 right-2.5',
  'bottom-left': 'bottom-2.5 left-2.5',
  'bottom-right': 'bottom-2.5 right-2.5',
};

export const MediaImage: React.FC<MediaImageProps> = ({
  imageKey,
  alt,
  className = 'w-full h-full object-cover',
  aspectClass = '',
  brandMark = 'none',
}) => {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(imageKey);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#003D25] to-[#00552B] text-[#F8F5EF] p-6 text-center ${aspectClass}`}
      >
        <Coffee className="w-8 h-8 mb-2 text-[#C6A667]" />
        <span className="text-xs font-medium tracking-wide opacity-90">{alt}</span>
      </div>
    );
  }

  const imgEl = (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );

  if (brandMark === 'none') {
    return imgEl;
  }

  return (
    <span className="relative block w-full h-full overflow-hidden">
      {imgEl}
      <span
        aria-hidden="true"
        className={`pointer-events-none select-none absolute ${BRAND_MARK_POSITION_CLASSES[brandMark]} z-10 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-[#0E1512]/90 backdrop-blur-sm border border-[#C6A667]/45 shadow-sm inline-flex items-center`}
      >
        <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" />
      </span>
    </span>
  );
};
