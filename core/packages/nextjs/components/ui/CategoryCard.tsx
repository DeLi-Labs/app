import Image from "next/image";

export interface CategoryCardProps {
  name: string;
  patents: number | string;
  icon: string;
  strokeGradient: string;
  glowColor: string;
  marketCap?: string;
  change24h?: string;
  topToken?: string;
  isLoading?: boolean;
  isError?: boolean;
}

export const CategoryCard = ({
  name,
  patents,
  icon,
  strokeGradient,
  glowColor,
  marketCap,
  change24h,
  topToken,
  isLoading,
  isError,
}: CategoryCardProps) => (
  <div
    className="w-[380px] min-w-[380px] h-[204px] shrink-0 snap-center rounded-[20px] p-[20px] relative group hover:scale-[1.05] transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-[var(--hover-glow)] border border-transparent [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--category-card-stroke)_border-box]"
    style={
      {
        "--hover-glow": `0px 4px 24px 0px ${glowColor}`,
        "--category-card-stroke": strokeGradient,
      } as React.CSSProperties
    }
  >
    {/* Dotted Texture Layer clipped by an Ellipse */}
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[20px]"
      style={{
        maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 100%)",
      }}
    >
      <Image
        src="/assets/category-bg.svg"
        alt="Texture"
        fill
        className="object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300"
      />
    </div>
    <div className="relative z-10 flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Image src={`/assets/${icon}.svg`} alt={name} width={31} height={31} />
        {/* Header-4: Urbanist 400, 26px */}
        <h3 className="text-h4 text-deli-white m-0 leading-none">{name}</h3>
      </div>
      {/* Body-2: Urbanist 400, 16px */}
      {isLoading ? (
        <div className="h-4 w-32 bg-white/10 animate-pulse rounded mt-1" />
      ) : isError ? (
        <p className="text-body-2 text-red-400 m-0">Error loading patents</p>
      ) : (
        <p className="text-body-2 text-deli-grey-light m-0">Number of Patents: {patents}</p>
      )}
    </div>

    <div className="flex flex-col gap-[10px] mt-auto relative z-10">
      {/* 
          stat: pill frame 
          Labels row in a dark pill container 
      */}
      <div className="relative rounded-[40px] bg-[#0F1314] px-[24px] py-[7px] flex justify-between items-center overflow-hidden border border-white/5">
        <span className="text-body-3-caps text-deli-grey-light relative z-10 whitespace-nowrap">market cap</span>
        <span className="text-body-3-caps text-deli-grey-light relative z-10 whitespace-nowrap">24h change</span>
        <span className="text-body-3-caps text-deli-grey-light relative z-10 whitespace-nowrap">top token</span>
      </div>

      {/* 
          info: values row 
          The row with financial data separated by decorative vertical dividers 
      */}
      <div className="flex justify-between items-center px-[25px] flex-nowrap min-h-[40px]">
        {isLoading ? (
          <div className="h-4 w-16 bg-white/10 animate-pulse rounded" />
        ) : isError ? (
          <span className="text-body-3-caps text-red-400 font-medium whitespace-nowrap">Error</span>
        ) : (
          <span className="text-body-3-caps text-deli-white font-medium whitespace-nowrap">{marketCap || "--"}</span>
        )}

        {/* Vertical divider line with custom gradient */}
        <div
          className="w-[1px] h-[40px] shrink-0 mx-2"
          style={{
            background: "linear-gradient(136deg, rgba(167, 210, 255, 1) 0%, rgba(4, 48, 92, 0) 100%)",
          }}
        />

        {isLoading ? (
          <div className="h-4 w-12 bg-white/10 animate-pulse rounded" />
        ) : isError ? (
          <span className="text-body-3-caps text-red-400 font-medium whitespace-nowrap">Error</span>
        ) : (
          <span
            className={`text-body-3-caps font-medium whitespace-nowrap ${change24h?.startsWith("-") ? "text-red-400" : "text-[#34eeb6]"}`}
          >
            {change24h || "--"}
          </span>
        )}

        <div
          className="w-[1px] h-[40px] shrink-0 mx-2"
          style={{
            background: "linear-gradient(136deg, rgba(167, 210, 255, 1) 0%, rgba(4, 48, 92, 0) 100%)",
          }}
        />

        {isLoading ? (
          <div className="h-4 w-16 bg-white/10 animate-pulse rounded" />
        ) : isError ? (
          <span className="text-body-3-caps text-red-400 font-medium whitespace-nowrap">Error</span>
        ) : (
          <span className="text-body-3-caps text-deli-white font-medium whitespace-nowrap">{topToken || "--"}</span>
        )}
      </div>
    </div>
  </div>
);
