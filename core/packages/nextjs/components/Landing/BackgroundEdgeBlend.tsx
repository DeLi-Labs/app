type BackgroundEdgeBlendProps = {
  className?: string;
};

/**
 * 10px edge fade: transparent toward image center, deli-main toward page background.
 */
export const BackgroundEdgeBlend = ({ className = "" }: BackgroundEdgeBlendProps) => (
  <>
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-[10px] bg-gradient-to-b from-deli-main to-transparent ${className}`}
      aria-hidden
    />
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[10px] bg-gradient-to-t from-deli-main to-transparent ${className}`}
      aria-hidden
    />
  </>
);
