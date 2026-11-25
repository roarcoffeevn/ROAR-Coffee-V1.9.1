import React from 'react';
import { OFFICIAL_LOGOS } from '../lib/media';

interface AdaptiveLogoProps {
  /**
   * 'horizontal' -> Desktop header, nav, banners, B2B wide cards
   * 'vertical'   -> Footer stacked column, brand intro, mobile centered logo
   * 'auto'       -> Responsive: horizontal on compact screens, vertical on md+ portrait cards
   */
  variant?: 'horizontal' | 'vertical' | 'auto';
  /**
   * 'light' -> Original dark forest-green artwork on light backgrounds
   * 'dark'  -> Dark / emerald / obsidian surfaces
   * 'auto'  -> Automatically adapts when html.dark is active
   */
  surface?: 'light' | 'dark' | 'auto';
  /**
   * Controls logo finish on dark backgrounds:
   * - 'mobile-gold' (default): Metallic Champagne Gold on mobile/tablet (< lg), crisp white on desktop dark surfaces
   * - 'gold': Metallic Champagne Gold across all viewports on dark surfaces
   * - 'white': Pure white inverted finish across all viewports on dark surfaces
   */
  darkTone?: 'gold' | 'white' | 'mobile-gold';
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'horizontal' | 'vertical', Record<'2xs' | 'xs' | 'sm' | 'md' | 'lg', string>> = {
  horizontal: {
    '2xs': 'h-4 sm:h-[18px] w-auto max-w-[92px]',
    xs: 'h-9 w-auto max-w-[175px]',
    sm: 'h-11 sm:h-12 w-auto max-w-[225px]',
    md: 'h-12 sm:h-14 w-auto max-w-[270px]',
    lg: 'h-16 sm:h-20 w-auto max-w-[340px]',
  },
  vertical: {
    '2xs': 'h-8 sm:h-10 w-auto max-w-[64px]',
    xs: 'h-[54px] sm:h-[60px] w-auto max-w-[136px]',
    sm: 'h-24 w-auto max-w-[190px]',
    md: 'h-32 w-auto max-w-[240px]',
    lg: 'h-44 w-auto max-w-[300px]',
  },
};

const METALLIC_GOLD_GRADIENT =
  'linear-gradient(135deg, #F5E6BC 0%, #D9B972 28%, #C6A667 52%, #FFF1C9 74%, #A17D38 100%)';

interface LogoAssetProps {
  src: string;
  sizeClass: string;
  visibilityClass?: string;
  surface: 'light' | 'dark' | 'auto';
  darkTone: 'gold' | 'white' | 'mobile-gold';
}

const LogoAsset: React.FC<LogoAssetProps> = ({
  src,
  sizeClass,
  visibilityClass = '',
  surface,
  darkTone,
}) => {
  const usesGoldOverlay = surface !== 'light' && darkTone !== 'white';

  const imgToneClass =
    surface === 'light'
      ? ''
      : surface === 'dark'
        ? darkTone === 'white'
          ? 'brightness-0 invert'
          : darkTone === 'gold'
            ? 'opacity-0'
            : 'opacity-0 lg:opacity-100 lg:brightness-0 lg:invert'
        : darkTone === 'white'
          ? 'dark:brightness-0 dark:invert'
          : darkTone === 'gold'
            ? 'dark:opacity-0'
            : 'dark:opacity-0 lg:dark:opacity-100 lg:dark:brightness-0 lg:dark:invert';

  const goldOverlayClass =
    surface === 'dark'
      ? darkTone === 'gold'
        ? 'block'
        : 'block lg:hidden'
      : surface === 'auto'
        ? darkTone === 'gold'
          ? 'hidden dark:block'
          : 'hidden dark:block lg:dark:hidden'
        : 'hidden';

  return (
    <span className={`relative ${visibilityClass || 'inline-flex'} items-center justify-center shrink-0`}>
      <img
        src={src}
        alt="ROAR COFFEE® — Igniting Courage. Defining Character."
        className={`object-contain select-none transition-all duration-200 ${sizeClass} ${imgToneClass}`}
        referrerPolicy="no-referrer"
      />
      {usesGoldOverlay && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-opacity duration-200 ${goldOverlayClass}`}
          style={{
            background: METALLIC_GOLD_GRADIENT,
            WebkitMaskImage: `url("${src}")`,
            maskImage: `url("${src}")`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      )}
    </span>
  );
};

export const AdaptiveLogo: React.FC<AdaptiveLogoProps> = ({
  variant = 'horizontal',
  surface = 'light',
  darkTone = 'mobile-gold',
  size = 'sm',
  className = '',
}) => {
  if (variant === 'auto') {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <LogoAsset
          src={OFFICIAL_LOGOS.horizontal}
          sizeClass={SIZE_CLASSES.horizontal[size]}
          visibilityClass="inline-flex md:hidden"
          surface={surface}
          darkTone={darkTone}
        />
        <LogoAsset
          src={OFFICIAL_LOGOS.vertical}
          sizeClass={SIZE_CLASSES.vertical[size]}
          visibilityClass="hidden md:inline-flex"
          surface={surface}
          darkTone={darkTone}
        />
      </span>
    );
  }

  const src = variant === 'vertical' ? OFFICIAL_LOGOS.vertical : OFFICIAL_LOGOS.horizontal;
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <LogoAsset
        src={src}
        sizeClass={SIZE_CLASSES[variant][size]}
        surface={surface}
        darkTone={darkTone}
      />
    </span>
  );
};
