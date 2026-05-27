import EventSidebar from "./EventSidebar";

const USP_LIST = [
  "Personalised ring presentation setups",
  "Floral and balloon decor arrangements",
  "Intimate venue selection and booking",
  "Surprise element planning and coordination",
  "Photography and videography coverage",
  "Catering, cake, and beverage services",
];

const GALLERY = [
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
];

export default function EngagementContent() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-zinc-200 p-6 flex flex-col gap-8">
              <div>
                <div className="rounded-lg overflow-hidden mb-5 h-64">
                  <img
                    src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80"
                    alt="Engagement celebration"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Engagement Planners in Delhi, Noida & Gurgaon
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  An engagement is the beginning of a beautiful journey together. SpaksTrip Events specialises in
                  crafting intimate, heartfelt engagement ceremonies that perfectly capture the joy and emotion of
                  this milestone moment. From a surprise proposal setup to a grand family celebration, we design
                  every detail with love.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Whether you envision a rooftop setup under the stars, a floral garden ceremony, or a candlelit
                  indoor arrangement, our team transforms your dream engagement into a reality that moves families
                  to tears of joy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  What We Offer For Your Engagement Celebration
                </h2>
                <ul className="flex flex-col gap-2 list-disc list-inside mb-5">
                  {USP_LIST.map((item) => (
                    <li key={item} className="text-sm text-zinc-600 leading-relaxed">{item}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {GALLERY.map((src, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-32">
                      <img src={src} alt={`Engagement event ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1E3A] mb-3">
                  Why Trust SpaksTrip Events With Your Engagement
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                  The engagement is a once-in-a-lifetime moment. Our team of experienced planners ensures every
                  element — from the flower arrangements to the ring presentation — is crafted with precision and
                  warmth, making it a memory your families will cherish forever.
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Contact us today to discuss your vision and we'll create an engagement ceremony that is
                  perfectly personalised, beautifully executed, and absolutely unforgettable.
                </p>
              </div>
            </div>
          </div>

          <EventSidebar activeEvent="Engagement Planner" eventType="Engagement" />
        </div>
      </div>
    </section>
  );
}
