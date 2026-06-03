// SEO par page — s'appuie sur le support natif des métadonnées de React 19.
// Les balises rendues ici sont automatiquement hissées dans <head>.
// Améliore le titre d'onglet + les moteurs qui exécutent le JS (ex. Google).
// Les balises statiques de index.html couvrent les scrapers sans JS.

const SITE = 'OpenScience Hub'

export default function Seo({ title, description, type = 'website' }) {
  const fullTitle = title ? `${title} — ${SITE}` : SITE

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </>
  )
}
