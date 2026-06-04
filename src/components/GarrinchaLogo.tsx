import Image from "next/image";

interface GarrinchaLogoProps {
  height?: number;
  variant?: "white" | "black";
  style?: React.CSSProperties;
  /** @deprecated use height/variant instead */
  compact?: boolean;
}

export function GarrinchaLogo({ height = 20, variant = "white", style = {} }: GarrinchaLogoProps) {
  const src = variant === "black" ? "/garrincha-black.png" : "/garrincha-white.png";
  return (
    <Image
      src={src}
      alt="GARRINCHA"
      height={height}
      width={height * 6}
      style={{ height, width: "auto", display: "block", ...style }}
      priority
    />
  );
}
