"use client";

import { cn } from "@/lib/cn";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

export type IntegrationStatusVariant = "default" | "success" | "warning" | "error";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  status: { label: string; variant?: IntegrationStatusVariant; helper?: string };
}

const statusColors: Record<IntegrationStatusVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  error: "bg-rose-100 text-rose-800",
};

export function IntegrationCard({ title, description, icon, onClick, status }: IntegrationCardProps) {
  const variant = status.variant ?? "default";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition-colors duration-200 hover:bg-gray-50"
    >
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-brand-accent flex items-center justify-center overflow-hidden">
          {icon}
        </div>
        <div>
          <p className="flex items-center gap-1 text-base font-semibold text-gray-900">
            {title}
            <ArrowUpRightIcon className="h-4 w-4 text-gray-400 transition group-hover:text-brand-accent" />
          </p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-right">
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusColors[variant])}>
          {status.label}
        </span>
        {status.helper ? <span className="text-xs text-gray-500">{status.helper}</span> : null}
      </div>
    </button>
  );
}
