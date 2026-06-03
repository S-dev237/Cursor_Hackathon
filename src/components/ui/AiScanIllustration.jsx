// Mise en scène animée : un document scanné par l'IA, métadonnées extraites.
// Décoratif (aria-hidden). Animations désactivées via prefers-reduced-motion.

function Sparkle({ className = '', style }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2l1.6 5.6L19 9.2l-5.4 1.6L12 16l-1.6-5.2L5 9.2l5.4-1.6L12 2z" />
    </svg>
  )
}

function MetaChip({ label, value, className = '', delay = '0ms' }) {
  return (
    <div
      className={`absolute animate-pop-in rounded-lg border border-teal-border bg-white px-3 py-2 shadow-card-hover ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-1.5">
        <span className="rounded bg-teal-light px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-teal-dark">
          IA
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-gray-muted">
          {label}
        </span>
      </div>
      <div className="mt-1 font-serif text-[13px] font-semibold text-gray-text">
        {value}
      </div>
    </div>
  )
}

export default function AiScanIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
      {/* halo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(29,158,117,0.14) 0%, transparent 60%)',
        }}
      />

      {/* étincelles flottantes */}
      <Sparkle className="absolute left-[12%] top-[14%] h-5 w-5 text-teal animate-twinkle" />
      <Sparkle
        className="absolute right-[16%] top-[10%] h-4 w-4 text-teal-mid animate-twinkle"
        style={{ animationDelay: '0.6s' }}
      />
      <Sparkle
        className="absolute right-[10%] bottom-[22%] h-6 w-6 text-teal animate-twinkle"
        style={{ animationDelay: '1.1s' }}
      />

      {/* Document central */}
      <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 animate-float-slow">
        <div className="relative overflow-hidden rounded-xl border border-gray-border bg-white p-4 shadow-card-hover">
          {/* en-tête du doc */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-navy" />
            <div className="flex-1">
              <div className="h-2 w-3/4 rounded bg-gray-text/80" />
              <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-border" />
            </div>
          </div>
          {/* lignes de texte */}
          <div className="space-y-1.5">
            {['w-full', 'w-[92%]', 'w-full', 'w-[78%]', 'w-[88%]', 'w-[64%]'].map(
              (w, i) => (
                <div key={i} className={`h-1.5 rounded bg-gray-border ${w}`} />
              ),
            )}
          </div>
          <div className="mt-3 flex gap-1.5">
            <span className="h-3 w-10 rounded bg-teal-light" />
            <span className="h-3 w-8 rounded bg-teal-light" />
          </div>

          {/* faisceau de scan */}
          <div
            className="absolute inset-x-0 top-0 h-10 animate-scan"
            style={{
              background:
                'linear-gradient(180deg, transparent, rgba(29,158,117,0.28) 70%, rgba(29,158,117,0.6))',
              boxShadow: '0 2px 8px rgba(29,158,117,0.5)',
            }}
          >
            <div className="absolute bottom-0 h-0.5 w-full bg-teal" />
          </div>
        </div>
      </div>

      {/* Chips de métadonnées extraites */}
      <MetaChip
        label="Titre"
        value="Réseaux de neurones"
        className="left-0 top-[8%] w-40"
        delay="200ms"
      />
      <MetaChip
        label="Auteurs"
        value="A. Diallo, M. Sow"
        className="right-0 top-[34%] w-36"
        delay="500ms"
      />
      <MetaChip
        label="Domaine"
        value="Informatique"
        className="left-[2%] bottom-[24%] w-32"
        delay="800ms"
      />
      <MetaChip
        label="Confiance"
        value="94 %"
        className="right-[4%] bottom-[8%] w-24"
        delay="1100ms"
      />
    </div>
  )
}
