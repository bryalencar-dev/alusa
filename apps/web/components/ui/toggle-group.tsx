import { useRef, useState, useLayoutEffect, useCallback } from 'react';

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}

export function ToggleGroup({ value, onValueChange, options, className = '' }: ToggleGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // fallback defensivo para options
  const safeOptions = Array.isArray(options) ? options : [];

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const btn = containerRef.current.querySelector<HTMLButtonElement>(
      `button[data-value='${value}']`
    );
    if (!btn) return setIndicator(null);
    const btnRect = btn.getBoundingClientRect();
    const contRect = containerRef.current.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - contRect.left + containerRef.current.scrollLeft,
      width: btnRect.width,
    });
  }, [value]);

  useLayoutEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={`relative inline-flex gap-2 rounded-lg border border-gray-200 bg-gray-100 p-1.5 shadow-sm ${className}`}
    >
      {indicator && (
        <div
          aria-hidden
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: 'all 0.3s cubic-bezier(.4,1,.4,1)',
          }}
          className="absolute inset-y-1 rounded-sm bg-white shadow z-0"
        />
      )}
      {safeOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          data-value={opt.value}
          tabIndex={value === opt.value ? 0 : -1}
          onClick={() => onValueChange(opt.value)}
          className={`relative z-10 rounded-md px-4 h-9 text-sm font-medium transition-colors duration-150
            ${value === opt.value ? 'text-[#8B3DFF]' : 'text-gray-800'}
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3DFF]/40`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ToggleGroupItem({
  value,
  className = '',
  disabled,
  children,
  ...rest
}: ToggleGroupItemProps) {
  const ctx = useContext(ToggleGroupCtx);
  if (!ctx) throw new Error('ToggleGroupItem deve estar dentro de <ToggleGroup>');

  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      data-state={active ? 'on' : 'off'}
      data-toggle-item
      data-value={value}
      onClick={() => {
        if (disabled) return;
        if (!active) ctx.setValue(value);
      }}
      style={undefined}
      className={`relative z-10 rounded-md px-4 h-9 text-sm font-medium transition-colors duration-150
        ${active ? 'text-[#8B3DFF]' : 'text-gray-800'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B3DFF]/40
        ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
