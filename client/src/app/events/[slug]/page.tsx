import EventDetailView from "@/components/events/EventDetailView";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

// Event detail + booking. Server component resolves the dynamic slug (async
// params in this Next version) and hands it to the client booking view.
type PageProps = { params: Promise<{ slug: string }> };

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-white text-[#0E1E3A]">
      <Header />
      <main>
        <EventDetailView slug={slug} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
