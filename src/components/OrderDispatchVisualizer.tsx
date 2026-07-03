import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Order } from '../types';
import { TrendingUp, ShoppingBag, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface OrderDispatchVisualizerProps {
  orders: Order[];
}

export default function OrderDispatchVisualizer({ orders }: OrderDispatchVisualizerProps) {
  const [activeMetric, setActiveMetric] = useState<'value' | 'count'>('value');

  // Compute metrics based on order status
  const chartData = useMemo(() => {
    const statusData = {
      pending: { value: 0, count: 0, label: 'Pending Dispatch', color: '#f59e0b', bgLight: '#fef3c7' },
      approved: { value: 0, count: 0, label: 'Approved / Live', color: '#10b981', bgLight: '#d1fae5' },
      rejected: { value: 0, count: 0, label: 'Rejected / Cancelled', color: '#ef4444', bgLight: '#fee2e2' }
    };

    orders.forEach((order) => {
      const status = order.status || 'pending';
      if (statusData[status]) {
        statusData[status].value += order.totalPrice;
        statusData[status].count += 1;
      }
    });

    return [
      {
        status: 'Pending',
        displayLabel: 'Pending Dispatch',
        value: Number(statusData.pending.value.toFixed(2)),
        count: statusData.pending.count,
        color: statusData.pending.color,
        bgLight: statusData.pending.bgLight,
        rawStatus: 'pending'
      },
      {
        status: 'Approved',
        displayLabel: 'Approved Live',
        value: Number(statusData.approved.value.toFixed(2)),
        count: statusData.approved.count,
        color: statusData.approved.color,
        bgLight: statusData.approved.bgLight,
        rawStatus: 'approved'
      },
      {
        status: 'Rejected',
        displayLabel: 'Rejected / Void',
        value: Number(statusData.rejected.value.toFixed(2)),
        count: statusData.rejected.count,
        color: statusData.rejected.color,
        bgLight: statusData.rejected.bgLight,
        rawStatus: 'rejected'
      }
    ];
  }, [orders]);

  // General Dispatch Insights
  const insights = useMemo(() => {
    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const approvedCount = orders.filter(o => o.status === 'approved').length;
    const totalApprovedValue = orders.filter(o => o.status === 'approved').reduce((acc, o) => acc + o.totalPrice, 0);
    const totalPendingValue = orders.filter(o => o.status === 'pending').reduce((acc, o) => acc + o.totalPrice, 0);

    const averageOrderValue = totalCount > 0 
      ? orders.reduce((acc, o) => acc + o.totalPrice, 0) / totalCount 
      : 0;

    return {
      totalCount,
      pendingCount,
      approvedCount,
      totalApprovedValue,
      totalPendingValue,
      averageOrderValue
    };
  }, [orders]);

  // Custom tooltips matching the dashboard aesthetic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-sans z-50">
          <p className="font-bold flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block" 
              style={{ backgroundColor: data.color }}
            />
            {data.displayLabel}
          </p>
          <div className="space-y-0.5 text-slate-300 font-mono">
            <p>Total Value: <span className="text-white font-bold">${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
            <p>Total Bookings: <span className="text-white font-bold">{data.count} orders</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="dispatch-flow-visualizer" className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
      
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-base font-brand">Dispatch Volume Analytics</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time visual monitoring of pending versus approved shopper order metrics.
          </p>
        </div>

        {/* View Metric Selectors */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            id="btn-metric-val"
            type="button"
            onClick={() => setActiveMetric('value')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMetric === 'value'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Order Value ($)
          </button>
          <button
            id="btn-metric-cnt"
            type="button"
            onClick={() => setActiveMetric('count')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMetric === 'count'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Order Count
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recharts Column */}
        <div className="lg:col-span-7 bg-slate-50/50 rounded-2xl border border-slate-50 p-4 flex flex-col justify-between min-h-[300px]">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="status" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(val) => activeMetric === 'value' ? `$${val}` : val}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                <Bar 
                  dataKey={activeMetric === 'value' ? 'value' : 'count'} 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Operations Guidance Side Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 font-sans">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block font-brand">Dispatch Pipeline Overview</span>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-800 font-semibold uppercase">Pending</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="font-mono font-bold text-amber-700 text-lg mt-1">
                  {insights.pendingCount}
                </div>
                <div className="text-[10px] text-amber-600 font-mono mt-0.5">
                  ${insights.totalPendingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-semibold uppercase">Dispatched</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="font-mono font-bold text-emerald-700 text-lg mt-1">
                  {insights.approvedCount}
                </div>
                <div className="text-[10px] text-emerald-600 font-mono mt-0.5">
                  ${insights.totalApprovedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Average Ticket Order Value:</span>
                <span className="font-mono font-bold text-slate-900">${insights.averageOrderValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Total Received bookings:</span>
                <span className="font-mono font-bold text-slate-900">{insights.totalCount} orders</span>
              </div>
            </div>
          </div>

          {/* Operational recommendation box */}
          <div className="p-3.5 bg-sky-50/50 border border-sky-100/30 rounded-2xl text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 font-brand">
              <AlertTriangle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Dispatch Flow Guidance</span>
            </div>
            <p className="leading-relaxed">
              {insights.pendingCount > 0 
                ? `You have ${insights.pendingCount} pending order(s) awaiting approval totaling $${insights.totalPendingValue.toFixed(2)}. Consider reviewing them under the "Booked Shopping Orders" tab to minimize dispatch delay.`
                : "All incoming order requests are cleared! Current queue is empty. Active wholesalers can add additional inventory items to maintain high dispatch rates."
              }
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
