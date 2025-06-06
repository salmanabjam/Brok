import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { PerformanceMetrics } from "@/types/trading";

interface ExportPanelProps {
  performance: PerformanceMetrics | null;
}

export default function ExportPanel({ performance }: ExportPanelProps) {
  const [performanceLogging, setPerformanceLogging] = useState(true);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/export/signals/EURUSD?format=csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eurusd_signals.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Signal data exported to CSV file",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export signal data",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/indicator-settings/1');
      if (response.ok) {
        const settings = await response.json();
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indicator_settings.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Configuration exported to JSON file",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export configuration",
        variant: "destructive",
      });
    }
  };

  const handleExportChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trading_chart.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Chart image exported successfully",
      });
    } else {
      toast({
        title: "Export Failed",
        description: "No chart found to export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analysis</h3>
        
        <div className="space-y-3">
          <Button 
            onClick={handleExportCSV}
            className="w-full flex items-center justify-center space-x-2"
          >
            <i className="fas fa-file-csv"></i>
            <span>Export Signal Data (CSV)</span>
          </Button>
          
          <Button 
            onClick={handleExportJSON}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            <i className="fas fa-file-code"></i>
            <span>Export Configuration (JSON)</span>
          </Button>
          
          <Button 
            onClick={handleExportChart}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            <i className="fas fa-image"></i>
            <span>Export Chart Image</span>
          </Button>
        </div>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Details</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Calculations</p>
              <p className="text-xl font-bold font-mono text-gray-900">
                {performance?.totalCalculations.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-xl font-bold font-mono text-gray-900">
                {performance ? `${performance.memoryUsage.toFixed(1)}MB` : '0.0MB'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">CPU Usage</span>
              <span className="font-mono">
                {performance ? `${performance.cpuUsage.toFixed(1)}%` : '0.0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${performance?.cpuUsage || 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Network Load</span>
              <span className="font-mono">
                {performance ? `${performance.networkLoad.toFixed(1)}KB/s` : '0.0KB/s'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full" 
                style={{ width: `${Math.min(100, (performance?.networkLoad || 0) * 10)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700">Performance Logging</label>
            <Switch 
              checked={performanceLogging} 
              onCheckedChange={setPerformanceLogging}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
