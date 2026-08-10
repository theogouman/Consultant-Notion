import BookingModalProvider from "@/modules/booking/components/BookingModalProvider";
import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import ProofBar from "@/components/sections/ProofBar";
import ProcessStack from "@/components/sections/ProcessStack";
import CaseStudies from "@/components/sections/CaseStudies";
import About from "@/components/sections/About";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import Footer from "@/components/sections/Footer";

/**
 * Landing one-page consultant-notion.fr.
 * Rendu build-time + ISR : le contenu Notion (études de cas) se rafraîchit
 * toutes les heures sans redéploiement.
 *
 * Le CTA unique ouvre le modal de réservation (booker maison) : choix du
 * créneau puis formulaire de qualification, sans quitter la page.
 */
export const revalidate = 3600;

export default function Home() {
  return (
    <BookingModalProvider>
      <Header />
      <main>
        <Hero />
        <ProofBar />
        <ProcessStack />
        <CaseStudies />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </BookingModalProvider>
  );
}
