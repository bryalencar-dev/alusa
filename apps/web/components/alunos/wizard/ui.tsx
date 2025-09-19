"use client";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { IMaskInput } from "react-imask";

export function StepHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      <div />
    </div>
  );
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-5">{children}</div>;
}

export function FieldLabel({ children, required = false, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">
      {children} {required && <span aria-hidden="true" className="text-red-600">*</span>}
    </label>
  );
}

export function FieldError({ name }: { name: string }) {
  const { formState } = useFormContext();
  const parts = name.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let curr: any = formState.errors;
  for (const p of parts) {
    curr = curr?.[p];
    if (!curr) break;
  }
  if (!curr?.message) return null;
  return <p className="mt-1 text-[11px] text-red-600">{String(curr.message)}</p>;
}

export function IMaskControlled({
  name,
  mask,
  placeholder = "",
  ariaLabel,
  id,
}: {
  name: string;
  mask: string | string[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
}) {
  const ctx = useFormContext() as unknown as {
    watch: (_: string) => unknown;
    setValue: (_: string, _v: unknown, _o?: unknown) => void;
  };
  const raw = ctx.watch(name);
  const val = typeof raw === "string" ? raw : "";
  return (
    <IMaskInput
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mask={mask as any}
      value={val}
      onAccept={(v: unknown) => ctx.setValue(name, String(v), { shouldValidate: false })}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
      placeholder={placeholder}
      aria-label={ariaLabel}
      id={id}
    />
  );
}
