"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslate } from "@tolgee/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Logo from "./Logo";
import { cn } from "@/lib/cn";
import RoleGate from "@/components/auth/RoleGate";
import { useAuthStore } from "@/state/authStore";
import { useLocaleStore, useCountryLocale } from "@/state/localeStore";
import { getCountryFlagUrl } from "@/lib/countryFlags";

type NavItem = {
  labelKey: string;
  href: string;
  menu?: { labelKey: string; href: string }[];
};

// Hydration-safe aria-label normalization:
// Some i18n labels can include zero-width characters that differ between SSR and client.
// Strip them so `aria-label` props are identical across hydration.
function normalizeAriaText(input: string) {
  return input.replace(/[​-‍﻿]/g, "");
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.flight", href: "/flight" },
  { labelKey: "Premium Hotel", href: "/hotel" },
  { labelKey: "Hotel", href: "/hotel" },
  { labelKey: "nav.taxi_package", href: "/taxi-package" },
  {
    labelKey: "nav.holiday_packages",
    href: "#",
    menu: [
      { labelKey: "nav.national_tour_packages", href: "/national-tour-packages" },
      { labelKey: "nav.international_tour_packages", href: "/international-tour-packages" },
    ],
  },
  {
    labelKey: "nav.accommodation",
    href: "#",
    menu: [
      { labelKey: "nav.homestay", href: "#" },
      { labelKey: "nav.airbnb", href: "#" },
      { labelKey: "nav.villa", href: "#" },
      { labelKey: "nav.guest_house", href: "#" },
      { labelKey: "nav.house_board", href: "#" },
      { labelKey: "nav.hostels", href: "#" },
      { labelKey: "nav.resorts", href: "#" },
    ],
  },
  {
    labelKey: "nav.transport",
    href: "#",
    menu: [
      { labelKey: "nav.taxi_package", href: "/taxi-package" },
      { labelKey: "nav.cabs", href: "/cabs" },
      { labelKey: "nav.tour_bus", href: "/tour-bus" },
      { labelKey: "nav.train", href: "/train/search" },
    ],
  },
  {
    labelKey: "nav.cruise",
    href: "#",
    menu: [
      { labelKey: "nav.cruise_for_andaman", href: "/cruise/andaman" },
      { labelKey: "nav.general_cruise", href: "/cruise" },
    ],
  },
  {
    labelKey: "nav.train",
    href: "/train/search",
    menu: [
      { labelKey: "nav.search", href: "/train/search" },
      { labelKey: "nav.tickets", href: "/train/tickets" },
      { labelKey: "nav.change_request", href: "/train/change-request" },
      { labelKey: "nav.file_tdr_online", href: "/train/file-tdr-online" },
    ],
  },
  {
    labelKey: "Rail Europe",
    href: "#",
    menu: [
      { labelKey: "Search Trains", href: "/rail-europe" },
      { labelKey: "Bookings", href: "/rail-europe/bookings" },
    ],
  },
  {
    labelKey: "SightSeeing",
    href: "#",
    menu: [
      { labelKey: "Search Activities", href: "/sightseeing" },
      { labelKey: "My Bookings", href: "/sightseeing/bookings" },
    ],
  },
  {
    labelKey: "Transfer",
    href: "#",
    menu: [
      { labelKey: "Airport Transfer", href: "/transfer" },
      { labelKey: "Bookings", href: "/transfer/bookings" },
    ],
  },
  {
    labelKey: "Self-Drive",
    href: "#",
    menu: [
      { labelKey: "Search Cars", href: "/self-drive" },
      { labelKey: "Bookings", href: "/self-drive/bookings" },
    ],
  },
  { labelKey: "Queues", href: "/queues" },
  { labelKey: "Accounts", href: "/accounts" },
  { labelKey: "Reports", href: "/reports" },
  { labelKey: "Admin", href: "/admin" },
  { labelKey: "GST", href: "/gst" },
  { labelKey: "Islandhopper", href: "/islandhopper" },
  {
    labelKey: "nav.visa_consultancy",
    href: "#",
    menu: [
      { labelKey: "nav.pr_visa", href: "/visa/pr-visa" },
      { labelKey: "nav.work_visa", href: "/visa/work-visa" },
      { labelKey: "nav.investor_visa", href: "/visa/investor-visa" },
      { labelKey: "nav.study_visa", href: "/visa/study-visa" },
      { labelKey: "nav.visit_visa", href: "/visa/visit-visa" },
      { labelKey: "nav.tourist_visa", href: "#" },
    ],
  },
  { labelKey: "Life insurance", href: "/insurance" },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
  "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia", "Cameroon",
  "Canada", "Chile", "China", "Colombia", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia",
  "Germany", "Ghana", "Greece", "Guatemala", "Hungary", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Maldives",
  "Malta", "Mexico", "Moldova", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands",
  "New Zealand", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Palestine",
  "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia",
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const LANGUAGE_OPTIONS: { name: string; key: string }[] = [
  { name: "English", key: "language.english" },
  { name: "Hindi", key: "language.hindi" },
  { name: "Spanish", key: "language.spanish" },
  { name: "French", key: "language.french" },
  { name: "Chinese", key: "language.chinese" },
  { name: "Arabic", key: "language.arabic" },
  { name: "Bengali", key: "language.bengali" },
  { name: "Portuguese", key: "language.portuguese" },
  { name: "Russian", key: "language.russian" },
  { name: "Urdu", key: "language.urdu" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", symbol: "₹" },
  { value: "USD", symbol: "$" },
] as const;

type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["value"];

type OpenDropdown = "country" | "currency" | "language" | "user" | null;

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.3, ease: "easeIn" } },
};

const megaItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.025, duration: 0.2, ease: "easeOut" },
  }),
};

function renderTopLevelNavLabel(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 2) {
    return (
      <span className="flex flex-col items-center leading-[1.05]">
        <span>{words[0]}</span>
        <span>{words[1]}</span>
      </span>
    );
  }
  return <span className="whitespace-nowrap">{label}</span>;
}

function NavIcon({ labelKey, className }: { labelKey: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (labelKey) {
    case "nav.flight":
      return (
        <svg {...common}>
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      );
    case "Premium Hotel":
      return (
        <svg {...common}>
          <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
          <path d="M4 21h16" />
          <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
        </svg>
      );

      case "Hotel":
      return (
        <svg {...common}>
          <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
          <path d="M4 21h16" />
          <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
        </svg>
      );
    case "nav.train":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="14" rx="2" />
          <path d="M5 10h14" />
          <circle cx="9" cy="13.5" r="1" />
          <circle cx="15" cy="13.5" r="1" />
          <path d="M7 21l2-3M17 21l-2-3" />
        </svg>
      );
    case "nav.holiday_packages":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case "nav.accommodation":
      return (
        <svg {...common}>
          <path d="M3 18v-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5" />
          <path d="M3 18h18" />
          <path d="M7 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "nav.transport":
      return (
        <svg {...common}>
          <path d="M4 16h16" />
          <path d="M6 16V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
          <path d="M8 7l1.2-2h5.6L16 7" />
          <circle cx="8.5" cy="17.5" r="1.5" />
          <circle cx="15.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "nav.taxi_package":
      return (
        <svg {...common}>
          <path d="M5 17h14" />
          <path d="M5 17l1.5-6a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 17" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "nav.cruise":
      return (
        <svg {...common}>
          <path d="M3 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
          <path d="M5 14l1-4h12l1 4" />
          <path d="M12 4v6" />
        </svg>
      );
    case "nav.bus":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="13" rx="2" />
          <path d="M5 11h14" />
          <circle cx="8.5" cy="14.5" r="1" />
          <circle cx="15.5" cy="14.5" r="1" />
          <path d="M7 20v-3M17 20v-3" />
        </svg>
      );
    case "nav.events":
      return (
        <svg {...common}>
          <path d="M3 9l9-5 9 5v6a2 2 0 0 1-2 2h-2l-2 3-2-3H8l-2 3-2-3H3z" />
        </svg>
      );
    case "nav.visa_consultancy":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M9 16h6" />
        </svg>
      );
    case "Life insurance":
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "Islandhopper":
      return (
        <svg {...common}>
          <path d="M4 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
          <path d="M9 18v-6" />
          <path d="M9 12c2-1.2 3-2.8 3.5-5" />
          <path d="M9 12c-1.8-1.1-3-2.5-3.5-4.5" />
          <path d="M9 10.5c2.1-.8 4.3-.8 6.4 0" />
        </svg>
      );
    case "Rail Europe":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="14" rx="2" />
          <path d="M5 10h14" />
          <circle cx="9" cy="13.5" r="1" />
          <circle cx="15" cy="13.5" r="1" />
          <path d="M7 21l2-3M17 21l-2-3" />
          <path d="M9 6h6" />
        </svg>
      );
    case "SightSeeing":
      return (
        <svg {...common}>
          <circle cx="8" cy="12" r="3.5" />
          <circle cx="16" cy="12" r="3.5" />
          <path d="M11.5 12h1" />
          <path d="M5.5 9.5 4 7m14.5 2.5L20 7" />
          <path d="M8 15.5v2M16 15.5v2" />
        </svg>
      );
    case "Transfer":
      return (
        <svg {...common}>
          <path d="M4 16h16" />
          <path d="M6 16V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
          <path d="M9 10h6" />
          <circle cx="8.5" cy="17.5" r="1.5" />
          <circle cx="15.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "Self-Drive":
      return (
        <svg {...common}>
          <path d="M5 16h14" />
          <path d="M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16" />
          <path d="M9 9.5V7.8M15 9.5V7.8" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "Services":
      return (
        <svg {...common}>
          <path d="M10.5 4.5 9.7 6.8a1 1 0 0 1-.6.6l-2.3.8 2.3.8a1 1 0 0 1 .6.6l.8 2.3.8-2.3a1 1 0 0 1 .6-.6l2.3-.8-2.3-.8a1 1 0 0 1-.6-.6l-.8-2.3Z" />
          <path d="M16.5 11.5 15.9 13a1 1 0 0 1-.6.6l-1.5.6 1.5.6a1 1 0 0 1 .6.6l.6 1.5.6-1.5a1 1 0 0 1 .6-.6l1.5-.6-1.5-.6a1 1 0 0 1-.6-.6l-.6-1.5Z" />
          <path d="M5 19h6" />
          <path d="M13 19h6" />
        </svg>
      );
    case "Queues":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "Accounts":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case "Reports":
      return (
        <svg {...common}>
          <path d="M7 3h7l3 3v15H7z" />
          <path d="M14 3v4h4" />
          <path d="M10 17v-4M14 17V9" />
        </svg>
      );
    case "Admin":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.2-2.8 7-7 10-4.2-3-7-5.8-7-10V6z" />
          <path d="M12 9v6M9 12h6" />
        </svg>
      );
    case "GST":
      return (
        <svg {...common}>
          <path d="M7 3h8l3 3v15H7z" />
          <path d="M15 3v4h4" />
          <path d="M10 10h5M10 14h4M10 18h6" />
        </svg>
      );
    case "nav.offers":
      return (
        <svg {...common}>
          <path d="M20 12l-8 8-9-9V3h8z" />
          <circle cx="8" cy="8" r="1.3" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Header() {
  const { t } = useTranslate();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [hoveredDesktopMenu, setHoveredDesktopMenu] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const utilityBarRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const country = useLocaleStore((state) => state.country);
  const setCountry = useLocaleStore((state) => state.setCountry);
  const language = useLocaleStore((state) => state.language);
  const setLanguage = useLocaleStore((state) => state.setLanguage);
  const { currency } = useCountryLocale();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    currency === "USD" ? "USD" : "INR",
  );

  const languageOptionLabels = useMemo(
    () => LANGUAGE_OPTIONS.map((opt) => ({ value: opt.name, label: t(opt.key) })),
    [t],
  );

  const toggleMobileSection = (label: string) => {
    setMobileExpanded((current) => (current === label ? null : label));
  };

  const toggleDropdown = useCallback(
    (name: OpenDropdown) => setOpenDropdown((prev) => (prev === name ? null : name)),
    [],
  );

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (utilityBarRef.current && !utilityBarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openDropdown]);

  const profileHref = user?.role === "partner" ? "/partner/dashboard" : "/my-trips";

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={headerVariants}
      className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      <RoleGate />

      <div className="px-3 pt-3 sm:px-6">
        <div
          ref={utilityBarRef}
          className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-gradient-to-r from-brand-900 via-[#0b1f4d] to-brand-900 px-5 py-2.5 text-[13px] text-white shadow-[0_6px_20px_-8px_rgba(11,31,77,0.45)] sm:px-7"
        >
          <Logo variant="header" />

          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex items-center gap-4 border-r border-white/15 pr-4">
              <SelectDropdown
                label={t("header.country")}
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                value={country}
                onChange={setCountry}
                isOpen={openDropdown === "country"}
                onToggle={() => toggleDropdown("country")}
                showFlags
              />
              <span className="text-white/20 select-none">|</span>
              <CurrencyDropdown
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                isOpen={openDropdown === "currency"}
                onToggle={() => toggleDropdown("currency")}
                ariaLabel={t("header.currency")}
              />
              <span className="text-white/20 select-none">|</span>
              <SelectDropdown
                label={t("header.language")}
                options={languageOptionLabels}
                value={language}
                onChange={setLanguage}
                isOpen={openDropdown === "language"}
                onToggle={() => toggleDropdown("language")}
                showLanguageIcon
              />
            </div>

            {user ? (
              <div className="relative flex items-center gap-2">
                <Link
                  href="/my-trips"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/85 transition-colors hover:text-white"
                >
                  {t("header.my_trips")}
                </Link>
                <span className="text-white/40">·</span>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleDropdown("user")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  <span>{user.displayName}</span>
                  <svg
                    viewBox="0 0 24 24"
                    width={12}
                    height={12}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className={cn("transition-transform duration-200", openDropdown === "user" && "rotate-180")}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {openDropdown === "user" ? (
                    <motion.div
                      key="user-dropdown"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={dropdownVariants}
                      className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[14rem] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-2 text-ink shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25)] backdrop-blur-xl ring-1 ring-black/5"
                    >
                      <div className="border-b border-slate-100 px-3 py-2.5">
                        <p className="text-[13px] font-semibold text-ink">{user.displayName}</p>
                        <p className="text-[12px] text-ink-muted">{user.email}</p>
                      </div>
                      <div className="pt-2">
                        <Link
                          href={profileHref}
                          className="block rounded-xl px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-blue-50 hover:text-brand-700"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {t("header.profile")}
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            setOpenDropdown(null);
                            await logout();
                            router.replace("/");
                          }}
                          className="block w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-ink transition-colors hover:bg-blue-50 hover:text-brand-700"
                        >
                          {t("header.sign_out")}
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <LoginPill label="Login / Register" href="/auth" />
            )}

            <motion.a
              href="tel:+919220328072"
              aria-label="Call +91 922 032 8072"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="group/phone inline-flex items-center text-white/85 transition-colors duration-200 hover:text-white ml-2"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition-all duration-200 group-hover/phone:scale-110 group-hover/phone:bg-white/15">
                <svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
                </svg>
              </span>
              <span className="sr-only">+91 922 032 8072</span>
            </motion.a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto st-header-main-nav-inner max-w-7xl px-4 py-3 sm:px-6">
          <nav className="hidden lg:block flex-1 -ml-4 justify-center">
            <ul className="flex items-end gap-4 text-ink">
              {NAV_ITEMS.map((item) => (
                <motion.li
                  key={item.labelKey}
                  className={cn(
                    "group/nav relative inline-flex",
                    item.menu && "z-0 hover:z-20",
                  )}
                  initial="rest"
                  animate={item.menu && hoveredDesktopMenu === item.labelKey ? "hover" : "rest"}
                  whileTap={{ scale: 0.97 }}
                  variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  onMouseLeave={() => {
                    if (item.menu) {
                      setHoveredDesktopMenu((current) =>
                        current === item.labelKey ? null : current,
                      );
                    }
                  }}
                  onBlur={(event) => {
                    if (item.menu && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setHoveredDesktopMenu((current) =>
                        current === item.labelKey ? null : current,
                      );
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    onMouseEnter={() => {
                      if (item.menu) {
                        setHoveredDesktopMenu(item.labelKey);
                      }
                    }}
                    onFocus={() => {
                      if (item.menu) {
                        setHoveredDesktopMenu(item.labelKey);
                      }
                    }}
                    className="relative inline-flex flex-col items-center gap-0 rounded-2xl p-0 text-center transition-colors duration-200 hover:bg-blue-50/70 group-hover/nav:text-brand-700"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-xl text-brand-600 transition-transform duration-200 group-hover/nav:scale-110">
                      <NavIcon labelKey={item.labelKey} className="h-[15px] w-[15px]" />
                    </span>
                    <span className="inline-flex items-center gap-0 text-[10px] font-semibold leading-tight tracking-tight text-ink/85 transition-colors group-hover/nav:text-brand-700">
                      {renderTopLevelNavLabel(t(item.labelKey))}
                      {item.menu ? (
                        <svg
                          viewBox="0 0 24 24"
                          width={10}
                          height={10}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                          className="transition-transform duration-200 group-hover/nav:rotate-180"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : null}
                    </span>
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1.5 -bottom-[1px] h-[2px] origin-center rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                      variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                      transition={{ duration: 0.28, ease: [0.35, 1, 0.36, 1] }}
                    />
                  </Link>
                  {item.menu ? <MegaMenu parentKey={item.labelKey} items={item.menu} t={t} /> : null}
                </motion.li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            aria-label={t("header.toggle_menu")}
            onClick={() => {
              setMobileOpen((value) => {
                const next = !value;
                if (!next) setMobileExpanded(null);
                return next;
              });
            }}
            className="lg:hidden grid h-10 w-10 place-items-center rounded-xl text-ink transition-colors hover:bg-blue-50 justify-self-end"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
      {mobileOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="lg:hidden border-b border-slate-100 bg-white max-h-[70vh] overflow-y-auto scrollbar-thin"
        >
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
            <MobileSelect label={t("header.country")} options={COUNTRIES.map((c) => ({ value: c, label: c }))} value={country} onChange={setCountry} showFlag />
            <MobileCurrencySelect value={selectedCurrency} onChange={setSelectedCurrency} label={t("header.currency")} />
            <MobileSelect label={t("header.language")} options={languageOptionLabels} value={language} onChange={setLanguage} showLanguageIcon />
          </div>

          <ul className="flex flex-col py-2">
            {NAV_ITEMS.map((item) => {
              const itemLabel = t(item.labelKey);
              return (
                <li key={item.labelKey}>
                  {item.menu ? (
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
                      <span className="flex items-center gap-3 text-[14px] font-semibold text-ink">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-brand-600">
                          <NavIcon labelKey={item.labelKey} className="h-[18px] w-[18px]" />
                        </span>
                        {itemLabel}
                      </span>
                      <button
                        type="button"
                        aria-label={t("header.toggle_section_menu", { label: itemLabel })}
                        aria-expanded={mobileExpanded === item.labelKey}
                        onClick={() => toggleMobileSection(item.labelKey)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink transition-colors hover:bg-blue-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width={16}
                          height={16}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                          className={cn(
                            "transition-transform duration-200",
                            mobileExpanded === item.labelKey && "rotate-180",
                          )}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-blue-50 sm:px-6"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-brand-600">
                        <NavIcon labelKey={item.labelKey} className="h-[18px] w-[18px]" />
                      </span>
                      {itemLabel}
                    </Link>
                  )}
                  {item.menu && mobileExpanded === item.labelKey ? (
                    <ul className="bg-slate-50/70">
                      {item.menu.map((m) => (
                        <li key={m.labelKey}>
                          <Link
                            href={m.href}
                            className="block px-12 py-2.5 text-[13px] text-ink-soft transition-colors hover:text-brand-700 sm:px-14"
                            onClick={() => {
                              setMobileOpen(false);
                              setMobileExpanded(null);
                            }}
                          >
                            {t(m.labelKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={profileHref}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-blue-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    await logout();
                    router.replace("/");
                  }}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-left text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="block rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-center text-[14px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
                onClick={() => setMobileOpen(false)}
              >
                Login / Register
              </Link>
            )}
          </div>
        </motion.nav>
      )}
      </AnimatePresence>
    </motion.header>
  );
}

type Option = { value: string; label: string };

function SelectDropdown({
  label,
  options,
  value,
  onChange,
  isOpen,
  onToggle,
  showFlags = false,
  showLanguageIcon = false,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  showFlags?: boolean;
  showLanguageIcon?: boolean;
}) {
  const selectedFlagUrl = showFlags ? getCountryFlagUrl(value) : null;
  const selectedLabel = normalizeAriaText(options.find((opt) => opt.value === value)?.label ?? value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${normalizeAriaText(label)}: ${normalizeAriaText(selectedLabel)}`}
        className="flex items-center gap-1.5 text-white/85 transition-colors duration-200 hover:text-white whitespace-nowrap"
      >
        {selectedFlagUrl ? (
          <img
            src={selectedFlagUrl}
            alt={`${value} flag`}
            width={18}
            height={14}
            className="h-3.5 w-[18px] rounded-[2px] object-cover ring-1 ring-white/10"
          />
        ) : null}
        {showLanguageIcon ? <LanguageIcon className="h-3.5 w-3.5 shrink-0" /> : null}
        <span className="font-medium">{selectedLabel}</span>
        <svg
          viewBox="0 0 24 24"
          width={11}
          height={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
      {isOpen ? (
        <motion.div
          role="listbox"
          aria-label={normalizeAriaText(label)}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dropdownVariants}
          className="absolute left-0 top-[calc(100%+10px)] z-50 max-h-60 min-w-[11rem] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/95 py-1.5 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25)] backdrop-blur-xl ring-1 ring-black/5"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => { onChange(option.value); onToggle(); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-blue-50 hover:text-brand-700",
                value === option.value && "bg-blue-50 text-brand-700 font-semibold",
              )}
            >
              {showFlags && getCountryFlagUrl(option.value) ? (
                <img
                  src={getCountryFlagUrl(option.value) ?? undefined}
                  alt={`${option.value} flag`}
                  width={18}
                  height={14}
                  className="h-3.5 w-[18px] shrink-0 rounded-[2px] object-cover ring-1 ring-slate-200"
                />
              ) : null}
              {showLanguageIcon ? <LanguageIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" /> : null}
              <span>{normalizeAriaText(option.label)}</span>
            </button>
          ))}
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

function MobileSelect({
  label,
  options,
  value,
  onChange,
  showFlag = false,
  showLanguageIcon = false,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  showFlag?: boolean;
  showLanguageIcon?: boolean;
}) {
  const flagUrl = showFlag ? getCountryFlagUrl(value) : null;
  const hasLeadingIcon = Boolean(flagUrl || showLanguageIcon);

  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{normalizeAriaText(label)}</span>
      <span className="relative">
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={`${value} flag`}
            width={18}
            height={14}
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-[18px] -translate-y-1/2 rounded-[2px] object-cover"
          />
        ) : null}
        {showLanguageIcon ? (
          <LanguageIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
        ) : null}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-ink transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
            hasLeadingIcon && "pl-8",
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{normalizeAriaText(opt.label)}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

function LanguageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function CurrencyDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
  ariaLabel,
}: {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  isOpen: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  const selected = CURRENCY_OPTIONS.find((option) => option.value === value) ?? CURRENCY_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${normalizeAriaText(ariaLabel)}: ${normalizeAriaText(selected.value)}`}
        className="flex items-center gap-1.5 text-white/85 transition-colors duration-200 hover:text-white whitespace-nowrap"
      >
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 text-[11px] font-semibold leading-none">
          {selected.symbol}
        </span>
        <span className="font-medium">{selected.value}</span>
        <svg
          viewBox="0 0 24 24"
          width={11}
          height={11}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
      {isOpen && (
        <motion.div
          role="listbox"
          aria-label={normalizeAriaText(ariaLabel)}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dropdownVariants}
          className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-[8.5rem] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 py-1.5 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.25)] backdrop-blur-xl ring-1 ring-black/5"
        >
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => { onChange(option.value); onToggle(); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-blue-50 hover:text-brand-700",
                value === option.value && "bg-blue-50 text-brand-700 font-semibold",
              )}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[12px] font-semibold text-brand-700">
                {option.symbol}
              </span>
              <span>{option.value}</span>
            </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function MobileCurrencySelect({
  value,
  onChange,
  label,
}: {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  label: string;
}) {
  const selected = CURRENCY_OPTIONS.find((option) => option.value === value) ?? CURRENCY_OPTIONS[0];

  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
      <span className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold leading-none text-brand-700">
          {selected.symbol}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as CurrencyCode)}
          className="w-full truncate rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-[12px] text-ink transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          aria-label={label}
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.symbol} {option.value}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

const MEGA_DESCRIPTIONS: Record<string, string> = {
  "nav.search": "Find trains by route & date",
  "nav.tickets": "Manage your booked tickets",
  "nav.change_request": "Modify journey details",
  "nav.file_tdr_online": "Raise refund requests easily",
  "nav.national_tour_packages": "Curated trips across India",
  "nav.international_tour_packages": "Worldwide getaways & escapes",
  "nav.homestay": "Live local, stay homely",
  "nav.airbnb": "Unique stays worldwide",
  "nav.villa": "Private luxury villas",
  "nav.guest_house": "Cozy guest accommodation",
  "nav.house_board": "Floating stays on water",
  "nav.hostels": "Budget-friendly social stays",
  "nav.resorts": "Premium resort experiences",
  "nav.taxi_package": "Private taxi for tours",
  "nav.cabs": "On-demand city cabs",
  "nav.tour_bus": "Group tour bus rentals",
  "nav.train": "Search & book trains",
  "nav.cruise_for_andaman": "Andaman island cruises",
  "nav.general_cruise": "All cruise destinations",
  "nav.pr_visa": "Permanent residency support",
  "nav.work_visa": "Work abroad legally",
  "nav.investor_visa": "Investor migration paths",
  "nav.study_visa": "Study abroad assistance",
  "nav.visit_visa": "Short-term visit visas",
  "nav.tourist_visa": "Tourist visa processing",
  Transfer: "Airport and city transfer bookings",
  SightSeeing: "Tours and local experience tickets",
  "Self-Drive": "Rental cars for flexible road trips",
  "Rail Europe": "Cross-border European train booking",
  Queues: "Monitor pending tasks and workflows",
  Accounts: "Billing, deposits, and ledgers",
  Reports: "Operational and sales reporting",
  Admin: "Portal controls and configuration",
  GST: "Tax documents and GST tools",
  "Search Trains": "Find international rail routes quickly",
  Bookings: "View and manage confirmed reservations",
  "Search Activities": "Browse tours and attraction tickets",
  "My Bookings": "Manage your sightseeing reservations",
  "Airport Transfer": "Book point-to-point airport rides",
  "Search Cars": "Find self-drive cars by destination",
  "nav.offers": "Promotions and limited-time deals",
};

function MegaItemIcon({ labelKey, className }: { labelKey: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="10 8 14 12 10 16" />
    </svg>
  );
}

function MegaMenu({
  parentKey,
  items,
  t,
}: {
  parentKey: string;
  items: { labelKey: string; href: string }[];
  t: (key: string) => string;
}) {
  const cols = items.length >= 6 ? 3 : items.length >= 3 ? 2 : 1;
  const widthClass = cols === 3 ? "w-[640px]" : cols === 2 ? "w-[460px]" : "w-[280px]";
  const gridClass = cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <motion.div
      className={cn("pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2", widthClass)}
    >
      <motion.div
        role="menu"
        variants={{
          rest: { opacity: 0, y: 10, scale: 0.98 },
          hover: { opacity: 1, y: 0, scale: 1 },
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.28)] backdrop-blur-xl ring-1 ring-black/5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-transparent px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/70">
              <NavIcon labelKey={parentKey} className="h-[16px] w-[16px]" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{t(parentKey)}</p>
              <p className="text-[11px] text-ink-soft">Explore options</p>
            </div>
          </div>
        </div>
        <ul className={cn("grid gap-1 p-3", gridClass)}>
          {items.map((m, i) => (
            <motion.li
              key={m.labelKey}
              custom={i}
              variants={megaItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link
                href={m.href}
                role="menuitem"
                className="group/mi flex items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-blue-50"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-brand-600 ring-1 ring-slate-100 transition-all duration-200 group-hover/mi:bg-white group-hover/mi:text-brand-700 group-hover/mi:ring-brand-200">
                  <MegaItemIcon labelKey={m.labelKey} className="h-[18px] w-[18px]" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13.5px] font-semibold text-ink transition-colors group-hover/mi:text-brand-700">
                    {t(m.labelKey)}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-soft">
                    {MEGA_DESCRIPTIONS[m.labelKey] ?? "Discover more"}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="ml-auto self-center text-slate-300 transition-all duration-200 group-hover/mi:translate-x-0.5 group-hover/mi:text-brand-600"
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

function LoginPill({ label, href }: { label: string; href: string }) {
  return (
    <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(37,99,235,0.45)]"
      >
        <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden fill="currentColor">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v2h16v-2c0-3.3-4.7-5-8-5Z" />
        </svg>
        {label}
      </Link>
    </motion.div>
  );
}
