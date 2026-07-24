import React, { useMemo, useState } from 'react';
import { DataRow } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AlertCircle } from 'lucide-react';

interface DashboardProps {
  data: DataRow[];
  headers: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({ data, headers }) => {
  const [xAxis, setXAxis] = useState<string>(headers[0] || '');
  const [yAxis, setYAxis] = useState<string>(headers[1] || '');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  // Filter numeric columns for Y-axis (or values)
  const numericHeaders = useMemo(() => {
    return headers.filter(header => {
      // Check if at least some values are numeric
      const numericCount = data.filter(row => !isNaN(Number(row[header])) && row[header] !== '' && row[header] !== undefined).length;
      return numericCount > 0;
    });
  }, [headers, data]);

  // Aggregate data based on X and Y
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis || data.length === 0) return [];

    const aggregated = data.reduce((acc, row) => {
      const xVal = String(row[xAxis] || 'Unknown');
      const yVal = Number(row[yAxis]) || 0;

      if (!acc[xVal]) {
        acc[xVal] = 0;
      }
      acc[xVal] += yVal;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(aggregated)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 for readability
  }, [data, xAxis, yAxis]);

  if (headers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50 p-6">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
          <BarChart3 size={24} />
        </div>
        <h2 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Data</h2>
        <p className="text-xs text-slate-500 max-w-md">Upload dan gabungkan file Excel untuk melihat visualisasi data di dashboard ini.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-auto min-h-14 bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between flex-none">
        <div className="flex items-center space-x-4">
          <nav className="text-xs text-slate-400 font-medium space-x-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Visualisasi</span>
          </nav>
        </div>
      </header>

      {/* Stats row - styled to match High Density theme */}
      <section className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 bg-slate-50 flex-none border-b border-slate-200 overflow-x-hidden">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Baris</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-xl font-bold text-slate-800">{data.length}</span>
            <span className="text-[10px] text-emerald-500 font-medium">Baris</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Kolom</p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-xl font-bold text-slate-800">{headers.length}</span>
            <span className="text-[10px] text-blue-500 font-medium">Kolom</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm col-span-2 md:col-span-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Chart Configuration</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-[10px] text-slate-500">Category (X-Axis)</label>
              <select 
                value={xAxis} 
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none"
              >
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-[10px] text-slate-500 flex items-center justify-between">
                Value (Y-Axis)
                {numericHeaders.length === 0 && <AlertCircle size={10} className="text-amber-500" title="No numeric columns" />}
              </label>
              <select 
                value={yAxis} 
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 focus:outline-none"
              >
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded self-end">
              <button onClick={() => setChartType('bar')} className={`p-1.5 rounded flex items-center gap-1 ${chartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><BarChart3 size={14} /></button>
              <button onClick={() => setChartType('line')} className={`p-1.5 rounded flex items-center gap-1 ${chartType === 'line' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><LineIcon size={14} /></button>
              <button onClick={() => setChartType('pie')} className={`p-1.5 rounded flex items-center gap-1 ${chartType === 'pie' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><PieIcon size={14} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Area */}
      <section className="flex-1 bg-white p-6 min-h-[300px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
            Select valid Category and Value columns to display the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                <Bar dataKey="value" name={yAxis} fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                <Line type="monotone" dataKey="value" name={yAxis} stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
};
