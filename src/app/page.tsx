import QualificationProvider from "@/components/form/QualificationProvider";
import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import ProofBar from "@/components/sections/ProofBar";
import Process from "@/components/sections/Process";
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
 * Le CTA unique ouvre le formulaire de qualification en modal (multi-étapes) —
 * QualificationProvider expose l'ouverture à tous les CtaButton de la page.
 */
export const revalidate = 3600;

export default function Home() {
  return (
    <QualificationProvider>
      <Header />
      <main>
        <Hero />
        <ProofBar />
        <Process />
        <CaseStudies />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </QualificationProvider>
  );
}
