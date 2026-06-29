"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Shield,
  Lock,
  Users,
  CreditCard,
  LinkIcon,
  Eye,
  Cookie,
  AlertCircle,
  Mail,
  MapPin,
} from "lucide-react";

type PrivacySection = {
  title: string;
  id: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

const legalSectionTitleClass =
  "text-[22px] font-bold leading-[1.35] tracking-tight text-[#0e1e3a] sm:text-[24px] flex items-center gap-3";
const legalSubheadingClass =
  "text-[17px] font-bold leading-[1.4] text-[#0e1e3a] sm:text-[18px]";

const privacySections: PrivacySection[] = [
  {
    title: "1 - WHAT DO WE DO WITH YOUR INFORMATION ?",
    id: "what-we-do",
    icon: <Eye className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <div className="space-y-10">
        <ParagraphBlock>
          When you purchase something from our store, as part of the buying and
          selling process, we collect the personal information you give us such
          as your name, address and email address.
        </ParagraphBlock>
        <ParagraphBlock>
          When you browse our store, we also automatically receive your
          computer&apos;s internet protocol (IP) address in order to provide us
          with information that helps us learn about your browser and operating
          system.
        </ParagraphBlock>
        <ParagraphBlock>
          Email marketing (if applicable): With your permission, we may send
          you emails about our store, new products and other updates.
        </ParagraphBlock>
      </div>
    ),
  },
  {
    title: "2 - CONSENT",
    id: "consent",
    icon: <AlertCircle className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
        <div className="space-y-10">
        <div className="space-y-4">
          <h4 className={legalSubheadingClass}>
            How do you get my consent ?
          </h4>
          <div className="space-y-10">
            <ParagraphBlock>
              When you provide us with personal information to complete a
              transaction, verify your credit card, place an order, arrange for
              a delivery or return a purchase, we imply that you consent to our
              collecting it and using it for that specific reason only.
            </ParagraphBlock>
            <ParagraphBlock>
              If we ask for your personal information for a secondary reason,
              like marketing, we will either ask you directly for your
              expressed consent, or provide you with an opportunity to say no.
            </ParagraphBlock>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "3 - DISCLOSURE",
    id: "disclosure",
    icon: <Users className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <ParagraphBlock>
        We may disclose your personal information if we are required by law to
        do so or if you violate our Terms of Service.
      </ParagraphBlock>
    ),
  },
  {
    title: "4 - PAYMENT",
    id: "payment",
    icon: <CreditCard className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <div className="space-y-10">
        <ParagraphBlock>
          We use Razorpay for processing payments. We/Razorpay do not store
          your card data on their servers. The data is encrypted through the
          Payment Card Industry Data Security Standard (PCI-DSS) when
          processing payment. Your purchase transaction data is only used as
          long as is necessary to complete your purchase transaction. After
          that is complete, your purchase transaction information is not saved.
        </ParagraphBlock>
        <ParagraphBlock>
          Our payment gateway adheres to the standards set by PCI-DSS as
          managed by the PCI Security Standards Council, which is a joint
          effort of brands like Visa, MasterCard, American Express and
          Discover.
        </ParagraphBlock>
        <ParagraphBlock>
          PCI-DSS requirements help ensure the secure handling of credit card
          information by our store and its service providers. For more insight,
          you may also want to read terms and conditions of razorpay on{" "}
          <a
            href="https://razorpay.com"
            className="text-[#E0382E] transition-colors hover:text-[#c73027]"
          >
            https://razorpay.com
          </a>
          .
        </ParagraphBlock>
      </div>
    ),
  },
  {
    title: "5 - THIRD-PARTY SERVICES",
    id: "third-party",
    icon: <LinkIcon className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <div className="space-y-10">
        <ParagraphBlock>
          In general, the third-party providers used by us will only collect,
          use and disclose your information to the extent necessary to allow
          them to perform the services they provide to us.
        </ParagraphBlock>
        <ParagraphBlock>
          However, certain third-party service providers, such as payment
          gateways and other payment transaction processors, have their own
          privacy policies in respect to the information we are required to
          provide to them for your purchase-related transactions.
        </ParagraphBlock>
        <ParagraphBlock>
          For these providers, we recommend that you read their privacy
          policies so you can understand the manner in which your personal
          information will be handled by these providers.
        </ParagraphBlock>
        <ParagraphBlock>
          In particular, remember that certain providers may be located in or
          have facilities that are located a different jurisdiction than either
          you or us. So if you elect to proceed with a transaction that
          involves the services of a third-party service provider, then your
          information may become subject to the laws of the jurisdiction(s) in
          which that service provider or its facilities are located.
        </ParagraphBlock>
        <ParagraphBlock>
          Once you leave our store&apos;s website or are redirected to a
          third-party website or application, you are no longer governed by
          this Privacy Policy or our website&apos;s Terms of Service.
        </ParagraphBlock>
        <div className="space-y-4">
          <h4 className={legalSubheadingClass}>Links</h4>
          <ParagraphBlock>
            When you click on links on our store, they may direct you away from
            our site. We are not responsible for the privacy practices of other
            sites and encourage you to read their privacy statements.
          </ParagraphBlock>
        </div>
      </div>
    ),
  },
  {
    title: "6 - SECURITY",
    id: "security",
    icon: <Lock className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <ParagraphBlock>
        To protect your personal information, we take reasonable precautions
        and follow industry best practices to make sure it is not
        inappropriately lost, misused, accessed, disclosed, altered or
        destroyed.
      </ParagraphBlock>
    ),
  },
  {
    title: "7 - COOKIES",
    id: "cookies",
    icon: <Cookie className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <ParagraphBlock>
        We use cookies to maintain session of your user. It is not used to
        personally identify you on other websites.
      </ParagraphBlock>
    ),
  },
  {
    title: "8 - AGE OF CONSENT",
    id: "age-consent",
    icon: <AlertCircle className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <ParagraphBlock>
        By using this site, you represent that you are at least the age of
        majority in your state or province of residence, or that you are the
        age of majority in your state or province of residence and you have
        given us your consent to allow any of your minor dependents to use this
        site.
      </ParagraphBlock>
    ),
  },
  {
    title: "9 - CHANGES TO THIS PRIVACY POLICY",
    id: "changes",
    icon: <Shield className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <ParagraphBlock>
        If our store is acquired or merged with another company, your
        information may be transferred to the new owners so that we may
        continue to sell products to you.
      </ParagraphBlock>
    ),
  },
  {
    title: "QUESTIONS AND CONTACT INFORMATION",
    id: "contact",
    icon: <Mail className="h-6 w-6 text-[#E0382E] flex-shrink-0" />,
    content: (
      <div className="space-y-8">
        <ParagraphBlock>
          If you would like to: access, correct, amend or delete any personal
          information we have about you, register a complaint, or simply want
          more information contact our Privacy Compliance Officer.
        </ParagraphBlock>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-gradient-to-br from-[#fef2f2] to-[#f8fafc] p-5 ring-1 ring-[#E0382E]/10">
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-[#E0382E]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">
                  Email
                </p>
                <a
                  href="mailto:spakstrip@gmail.com"
                  className="mt-2 block text-sm font-semibold text-[#E0382E] transition-colors hover:text-[#c73027]"
                >
                  spakstrip@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-[#fef2f2] to-[#f8fafc] p-5 ring-1 ring-[#E0382E]/10">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-[#E0382E]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">
                  Address
                </p>
                <p className="mt-2 text-sm font-medium text-[#0e1e3a]">
                  E-38, Budh Vihar, Badarpur, New Delhi, Delhi -110044
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-gradient-to-r from-[#fef2f2] via-[#f8fafc] to-[#fef2f2] p-6 ring-1 ring-[#E0382E]/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0382E]/10">
              <Shield className="h-6 w-6 text-[#E0382E]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748b]">
                Privacy Compliance Officer
              </p>
              <p className="mt-1 text-lg font-bold text-[#0e1e3a]">MR. S K Meena</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicyLanding() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      for (const section of privacySections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(section.id);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
      <section className="relative isolate overflow-hidden">
        <div className="relative h-[270px] sm:h-[320px] lg:h-[390px]">
          <Image
            src="/privacy.png"
            alt="Privacy policy hero background"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
          <div className="relative flex h-full items-center justify-center px-4 text-center">
            <h1 className="text-[32px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] sm:text-[42px] lg:text-[40px]">
              Privacy Policy
            </h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1820px] px-4 py-8 sm:px-6 sm:py-10 lg:px-[66px] lg:py-14">
        <div className="grid gap-8 lg:grid-cols-4 lg:gap-12">
          <aside className="lg:col-span-1">
            <div className="sticky top-20 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#0e1e3a]">
                Quick Links
              </h3>
              <nav className="space-y-2">
                {privacySections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full rounded px-3 py-2 text-left text-sm font-medium transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-[#E0382E] text-white"
                        : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0e1e3a]"
                    }`}
                  >
                    {section.title.split(" - ")[1] || section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <article className="lg:col-span-3 space-y-1">
            <div className="rounded-lg bg-white p-5 shadow-sm sm:p-8 lg:p-11">
              <div className="space-y-12">
                {privacySections.map((section, index) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 border-l-4 border-[#E0382E] pl-6"
                  >
                    <h2 className={legalSectionTitleClass}>
                      {section.icon}
                      <span>{section.title}</span>
                    </h2>
                    <div className="mt-6 text-[#475569]">
                      {section.content}
                    </div>
                    {index < privacySections.length - 1 && (
                      <div className="mt-10 border-t border-slate-100" />
                    )}
                  </section>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

function ParagraphBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] font-normal leading-[1.62] text-[#475569] sm:text-[17px]">
      {children}
    </p>
  );
}
