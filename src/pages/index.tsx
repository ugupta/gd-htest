import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, useReducedMotion } from 'motion/react';
import { home } from 'virtual:content';

const siteUrl = 'https://8rqwes8j93.preview.c35.airoapp.ai';
const pageUrl = `${siteUrl}/`;
const title = 'Hello World — A small beginning';
const description = 'A small beginning, clearly made.';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Hello World', url: pageUrl },
    { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Hello World', url: pageUrl },
    { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, name: title, url: pageUrl, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#organization` }, datePublished: '2026-09-02', dateModified: '2026-09-02' },
  ],
};

export default function HomePage() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${siteUrl}/airo-assets/images/logo/horizontal`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/images/logo/horizontal`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main id="beginning" className="relative overflow-hidden bg-background">
        <div aria-hidden="true" className="absolute bottom-0 right-0 hidden h-2/5 w-1/3 bg-secondary lg:block" />
        <section className="relative mx-auto flex min-h-[calc(100vh-190px)] max-w-[1600px] flex-col justify-between px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-16 lg:px-12 lg:pb-20 lg:pt-20">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="h-px w-9 bg-border" />
            <span>{home.hero.label}</span>
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative -ml-[0.09em] py-16 sm:py-20 lg:py-24"
          >
            <h1 className="max-w-[12ch] font-heading text-[clamp(4.75rem,14.5vw,14.75rem)] leading-[0.81] tracking-[-0.065em] text-foreground">
              {home.hero.title}
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 items-end gap-10 border-t border-border pt-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-[20rem] text-sm leading-6 text-muted-foreground">{home.hero.support}</p>
            <div className="flex items-center gap-8 text-[11px] text-muted-foreground md:justify-self-end">
              <time dateTime="2026-09-02">{home.hero.footerNote}</time>
              <a href={home.hero.linkHref} className="nav-link text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">{home.hero.linkLabel}</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
