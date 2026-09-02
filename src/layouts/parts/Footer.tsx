import { site } from 'virtual:content';

export default function Footer() {
  return (
    <footer className="mt-auto bg-background">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 border-t border-border px-5 py-7 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <span>{site.copyright}</span>
        <a href={site.footerLink.href} className="nav-link w-fit transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
          {site.footerLink.label}
        </a>
      </div>
    </footer>
  );
}
