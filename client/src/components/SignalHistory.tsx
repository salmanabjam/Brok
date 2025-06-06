import { TradingSignal } from "@/types/trading";

interface SignalHistoryProps {
  signals: TradingSignal[];
}

export default function SignalHistory({ signals }: SignalHistoryProps) {
  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toTimeString().split(' ')[0];
  };

  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  const getSignalTypeClass = (type: string) => {
    return type === 'BUY' 
      ? 'bg-secondary/10 text-secondary'
      : 'bg-red-500/10 text-red-500';
  };

  const getSignalIcon = (type: string) => {
    return type === 'BUY' ? 'fa-arrow-up' : 'fa-arrow-down';
  };

  const getStrengthColor = (strength: number, type: string) => {
    if (strength > 80) return type === 'BUY' ? 'bg-secondary' : 'bg-red-500';
    if (strength > 60) return 'bg-warning';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Signals</h3>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
            View All
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Strength
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {signals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No signals yet. Waiting for market conditions...
                </td>
              </tr>
            ) : (
              signals.slice(-10).reverse().map((signal) => (
                <tr key={signal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {formatTime(signal.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSignalTypeClass(signal.type)}`}>
                      <i className={`fas ${getSignalIcon(signal.type)} mr-1`}></i>
                      {signal.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div 
                          className={`h-1.5 rounded-full ${getStrengthColor(signal.strength, signal.type)}`}
                          style={{ width: `${signal.strength}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{signal.strength.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {formatPrice(signal.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
