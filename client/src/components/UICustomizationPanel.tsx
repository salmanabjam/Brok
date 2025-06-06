import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { IndicatorSettings } from "@/types/trading";
import { useToast } from "@/hooks/use-toast";
import { Palette, Monitor, Signal, BarChart3 } from "lucide-react";

interface UICustomizationPanelProps {
  onSettingsChange: (settings: Partial<IndicatorSettings>) => void;
}

export default function UICustomizationPanel({ onSettingsChange }: UICustomizationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/indicator-settings/1'],
    enabled: true,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<IndicatorSettings>) => {
      return apiRequest('/api/indicator-settings/1', {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/indicator-settings/1'] });
      toast({
        title: "Settings Updated",
        description: "UI customization settings have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSettingUpdate = (key: string, value: any) => {
    const newSettings = { [key]: value };
    updateSettingsMutation.mutate(newSettings);
    onSettingsChange(newSettings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            UI Customization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          UI Customization - Cardano USD
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="signals" className="flex items-center gap-1">
              <Signal className="h-4 w-4" />
              Signals
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="strength" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Strength
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Signal Style</Label>
                  <Select
                    value={settings?.signalStyle || "dots"}
                    onValueChange={(value) => handleSettingUpdate("signalStyle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="arrows">Arrows</SelectItem>
                      <SelectItem value="triangles">Triangles</SelectItem>
                      <SelectItem value="lines">Lines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Signal Size</Label>
                  <Select
                    value={settings?.signalSize || "Normal"}
                    onValueChange={(value) => handleSettingUpdate("signalSize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                      <SelectItem value="Extra Large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Signal Icon Size: {settings?.signalIconSize || 8}px</Label>
                <Slider
                  value={[settings?.signalIconSize || 8]}
                  onValueChange={([value]) => handleSettingUpdate("signalIconSize", value)}
                  min={4}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Buy Signal Opacity: {settings?.buySignalOpacity || 70}%</Label>
                  <Slider
                    value={[settings?.buySignalOpacity || 70]}
                    onValueChange={([value]) => handleSettingUpdate("buySignalOpacity", value)}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Sell Signal Opacity: {settings?.sellSignalOpacity || 70}%</Label>
                  <Slider
                    value={[settings?.sellSignalOpacity || 70]}
                    onValueChange={([value]) => handleSettingUpdate("sellSignalOpacity", value)}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>QQE Signal Opacity: {settings?.qqeSignalOpacity || 50}%</Label>
                  <Slider
                    value={[settings?.qqeSignalOpacity || 50]}
                    onValueChange={([value]) => handleSettingUpdate("qqeSignalOpacity", value)}
                    min={10}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Buy Signal Color"
                color={settings?.buySignalColor || "#00ff00"}
                onChange={(color) => handleSettingUpdate("buySignalColor", color)}
              />

              <ColorPicker
                label="Sell Signal Color"
                color={settings?.sellSignalColor || "#ff0000"}
                onChange={(color) => handleSettingUpdate("sellSignalColor", color)}
              />

              <ColorPicker
                label="Neutral Signal Color"
                color={settings?.neutralSignalColor || "#ffff00"}
                onChange={(color) => handleSettingUpdate("neutralSignalColor", color)}
              />

              <ColorPicker
                label="Background Color"
                color={settings?.backgroundColor || "#1a1a1a"}
                onChange={(color) => handleSettingUpdate("backgroundColor", color)}
              />

              <ColorPicker
                label="Text Color"
                color={settings?.textColor || "#ffffff"}
                onChange={(color) => handleSettingUpdate("textColor", color)}
              />
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Table Position</Label>
                <Select
                  value={settings?.tablePosition || "Top-Right"}
                  onValueChange={(value) => handleSettingUpdate("tablePosition", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Top-Left">Top Left</SelectItem>
                    <SelectItem value="Top-Right">Top Right</SelectItem>
                    <SelectItem value="Bottom-Left">Bottom Left</SelectItem>
                    <SelectItem value="Bottom-Right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={settings?.fontFamily || "Arial"}
                  onValueChange={(value) => handleSettingUpdate("fontFamily", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Font Size: {settings?.fontSize || 12}px</Label>
              <Slider
                value={[settings?.fontSize || 12]}
                onValueChange={([value]) => handleSettingUpdate("fontSize", value)}
                min={8}
                max={24}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Show Summary Table</Label>
                <Switch
                  checked={settings?.showSummaryTable || true}
                  onCheckedChange={(checked) => handleSettingUpdate("showSummaryTable", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Trend Dots</Label>
                <Switch
                  checked={settings?.showTrendDots || true}
                  onCheckedChange={(checked) => handleSettingUpdate("showTrendDots", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Crypto News</Label>
                <Switch
                  checked={settings?.enableCryptoNews || true}
                  onCheckedChange={(checked) => handleSettingUpdate("enableCryptoNews", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strength" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Signal Strength</Label>
                <Switch
                  checked={settings?.showSignalStrength || true}
                  onCheckedChange={(checked) => handleSettingUpdate("showSignalStrength", checked)}
                />
              </div>

              <div>
                <Label>Strength Display Type</Label>
                <Select
                  value={settings?.strengthDisplayType || "gradient"}
                  onValueChange={(value) => handleSettingUpdate("strengthDisplayType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Color Gradient</SelectItem>
                    <SelectItem value="bar">Progress Bar</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="text">Text Labels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Strong Signal Threshold: {settings?.strongSignalThreshold || 75}%</Label>
                <Slider
                  value={[settings?.strongSignalThreshold || 75]}
                  onValueChange={([value]) => handleSettingUpdate("strongSignalThreshold", value)}
                  min={50}
                  max={95}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Weak Threshold: {settings?.weakThreshold || 20}%</Label>
                  <Slider
                    value={[settings?.weakThreshold || 20]}
                    onValueChange={([value]) => handleSettingUpdate("weakThreshold", value)}
                    min={10}
                    max={40}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Medium Threshold: {settings?.mediumThreshold || 50}%</Label>
                  <Slider
                    value={[settings?.mediumThreshold || 50]}
                    onValueChange={([value]) => handleSettingUpdate("mediumThreshold", value)}
                    min={30}
                    max={70}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Trading Symbol: {settings?.cryptoSymbol || "ADAUSD"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset to default values
              const defaultSettings = {
                buySignalColor: "#00ff00",
                sellSignalColor: "#ff0000",
                neutralSignalColor: "#ffff00",
                backgroundColor: "#1a1a1a",
                textColor: "#ffffff",
                fontSize: 12,
                signalIconSize: 8,
                tablePosition: "Top-Right",
                strengthDisplayType: "gradient"
              };
              updateSettingsMutation.mutate(defaultSettings);
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}