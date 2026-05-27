import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Corporate conference and summit management",
  "Team building events and off-sites",
  "Product launches and brand activations",
  "Award nights and gala dinners",
  "Corporate gifting and hamper curation",
  "AV setup, stage design, and production",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
];

export default function CorporateContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80"
                    alt="Corporate event conference"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Corporate Event Management Services in Delhi & NCR
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  SpaksTrip Events is a trusted corporate event management company serving businesses across
                  Delhi, Gurgaon, Noida, and the wider NCR region. From high-profile conferences and product
                  launches to team-building retreats and award ceremonies, we deliver world-class corporate events
                  that impress clients and inspire teams.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Our professional event managers bring deep experience in corporate environments — understanding
                  your brand identity, objectives, and audience to craft events that achieve real business impact.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Our Corporate Event Services
                </h2>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Corporate event ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Choose SpaksTrip Events For Corporate Events
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  We have successfully executed corporate events for startups, mid-size companies, and Fortune
                  500 enterprises. Our approach is professional, punctual, and creative — transforming annual
                  summits into world-class experiences that leave clients thoroughly impressed.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Contact our corporate events team today to discuss your requirements and receive a detailed
                  proposal within 24 hours.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Corporate Events" eventType="Corporate Events" />
        </div>
      </div>
    </section>
  );
}
