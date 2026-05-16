import Image from "next/image";

type PrivacySection = {
  title: string;
  content: React.ReactNode;
};

const legalSectionTitleClass =
  "text-[20px] font-bold leading-[1.35] tracking-tight text-[#0e1e3a] sm:text-[21px]";
const legalSubheadingClass =
  "text-[17px] font-bold leading-[1.4] text-[#0e1e3a] sm:text-[18px]";

const privacySections: PrivacySection[] = [
  {
    title: "1 - WHAT DO WE DO WITH YOUR INFORMATION ?",
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
    content: (
      <ParagraphBlock>
        We may disclose your personal information if we are required by law to
        do so or if you violate our Terms of Service.
      </ParagraphBlock>
    ),
  },
  {
    title: "4 - PAYMENT",
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
    content: (
      <ParagraphBlock>
        We use cookies to maintain session of your user. It is not used to
        personally identify you on other websites.
      </ParagraphBlock>
    ),
  },
  {
    title: "8 - AGE OF CONSENT",
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
    content: (
      <div className="space-y-10">
        <ParagraphBlock>
          If you would like to: access, correct, amend or delete any personal
          information we have about you, register a complaint, or simply want
          more information contact our Privacy Compliance Officer at{" "}
          <a
            href="mailto:spakstrip@gmail.com"
            className="font-semibold text-[#E0382E] transition-colors hover:text-[#c73027]"
          >
            spakstrip@gmail.com
          </a>{" "}
          or by mail at{" "}
          <span className="font-semibold text-[#0e1e3a]">
            E-38, Budh Vihar, Badarpur, New Delhi, Delhi -110044
          </span>
          .
        </ParagraphBlock>
        <div className="rounded-lg bg-[#f8fafc] px-5 py-4 ring-1 ring-slate-200/80">
          <p className="text-[14px] text-[#64748b]">[ Privacy Compliance Officer ]</p>
          <p className="mt-2 text-[18px] font-semibold text-[#0e1e3a]">
            MR. S K Meena
          </p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicyLanding() {
  return (
    <div className="bg-[#f5f5f5]">
      <section className="relative isolate overflow-hidden">
        <div className="relative h-[270px] sm:h-[320px] lg:h-[390px]">
          <Image
            src="/privacy.png"
            alt="Privacy policy hero background"
            fill
            priority
            className="object-cover"
          />
          
          <div className="relative flex h-full items-center justify-center px-4 text-center">
            <h1 className="text-[32px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] sm:text-[42px] lg:text-[40px]">
              Privacy Policy
            </h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1820px] px-4 py-8 sm:px-6 sm:py-10 lg:px-[66px] lg:py-14">
        <article className="bg-white px-5 py-9 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-8 lg:px-11 lg:py-14">
          <div className="space-y-8 lg:space-y-10">
            {privacySections.map((section) => (
              <section key={section.title}>
                <h2 className={legalSectionTitleClass}>
                  {section.title}
                </h2>
                <div className="mt-4">{section.content}</div>
              </section>
            ))}
          </div>
        </article>
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
