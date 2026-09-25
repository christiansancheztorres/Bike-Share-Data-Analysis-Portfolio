import type { ReactNode } from 'react';
import { Download } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { Report } from '../hooks/use-report';

const colors = { registered: '#2c8177', casual: '#e17b54', total: '#2c8177' };
const darkColors = { registered: '#86cdbd', casual: '#f1a183', total: '#86cdbd' };
const fmt = (value: number) => Math.round(value).toLocaleString('en-US');

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const csv = [columns.join(','), ...rows.map(row => columns.map(key => csvCell(row[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Figure({ title, subtitle, filename, rows, children, foot, className = '' }: {
  title: string; subtitle: string; filename: string; rows: object[];
  children: ReactNode; foot?: ReactNode; className?: string;
}) {
  return (
    <div className={`figure ${className}`}>
      <div className="figure-top">
        <div><h3 className="figure-title">{title}</h3><p className="figure-subtitle">{subtitle}</p></div>
        <button data-testid={`button-download-${filename.replace('.csv', '')}`} className="download-button print:hidden" type="button"
          onClick={() => downloadCsv(filename, rows as Record<string, unknown>[])} aria-label={`Download ${title} data as CSV`} title="Download chart data as CSV">
          <Download size={13} aria-hidden="true" /> <span>CSV</span>
        </button>
      </div>
      {children}
      {foot && <div className="figure-foot">{foot}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, suffix = 'rides / hour' }: {
  active?: boolean; payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string | number; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip">
    <strong>{label}</strong>
    {payload.filter(item => item.value != null).map((item, index) =>
      <div className="tooltip-row" key={`${item.dataKey}-${index}`}>
        <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
        <b>{fmt(item.value!)} {suffix}</b>
      </div>)}
  </div>;
}

function axis(dark: boolean) {
  return {
    grid: dark ? '#3a5550' : '#e5e6dd',
    tick: dark ? '#aabbb5' : '#657572',
  };
}

export function RiderLegend({ dark }: { dark: boolean }) {
  const c = dark ? darkColors : colors;
  return <div className="legend" aria-label="Chart legend">
    <span><i style={{ background: c.registered }} />Registered riders</span>
    <span><i style={{ background: c.casual }} />Casual riders</span>
  </div>;
}

export function HourlyChart({ data, dark }: { data: Report['hourly']; dark: boolean }) {
  const a = axis(dark), c = dark ? darkColors : colors;
  return <div className="chart-shell tall" role="img" aria-label="Line chart of average hourly rentals. Registered riders peak at 17:00, casual riders at 14:00.">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 17, bottom: 8, left: -22 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke={a.grid} strokeDasharray="3 5" />
        <XAxis dataKey="hour_label" interval={3} tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <Tooltip content={<ChartTooltip />} isAnimationActive={false} cursor={{ stroke:a.tick, strokeDasharray:'4 4' }} />
        <Line name="Registered" dataKey="registered" type="monotone" stroke={c.registered} strokeWidth={3} dot={false} activeDot={{ r:5 }} isAnimationActive={false} />
        <Line name="Casual" dataKey="casual" type="monotone" stroke={c.casual} strokeWidth={3} dot={false} activeDot={{ r:5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}

export function MonthlyChart({ data, dark }: { data: Report['monthly']; dark: boolean }) {
  const a = axis(dark), c = dark ? darkColors : colors;
  return <div className="chart-shell" role="img" aria-label="Area chart of average hourly rentals for each month from January 2011 through December 2012.">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 19, bottom: 7, left: -22 }} accessibilityLayer>
        <defs><linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.total} stopOpacity={.22} /><stop offset="100%" stopColor={c.total} stopOpacity={.015} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke={a.grid} strokeDasharray="3 5" />
        <XAxis dataKey="period" interval={3} tickFormatter={(value:string) => value.slice(2)} tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <Tooltip content={<ChartTooltip />} isAnimationActive={false} cursor={{ stroke:a.tick, strokeDasharray:'4 4' }} />
        <Area name="Average" dataKey="average_rides" type="monotone" stroke={c.total} strokeWidth={2.7} fill="url(#monthlyFill)" activeDot={{ r:5 }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}

export function WeekdayChart({ data, dark }: { data: Report['weekday']; dark: boolean }) {
  const a = axis(dark), c = dark ? darkColors : colors;
  return <div className="chart-shell short" role="img" aria-label="Stacked bar chart comparing average registered and casual rentals for each weekday.">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 14, bottom: 7, left: -22 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke={a.grid} strokeDasharray="3 5" />
        <XAxis dataKey="weekday_name" tickFormatter={(value:string) => value.slice(0,3)} tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill:a.tick, fontSize:11, fontFamily:'DM Mono' }} />
        <Tooltip content={<ChartTooltip />} isAnimationActive={false} cursor={false} />
        <Bar name="Registered" dataKey="registered" stackId="rides" fill={c.registered} isAnimationActive={false} />
        <Bar name="Casual" dataKey="casual" stackId="rides" fill={c.casual} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function DayTypeChart({ data, dark }: { data: Report['day_type']; dark: boolean }) {
  const c = dark ? darkColors : colors;
  return <div className="daytype">
    {data.map(row => {
      const casualPct = row.casual / row.cnt * 100;
      return <div className="daytype-item" key={row.day_type} data-testid={`card-daytype-${row.day_type.replace(/\W+/g,'-').toLowerCase()}`}>
        <div className="eyebrow">{row.day_type}</div>
        <strong>{casualPct.toFixed(1)}%</strong>
        <p>of average hourly rentals are casual</p>
        <div style={{ display:'flex', height:8, marginTop:23, background:'var(--line)' }}
          role="img" aria-label={`${row.day_type}: ${row.registered.toFixed(1)} registered and ${row.casual.toFixed(1)} casual average rentals per hour`}
          title={`${row.day_type}: ${row.registered.toFixed(1)} registered, ${row.casual.toFixed(1)} casual rentals per hour`}>
          <span style={{ width:`${100-casualPct}%`, background:c.registered }} />
          <span style={{ width:`${casualPct}%`, background:c.casual }} />
        </div>
        <p style={{ marginTop:12 }}>{fmt(row.cnt)} total rides / hour on average</p>
      </div>;
    })}
  </div>;
}