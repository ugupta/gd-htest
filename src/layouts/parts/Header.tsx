import { Link } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { site } from 'virtual:content';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
          <img
            src="/airo-assets/images/logo/horizontal"
            alt={site.brandName}
            width={1536}
            height={1024}
            className="block h-auto max-h-9 w-auto max-w-full self-center object-contain md:max-h-10"
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {site.navigation.map((item) => (
            <a key={item.href} href={item.href} className="nav-link text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-sm p-1 text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <nav aria-label="Mobile navigation" className="border-t border-border px-5 py-4 sm:px-8 md:hidden">
          {site.navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="nav-link block py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
