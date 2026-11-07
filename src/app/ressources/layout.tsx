import BookingModalProvider from "@/modules/booking/components/BookingModalProvider";
import Header from "@/components/sections/Header";
import Footer from "@/components/sections/Footer";

/**
 * Enveloppe de toutes les pages /ressources : même Header/Footer que la home
 * et le MÊME `BookingModalProvider` (un seul modal, aucun doublon). Tout
 * `CtaButton` d'une ressource ouvre donc la prise de rendez-vous, et `?l=1`
 * l'ouvre directement à l'arrivée.
 */
export default function RessourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <BookingModalProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </BookingModalProvider>
  );
}
