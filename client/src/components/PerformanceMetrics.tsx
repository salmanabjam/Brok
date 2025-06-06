import { PerformanceMetrics } from "@/types/trading";

interface PerformanceMetricsProps {
  performance: PerformanceMetrics | null;
  signalCount: number;
  signalStrength: number;
}

export default function PerformanceMetricsComponent({ 
  performance, 
  signalCount, 
  signalStrength 
}: PerformanceMetricsProps) {
  const formatTime = (ms: number) => `${ms.toFixed(2)}ms`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Calculation Time</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {performance ? formatTime(performance.calculationTime) : '0.00ms'}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-stopwatch text-primary"></i>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-success flex items-center">
            <i className="fas fa-arrow-down mr-1"></i>
            Optimized performance
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Signal Strength</p>
            <p className="text-2xl font-bold text-gray-900">{signalStrength.toFixed(0)}%</p>
          </div>
          <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-signal text-secondary"></i>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-secondary h-1.5 rounded-full" 
              style={{ width: `${signalStrength}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Signals</p>
            <p className="text-2xl font-bold text-gray-900">{signalCount}</p>
          </div>
          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-bell text-warning"></i>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-gray-600">Recent activity</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {performance ? formatPercentage(performance.cacheHitRate) : '0.0%'}
            </p>
          </div>
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-database text-success"></i>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-success flex items-center">
            <i className="fas fa-arrow-up mr-1"></i>
            Excellent performance
          </span>
        </div>
      </div>
    </div>
  );
}
