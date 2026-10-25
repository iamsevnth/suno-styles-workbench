// Imported with ?inline so the images are part of the code: the offline single-file build then
// carries them too, and the CSP's img-src data: allows them on both the site and the offline file.
import logoFull from "../../assets/brand/logo-full.webp?inline";
import logoMark from "../../assets/brand/logo-mark.webp?inline";

/** The cube-and-sound-bars mark, for the header and tool pages. Decorative: its link or heading names it. */
export function LogoMark({ height = 32, className = "" }: { height?: number; className?: string }) {
  return (
    <img
      src={logoMark}
      alt=""
      aria-hidden="true"
      width={Math.round((height * 156) / 96)}
      height={height}
      className={`shrink-0 ${className}`}
      decoding="async"
    />
  );
}

/** The full Suno Workbench Styles Pro logo with its wordmark. */
export function LogoFull({ width = 360, className = "" }: { width?: number; className?: string }) {
  return (
    <img
      src={logoFull}
      alt="Suno Workbench Styles Pro"
      width={width}
      height={Math.round((width * 517) / 720)}
      className={`h-auto max-w-full ${className}`}
      decoding="async"
    />
  );
}
