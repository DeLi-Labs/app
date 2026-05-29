import React from "react";

const ENTRY_POINTS = [
  {
    title: "Pre-litigation",
    description:
      "Highest uncertainty, lowest entry cost, and a longer horizon. You get the unique advantage to shape the case from the very start.",
  },
  {
    title: "Active litigation",
    description:
      "Medium uncertainty. The case has already cleared filing, and the defendant's responses give a much clearer read on the merits.",
  },
  {
    title: "Post-Judgment",
    description:
      "Lowest uncertainty and the highest ROI on capital deployed. Risk is strictly bounded by defendant recoverability.",
  },
] as const;

const gradientCircleStyle = {
  background: "linear-gradient(89.91deg, #054686 -18.11%, #A7D2FF 81.73%)",
};

const lineGradientHorizontal =
  "linear-gradient(89.91deg, rgba(7, 10, 13, 0) 0.15%, #054686 5.89%, #A7D2FF 89.33%, rgba(7, 10, 13, 0) 98.3%)";

const lineGradientVertical =
  "linear-gradient(180deg, rgba(7, 10, 13, 0) 0.15%, #054686 5.89%, #A7D2FF 89.33%, rgba(7, 10, 13, 0) 98.3%)";

const horizontalLineStyle: React.CSSProperties = {
  borderTop: "4px solid transparent",
  borderImageSource: lineGradientHorizontal,
  borderImageSlice: 1,
};

const verticalLineStyle: React.CSSProperties = {
  width: 0,
  borderLeft: "4px solid transparent",
  borderImageSource: lineGradientVertical,
  borderImageSlice: 1,
};

const GradientCircle = ({ className }: { className?: string }) => (
  <div
    className={`relative z-10 size-10 shrink-0 rounded-full ${className ?? ""}`}
    style={gradientCircleStyle}
  />
);

export const PickYourEntryPoint = () => {
  return (
    <section className="relative w-full flex flex-col items-center overflow-hidden bg-deli-main py-24">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[84px] px-5 lg:px-[75px]">
        <h2 className="text-h2 m-0 text-left text-deli-white">Pick your entry point</h2>

        {/* Desktop */}
        <div className="hidden w-full flex-col gap-[25px] lg:flex">
          <div className="grid grid-cols-3 gap-16 xl:gap-24">
            {ENTRY_POINTS.map(({ title }) => (
              <h3 key={title} className="text-h5 m-0 text-deli-white">
                {title}
              </h3>
            ))}
          </div>

          <div className="relative grid grid-cols-3 items-center gap-16 xl:gap-24">
            <div
              className="pointer-events-none absolute top-1/2 right-0 left-0 z-0 h-0 -translate-y-1/2"
              style={horizontalLineStyle}
            />
            {ENTRY_POINTS.map(({ title }) => (
              <GradientCircle key={title} />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-16 xl:gap-24">
            {ENTRY_POINTS.map(({ title, description }) => (
              <p key={title} className="text-body-2 m-0 text-deli-white">
                {description}
              </p>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="relative flex w-full flex-col gap-20 lg:hidden">
          <div
            className="pointer-events-none absolute top-0 bottom-0 left-5 z-0 -translate-x-1/2"
            style={verticalLineStyle}
          />
          {ENTRY_POINTS.map(({ title, description }) => (
            <div key={title} className="flex gap-[25px]">
              <div className="flex w-10 shrink-0 items-center justify-center self-stretch">
                <GradientCircle />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3 text-deli-white">
                <h3 className="text-h5 m-0">{title}</h3>
                <p className="text-body-2 m-0">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
