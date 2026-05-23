import React from "react";
import ThemeTogglerTwo from "../../shared/components/common/ThemeTogglerTwo";

// ── Warehouse / Inventory SVG Illustration ─────────────────────────────────
// Cores claras sobre fundo escuro — funciona igual em light e dark mode
const WarehouseIllustration: React.FC = () => (
  <svg
    viewBox="0 0 480 370"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[400px]"
    aria-hidden="true"
  >
    {/* Background rings */}
    <circle cx="240" cy="185" r="195" fill="rgba(255,255,255,0.018)" />
    <circle cx="240" cy="185" r="148" fill="rgba(255,255,255,0.025)" />

    {/* ── Shelving structure ── */}
    {/* Horizontal shelves */}
    <rect x="55"  y="310" width="370" height="7" rx="3.5" fill="rgba(255,255,255,0.22)" />
    <rect x="55"  y="228" width="370" height="7" rx="3.5" fill="rgba(255,255,255,0.22)" />
    <rect x="55"  y="146" width="370" height="7" rx="3.5" fill="rgba(255,255,255,0.22)" />
    <rect x="55"  y="64"  width="370" height="7" rx="3.5" fill="rgba(255,255,255,0.18)" />
    {/* Vertical poles */}
    <rect x="55"  y="64"  width="7" height="253" rx="3.5" fill="rgba(255,255,255,0.18)" />
    <rect x="420" y="64"  width="7" height="253" rx="3.5" fill="rgba(255,255,255,0.18)" />
    <rect x="236" y="64"  width="7" height="253" rx="3.5" fill="rgba(255,255,255,0.12)" />

    {/* ── BOTTOM ROW ── */}
    <rect x="70"  y="272" width="62"  height="38" rx="5" fill="#3a8dc4" />
    <rect x="70"  y="272" width="62"  height="9"  rx="5" fill="#4da8e0" />
    {/* barcode */}
    <rect x="80"  y="284" width="3"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="85"  y="284" width="2"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="89"  y="284" width="4"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="95"  y="284" width="2"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="99"  y="284" width="3"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="104" y="284" width="2"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="108" y="284" width="5"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />
    <rect x="115" y="284" width="3"   height="13" rx="1" fill="rgba(255,255,255,0.55)" />

    <rect x="143" y="276" width="56"  height="34" rx="5" fill="#58b0e5" />
    <rect x="143" y="276" width="56"  height="9"  rx="5" fill="#6fc3f7" />
    <line x1="171" y1="285" x2="171" y2="310" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

    {/* Accent (amber) box */}
    <rect x="251" y="270" width="68"  height="40" rx="5" fill="#c9820e" />
    <rect x="251" y="270" width="68"  height="9"  rx="5" fill="#eda020" />
    <line x1="285" y1="279" x2="285" y2="310" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
    <ellipse cx="285" cy="314" rx="36" ry="7" fill="#eda020" opacity="0.12" />

    <rect x="333" y="273" width="60"  height="37" rx="5" fill="#3a8dc4" />
    <rect x="333" y="273" width="60"  height="9"  rx="5" fill="#4da8e0" />

    {/* ── MIDDLE ROW ── */}
    <rect x="70"  y="190" width="58"  height="38" rx="5" fill="#58b0e5" />
    <rect x="70"  y="190" width="58"  height="9"  rx="5" fill="#6fc3f7" />

    <rect x="143" y="193" width="64"  height="35" rx="5" fill="#3a8dc4" />
    <rect x="143" y="193" width="64"  height="9"  rx="5" fill="#4da8e0" />

    <rect x="251" y="190" width="60"  height="38" rx="5" fill="#58b0e5" opacity="0.9" />
    <rect x="251" y="190" width="60"  height="9"  rx="5" fill="#6fc3f7" />

    <rect x="328" y="191" width="64"  height="37" rx="5" fill="#c9820e" opacity="0.85" />
    <rect x="328" y="191" width="64"  height="9"  rx="5" fill="#eda020" />

    {/* ── TOP ROW ── */}
    <rect x="70"  y="108" width="65"  height="38" rx="5" fill="#3a8dc4" opacity="0.9" />
    <rect x="70"  y="108" width="65"  height="9"  rx="5" fill="#4da8e0" />

    <rect x="152" y="110" width="54"  height="36" rx="5" fill="#c9820e" opacity="0.8" />
    <rect x="152" y="110" width="54"  height="9"  rx="5" fill="#eda020" />

    <rect x="251" y="108" width="62"  height="38" rx="5" fill="#58b0e5" />
    <rect x="251" y="108" width="62"  height="9"  rx="5" fill="#6fc3f7" />

    <rect x="330" y="109" width="58"  height="37" rx="5" fill="#3a8dc4" opacity="0.75" />
    <rect x="330" y="109" width="58"  height="9"  rx="5" fill="#4da8e0" />

    {/* ── Floating DATA CARD (top right) ── */}
    <rect x="338" y="22" width="118" height="68" rx="11"
      fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
    <rect x="352" y="36" width="42"  height="5" rx="2.5" fill="rgba(255,255,255,0.6)" />
    <rect x="352" y="46" width="62"  height="4" rx="2"   fill="rgba(255,255,255,0.28)" />
    <rect x="352" y="54" width="50"  height="4" rx="2"   fill="rgba(255,255,255,0.28)" />
    {/* mini bar chart */}
    <rect x="415" y="50" width="8"   height="26" rx="2" fill="#4da8e0" opacity="0.8" />
    <rect x="426" y="40" width="8"   height="36" rx="2" fill="#eda020" opacity="0.8" />
    <rect x="437" y="45" width="8"   height="31" rx="2" fill="#4da8e0" opacity="0.8" />

    {/* ── Floating STATUS CARD (top left) ── */}
    <rect x="24" y="24" width="120" height="64" rx="11"
      fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
    <circle cx="48" cy="56" r="14" fill="#3a8dc4" opacity="0.55" />
    {/* checkmark */}
    <path d="M41 56 L46 61 L55 51"
      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="68" y="42" width="62"  height="5" rx="2.5" fill="rgba(255,255,255,0.6)" />
    <rect x="68" y="52" width="48"  height="4" rx="2"   fill="rgba(255,255,255,0.28)" />
    <rect x="68" y="60" width="54"  height="4" rx="2"   fill="rgba(255,255,255,0.28)" />

    {/* ── Floating MOVEMENT BADGE ── */}
    <rect x="160" y="330" width="160" height="34" rx="17"
      fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    <circle cx="180" cy="347" r="7" fill="#eda020" opacity="0.75" />
    <rect x="194" y="342" width="55" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="194" y="350" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
    {/* arrow icon */}
    <path d="M293 347 L302 347 M297 342 L302 347 L297 352"
      stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

    {/* ── Floating particles ── */}
    <circle cx="215" cy="48"  r="3"   fill="rgba(255,255,255,0.15)" />
    <circle cx="310" cy="60"  r="2"   fill="rgba(77,168,224,0.35)" />
    <circle cx="170" cy="38"  r="4"   fill="rgba(255,255,255,0.08)" />
    <circle cx="400" cy="155" r="2.5" fill="rgba(237,160,32,0.3)" />
    <circle cx="38"  cy="170" r="2"   fill="rgba(91,179,232,0.35)" />
    <circle cx="450" cy="250" r="3"   fill="rgba(255,255,255,0.1)" />
  </svg>
);

