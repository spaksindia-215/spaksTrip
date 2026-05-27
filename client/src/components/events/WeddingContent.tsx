import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Vendor Management",
  "Wedding Design and Decor",
  "On-Site Coordination",
  "Experience and Expertise",
  "Personalized Approach",
  "Attention to Detail",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=600&q=80",
];

export default function WeddingContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80"
                    alt="Wedding planning"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Wedding Management Services In Delhi, Gurugram, Noida & NCR India
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  SpaksTrip Events is a popular Wedding Organiser in Delhi. We specialize in providing exceptional
                  wedding management services across India. With more than 10 years of experience and a dedicated
                  team of experts, we ensure that every wedding function becomes an unforgettable and cherished
                  experience. Our meticulous planning and flawless execution ensure that your wedding is filled
                  with beautiful memories that will last a lifetime.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Are you looking for a professional Luxury Wedding Planner in Delhi? Our comprehensive wedding
                  planning services cover everything you need to make your dream wedding a reality — venue
                  selection, theme and decor planning, catering, entertainment, logistics, and much more. Our team
                  works closely with you to understand your vision and deliver a personalized wedding experience
                  that reflects your style and preferences.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why SpaksTrip Events Is Your Premier Wedding Planner in Delhi
                </h2>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Wedding gallery ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Choose SpaksTrip Events For Your Wedding
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  With SpaksTrip Events, you can rest assured that you will get the event of your dreams — putting
                  your ideas together and adding a professional touch. We will make sure that any event you plan
                  with us will be stress-free, so you can relax and enjoy the build-up.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Let us create a magical experience that surpasses your expectations as the top wedding planners
                  in Delhi, Gurgaon, Noida & NCR. Contact us today to discuss your dream wedding at the best price.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Wedding Planner" eventType="Wedding Planner" />
        </div>
      </div>
    </section>
  );
}
