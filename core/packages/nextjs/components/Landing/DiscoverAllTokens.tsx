"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type TokenData, TokenTable } from "~~/components/ui/TokenTable";
import { DiscoverIP } from "~~/types";
import { storageUriToProxiedImageUrl } from "~~/utils/storageMediaUrl";

export const DiscoverAllTokens = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [currentPage, setCurrentPage] = useState(1);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("tokenId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const categories = ["All categories", "Medicine", "Energy", "Engineering", "Creative", "Technology", "Resources"];

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: (currentPage - 1).toString(),
          pageSize: pageSize.toString(),
          orderBy: sortBy,
          orderDirection: sortOrder,
        });

        const trimmedSearch = debouncedSearchTerm.trim();
        if (trimmedSearch) {
          queryParams.append("name", trimmedSearch);
        }
        console.log("Fetching IPs with query:", queryParams.toString());

        if (selectedCategory !== "All categories") {
          queryParams.append("category", selectedCategory);
        }

        const response = await fetch(`/api/ip/discover?${queryParams.toString()}`);
        const data = await response.json();
        console.log(data);

        if (data && data.items) {
          const mappedTokens: TokenData[] = data.items.map((ip: DiscoverIP) => {
            const resolvedGrowth = ip.topCampaign?.growth24h ?? ip.growthPercent ?? 0;
            const raw = ip.image?.trim() ?? "";
            const icon =
              !raw || raw.includes("picsum.photos")
                ? "/assets/energy.svg"
                : (storageUriToProxiedImageUrl(raw) ?? "/assets/energy.svg");
            return {
              no: ip.tokenId,
              name: ip.name,
              icon,
              category: ip.categoryId || "Creative",
              topCampaignPrice: ip.topCampaign?.currentPrice
                ? `$${ip.topCampaign.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "",
              marketCap: `$${ip.totalEmittedLicensesValueUSD?.toLocaleString() ?? "0"}`,
              totalTradingVolume: `$${ip.totalTradingVolumeUSD?.toLocaleString() ?? "0"}`,
              totalInteractions: ip.totalInteractions?.toLocaleString() ?? "0",
              growthPercent: `${resolvedGrowth.toFixed(2)}%`,
              growthValue: resolvedGrowth,
            };
          });
          setTokens(mappedTokens);
          setTotalCount(data.totalCount);
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [currentPage, debouncedSearchTerm, selectedCategory, sortBy, sortOrder]);

  return (
    <section className="min-h-[1550px] pt-[120px] pb-[160px] flex flex-col relative overflow-hidden bg-[#070A0D]">
      {/* Background image */}
      <div className="absolute top-0 inset-x-0 h-[459px] w-full max-w-[1290px] mx-auto overflow-hidden pointer-events-none rounded-[20px] left-1/2 -translate-x-1/2">
        <Image
          src="/assets/bg.png"
          alt="background waves"
          fill
          className="object-cover object-top mix-blend-screen opacity-100"
        />
      </div>

      <div className="w-full max-w-[1290px] px-5 mx-auto z-10 flex flex-col gap-[60px]">
        {/* Header Section (top) gap 535px */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-[535px] w-full">
          <div className="w-full lg:w-[357px]">
            <h2 className="text-white m-0 font-urbanist font-light text-[35px] lg:text-[45px] leading-[130%]">
              Discover all tokens
            </h2>
          </div>
          <div className="w-full lg:w-[462px]">
            <p className="text-white m-0 font-urbanist font-normal text-[16px] leading-[130%] opacity-80">
              A comprehensive registry of tokenized patents with real-time data. Track trading volumes and price
              dynamics, and select assets based on accurate figures rather than guesswork.
            </p>
          </div>
        </div>

        {/* Frame (Table Container) */}
        <div
          className="w-full min-h-[1200px] rounded-[20px] lg:rounded-[30px] p-[20px] lg:p-[30px_40px] flex flex-col gap-[20px] relative box-border mx-auto"
          style={{
            background:
              "linear-gradient(180deg, rgba(7, 10, 13, 0.95) 0%, rgba(9, 14, 18, 0.95) 100%) padding-box, linear-gradient(180deg, #A7D2FF 0%, #04305C 100%) border-box",
            border: "2px solid transparent",
            backdropFilter: "blur(84px)",
            margin: "0 auto",
          }}
        >
          {/* Top (Filter Bar) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between w-full gap-4 mb-4">
            {/* Desktop Filter Bar (lg and above) */}
            <div className="hidden lg:flex flex-row items-center justify-between w-full h-[57px]">
              {/* Search Component */}
              <div className="w-[280px] h-full bg-[#0F1314] rounded-[10px] flex flex-row items-center p-[15px_20px] box-border border border-transparent hover:border-white/10 transition-colors shrink-0">
                <div className="relative w-[21px] h-[22px] flex items-center justify-center mr-[15px] shrink-0">
                  <div className="w-[20px] h-[20px] border border-white rounded-full absolute top-0 left-0 box-border" />
                  <div className="w-[5px] h-[5px] border border-[#555555] absolute top-[17px] left-[16px] box-border rotate-45" />
                </div>
                <input
                  type="text"
                  placeholder="Search Patent"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-[16px] leading-[130%] text-[#9FA1A1] w-full font-urbanist placeholder:text-[#9FA1A1]"
                />
              </div>

              <div className="flex flex-row items-center gap-[20px] flex-1 justify-end">
                {/* Category Selector */}
                <div className="dropdown dropdown-bottom dropdown-end w-auto">
                  <div
                    tabIndex={0}
                    role="button"
                    className="w-[230px] h-[57px] bg-[#0F1314] rounded-[10px] flex flex-row items-center justify-between p-[5px_5px_5px_15px] box-border cursor-pointer group border border-transparent hover:border-white/10 transition-colors"
                  >
                    <div className="flex flex-row items-center gap-[5px] overflow-hidden">
                      <span className="text-[16px] leading-[130%] text-[#9FA1A1] font-urbanist shrink-0">Category</span>
                      <span className="text-[16px] leading-[130%] text-white font-urbanist ml-1 truncate">
                        {selectedCategory}
                      </span>
                    </div>
                    <div className="w-[47px] h-[47px] bg-[#0F1314] rounded-[8px] flex items-center justify-center shrink-0">
                      <svg width="10" height="15" viewBox="0 0 10 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M0 0 L10 7.5 L0 15 Z"
                          fill="white"
                          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
                        />
                      </svg>
                    </div>
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[20] menu p-2 shadow-2xl bg-[#0F1314] rounded-box w-[230px] mt-1 border border-white/10 max-h-[300px] overflow-y-auto"
                  >
                    {categories.map(cat => (
                      <li key={cat}>
                        <a
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCurrentPage(1);
                            (document.activeElement as HTMLElement)?.blur();
                          }}
                          className={`text-white hover:bg-white/10 font-urbanist ${selectedCategory === cat ? "bg-white/10" : ""}`}
                        >
                          {cat}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Mobile Filter View (lg and below) */}
            <div className="lg:hidden flex flex-col gap-3 w-full">
              {/* Search Card */}
              <div className="w-full h-[64px] bg-[#0F1314] rounded-[16px] flex flex-row items-center px-5 border border-white/10">
                <div className="w-6 h-6 flex items-center justify-center mr-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="8" stroke="#9FA1A1" strokeWidth="2" />
                    <path d="M15 15L19 19" stroke="#9FA1A1" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search Patent"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-[16px] text-white w-full font-urbanist placeholder:text-[#9FA1A1]"
                />
              </div>

              {/* Category Card */}
              <div className="dropdown dropdown-bottom w-full">
                <div
                  tabIndex={0}
                  role="button"
                  className="w-full h-[64px] bg-[#0F1314] rounded-[16px] flex flex-row items-center justify-between px-5 border border-white/10"
                >
                  <span className="font-urbanist text-[16px] text-[#9FA1A1]">Category</span>
                  <div className="flex flex-row items-center gap-3">
                    <span className="font-urbanist text-[16px] text-white">{selectedCategory}</span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 1L7 6L1 11"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[20] menu p-2 shadow-2xl bg-[#0F1314] rounded-box w-full mt-1 border border-white/10 max-h-[300px] overflow-y-auto"
                >
                  {categories.map(cat => (
                    <li key={cat}>
                      <a
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentPage(1);
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                        className={`text-white hover:bg-white/10 font-urbanist py-3 ${selectedCategory === cat ? "bg-white/10" : ""}`}
                      >
                        {cat}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto xl:overflow-x-hidden relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20 rounded-xl">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : null}
            {!isLoading && tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] border border-white/10 rounded-xl bg-white/[0.02]">
                <span className="text-white/40 font-urbanist text-[18px]">No results found</span>
                <span className="text-white/20 font-urbanist text-[14px] mt-2">
                  Try adjusting your filters or search term
                </span>
              </div>
            ) : (
              <>
                <TokenTable
                  tokens={tokens}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  onRowClick={token => router.push(`/patent/${token.no}`)}
                />

                {/* Pagination */}
                {totalCount > pageSize && (
                  <div className="flex flex-row items-center justify-center gap-[10px] mt-10 mb-10">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-[45px] h-[45px] rounded-[10px] bg-[#0F1314] flex items-center justify-center border border-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <svg
                        width="8"
                        height="12"
                        viewBox="0 0 8 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="rotate-180"
                      >
                        <path
                          d="M1 1L7 6L1 11"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <div className="flex flex-row items-center gap-[8px]">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-[45px] h-[45px] rounded-[10px] flex items-center justify-center font-urbanist text-[16px] transition-all border ${
                              currentPage === pageNum
                                ? "bg-[#A7D2FF] text-[#070A0D] border-transparent font-bold shadow-[0_0_15px_rgba(167,210,255,0.4)]"
                                : "bg-[#0F1314] text-white border-white/10 hover:border-white/30"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && <span className="text-white mx-1">...</span>}
                      {totalPages > 5 && (
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-[45px] h-[45px] rounded-[10px] flex items-center justify-center font-urbanist text-[16px] transition-all border ${
                            currentPage === totalPages
                              ? "bg-[#A7D2FF] text-[#070A0D] border-transparent font-bold shadow-[0_0_15px_rgba(167,210,255,0.4)]"
                              : "bg-[#0F1314] text-white border-white/10 hover:border-white/30"
                          }`}
                        >
                          {totalPages}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-[45px] h-[45px] rounded-[10px] bg-[#0F1314] flex items-center justify-center border border-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 1L7 6L1 11"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
