import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money, num, percent, shortDate } from '../lib/format';
import type { DayPoint, Slice } from '../lib/selectors';

const AXIS = { fontSize: 11, fill: '#8a7780' };
const GRID = '#f0e7e0';

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: unknown;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="tooltip-title">{typeof label === 'string' && label.includes('-') ? shortDate(label) : label}</div>
      {payload.map((entry, index) => (
        <div className="tooltip-row" key={`${entry.name}-${index}`}>
          <span className="dot" style={{ background: entry.color ?? '#7a1730' }} />
          <span>{entry.name}</span>
          <strong>{money(Number(entry.value ?? 0))}</strong>
        </div>
      ))}
    </div>
  );
}

export function CollectionTrend({ points }: { points: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 14, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="barWine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a32847" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#e2c8a0" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={GRID} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          tickFormatter={(value: string) => shortDate(value)}
          minTickGap={22}
        />
        <YAxis
          yAxisId="daily"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: '#8a7780' }}
          tickFormatter={(value: number) => num(value)}
          width={58}
        />
        <YAxis
          yAxisId="total"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: '#8a7780' }}
          tickFormatter={(value: number) => num(value)}
          width={64}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(122, 23, 48, 0.05)' }} />
        <Bar
          yAxisId="daily"
          dataKey="daily"
          name="সেদিনের আদায়"
          fill="url(#barWine)"
          radius={[5, 5, 0, 0]}
          maxBarSize={28}
        />
        <Line
          yAxisId="total"
          type="monotone"
          dataKey="cumulative"
          name="ক্রমপুঞ্জিত মোট"
          stroke="#6d1026"
          strokeWidth={2.4}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: Slice[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="donut-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((slice) => (
              <Cell key={slice.id} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <small>{centerLabel}</small>
        <strong>{centerValue}</strong>
      </div>
    </div>
  );
}

export function RankedBars({
  data,
  total,
  emptyLabel = 'এখনো কোনো তথ্য নেই',
}: {
  data: Slice[];
  total: number;
  emptyLabel?: string;
}) {
  if (!data.length) return <p className="muted small">{emptyLabel}</p>;
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div>
      {data.map((item) => (
        <div className="progress-row" key={item.id}>
          <div className="progress-top">
            <span className="dot" style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="muted small">({num(item.count)} জন)</span>
            <strong>{money(item.value)}</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${percent(item.value, max)}%`, background: item.color }}
            />
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            মোট আদায়ের {percent(item.value, total).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleLegend({ data }: { data: Slice[] }) {
  return (
    <div className="legend">
      {data.map((item) => (
        <span className="legend-item" key={item.id}>
          <span className="dot" style={{ background: item.color }} />
          {item.label}
          <strong style={{ color: '#2a1a20', fontWeight: 600 }}>{money(item.value)}</strong>
        </span>
      ))}
    </div>
  );
}
