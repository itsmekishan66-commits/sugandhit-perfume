import { useState } from 'react';

interface ImagePreviewProps {
  src: string;
  alt: string;
  /** Classes for the loaded image (sizing, rounding, borders…). */
  className: string;
  /** Classes for the failure box (same sizing, plus error styling). */
  errorClassName: string;
  /** Optional short text shown inside the failure box; a tooltip always explains the cause. */
  errorLabel?: string;
}

/**
 * Renders an image, but swaps in a clearly-marked placeholder when the URL
 * cannot be loaded — e.g. it points at a web page instead of an image file
 * (`text/html` instead of `image/jpeg`). The tooltip tells the editor what to
 * fix. Retries automatically when `src` changes.
 */
const ImagePreview = ({ src, alt, className, errorClassName, errorLabel }: ImagePreviewProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src) return null;

  if (failedSrc === src) {
    return (
      <div
        className={errorClassName}
        title="This image URL can't be loaded. It must link directly to an image file (usually ends in .jpg, .png or .webp), not to a web page like an Unsplash or iStock photo link."
        role="img"
        aria-label={`${alt}: image link could not be loaded`}
      >
        <span aria-hidden="true">⚠</span>
        {errorLabel && <span>{errorLabel}</span>}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
};

export default ImagePreview;
