import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Seo from '../components/Seo.jsx'
import Navbar from '../components/layout/Navbar.jsx'
import HeroSearchBar from '../components/search/HeroSearchBar.jsx'
import DocumentCard from '../components/ui/DocumentCard.jsx'
import Logo from '../components/ui/Logo.jsx'
import AnimatedCounter from '../components/ui/AnimatedCounter.jsx'
import FloatingDocs from '../components/ui/FloatingDocs.jsx'
import AiScanIllustration from '../components/ui/AiScanIllustration.jsx'
import { getInstitutions, getStats, searchDocuments } from '../api/documents.js'

const TRENDING = [
  'machine learning',
  'réseaux de neurones',
  'génie logiciel',
  'énergie renouvelable',
]

const FALLBACK_INSTITUTIONS = [
  'Université Cheikh Anta Diop',
  'École Polytechnique de Thiès',
  'Université Gaston Berger',
  'Université Assane Seck',
  'Université Alioune Diop',
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
}

function Sparkle({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.6 5.6L19 9.2l-5.4 1.6L12 16l-1.6-5.2L5 9.2l5.4-1.6L12 2z" />
    </svg>
  )
}

function StatItem({ value, label, isLast = false }) {
  return (
    <div
      className={clsx(
        'px-4 py-2 text-center sm:px-6',
        !isLast && 'border-r border-white/[0.08]',
      )}
    >
      <div className="font-serif text-[30px] font-semibold tabular-nums text-teal-300 sm:text-[34px]">
        <AnimatedCounter value={value} duration={1.5} />
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon, highlighted, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      className={clsx(
        'group relative flex flex-col rounded-xl border p-7 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        highlighted
          ? 'border-teal-300/40 bg-teal-50/80 dark:border-teal-500/30 dark:bg-teal-500/10'
          : 'border-gray-200/60 bg-white hover:border-teal-300/50 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-teal-500/40',
        className,
      )}
    >
      {highlighted && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-teal-500 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white shadow-teal">
          <Sparkle className="h-2.5 w-2.5" />
          +3 pts
        </span>
      )}
      <div
        className={clsx(
          'mb-4 flex h-11 w-11 items-center justify-center rounded-lg transition-colors duration-200',
          highlighted
            ? 'bg-teal-500 text-white shadow-teal'
            : 'bg-gray-50 text-teal-700 group-hover:bg-teal-50 dark:bg-navy-900 dark:text-teal-400 dark:group-hover:bg-teal-500/10',
        )}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </motion.div>
  )
}

