"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import CardHeader from "@/components/layout/CardHeader";

const PROTECTED = [
  "/dashboard",
  "/alunos",
  "/professores",
  "/matriculas",
  "/recepcao",
  "/financeiro",
  "/portal",
  "/admin",
];

/** Espaçamentos já validados por você */
const CONTENT_GAP_PX = 28;
const OUTER_PADDING_TOP_PX = 20;
const OUTER_PADDING_RIGHT_PX = 20;
const OUTER_PADDING_BOTTOM_PX = 24;
const CARD_PADDING_PX = 32;
const CARD_RADIUS_PX = 40;
const CARD_SHADOW = "rgba(149, 157, 165, 0.2) 0px 8px 24px";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();

  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  const shouldShowSPA =
    isProtected && (status === "authenticated" || status === "loading");

  // Health ping em dev
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const w = window as unknown as { __alusaHealthCalled?: boolean };
      if (!w.__alusaHealthCalled) {
        w.__alusaHealthCalled = true;
        fetch("/api/health", { cache: "no-store" }).catch(() => {});
      }
    }
  }, []);

  // largura inicial da sidebar
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (!root.style.getPropertyValue("--sidebar-w")) {
        root.style.setProperty("--sidebar-w", "262px");
      }
    }
  }, []);

  if (!shouldShowSPA) return <>{children}</>;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden app-surface-bg"
    >
      <Sidebar />

      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          paddingLeft: `calc(var(--sidebar-w,262px) + ${CONTENT_GAP_PX}px)`,
        }}
      >
        <div
          style={{
            paddingTop: OUTER_PADDING_TOP_PX,
            paddingRight: OUTER_PADDING_RIGHT_PX,
            paddingBottom: OUTER_PADDING_BOTTOM_PX,
          }}
        >
          <div
            className="w-full"
            style={{
              minHeight: `calc(100vh - ${OUTER_PADDING_TOP_PX + OUTER_PADDING_BOTTOM_PX}px)`,
              background: "#FFFFFF",
              borderRadius: CARD_RADIUS_PX,
              padding: CARD_PADDING_PX,
              boxShadow: CARD_SHADOW,
            }}
          >
            <CardHeader />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
