import { Suspense } from "react";
import { Album } from "@/components/Album";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <Album />
    </Suspense>
  );
}
