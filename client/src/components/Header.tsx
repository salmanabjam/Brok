import { useState, useEffect } from "react";

interface HeaderProps {
  isConnected: boolean;
  currentPrice: number;
  priceChange: number;
}

export default function Header({ isConnected, currentPrice, priceChange }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(4)}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">EUR/USD Trading Analysis</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 ${isConnected ? 'bg-success animate-pulse' : 'bg-red-500'} rounded-full`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live Market Data' : 'Connection Lost'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Current Price Display */}
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-700">Current: </span>
            <span className="text-sm font-mono font-semibold text-gray-900">
              {formatPrice(currentPrice)}
            </span>
            <span className={`text-xs ml-2 ${priceChange >= 0 ? 'text-success' : 'text-red-500'}`}>
              {formatChange(priceChange)}
            </span>
          </div>
          
          {/* Time Zone Display */}
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-700">UTC+0</span>
            <span className="text-xs text-gray-500 ml-2">{formatTime(currentTime)}</span>
          </div>
          
          {/* Market Status */}
          <div className="bg-success/10 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-success">Market Open</span>
          </div>
          
          {/* Settings Button */}
          <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
            <i className="fas fa-cog text-gray-600"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
