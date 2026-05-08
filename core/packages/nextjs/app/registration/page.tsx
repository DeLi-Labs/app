"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { CrumbsNavigation } from "~~/components/CrumbsNavigation";
import { DELI_LOGO } from "~~/components/assets/common";

const BG_IMAGE_PATH = "/1ebc2ecddac10f1215f1374e9fb172e8666b439f.jpg";

export default function RegistrationPage() {
  const router = useRouter();
  const { status } = useAccount();
  const { login } = usePrivy();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (status !== "connected" || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    router.push("/profile");
  }, [status, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-deli-main px-[10px] pb-8 pt-34 lg:px-[75px]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45vh] min-h-[240px] max-h-[520px] lg:h-1/2 lg:min-h-0 lg:max-h-none"
        aria-hidden="true"
      >
        <div
          className="h-full w-full bg-cover bg-left-bottom bg-no-repeat lg:bg-center"
          style={{
            backgroundImage: `url(${BG_IMAGE_PATH})`,
            mixBlendMode: "screen",
            opacity: 0.95,
            transform: "rotate(-180deg)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-16"
          style={{
            background: "linear-gradient(to bottom, var(--deli-main) 0%, rgba(7,10,13,0) 75%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-72px)] flex-col gap-4">
        <CrumbsNavigation />

        <section className="flex w-full flex-col gap-[60px] lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="text-h3 text-deli-white">Welcome to Labs</div>
            <div className="text-h4 text-deli-white">Launch, sell and manage your IP</div>
          </div>

          <div className="flex w-full max-w-[450px] flex-col items-center gap-5 self-center text-center lg:w-[450px] lg:max-w-none lg:shrink-0 lg:self-start">
            <div className="text-h4 text-deli-white">Sign In to Labs</div>

            <button
              type="button"
              onClick={login}
              className="box-border flex h-[65px] w-full cursor-pointer items-center justify-center rounded-xl border border-transparent bg-deli-main text-h6 text-deli-white"
              style={{
                border: "1px solid transparent",
                backgroundImage: "linear-gradient(var(--deli-main),var(--deli-main)), var(--deli-stroke-main)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
            >
              Sign In
            </button>

            <p className="max-w-[420px] text-body-3 text-deli-grey">
              By logging in, I agree to the Terms of Service and Privacy Policy
            </p>

            <div className="flex w-full justify-center pt-[25px]">{DELI_LOGO}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
