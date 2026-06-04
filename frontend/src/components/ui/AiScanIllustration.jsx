// Mise en scène animée : un document scanné par l'IA, métadonnées extraites.
// Décoratif (aria-hidden). Animations réduites via prefers-reduced-motion.

const TEXT_LINES = ['w-full', 'w-[92%]', 'w-full', 'w-[78%]', 'w-[88%]', 'w-[64%]']

function Sparkle({ className = '', style }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M12 2l1.6 5.6L19 9.2l-5.4 1.6L12 16l-1.6-5.2L5 9.2l5.4-1.6L12 2z" />
    </svg>
  )
}

function MetaChip({ label, value, className = '', delay = '0ms', scanDelay = '0ms' }) {
  return (
    <div
      className={`absolute animate-pop-in rounded-lg border border-teal-border bg-white px-3 py-2 shadow-card-hover motion-reduce:animate-none dark:border-teal-500/30 dark:bg-navy-800 ${className}`}
      style={{ animationDelay: delay }}
    >
      <div
        className="motion-reduce:animate-none animate-chip-scan"
        style={{ animationDelay: scanDelay }}
      >
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-teal-light px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-teal-dark dark:bg-teal-500/20 dark:text-teal-300">
            IA
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-gray-muted dark:text-gray-400">
            {label}
          </span>
        </div>
        <div className="mt-1 font-serif text-[13px] font-semibold text-gray-text dark:text-gray-100">
          {value}
        </div>
      </div>
    </div>
  )
}

function ScanLine({ width, index }) {
  const lineDelay = `${0.28 + index * 0.32}s`
  return (
    <div className="relative h-1.5 overflow-hidden rounded">
      <div className={`h-full rounded bg-gray-200 dark:bg-navy-600 ${width}`} />
      <div
        className={`absolute inset-0 origin-left rounded bg-teal-400/90 motion-reduce:opacity-0 dark:bg-teal-400/80 animate-line-read ${width}`}
        style={{ animationDelay: lineDelay }}
      />
    </div>
  )
}

function ScanBeam() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      {/* Zone déjà analysée */}
      <div
        className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-teal-500/12 via-teal-500/6 to-transparent animate-scan-fill"
        style={{ height: '100%' }}
      />

      {/* Faisceau */}
      <div className="absolute inset-x-0 top-0 h-11 animate-scan will-change-transform">
        {/* Halo diffus */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/20 to-teal-500/35 blur-md animate-scan-glow" />
        {/* Traînée */}
        <div className="absolute inset-x-2 bottom-3 top-0 bg-gradient-to-b from-transparent to-teal-500/10" />
        {/* Ligne laser */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div className="h-px w-full bg-teal-200/80 dark:bg-teal-100/70" />
          <div className="h-[2px] w-full bg-teal-400 shadow-[0_0_14px_3px_rgba(45,191,142,0.55)]" />
          <div className="mt-0.5 h-1 w-1 rounded-full bg-teal-300 shadow-[0_0_8px_2px_rgba(93,202,165,0.9)]" />
        </div>
      </div>
    </div>
  )
}

export default function AiScanIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
      <div
        className="absolute inset-0 motion-safe:animate-pulse motion-reduce:animate-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(29,158,117,0.14) 0%, transparent 60%)',
          animationDuration: '4s',
        }}
      />

      <Sparkle className="absolute left-[12%] top-[14%] h-5 w-5 text-teal motion-reduce:animate-none animate-twinkle" />
      <Sparkle
        className="absolute right-[16%] top-[10%] h-4 w-4 text-teal-mid motion-reduce:animate-none animate-twinkle"
        style={{ animationDelay: '0.6s' }}
      />
      <Sparkle
        className="absolute right-[10%] bottom-[22%] h-6 w-6 text-teal motion-reduce:animate-none animate-twinkle"
        style={{ animationDelay: '1.1s' }}
      />

      {/* Document central */}
      <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none animate-float-slow">
        <div className="relative min-h-[172px] overflow-hidden rounded-xl border border-gray-border bg-white p-4 shadow-card-hover dark:border-navy-700 dark:bg-navy-800">
          <ScanBeam />

          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-navy dark:bg-navy-700">
                <span className="font-mono text-[8px] font-bold text-teal-300">PDF</span>
              </div>
              <div className="flex-1">
                <div className="h-2 w-3/4 rounded bg-gray-text/80 dark:bg-gray-400/50" />
                <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-border dark:bg-navy-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              {TEXT_LINES.map((w, i) => (
                <ScanLine key={w + i} width={w} index={i} />
              ))}
            </div>

            <div className="mt-3 flex gap-1.5">
              <span className="h-3 w-10 rounded bg-teal-light dark:bg-teal-500/20" />
              <span className="h-3 w-8 rounded bg-teal-light dark:bg-teal-500/20" />
            </div>
          </div>

          {/* Indicateur de progression (coin) */}
          <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1 rounded-md bg-navy/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-teal-300 motion-reduce:hidden dark:bg-navy-950/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
            </span>
            Scan
          </div>
        </div>
      </div>

      <MetaChip
        label="Titre"
        value="Réseaux de neurones"
        className="left-0 top-[8%] w-40"
        delay="200ms"
        scanDelay="0.5s"
      />
      <MetaChip
        label="Auteurs"
        value="A. Diallo, M. Sow"
        className="right-0 top-[34%] w-36"
        delay="500ms"
        scanDelay="0.9s"
      />
      <MetaChip
        label="Domaine"
        value="Informatique"
        className="left-[2%] bottom-[24%] w-32"
        delay="800ms"
        scanDelay="1.3s"
      />
      <MetaChip
        label="Confiance"
        value="94 %"
        className="right-[4%] bottom-[8%] w-24"
        delay="1100ms"
        scanDelay="1.75s"
      />
    </div>
  )
}
