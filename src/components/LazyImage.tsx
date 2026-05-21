import { ImgHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Image with native lazy loading + async decoding + a soft skeleton until it
 * paints. Falls back to a neutral background on error.
 */
export function LazyImage({ src, alt, className, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className={cn("relative bg-muted", className)}>
      {!loaded && !errored && <div className="absolute inset-0 animate-pulse bg-muted" />}
      {!errored && (
        <img
          {...rest}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Image unavailable
        </div>
      )}
    </div>
  );
}
