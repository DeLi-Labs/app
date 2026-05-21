"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());

type SubscribeStatus = "idle" | "loading" | "success";

export const SubscribeSection = () => {
  const [email, setEmail] = useState("");
  const [showInvalidEmail, setShowInvalidEmail] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  const handleSubscribe = async () => {
    if (!isValidEmail(email)) {
      setShowInvalidEmail(true);
      setSubmitError(false);
      setStatus("idle");
      return;
    }

    setShowInvalidEmail(false);
    setSubmitError(false);
    setStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          setShowInvalidEmail(true);
        } else {
          setSubmitError(true);
        }
        setStatus("idle");
        return;
      }

      setStatus("success");
      window.setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch {
      setSubmitError(true);
      setStatus("idle");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (showInvalidEmail) {
      setShowInvalidEmail(false);
    }
    if (submitError) {
      setSubmitError(false);
    }
    if (status !== "idle") {
      setStatus("idle");
    }
  };

  return (
    <div className="relative z-10 flex w-full justify-center overflow-hidden py-10">
      <div className="relative mx-auto w-full max-w-[1440px] min-h-[425px] overflow-hidden rounded-[20px] bg-[rgba(0,0,0,0.5)]">
        {/* Background Blur Ellipse */}
        <div className="absolute w-[291px] h-[291px] -left-[49px] -top-[44px] bg-[linear-gradient(135.75deg,#010E6D_21.8%,rgba(1,14,109,0.5)_94.06%)] blur-[72px]" />

        <div className="relative z-10 flex min-h-[425px] w-full flex-col items-center justify-center px-5 py-16 lg:flex-row lg:px-[75px] lg:py-0">
          {/* Content Frame */}
          <div className="relative flex w-full max-w-[545px] flex-col items-center gap-[22px]">
            {/* top */}
            <div className="flex w-full flex-col items-center gap-[10px]">
              <h2 className="font-urbanist font-light text-[35px] lg:text-[45px] leading-[130%] text-center text-white m-0">
                Don’t miss a thing
              </h2>
              <p className="font-urbanist font-normal text-[18px] lg:text-[21px] leading-[130%] text-center text-[#9FA1A1] m-0">
                Stay tuned to new case openings and project updates
              </p>
            </div>

            {/* bottom / form */}
            <div className="flex w-full flex-col items-center justify-center gap-[10px] sm:flex-row sm:items-start">
              <div className="flex w-full shrink-0 flex-col sm:w-[400px]">
                <div className="relative h-[43px] shrink-0 rounded-[10px] bg-[#0F1314]">
                  <input
                    type="email"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    placeholder="Enter your email"
                    className="absolute inset-0 border-none bg-transparent px-[23px] font-urbanist font-normal text-[16px] leading-[130%] text-white outline-none placeholder-[#555555]"
                  />
                </div>
                {showInvalidEmail && (
                  <p className="font-urbanist m-0 mt-2 text-[14px] leading-[130%] text-[var(--deli-status-invalid)]">
                    Invalid email
                  </p>
                )}
                {submitError && (
                  <p className="font-urbanist m-0 mt-2 text-[14px] leading-[130%] text-[var(--deli-status-invalid)]">
                    Could not send email. Try again later.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={status === "loading"}
                  className="flex h-[41px] w-full shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-white px-[30px] py-[10px] transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-80 sm:w-[144px]"
                >
                  <span className="whitespace-nowrap text-center font-urbanist font-normal text-[16px] leading-[130%] text-[#070A0D]">
                    Subscribe
                  </span>
                </button>

                {status === "loading" && (
                  <span className="loading loading-spinner loading-md text-deli-accent shrink-0" aria-hidden />
                )}
                {status === "success" && (
                  <CheckCircleIcon
                    className="h-7 w-7 shrink-0 text-[var(--deli-status-valid)]"
                    aria-label="Subscribed"
                  />
                )}
              </div>
            </div>
          </div>

          {/* DNA Video Background - Repositioned for Mobile */}
          <div className="relative mt-10 h-[300px] w-full overflow-hidden lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:block lg:h-full lg:w-[425px]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="mask-image-gradient h-full w-full rotate-90 rounded-[20px] object-cover"
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
    </div>
  );
};
