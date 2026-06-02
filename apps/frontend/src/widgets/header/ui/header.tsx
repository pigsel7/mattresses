import Link from "next/link";
import { getPhoneHref } from "@/shared/lib/phone";
import { HeaderSearch } from "./header-search";

type HeaderProps = {
  address?: string;
  contactPhone?: string;
  isSignedIn?: boolean;
  showAdminLink?: boolean;
};

export function Header({
  address,
  contactPhone,
  isSignedIn,
  showAdminLink
}: HeaderProps) {
  const phoneHref = contactPhone ? getPhoneHref(contactPhone) : undefined;
  const hasContacts = Boolean(address || contactPhone);
  const accountHref = isSignedIn ? "/profile" : "/login";
  const accountLabel = isSignedIn ? "Профиль" : "Войти";

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__top">
          <div className="site-header__brand-block">
            <Link className="site-header__brand" href="/">
              <img alt="" className="site-header__logo" src="/logo.svg" />
              <span>Sleep Shop</span>
            </Link>
            {hasContacts ? (
              <div className="site-header__contacts" aria-label="Контакты магазина">
                {contactPhone ? (
                  phoneHref ? (
                    <a className="site-header__phone" href={phoneHref}>
                      {contactPhone}
                    </a>
                  ) : (
                    <span className="site-header__phone">{contactPhone}</span>
                  )
                ) : null}
                {address ? (
                  <span className="site-header__address">{address}</span>
                ) : null}
              </div>
            ) : null}
          </div>
          <Link className="site-header__account" href={accountHref}>
            {accountLabel}
          </Link>
        </div>
        <div className="site-header__main">
          <HeaderSearch />
          <div className="site-header__right">
            <nav className="site-header__nav" aria-label="Основная навигация">
              <Link className="site-header__nav-link" href="/catalog">
                <span
                  aria-hidden="true"
                  className="site-header__nav-icon site-header__nav-icon--catalog"
                />
                <span>Каталог</span>
              </Link>
              <Link className="site-header__nav-link" href="/favorites">
                <span
                  aria-hidden="true"
                  className="site-header__nav-icon site-header__nav-icon--favorites"
                />
                <span>Избранное</span>
              </Link>
              <Link className="site-header__nav-link" href="/cart">
                <span
                  aria-hidden="true"
                  className="site-header__nav-icon site-header__nav-icon--cart"
                />
                <span>Корзина</span>
              </Link>
              {showAdminLink ? (
                <Link className="site-header__nav-link" href="/admin">
                  <span
                    aria-hidden="true"
                    className="site-header__nav-icon site-header__nav-icon--admin"
                  />
                  <span>Админка</span>
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
