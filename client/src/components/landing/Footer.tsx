"use client";

import { useTranslate } from "@tolgee/react";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  const { t } = useTranslate();

  return (
    <footer className="bg-[#F4F6F9]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="footer" />
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-zinc-500">
              {t("footer.about_text")}
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-extrabold text-[#0E1E3A]">
                {t("footer.subscribe_title")}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {t("footer.subscribe_desc")}
              </p>

              <NewsletterForm />
            </div>
          </div>

          <FooterColumn
            title={t("footer.important_links")}
            links={[
              { label: t("footer.privacy_policy"), href: "#" },
              { label: t("footer.terms_conditions"), href: "#" },
              { label: t("footer.refund_policy"), href: "#" },
            ]}
          />
          <FooterColumn
            title={t("footer.quick_links")}
            links={[
              { label: t("nav.flight"), href: "#" },
              { label: t("footer.partner_login"), href: "#" },
              { label: t("footer.contact_us"), href: "#" },
            ]}
          />

          <div>
            <h3 className="text-lg font-extrabold text-[#0E1E3A]">{t("footer.contact_info")}</h3>
            <ul className="mt-6 flex flex-col gap-5 text-[15px] text-zinc-600">
              <li className="flex items-start gap-3">
                <IconBubble>
                  <HeadsetIcon />
                </IconBubble>
                <div>
                  <p className="text-zinc-500">{t("footer.customer_support")}</p>
                  <p className="font-medium text-[#0E1E3A]">
                    +91 870 045 8818, +91 922 032 8072
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <IconBubble>
                  <MailIcon />
                </IconBubble>
                <div>
                  <p className="text-zinc-500">{t("footer.drop_email")}</p>
                  <p className="font-medium text-[#0E1E3A]">
                    spakstrip@gmail.com
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <IconBubble>
                  <PhoneIcon />
                </IconBubble>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-zinc-200 pt-6 md:flex-row md:items-center">
          <p className="text-sm text-zinc-500">
            {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-3">
            <SocialIcon label="Facebook"><FacebookIcon /></SocialIcon>
            <SocialIcon label="Instagram"><InstagramIcon /></SocialIcon>
            <SocialIcon label="YouTube"><YouTubeIcon /></SocialIcon>
            <SocialIcon label="Pinterest"><PinterestIcon /></SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-lg font-extrabold text-[#0E1E3A]">{title}</h3>
      <ul className="mt-6 flex flex-col gap-4 text-[15px] text-zinc-600">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="hover:text-[#E0382E] transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconBubble({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200">
      {children}
    </span>
  );
}

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:text-[#E0382E]"
    >
      {children}
    </a>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h2v-8H5v-0a7 7 0 0 1 14 0v0h-3v8h2a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.5l8 5 8-5V8H4Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 1.7z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M13 22v-8h3l.5-4H13V7.5C13 6.5 13.3 6 14.7 6H16.5V2.2C16.2 2.2 15.1 2 13.9 2 11.3 2 9.5 3.6 9.5 6.7V10H7v4h2.5v8H13Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x={3} y={3} width={18} height={18} rx={5} />
      <circle cx={12} cy={12} r={4} />
      <circle cx={17.5} cy={6.5} r={1} fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M22 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7.2.1c-.4.1-1.2.1-2 .9C2.2 6.6 2 8 2 8s-.2 1.6-.2 3.2V13c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.9.8 2.4.9 1.7.2 7.2.2 7.2.2s4.2 0 7.2-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2V11.2C22.2 9.6 22 8 22 8ZM10 15V9l5 3-5 3Z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2.1 0-3l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-4.9 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.3.1-1.3-.6-2.1-2.5-2.1-4 0-3.2 2.4-6.2 6.8-6.2 3.6 0 6.3 2.6 6.3 5.9 0 3.5-2.2 6.3-5.3 6.3-1 0-2-.6-2.4-1.2l-.6 2.5c-.2.9-.9 2-1.3 2.7.9.3 2 .5 3 .5a10 10 0 0 0 0-20Z" />
    </svg>
  );
}