// ── Layout ─────────────────────────────────────────────────────────────────
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#eaf2fb] dark:bg-[#0d1117]">

      {/* ════ LEFT PANEL — Form ════════════════════════════════════════════ */}
      <div className="relative flex flex-col w-full lg:w-[48%] min-h-screen">

        {/* Theme toggle — mobile only (bottom-left) */}
        <div className="absolute bottom-5 left-5 z-50 lg:hidden">
          <ThemeTogglerTwo />
        </div>

        {/* Vertically centered content */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="mb-7 flex justify-center">
              <img
                src="/3a4a3985-ceb5-4a84-911b-4e14fbba3957.png"
                alt="Nexventory"
                className="h-9 w-auto object-contain"
              />
            </div>

            {/* Form card */}
            <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-theme-md border border-[#cce2f4] dark:border-[#21262d] px-8 py-8">
              {children}
            </div>

            {/* Footer */}
            <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600 select-none">
              © {new Date().getFullYear()} Araxios — All rights reserved
            </p>
          </div>
        </div>
      </div>

      {/* ════ RIGHT PANEL — Illustration ══════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center
        bg-gradient-to-br from-[#1a3552] via-[#1e4570] to-[#0e2036]
        dark:from-[#090e17] dark:via-[#0d1520] dark:to-[#07090f]">

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient glow blobs */}
        <div className="absolute top-1/3  left-1/4  w-96 h-96 rounded-full bg-[#2a5080] opacity-20 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-[#4da8e0] opacity-10 blur-[70px] pointer-events-none" />
        <div className="absolute top-10   right-16  w-40 h-40 rounded-full bg-[#eda020] opacity-[0.07] blur-[55px] pointer-events-none" />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center px-10 max-w-lg">
          <WarehouseIllustration />

          <h2 className="mt-5 text-2xl font-bold text-white tracking-tight">
            Smart Inventory Control
          </h2>
          <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-xs">
            Track supplies, manage regions and control stock movements with precision — in real time.
          </p>

          {/* Feature chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Real-time tracking", "QR Code", "Multi-region", "Audit logs"].map((feat) => (
              <span
                key={feat}
                className="px-3 py-1 text-[11px] font-medium rounded-full border border-white/10 bg-white/[0.07] text-white/65"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Theme toggle — desktop (bottom-right of this panel) */}
        <div className="absolute bottom-6 right-6 z-20">
          <ThemeTogglerTwo />
        </div>

        {/* Subtle bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24
          bg-gradient-to-t from-[#0e2036]/60 dark:from-[#07090f]/60 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
