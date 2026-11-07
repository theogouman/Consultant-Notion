"use client";

import { useEffect } from "react";
import { captureRessourceAcquisition } from "@/modules/booking/lib/acquisition";

/**
 * Attribution CRM d'une page ressource : `ressource⎜<slug>`, sauf si une
 * attribution existe déjà (ex. `?source=linkedin`), qui reste prioritaire.
 */
export default function RessourceAttribution({ slug }: { slug: string }) {
  useEffect(() => {
    captureRessourceAcquisition(slug);
  }, [slug]);
  return null;
}
