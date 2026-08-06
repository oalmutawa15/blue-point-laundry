"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";

export type DayRevenue = { day: string; revenue: number };

export function RevenueChart({
  data,
  costPct,
}: {
  data: DayRevenue[];
  costPct: number;
}) {
  const { t, lang } = useLang();
  const W = 640;
  const H = 200;
  const pad = { top: 16, right: 12, bottom: 24, left: 12 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const n = data.length || 1;
  const slot = innerW / n;
  const barW = Math.min(26, slot * 0.5);
  const locale = lang === "ar" ? "ar-KW" : "en-GB";

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold">{t.admin.fin.revenueTrend}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-brand" />{t.admin.fin.revenue}</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-success" />{t.admin.fin.profit}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={pad.left}
            x2={W - pad.right}
            y1={pad.top + innerH * (1 - g)}
            y2={pad.top + innerH * (1 - g)}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + slot / 2;
          const revH = (d.revenue / max) * innerH;
          const profit = d.revenue * (1 - costPct / 100);
          const proH = (profit / max) * innerH;
          return (
            <g key={d.day}>
              <rect
                x={x - barW / 2}
                y={pad.top + innerH - revH}
                width={barW}
                height={revH}
                rx="3"
                fill="var(--brand)"
                opacity="0.85"
              />
              <rect
                x={x - barW / 2}
                y={pad.top + innerH - proH}
                width={barW}
                height={proH}
                rx="3"
                fill="var(--success)"
              />
              {i % 2 === 0 && (
                <text
                  x={x}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted-foreground)"
                >
                  {new Date(d.day).toLocaleDateString(locale, { day: "numeric", month: "numeric" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
