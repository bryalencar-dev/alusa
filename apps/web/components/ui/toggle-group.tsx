import React, { createContext, useContext, useId, useState, useRef, useCallback } from 'react';

type ToggleGroupType = 'single';

interface ToggleGroupContextValue {
  value: string | undefined;
  setValue: (_v: string) => void;
}

const ToggleGroupCtx = createContext<ToggleGroupContextValue | null>(null);

interface ToggleGroupProps {
  type?: ToggleGroupType; // apenas 'single' suportado por enquanto
  value?: string;
  defaultValue?: string;
  onValueChange?: (_value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ToggleGroup({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled,
  className = '',
  children,
}: ToggleGroupProps) {
  if (type !== 'single') {
    console.warn('[ToggleGroup] apenas type="single" é suportado atualmente.');
  }

  const [uncontrolled, setUncontrolled] = useState<string | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolled;

  const setValue = useCallback(
    (v: string) => {
      if (!isControlled) setUncontrolled(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange],
  );

  const id = useId();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!containerRef.current) return;
      const buttons = Array.from(
        containerRef.current.querySelectorAll<HTMLButtonElement>('button[data-toggle-item]'),
      );
      if (buttons.length === 0) return;
      const idx = buttons.findIndex((b) => b.getAttribute('data-value') === value);
      const focusAt = (i: number) => {
        const btn = buttons[i];
        if (btn) btn.focus();
        const val = btn?.getAttribute('data-value');
        if (val && val !== value) setValue(val);
      };
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          focusAt((idx + 1) % buttons.length);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          focusAt((idx - 1 + buttons.length) % buttons.length);
          break;
        case 'Home':
          e.preventDefault();
          focusAt(0);
          break;
        case 'End':
          e.preventDefault();
          focusAt(buttons.length - 1);
          break;
      }
    },
    [value, setValue],
  );

  return (
    <div
      role="tablist"
      aria-disabled={disabled || undefined}
      data-toggle-group
      ref={containerRef}
      onKeyDown={handleKey}
      className={`inline-flex gap-1 rounded-md border border-gray-200 bg-white p-1 text-xs font-medium ${className}`}
      id={id}
    >
      <ToggleGroupCtx.Provider value={{ value, setValue }}>{children}</ToggleGroupCtx.Provider>
    </div>
  );
}

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  disabled?: boolean;
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
      className={`rounded-md px-4 h-9 text-sm transition-colors
        ${active ? 'bg-violet-600 text-white' : 'hover:bg-violet-50 text-gray-900'}
        ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
