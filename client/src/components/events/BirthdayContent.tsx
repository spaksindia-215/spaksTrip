import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Themed birthday setups for all age groups",
  "Balloon decorations and canopy arrangements",
  "DJ, live music, and entertainment acts",
  "Tattoo artists, magicians, and kiddie rides",
  "Custom cakes and catering packages",
  "Artist management and event photography",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1543007631-283050bb3e8c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
];

export default function BirthdayContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80"
                    alt="Birthday party celebration"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Best Birthday Party Organizers in Delhi & Gurgaon
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  Birthday parties are the most popular celebrations organised every day across Delhi and Gurgaon.
                  Whether it's a little kid's first birthday, a teenager's milestone, or a surprise party for your
                  loved one — SpaksTrip Events brings boundless joy and a personal touch to every celebration.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  We carefully select themes, staff, and setups so that your party becomes the most talked-about
                  event in the neighbourhood. From cricket-themed parties for your sports-loving dad to princess
                  parties for your little one — we handle everything from planning to execution.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Consider Birthday Event Theming
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  SpaksTrip Events is one of the best birthday party organisers in Delhi and top Birthday Party
                  Planners in Gurgaon. We cater to all ages and preferences — kids, teenagers, adults, and
                  corporate birthday celebrations.
                </p>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Birthday party ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why We Are Delhi's Best Birthday Party Organiser
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  We meticulously plan every detail so that your party tops the buzz list. Our fast response team
                  and dedicated account managers understand your financial requirements and help you choose the
                  best plan for your budget.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Our team caters to DJs, video gamers, guitarists, kiddie rides, and artists. Overall, our
                  birthday party hosting team in Delhi respects your feelings and values. Give us a call whenever
                  you're planning to throw a birthday party and we'll craft the perfect experience.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Birthday Party" eventType="Birthday Planner" />
        </div>
      </div>
    </section>
  );
}
