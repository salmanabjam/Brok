import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import TradingChart from "@/components/TradingChart";
import IndicatorControls from "@/components/IndicatorControls";
import SignalHistory from "@/components/SignalHistory";
import ExportPanel from "@/components/ExportPanel";
import { useMarketData } from "@/hooks/useMarketData";
import { IndicatorSettings } from "@/types/trading";

export default function TradingDashboard() {
  const {
    marketData,
    signals,
    performance,
    currentPrice,
    priceChange,
    isConnected
  } = useMarketData('EURUSD');

  const [signalStrength, setSignalStrength] = useState(75);
  const [volume, setVolume] = useState("1.2M");

  // Calculate signal strength from recent signals
  useEffect(() => {
    if (signals.length > 0) {
      const recentSignals = signals.slice(-5);
      const avgStrength = recentSignals.reduce((sum, signal) => sum + signal.strength, 0) / recentSignals.length;
      setSignalStrength(avgStrength);
    }
  }, [signals]);

  // Format volume based on latest market data
  useEffect(() => {
    if (marketData.length > 0) {
      const latestVolume = marketData[marketData.length - 1].volume;
      if (latestVolume > 1000000) {
        setVolume(`${(latestVolume / 1000000).toFixed(1)}M`);
      } else if (latestVolume > 1000) {
        setVolume(`${(latestVolume / 1000).toFixed(1)}K`);
      } else {
        setVolume(latestVolume.toString());
      }
    }
  }, [marketData]);

  const handleSettingsChange = (settings: Partial<IndicatorSettings>) => {
    // Settings are automatically saved via the IndicatorControls component
    console.log('Settings updated:', settings);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header 
          isConnected={isConnected}
          currentPrice={currentPrice}
          priceChange={priceChange}
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Performance Metrics Bar */}
          <PerformanceMetrics 
            performance={performance}
            signalCount={signals.length}
            signalStrength={signalStrength}
          />

          {/* Main Chart and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <TradingChart 
              marketData={marketData}
              signals={signals}
              currentPrice={currentPrice}
              priceChange={priceChange}
              volume={volume}
            />

            <IndicatorControls onSettingsChange={handleSettingsChange} />
          </div>

          {/* Signal History and Export */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SignalHistory signals={signals} />
            <ExportPanel performance={performance} />
          </div>
        </div>
      </main>
    </div>
  );
}
