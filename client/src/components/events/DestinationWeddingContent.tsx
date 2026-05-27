import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Exotic location scouting & venue booking",
  "End-to-end travel & accommodation coordination",
  "Themed decor and floral arrangements",
  "Guest management and hospitality",
  "Photography and videography packages",
  "Catering and entertainment planning",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80",
];

export default function DestinationWeddingContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80"
                    alt="Destination wedding on beach"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Destination Wedding Planners — Goa, Rajasthan, Kerala & Beyond
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  A destination wedding transforms your special day into a breathtaking travel experience for you
                  and your guests. SpaksTrip Events specialises in curating destination weddings at India's most
                  iconic locations — pristine Goa beaches, grand Rajasthan palaces, serene Kerala backwaters, and
                  exotic international venues.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Our team handles every logistical detail — from venue scouting and travel arrangements to decor
                  and catering — so you can focus on celebrating the most important day of your life without a
                  single worry.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  What We Offer For Your Destination Wedding
                </h2>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Destination wedding ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Choose SpaksTrip Events For Your Destination Wedding
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  Planning a wedding away from home requires exceptional coordination across vendors, venues, and
                  travel providers. Our experienced destination wedding team has executed flawless ceremonies
                  across India and international locations, earning the trust of hundreds of couples.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Contact us today to begin planning your dream destination wedding. We offer customised packages
                  for every budget and vision.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Destination Wedding" eventType="Destination Wedding" />
        </div>
      </div>
    </section>
  );
}
