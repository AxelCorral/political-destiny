"use client";

import dynamic from "next/dynamic";

export const CastingLoader = dynamic(() => import("./casting-gallery"), {
  ssr: false,
  loading: () => <div className="h-[78vh] w-full animate-pulse rounded-2xl bg-[#efe7da]" />,
});

export const AiTrialLoader = dynamic(() => import("./ai-trial"), {
  ssr: false,
  loading: () => <div className="h-[50vh] w-full animate-pulse rounded-2xl bg-[#efe7da]" />,
});

export const DecorsLoader = dynamic(() => import("./decors-showcase"), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-[#efe7da]" />,
});
