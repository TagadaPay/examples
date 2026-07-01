import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '../lib/cart';
import { useCartUI } from '../lib/cart-ui';
import { CartDrawer } from './CartDrawer';
import { BRAND, FREE_SHIPPING_THRESHOLD_CENTS } from '../lib/config';
import { formatPrice } from '../lib/format';

/**
 * Site-wide layout: announcement bar + header (logo + nav + cart) + footer.
 * Renders the active route via `<Outlet />`.
 *
 * Hide the layout chrome on `/checkout` and `/thank-you/*` so the conversion
 * pages feel focused.
 */
export function Layout() {
  const { itemCount, subtotalCents, currency } = useCart();
  const { open: openCart } = useCartUI();
  const { pathname } = useLocation();
  const focusedPage = pathname.startsWith('/checkout') || pathname.startsWith('/thank-you');

  const isFree = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  // Tiny animation on the cart badge whenever the count changes.
  const [bump, setBump] = useState(false);
  const prevCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount !== prevCount.current) {
      prevCount.current = itemCount;
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [itemCount]);

  if (focusedPage) {
    return (
      <div className="min-h-screen bg-ink-50 text-ink-900">
        <FocusedHeader />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 text-ink-900">
      {/* Announcement bar */}
      <div className="bg-ink-900 text-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-[11px] tracking-[0.18em] uppercase sm:text-xs">
          {isFree ? (
            <>You've unlocked free shipping</>
          ) : (
            <>
              Free shipping on orders over <strong className="font-medium">{formatPrice(FREE_SHIPPING_THRESHOLD_CENTS, currency)}</strong>
              {itemCount > 0 && (
                <span className="opacity-60"> — add {formatPrice(remaining, currency)} to qualify</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-ink-50/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-white md:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <MenuIcon open={menuOpen} />
            </button>
            <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
              <NavItem to="/">Shop</NavItem>
              <NavItem to="/about">About</NavItem>
            </nav>
          </div>

          <Link
            to="/"
            className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl"
            aria-label={BRAND.name}
          >
            {BRAND.name}
          </Link>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <button
              type="button"
              onClick={openCart}
              className="group relative inline-flex h-10 items-center gap-2 rounded-full border border-transparent px-3 text-sm text-ink-700 transition-all duration-200 hover:border-ink-200 hover:bg-white active:scale-[0.97]"
              aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span
                  className={`pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1.5 text-[10px] font-medium leading-none text-ink-50 ring-2 ring-ink-50 ${
                    bump ? 'animate-cart-bump' : ''
                  }`}
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden border-t border-ink-200/80 md:hidden ${
            menuOpen ? 'max-h-40' : 'max-h-0 border-t-0'
          } transition-[max-height] duration-300 ease-out-expo`}
        >
          <nav className="flex flex-col gap-1 px-4 py-3 text-sm sm:px-6">
            <MobileNavItem to="/">Shop</MobileNavItem>
            <MobileNavItem to="/about">About</MobileNavItem>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `transition-colors hover:text-ink-900 ${isActive ? 'text-ink-900' : 'text-ink-500'}`
      }
    >
      {children}
    </NavLink>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.002-.881 2.002-2.003V5.632c0-.724-.49-1.359-1.196-1.442A49.007 49.007 0 0 0 7.5 3.78" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      )}
    </svg>
  );
}

function MobileNavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-lg px-2 py-2 transition-colors hover:bg-white ${isActive ? 'text-ink-900' : 'text-ink-600'}`
      }
    >
      {children}
    </NavLink>
  );
}

function FocusedHeader() {
  return (
    <header className="border-b border-ink-200/80 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink-900">
          {BRAND.name}
        </Link>
        <Link to="/cart" className="text-xs uppercase tracking-widest text-ink-500 hover:text-ink-900">
          Edit cart
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-200/80 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-xl font-semibold text-ink-900">{BRAND.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-500">{BRAND.tagline}</p>
        </div>

        <FooterCol title="Shop">
          <FooterLink to="/">All products</FooterLink>
          <FooterLink to="/cart">Cart</FooterLink>
        </FooterCol>

        <FooterCol title="Company">
          <FooterLink to="/about">About</FooterLink>
          <FooterLink to="#">Contact</FooterLink>
          <FooterLink to="#">Returns</FooterLink>
        </FooterCol>

        <FooterCol title="Built with">
          <a
            href="https://tagada.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            TagadaPay Headless SDK ↗
          </a>
          <a
            href="https://github.com/TagadaPay/examples"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-500 transition-colors hover:text-ink-900"
          >
            Fork on GitHub ↗
          </a>
        </FooterCol>
      </div>
      <div className="border-t border-ink-200/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {BRAND.name}. Built on TagadaPay.</span>
          <span className="font-mono">PCI-DSS Level 1 · 3DS · Multi-PSP</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-700">{title}</p>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm text-ink-500 transition-colors hover:text-ink-900">
        {children}
      </Link>
    </li>
  );
}
