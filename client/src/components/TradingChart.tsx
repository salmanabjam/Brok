import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import { MarketData, TradingSignal } from "@/types/trading";

Chart.register(...registerables);

interface TradingChartProps {
  marketData: MarketData[];
  signals: TradingSignal[];
  currentPrice: number;
  priceChange: number;
  volume: string;
}

export default function TradingChart({ 
  marketData, 
  signals, 
  currentPrice, 
  priceChange,
  volume 
}: TradingChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const chartData = marketData.map(item => ({
      x: new Date(item.timestamp),
      y: item.close
    }));

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'EUR/USD',
          data: chartData,
          borderColor: 'hsl(207, 90%, 54%)',
          backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(4);
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'hsl(207, 90%, 54%)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `Price: ${(context.parsed.y as number).toFixed(4)}`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [marketData]);

  const getLatestSignal = () => {
    if (signals.length === 0) return null;
    return signals[signals.length - 1];
  };

  const latestSignal = getLatestSignal();

  return (
    <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">EUR/USD Chart</h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>1m</option>
                <option defaultValue="">5m</option>
                <option>15m</option>
                <option>1h</option>
                <option>4h</option>
                <option>1D</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <i className="fas fa-play mr-1"></i>
              Live
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <i className="fas fa-expand mr-1"></i>
              Fullscreen
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Chart Container */}
        <div className="relative h-96 bg-gray-50 rounded-lg overflow-hidden">
          <canvas ref={chartRef} className="w-full h-full"></canvas>
          
          {/* Signal Overlays */}
          {latestSignal && (
            <div className="absolute top-4 left-4 space-y-2">
              <div className={`flex items-center space-x-2 ${
                latestSignal.type === 'BUY' ? 'bg-secondary/90' : 'bg-red-500/90'
              } text-white px-3 py-1 rounded-full text-sm`}>
                <i className={`fas ${latestSignal.type === 'BUY' ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                <span>{latestSignal.type} Signal - RSI+QQE</span>
              </div>
              <div className="flex items-center space-x-2 bg-primary/90 text-white px-3 py-1 rounded-full text-sm">
                <i className="fas fa-trending-up"></i>
                <span>Strength: {latestSignal.strength.toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Price Info */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-sm">
            <div className="text-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current:</span>
                <span className="font-mono font-semibold">{currentPrice.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Change:</span>
                <span className={`font-mono ${priceChange >= 0 ? 'text-secondary' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Volume:</span>
                <span className="font-mono text-sm">{volume}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
