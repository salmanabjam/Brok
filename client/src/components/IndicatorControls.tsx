import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { IndicatorSettings } from "@/types/trading";

interface IndicatorControlsProps {
  onSettingsChange: (settings: Partial<IndicatorSettings>) => void;
}

export default function IndicatorControls({ onSettingsChange }: IndicatorControlsProps) {
  const [settings, setSettings] = useState<IndicatorSettings>({
    id: 1,
    userId: 1,
    rsiPeriod: 14,
    qqeSmoothing: 5,
    adxThreshold: 25,
    rangeFilterEnabled: true,
    atrPeriod: 14,
    signalStyle: "dots",
    opacity: 85,
    trendDotsEnabled: true,
  });

  const [rsiEnabled, setRsiEnabled] = useState(true);
  const [qqeEnabled, setQqeEnabled] = useState(true);
  const [adxEnabled, setAdxEnabled] = useState(true);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/indicator-settings/1');
        if (response.ok) {
          const loadedSettings = await response.json();
          setSettings(loadedSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<IndicatorSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    onSettingsChange(updated);

    try {
      await apiRequest('PUT', '/api/indicator-settings/1', newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Technical Indicators */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Technical Indicators</h4>
        
        <div className="space-y-4">
          {/* RSI Settings */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">RSI</label>
              <Switch checked={rsiEnabled} onCheckedChange={setRsiEnabled} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Period:</span>
                <span className="font-mono">{settings.rsiPeriod}</span>
              </div>
              <Slider
                value={[settings.rsiPeriod]}
                onValueChange={(value) => updateSettings({ rsiPeriod: value[0] })}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Value:</span>
                <span className="font-mono text-warning">67.3</span>
              </div>
            </div>
          </div>

          {/* QQE Settings */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">QQE</label>
              <Switch checked={qqeEnabled} onCheckedChange={setQqeEnabled} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Smoothing:</span>
                <span className="font-mono">{settings.qqeSmoothing}</span>
              </div>
              <Slider
                value={[settings.qqeSmoothing]}
                onValueChange={(value) => updateSettings({ qqeSmoothing: value[0] })}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* ADX Settings */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">ADX</label>
              <Switch checked={adxEnabled} onCheckedChange={setAdxEnabled} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Threshold:</span>
                <span className="font-mono">{settings.adxThreshold}</span>
              </div>
              <Slider
                value={[settings.adxThreshold]}
                onValueChange={(value) => updateSettings({ adxThreshold: value[0] })}
                min={10}
                max={50}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Value:</span>
                <span className="font-mono text-secondary">31.8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Market Analysis</h4>
        
        <div className="space-y-3">
          {/* Range Market Detection */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Range Market</p>
              <p className="text-xs text-gray-500">ATR-based detection</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                Detected
              </span>
            </div>
          </div>

          {/* Order Blocks */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Order Blocks</p>
              <p className="text-xs text-gray-500">Support/Resistance levels</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-gray-900">3</span>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>

          {/* Fair Value Gaps */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Fair Value Gaps</p>
              <p className="text-xs text-gray-500">Imbalance detection</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-gray-900">2</span>
              <p className="text-xs text-gray-500">Identified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Signal Display</h4>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Signal Style</label>
            <Select 
              value={settings.signalStyle} 
              onValueChange={(value) => updateSettings({ signalStyle: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select signal style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arrows">Arrows</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="lines">Lines</SelectItem>
                <SelectItem value="triangles">Triangles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Opacity: {settings.opacity}%
            </label>
            <Slider
              value={[settings.opacity]}
              onValueChange={(value) => updateSettings({ opacity: value[0] })}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Trend Dots</label>
            <Switch 
              checked={settings.trendDotsEnabled} 
              onCheckedChange={(checked) => updateSettings({ trendDotsEnabled: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
