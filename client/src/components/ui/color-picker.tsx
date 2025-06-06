import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const presetColors = [
  "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
  "#ffffff", "#000000", "#808080", "#ffa500", "#800080", "#008000",
  "#ff1493", "#00ced1", "#ffd700", "#dc143c", "#32cd32", "#1e90ff"
];

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-16 h-8 p-0 border-2"
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">Pick color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Custom Color</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => onChange(e.target.value)}
                  className="flex-1 text-xs"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Preset Colors</label>
              <div className="grid grid-cols-6 gap-1 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: presetColor }}
                    onClick={() => {
                      onChange(presetColor);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}