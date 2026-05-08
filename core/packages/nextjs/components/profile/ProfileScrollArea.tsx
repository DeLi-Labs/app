"use client";

import { type ReactNode } from "react";
import { DeliCustomScrollArea } from "~~/components/profile/DeliCustomScrollArea";

type ProfileScrollAreaProps = {
  children: ReactNode;
  maxHeightPx: number;
};

export const ProfileScrollArea = ({ children, maxHeightPx }: ProfileScrollAreaProps) => (
  <DeliCustomScrollArea maxHeightPx={maxHeightPx} className="h-full w-full">
    {children}
  </DeliCustomScrollArea>
);
