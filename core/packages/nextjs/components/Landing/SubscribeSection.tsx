export const SubscribeSection = () => {
  return (
    <div className="w-full flex justify-center py-10 relative z-10 overflow-hidden px-5">
      <div className="relative w-full max-w-[1290px] min-h-[425px] rounded-[20px] overflow-hidden bg-[rgba(0,0,0,0.5)] flex flex-col lg:flex-row items-center justify-center py-16 lg:py-0">
        {/* Background Blur Ellipse */}
        <div className="absolute w-[291px] h-[291px] -left-[49px] -top-[44px] bg-[linear-gradient(135.75deg,#010E6D_21.8%,rgba(1,14,109,0.5)_94.06%)] blur-[72px]" />

        {/* Content Frame */}
        <div className="relative z-10 w-full max-w-[545px] flex flex-col items-center gap-[22px] px-5">
          {/* top */}
          <div className="flex flex-col items-center gap-[10px] w-full">
            <h2 className="font-urbanist font-light text-[35px] lg:text-[45px] leading-[130%] text-center text-white m-0">
              Don’t miss a thing
            </h2>
            <p className="font-urbanist font-normal text-[18px] lg:text-[21px] leading-[130%] text-center text-[#9FA1A1] m-0">
              Stay tuned to new patent launches and project updates
            </p>
          </div>

          {/* bottom / form */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-[10px] w-full">
            <div className="w-full sm:w-[400px] h-[43px] bg-[#0F1314] rounded-[10px] relative shrink-0">
              <input
                placeholder="Enter your email"
                className="absolute inset-0 px-[23px] bg-transparent outline-none border-none font-urbanist font-normal text-[16px] leading-[130%] text-white placeholder-[#555555]"
              />
            </div>

            <button className="flex items-center justify-center px-[30px] py-[10px] w-full sm:w-[144px] h-[41px] bg-white rounded-[10px] border-none cursor-pointer shrink-0 hover:bg-gray-200 transition-colors">
              <span className="font-urbanist font-normal text-[16px] leading-[130%] text-center text-[#070A0D] whitespace-nowrap">
                Subscribe
              </span>
            </button>
          </div>
        </div>

        {/* DNA Video Background - Repositioned for Mobile */}
        <div className="relative lg:absolute lg:right-0 lg:top-0 w-full lg:w-[425px] h-[300px] lg:h-full overflow-hidden mt-10 lg:mt-0 lg:block">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover rounded-[20px] rotate-90 mask-image-gradient"
            style={{
              maskImage: "linear-gradient(to top, transparent 0%, black 25%, black 100%)",
              WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 25%, black 100%)",
            }}
          >
            <source src="/assets/dna.mov" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
};
