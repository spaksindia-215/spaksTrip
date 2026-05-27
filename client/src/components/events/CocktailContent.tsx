import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Rooftop, indoor, and outdoor venue options",
  "Premium bar setup and cocktail menu curation",
  "Ambient lighting and decor design",
  "Live music, DJ, and entertainment booking",
  "Catering, canapes, and finger food service",
  "Guest management and hosting staff",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1543007631-283050bb3e8c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
];

export default function CocktailContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80"
                    alt="Cocktail party ambiance"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Cocktail Party Planners in Delhi & NCR
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  A cocktail party is the perfect blend of sophistication and relaxed social interaction.
                  SpaksTrip Events designs cocktail parties that leave guests thoroughly impressed — from
                  intimate rooftop mixers for 20 guests to large-scale social evenings for 200+.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  We manage every aspect of your cocktail event — venue selection, bar setup, lighting, music,
                  catering, and hosting staff — so you can enjoy the evening as much as your guests do.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  What We Offer For Your Cocktail Party
                </h2>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Cocktail party ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Choose SpaksTrip Events For Your Cocktail Mixer
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  Our cocktail party setups are known for their stunning ambiance, curated bar menus, and
                  seamless service. Whether it's a pre-wedding cocktail night, a networking mixer, or a birthday
                  evening — we tailor every detail to your style and budget.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Contact us today to discuss your cocktail party ideas and get a customised quote within 24
                  hours.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Cocktail Party" eventType="Cocktail Party" />
        </div>
      </div>
    </section>
  );
}