function StepCard({ number, title, description, index }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      custom={index}
      className="relative"
    >
      <div className="mb-3 font-serif text-4xl font-semibold text-teal-500/25">{number}</div>
      <h3 className="mb-1.5 font-serif text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [institutions, setInstitutions] = useState([])

  useEffect(() => {
    getStats().then(({ data }) => data && setStats(data))
    searchDocuments({ sort: 'date', per_page: 6, status: 'published' }).then(
      ({ data }) => data?.documents && setRecent(data.documents),
    )
    getInstitutions().then(
      ({ data }) => data?.length && setInstitutions(data.map((i) => i.name)),
    )
  }, [])

  const goSearch = (q) => {
    navigate(`/search?q=${encodeURIComponent(q || '')}`)
  }

  const trustNames = institutions.length ? institutions : FALLBACK_INSTITUTIONS
  // Répété pour qu'un groupe remplisse la largeur et que la boucle reste fluide.
  const marqueeNames = Array.from({ length: 3 }, () => trustNames).flat()

  const statItems = [
    { value: stats?.total_documents, label: 'Documents' },
    { value: stats?.total_institutions, label: 'Institutions' },
    { value: stats?.total_users, label: 'Chercheurs' },
    { value: stats?.total_downloads, label: 'Téléchargements' },
  ]

  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Seo
        title="Répertoire ouvert des travaux universitaires"
        description="Thèses, mémoires et articles académiques, indexés et accessibles. Recherchez, citez et partagez la recherche universitaire."
      />
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="gradient-hero texture-noise relative overflow-hidden">
        <div className="gradient-teal-glow pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
        <FloatingDocs />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          {/* Badge IA */}
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2.5 rounded-full border border-teal-300/20 bg-teal-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-teal-300"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
            </span>
            ✦ Extraction IA
          </motion.span>

          {/* Titre */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="visible"
            className="mt-7 font-serif text-[2.625rem] font-semibold leading-[1.05] tracking-[-0.025em] text-white sm:text-[3.25rem] lg:text-[3.75rem]"
          >
            Le répertoire ouvert des travaux
            <br />
            <span className="gradient-text">scientifiques universitaires</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg"
          >
            Thèses, mémoires et articles académiques, indexés et accessibles.
            Recherchez, citez et partagez la recherche universitaire.
          </motion.p>

          {/* Recherche */}
          <motion.div
            variants={fadeUp}
            custom={3}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-10 max-w-2xl"
          >
            <HeroSearchBar onSearch={goSearch} />
          </motion.div>

          {/* Tags tendances */}
          <motion.div
            variants={fadeUp}
            custom={4}
            initial="hidden"
            animate="visible"
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
              Tendances
            </span>
            {TRENDING.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => goSearch(tag)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65 transition-all duration-200 hover:border-teal-400/30 hover:bg-teal-500/15 hover:text-white"
              >
                {tag}
              </button>
            ))}
          </motion.div>

          {/* Stats animées */}
          <motion.div
            variants={fadeUp}
            custom={5}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-10"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {statItems.map((item, i) => (
                <StatItem
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  isLast={i === statItems.length - 1}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <section className="border-b border-gray-200/60 bg-white dark:border-navy-800 dark:bg-navy-900">
        <div className="py-8">
          <p className="section-label mb-6 text-center">
            Travaux issus des établissements partenaires
          </p>
          <div className="marquee-mask group relative overflow-hidden">
            <div className="marquee-track flex w-max animate-marquee">
              {[0, 1].map((groupIndex) => (
                <ul
                  key={groupIndex}
                  className="flex shrink-0 items-center"
                  aria-hidden={groupIndex === 1 ? 'true' : undefined}
                >
                  {marqueeNames.map((name, i) => (
                    <li
                      key={`${groupIndex}-${i}`}
                      className="flex items-center whitespace-nowrap"
                    >
                      <span className="font-serif text-sm font-medium text-gray-500/90 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                        {name}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mx-8 h-1 w-1 rounded-full bg-gray-300 dark:bg-navy-700"
                      />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RÉCEMMENT AJOUTÉS ────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Récemment ajoutés
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Les derniers travaux validés par la communauté.
            </p>
          </div>
          <Link
            to="/search"
            className="shrink-0 text-sm font-medium text-teal-500 transition-colors duration-200 hover:text-teal-600"
          >
            Voir tout →
          </Link>
        </div>

        {recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((doc, i) => (
              <DocumentCard key={doc.id} document={doc} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-14 text-center dark:border-navy-700 dark:bg-navy-800">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 dark:bg-navy-900">
              <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8 text-gray-400" aria-hidden="true">
                <rect x="8" y="6" width="28" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 14h28M14 22h16M14 28h20M14 34h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-gray-100">
              Aucune publication pour le moment
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Connectez le backend pour afficher les travaux récents, ou soumettez le premier document.
            </p>
            <Link to="/submit" className="btn-primary mt-6 inline-flex">
              Soumettre un travail
            </Link>
          </div>
        )}
      </section>

      {/* ── FONCTIONNALITÉS (bento) ───────────────────────────── */}
      <section className="border-y border-gray-200/60 bg-white py-20 dark:border-navy-800 dark:bg-navy-900">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mx-auto max-w-7xl px-4 sm:px-6"
        >
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <motion.h2 variants={fadeUp} className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Une plateforme pensée pour la recherche
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-3 text-gray-500 dark:text-gray-400">
              De la découverte à la citation, chaque étape est conçue pour faire
              gagner du temps aux chercheurs.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FeatureCard
              className="md:col-span-2"
              highlighted
              title="Extraction IA des métadonnées"
              description="Déposez un PDF : l'IA extrait automatiquement le titre, les auteurs, le résumé, les mots-clés et suggère un domaine. Vous gardez le contrôle, chaque champ reste éditable."
              icon={<Sparkle className="h-5 w-5" />}
            />
            <FeatureCard
              title="Recherche à facettes"
              description="Filtrez par type, domaine, institution et année. Des URL partageables qui restaurent l'état exact des filtres."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
            <FeatureCard
              title="Export de citations"
              description="Générez des citations BibTeX, APA ou MLA en un clic, prêtes à coller dans vos travaux."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M7 4h8l4 4v12H7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M14 4v4h4M10 13h5M10 16h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
            <FeatureCard
              className="md:col-span-2"
              title="Lecture intégrée & téléchargement"
              description="Consultez les documents dans un lecteur PDF natif, naviguez page par page, zoomez et téléchargez — sans quitter la plateforme."
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </motion.div>
      </section>

      {/* ── VITRINE IA ───────────────────────────────────────── */}
      <section className="overflow-hidden bg-gray-100 py-20 dark:bg-navy-900">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.span
              variants={fadeUp}
              className="badge-ai inline-flex !text-[10px] !normal-case !tracking-wider"
            >
              <Sparkle className="h-3 w-3" />
              Propulsé par l'IA
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="mt-5 font-serif text-3xl font-semibold leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl"
            >
              Vos métadonnées extraites en quelques secondes
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 max-w-md leading-relaxed text-gray-500 dark:text-gray-400">
              Déposez un PDF et l'IA analyse le document pour en extraire le
              titre, les auteurs, le résumé, les mots-clés et le domaine. Un
              score de confiance vous indique la fiabilité — chaque champ reste
              modifiable.
            </motion.p>
            <motion.ul variants={fadeUp} custom={3} className="mt-6 space-y-3">
              {[
                'Lecture automatique du PDF',
                'Champs pré-remplis et éditables',
                'Score de confiance transparent',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-teal">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={fadeUp} custom={4}>
              <Link to="/submit" className="btn-primary mt-8 inline-flex">
                Essayer l'extraction IA
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <AiScanIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-14 text-center font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100"
        >
          Soumettre un travail en trois étapes
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8"
        >
          <StepCard
            index={0}
            number="01"
            title="Déposez votre PDF"
            description="Glissez votre thèse, mémoire ou article. L'IA pré-remplit les métadonnées pour vous."
          />
          <StepCard
            index={1}
            number="02"
            title="Vérifiez & complétez"
            description="Ajustez les champs suggérés, ajoutez auteurs, domaine et mots-clés."
          />
          <StepCard
            index={2}
            number="03"
            title="Publiez après validation"
            description="Un administrateur valide la soumission, puis votre travail devient public et citable."
          />
        </motion.div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="gradient-hero texture-noise relative overflow-hidden">
        <div className="gradient-teal-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-serif text-3xl font-semibold text-white sm:text-4xl"
          >
            Donnez de la visibilité à votre recherche
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mt-4 max-w-xl text-white/60"
          >
            Rejoignez le répertoire ouvert et partagez vos travaux avec la
            communauté scientifique universitaire.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/submit" className="btn-primary px-6 py-3">
              Soumettre un travail
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-teal-400/40 hover:bg-white/10 active:scale-[0.98]"
            >
              Explorer les archives
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-navy-800">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <div>
            <Logo variant="full" size="sm" onDark={false} link={false} className="mb-3" />
            <p className="max-w-xs text-sm leading-relaxed text-white/45">
              Répertoire institutionnel ouvert des travaux académiques
              universitaires.
            </p>
          </div>
          <div>
            <h4 className="section-label mb-4 text-white/35">Plateforme</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/search" className="transition-colors duration-200 hover:text-white">Explorer</Link></li>
              <li><Link to="/domains" className="transition-colors duration-200 hover:text-white">Domaines</Link></li>
              <li><Link to="/institutions" className="transition-colors duration-200 hover:text-white">Institutions</Link></li>
              <li><Link to="/submit" className="transition-colors duration-200 hover:text-white">Soumettre</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="section-label mb-4 text-white/35">Ressources</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to="/login" className="transition-colors duration-200 hover:text-white">Connexion</Link></li>
              <li><Link to="/register" className="transition-colors duration-200 hover:text-white">Créer un compte</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.06] py-5 text-center font-mono text-[11px] text-white/35">
          © 2026 OpenScience Hub — Hackathon J.U.I.N
        </div>
      </footer>
    </div>
  )
}
