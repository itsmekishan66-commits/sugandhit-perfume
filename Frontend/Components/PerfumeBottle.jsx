import PropTypes from 'prop-types';

const PerfumeBottle = ({ className = '', tint = '#c9a227' }) => {
  return (
    <svg viewBox="0 0 160 220" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pbGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#f7efdd" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="pbLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity="0.55" />
          <stop offset="55%" stopColor={tint} />
          <stop offset="100%" stopColor="#7c4a1e" />
        </linearGradient>
        <linearGradient id="pbCap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b2a1e" />
          <stop offset="100%" stopColor="#1a110c" />
        </linearGradient>
      </defs>

      {/* bottle body */}
      <rect x="30" y="74" width="100" height="128" rx="22" fill="url(#pbGlass)" stroke="#fff" strokeOpacity="0.6" />
      {/* liquid */}
      <path d="M32 118 h96 v70 a22 22 0 0 1 -22 22 h-52 a22 22 0 0 1 -22 -22 z" fill="url(#pbLiquid)" />
      {/* sheen */}
      <path d="M42 92 h12 v92 h-6 c-5 0 -8 -4 -8 -9 v-74 a7 7 0 0 1 2 -9 z" fill="#ffffff" opacity="0.35" />

      {/* neck */}
      <rect x="62" y="46" width="36" height="34" rx="6" fill="url(#pbGlass)" stroke="#fff" strokeOpacity="0.6" />
      {/* collar */}
      <rect x="58" y="62" width="44" height="14" rx="4" fill="url(#pbCap)" />
      {/* cap */}
      <rect x="56" y="20" width="48" height="30" rx="10" fill="url(#pbCap)" />
      <rect x="56" y="20" width="48" height="6" rx="3" fill="#ffffff" opacity="0.18" />

      {/* atomizer */}
      <rect x="94" y="44" width="6" height="12" rx="3" fill="#3b2a1e" />

      {/* label */}
      <rect x="44" y="138" width="72" height="44" rx="8" fill="#faf6f0" opacity="0.92" />
      <text x="80" y="158" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="11" fill="#2b1d16" letterSpacing="2">
        SUGANDHIT
      </text>
      <line x1="60" y1="166" x2="100" y2="166" stroke="#c9a227" strokeWidth="1" />
      <text x="80" y="176" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="6.5" fill="#6f3b2b" letterSpacing="1.5">
        HAUTE PARFUM · MADE FOR YOU
      </text>
    </svg>
  );
};

PerfumeBottle.propTypes = {
  className: PropTypes.string,
  tint: PropTypes.string,
};

export default PerfumeBottle;