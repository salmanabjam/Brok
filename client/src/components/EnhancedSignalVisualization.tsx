import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TradingSignal, IndicatorSettings } from "@/types/trading";
import { TrendingUp, TrendingDown, Minus, Circle, Triangle, Square } from "lucide-react";

interface EnhancedSignalVisualizationProps {
  signals: TradingSignal[];
  settings: IndicatorSettings;
  signalStrength: number;
}

export default function EnhancedSignalVisualization({ 
  signals, 
  settings, 
  signalStrength 
}: EnhancedSignalVisualizationProps) {
  const [recentSignal, setRecentSignal] = useState<TradingSignal | null>(null);

  useEffect(() => {
    if (signals.length > 0) {
      setRecentSignal(signals[signals.length - 1]);
    }
  }, [signals]);

  const getSignalIcon = (signalType: string, style: string) => {
    const iconSize = settings.signalIconSize || 8;
    const iconProps = { 
      size: iconSize * 3, 
      className: "transition-all duration-300 hover:scale-110" 
    };

    switch (style) {
      case "triangles":
        return signalType === "BUY" ? 
          <Triangle {...iconProps} fill={settings.buySignalColor} stroke={settings.buySignalColor} /> : 
          <Triangle {...iconProps} fill={settings.sellSignalColor} stroke={settings.sellSignalColor} style={{ transform: 'rotate(180deg)' }} />;
      case "squares":
        return <Square {...iconProps} fill={signalType === "BUY" ? settings.buySignalColor : settings.sellSignalColor} stroke="white" />;
      case "arrows":
        return signalType === "BUY" ? 
          <TrendingUp {...iconProps} color={settings.buySignalColor} strokeWidth={3} /> : 
          <TrendingDown {...iconProps} color={settings.sellSignalColor} strokeWidth={3} />;
      default: // dots
        return <Circle {...iconProps} fill={signalType === "BUY" ? settings.buySignalColor : settings.sellSignalColor} stroke="white" />;
    }
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength >= (settings.strongSignalThreshold || 75)) {
      return settings.buySignalColor || "#00ff00";
    } else if (strength >= (settings.mediumThreshold || 50)) {
      return settings.neutralSignalColor || "#ffff00";
    } else {
      return settings.sellSignalColor || "#ff0000";
    }
  };

  const getSignalStrengthLabel = (strength: number) => {
    if (strength >= (settings.strongSignalThreshold || 75)) return "Strong";
    if (strength >= (settings.mediumThreshold || 50)) return "Medium";
    if (strength >= (settings.weakThreshold || 20)) return "Weak";
    return "Very Weak";
  };

  const renderSignalStrength = (strength: number) => {
    const strengthColor = getSignalStrengthColor(strength);
    const strengthLabel = getSignalStrengthLabel(strength);

    switch (settings.strengthDisplayType) {
      case "bar":
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Signal Strength</span>
              <span className="font-medium">{strengthLabel}</span>
            </div>
            <Progress 
              value={strength} 
              className="h-2" 
              style={{ 
                '--progress-background': strengthColor 
              } as React.CSSProperties}
            />
          </div>
        );
      case "percentage":
        return (
          <div className="text-center">
            <div 
              className="text-2xl font-bold"
              style={{ color: strengthColor }}
            >
              {strength.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">{strengthLabel}</div>
          </div>
        );
      case "text":
        return (
          <Badge 
            variant="outline" 
            className="px-3 py-1"
            style={{ 
              borderColor: strengthColor, 
              color: strengthColor 
            }}
          >
            {strengthLabel} ({strength.toFixed(1)}%)
          </Badge>
        );
      default: // gradient
        return (
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              background: `linear-gradient(135deg, ${strengthColor}20, ${strengthColor}40)`,
              border: `1px solid ${strengthColor}60`
            }}
          >
            <div 
              className="text-lg font-semibold"
              style={{ color: strengthColor }}
            >
              {strengthLabel}
            </div>
            <div className="text-sm opacity-80">{strength.toFixed(1)}% Confidence</div>
          </div>
        );
    }
  };

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-lg"
      style={{ 
        backgroundColor: settings.backgroundColor || "#1a1a1a",
        color: settings.textColor || "#ffffff",
        fontFamily: settings.fontFamily || "Arial",
        fontSize: `${settings.fontSize || 12}px`
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cardano USD Signals</span>
          <Badge variant="secondary" className="ml-2">
            {signals.length} Total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentSignal && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg border">
              <div className="flex flex-col items-center gap-2">
                <div className="text-sm text-muted-foreground">Latest Signal</div>
                {getSignalIcon(recentSignal.type, settings.signalStyle || "dots")}
                <Badge 
                  variant={recentSignal.type === "BUY" ? "default" : "destructive"}
                  className="font-semibold"
                  style={{
                    backgroundColor: recentSignal.type === "BUY" ? settings.buySignalColor : settings.sellSignalColor,
                    opacity: (recentSignal.type === "BUY" ? settings.buySignalOpacity : settings.sellSignalOpacity) / 100
                  }}
                >
                  {recentSignal.type}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Price: </span>
                  <span className="font-mono">${recentSignal.price.toFixed(4)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Time: </span>
                  <span>{new Date(recentSignal.timestamp).toLocaleTimeString()}</span>
                </div>
                {recentSignal.confirmed && (
                  <Badge variant="outline" className="text-xs">
                    Confirmed
                  </Badge>
                )}
              </div>
            </div>

            {settings.showSignalStrength && (
              <div>
                {renderSignalStrength(recentSignal.strength)}
              </div>
            )}

            {recentSignal.indicators && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                {recentSignal.indicators.rsi && (
                  <div className="text-center p-2 rounded bg-muted/20">
                    <div className="text-muted-foreground">RSI</div>
                    <div className="font-semibold">{recentSignal.indicators.rsi.toFixed(1)}</div>
                  </div>
                )}
                {recentSignal.indicators.qqe && (
                  <div className="text-center p-2 rounded bg-muted/20">
                    <div className="text-muted-foreground">QQE</div>
                    <div className="font-semibold">{recentSignal.indicators.qqe.toFixed(1)}</div>
                  </div>
                )}
                {recentSignal.indicators.adx && (
                  <div className="text-center p-2 rounded bg-muted/20">
                    <div className="text-muted-foreground">ADX</div>
                    <div className="font-semibold">{recentSignal.indicators.adx.toFixed(1)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Signals History */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Signals</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {signals.slice(-5).reverse().map((signal, index) => (
              <div key={signal.id} className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted/10">
                <div className="flex items-center gap-2">
                  {getSignalIcon(signal.type, settings.signalStyle || "dots")}
                  <span className={signal.type === "BUY" ? "text-green-400" : "text-red-400"}>
                    {signal.type}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
                <div className="font-mono">
                  ${signal.price.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}