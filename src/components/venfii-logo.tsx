import Image from "next/image";

export function VenfiiLogo({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/venfii-logo.png"
        alt="venfii"
        width={314}
        height={266}
        priority
        className={`h-10 w-auto object-contain ${
          onDark ? "md:drop-shadow-[0_1px_4px_rgba(255,255,255,0.35)]" : ""
        }`}
      />
    </span>
  );
}