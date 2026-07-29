/** Conteneur de section : largeur max + rythme vertical cohérent. */
export default function Section({
  id,
  children,
  className = "",
  width = "default",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  const max =
    width === "narrow"
      ? "max-w-3xl"
      : width === "wide"
        ? "max-w-6xl"
        : "max-w-5xl";
  return (
    <section
      id={id}
      className={`mx-auto w-full px-5 py-20 sm:px-8 sm:py-28 ${max} ${className}`}
    >
      {children}
    </section>
  );
}
