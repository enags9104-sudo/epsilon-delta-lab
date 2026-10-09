import type { ReactNode } from 'react';
import './ui.css';

/* ============================================================
   按钮
   ============================================================ */

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost' | 'del';
  size?: 'md' | 'sm';
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  full?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'outline',
  size = 'md',
  icon,
  active,
  disabled,
  title,
  full,
}: BtnProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${active ? 'is-active' : ''} ${
        full ? 'is-full' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
    >
      {icon && <span className="btn-ico">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

/* ============================================================
   对数刻度滑杆
   ============================================================ */

interface SliderProps {
  label: ReactNode;
  value: number;
  /** 归一化位置 0–1 */
  position: number;
  display: string;
  onChange: (pos: number) => void;
  tone: 'eps' | 'del';
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

export function LogSlider({
  label,
  value,
  position,
  display,
  onChange,
  tone,
  min = 0,
  max = 1,
  step = 0.001,
  hint,
}: SliderProps) {
  return (
    <div className={`lsl lsl-${tone}`}>
      <div className="lsl-head">
        <span className="lsl-label">{label}</span>
        <span className="lsl-value mono">{display}</span>
      </div>
      <div className="lsl-track-wrap">
        <input
          className="lsl-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={position}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={typeof label === 'string' ? label : tone}
          aria-valuetext={display}
          data-tone={tone}
          data-testid={`slider-${tone}`}
        />
        <div className="lsl-fill" style={{ width: `${position * 100}%` }} />
      </div>
      {hint && <p className="lsl-hint">{hint}</p>}
      <span className="sr-only">当前值 {value}</span>
    </div>
  );
}

/* ============================================================
   分段控制
   ============================================================ */

interface SegmentedProps<T extends string> {
  options: { value: T; label: ReactNode; hint?: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`seg-btn ${value === o.value ? 'is-on' : ''}`}
          onClick={() => onChange(o.value)}
          title={o.hint}
          data-testid={`seg-${o.value}`}
        >
          {o.icon && <span className="seg-ico">{o.icon}</span>}
          <span className="seg-txt">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   开关
   ============================================================ */

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: string;
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className={`tgl ${checked ? 'is-on' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="tgl-box" aria-hidden>
        <span className="tgl-knob" />
      </span>
      <span className="tgl-body">
        <span className="tgl-label">{label}</span>
        {hint && <span className="tgl-hint">{hint}</span>}
      </span>
    </label>
  );
}

/* ============================================================
   科室标签（章节题注）
   ============================================================ */

export function Eyebrow({
  children,
  icon,
  tone = 'ink',
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: 'ink' | 'eps' | 'del' | 'ok';
}) {
  return (
    <span className={`eyebrow eyebrow-${tone}`}>
      {icon && <span className="eyebrow-ico">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
