import Image from "next/image";

const nonReturnableItems = [
  "Gift cards",
  "Downloadable software products",
  "Some health and personal care items",
] as const;

const legalSectionTitleClass =
  "text-[20px] font-bold leading-[1.35] tracking-tight text-[#0e1e3a] sm:text-[21px]";
const legalSubheadingClass =
  "text-[19px] font-bold leading-[1.35] text-[#0e1e3a] sm:text-[20px]";

export default function RefundPolicyLanding() {
  return (
    <div className="bg-[#f5f5f5]">
      <section className="relative isolate overflow-hidden">
        <div className="relative h-[270px] sm:h-[320px] lg:h-[390px]">
          <Image
            src="/R&P.png"
            alt="Refund and cancellation policy hero background"
            fill
            priority
            className="object-cover"
          />

          <div className="relative flex h-full items-center justify-center px-6 text-center">
            <h1 className="text-[32px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] sm:text-[42px] lg:text-[48px]">
              Refund &amp; Cancellation Policy
            </h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1820px] px-4 py-8 sm:px-6 sm:py-10 lg:px-[66px] lg:py-14">
        <article className="bg-white px-5 py-9 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-8 lg:px-11 lg:py-14">
          <section>
            <h2 className={legalSectionTitleClass}>
              Returns/Cancellation
            </h2>

            <div className="mt-6 space-y-10">
              <ParagraphBlock>
                Our policy lasts 30 days. If 30 days have gone by since your
                purchase, unfortunately we can&apos;t offer you a refund or
                exchange.
              </ParagraphBlock>

              <ParagraphBlock>
                To be eligible for a return, your item must be unused and in
                the same condition that you received it. It must also be in the
                original packaging.
              </ParagraphBlock>

              <ParagraphBlock>
                Several types of goods are exempt from being returned.
                Perishable goods such as food, flowers, newspapers or magazines
                cannot be returned. We also do not accept products that are
                intimate or sanitary goods, hazardous materials, or flammable
                liquids or gases.
              </ParagraphBlock>

              <div className="space-y-5">
                <h3 className={legalSubheadingClass}>
                  Additional non-returnable items:
                </h3>
                <ul className="space-y-7 text-[16px] leading-[1.62] text-[#475569] sm:text-[17px]">
                  {nonReturnableItems.map((item) => (
                    <li key={item} className="flex items-start gap-4">
                      <span className="mt-0.5 text-[#475569]">
                        <svg
                          viewBox="0 0 24 24"
                          width={22}
                          height={22}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ParagraphBlock>
                To complete your return, we require a receipt or proof of
                purchase.
              </ParagraphBlock>

              <ParagraphBlock>
                Please do not send your purchase back to the manufacturer.
              </ParagraphBlock>

              <ParagraphBlock>
                There are certain situations where only partial refunds are
                granted: (if applicable) Book with obvious signs of use CD,
                DVD, VHS tape, software, video game, cassette tape, or vinyl
                record that has been opened.
              </ParagraphBlock>

              <ParagraphBlock>
                Any item not in its original condition, is damaged or missing
                parts for reasons not due to our error.
              </ParagraphBlock>

              <ParagraphBlock>
                Any item that is returned more than 30 days after delivery
              </ParagraphBlock>

              <SubSectionHeading>Refunds (if applicable)</SubSectionHeading>

              <ParagraphBlock>
                Once your return is received and inspected, we will send you an
                email to notify you that we have received your returned item.
                We will also notify you of the approval or rejection of your
                refund.
              </ParagraphBlock>

              <ParagraphBlock>
                If you are approved, then your refund will be processed, and a
                credit will automatically be applied to your credit card or
                original method of payment, within a certain amount of days.
              </ParagraphBlock>

              <SubSectionHeading>
                Late or missing refunds (if applicable)
              </SubSectionHeading>

              <ParagraphBlock>
                If you haven&apos;t received a refund yet, first check your
                bank account again.
              </ParagraphBlock>

              <ParagraphBlock>
                Then contact your credit card company, it may take some time
                before your refund is officially posted.
              </ParagraphBlock>

              <ParagraphBlock>
                Next contact your bank. There is often some processing time
                before a refund is posted.
              </ParagraphBlock>

              <ParagraphBlock>
                If you&apos;ve done all of this and you still have not received
                your refund yet, please contact us at spakstrip@gmail.com.
              </ParagraphBlock>

              <SubSectionHeading>Sale items (if applicable)</SubSectionHeading>

              <ParagraphBlock>
                Only regular priced items may be refunded, unfortunately sale
                items cannot be refunded.
              </ParagraphBlock>

              <SubSectionHeading>Exchanges (if applicable)</SubSectionHeading>

              <ParagraphBlock>
                We only replace items if they are defective or damaged. If you
                need to exchange it for the same item, send us an email at
                spakstrip@gmail.com and send your item to{" "}
                <strong className="font-semibold text-[#0e1e3a]">
                  E-38, Budh Vihar, Badarpur, New Delhi -110044
                </strong>
                .
              </ParagraphBlock>

              <SubSectionHeading>Gifts</SubSectionHeading>

              <ParagraphBlock>
                If the item was marked as a gift when purchased and shipped
                directly to you, you&apos;ll receive a gift credit for the
                value of your return. Once the returned item is received, a
                gift certificate will be mailed to you.
              </ParagraphBlock>

              <ParagraphBlock>
                If the item wasn&apos;t marked as a gift when purchased, or the
                gift giver had the order shipped to themselves to give to you
                later, we will send a refund to the gift giver and he will find
                out about your return.
              </ParagraphBlock>

              <SubSectionHeading>Shipping</SubSectionHeading>

              <ParagraphBlock>
                To return your product, you should mail your product to:{" "}
                <strong className="font-semibold text-[#0e1e3a]">
                  E-38, Budh Vihar, Badarpur, New Delhi -110044.
                </strong>
              </ParagraphBlock>

              <ParagraphBlock>
                You will be responsible for paying for your own shipping costs
                for returning your item. Shipping costs are non-refundable. If
                you receive a refund, the cost of return shipping will be
                deducted from your refund.
              </ParagraphBlock>

              <ParagraphBlock>
                Depending on where you live, the time it may take for your
                exchanged product to reach you, may vary.
              </ParagraphBlock>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

function SubSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className={legalSubheadingClass}>
      {children}
    </h3>
  );
}

function ParagraphBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] font-normal leading-[1.62] text-[#475569] sm:text-[17px]">
      {children}
    </p>
  );
}
