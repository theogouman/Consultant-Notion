import Image from "next/image";
import Link from "next/link";
import CtaButton from "@/components/ui/CtaButton";
import { footer } from "@/lib/content";

/** En-tête collant, sobre. Logo à gauche, CTA unique à droite. */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="#top" className="flex items-center gap-2.5 font-bold tracking-tight">
          <Image
            src="/images/Annexes/theo-gouman-avatar.png"
            alt="Théo Gouman"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-md object-contain"
          />
          <span className="text-ink">{footer.name}</span>
        </Link>
        <CtaButton className="!px-5 !py-2.5 !text-sm">
          Prendre rendez-vous
        </CtaButton>
      </div>
    </header>
  );
}
