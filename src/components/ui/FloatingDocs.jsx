// Glyphes de documents flottants — décor ambiant du hero (purement décoratif)
function PaperGlyph({ className = '', accent = false, style }) {
  return (
    <svg viewBox="0 0 64 80" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M8 4h36l12 12v60H8z"
        fill={accent ? 'rgba(29,158,117,0.10)' : 'rgba(255,255,255,0.04)'}
        stroke={accent ? 'rgba(93,202,165,0.5)' : 'rgba(255,255,255,0.18)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M44 4v12h12"
        stroke={accent ? 'rgba(93,202,165,0.5)' : 'rgba(255,255,255,0.18)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 30h32M16 40h32M16 50h22M16 60h28"
        stroke={accent ? 'rgba(93,202,165,0.45)' : 'rgba(255,255,255,0.15)'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Ring({ className = '' }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <circle
        cx="40"
        cy="40"
        r="38"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="1"
        strokeDasharray="4 8"
      />
    </svg>
  )
}

export default function FloatingDocs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <PaperGlyph className="absolute left-[6%] top-[18%] h-20 w-16 animate-float opacity-80" />
      <PaperGlyph
        accent
        className="absolute left-[14%] top-[55%] h-24 w-20 animate-float-slow opacity-90"
      />
      <PaperGlyph
        className="absolute right-[9%] top-[22%] h-24 w-20 animate-drift opacity-80"
      />
      <PaperGlyph
        accent
        className="absolute right-[16%] top-[60%] h-16 w-12 animate-float opacity-80"
        style={{ animationDelay: '1.5s' }}
      />
      <Ring className="absolute -left-10 top-[30%] h-40 w-40 animate-spin-slow opacity-70" />
      <Ring className="absolute right-[4%] top-[8%] h-24 w-24 animate-spin-slow opacity-60" />
    </div>
  )
}
