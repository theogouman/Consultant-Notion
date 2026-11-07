import type { ComponentType } from "react";
import type { AnimationNom } from "@/content/ressources/types";
import MemoireIaAnimation from "./MemoireIaAnimation";

/** Animations codées utilisables comme média de hero (`media.type = "animation"`). */
export const animations: Record<AnimationNom, ComponentType<{ label: string }>> = {
  "memoire-ia": MemoireIaAnimation,
};
