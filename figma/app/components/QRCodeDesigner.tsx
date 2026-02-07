import { useState, useEffect, useRef } from 'react';
import QRCodeStyling, {
  DotType,
  CornerSquareType,
  CornerDotType,
  ErrorCorrectionLevel,
  Options
} from 'qr-code-styling';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Label } from '@app/components/ui/label';
import { Input } from '@app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app/components/ui/tabs";
import { Download, RefreshCw, Upload, X, Palette, LayoutGrid, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

type QRCodeDesignerProps = {
  value: string;
  defaultSize?: number;
  showDownload?: boolean;
  onChange?: (config: QRConfig) => void;
};

export type QRConfig = {
  // Colors
  fgColor: string;
  bgColor: string;
  
  // Shapes
  dotsStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerSquareColor: string;
  cornerDotStyle: CornerDotType;
  cornerDotColor: string;
  
  // General
  size: number;
  level: ErrorCorrectionLevel;
  margin: number;
  
  // Logo
  logo: string | null;
  logoSize: number;
  logoMargin: number;
};

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy R.' },
  { value: 'extra-rounded', label: 'Extra R.' },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Extra R.' },
];

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];

const presetColors = [
  { name: 'Classic Black', fg: '#2D2721', bg: '#FFFFFF' },
  { name: 'Warm Gold', fg: '#FFC857', bg: '#FFFBF5' },
  { name: 'Forest Green', fg: '#9DB5A5', bg: '#F8F6F1' },
  { name: 'Coral Red', fg: '#E17B5C', bg: '#FFF9ED' },
  { name: 'Royal Blue', fg: '#3B82F6', bg: '#EFF6FF' },
  { name: 'Purple', fg: '#8B5CF6', bg: '#F5F3FF' },
  { name: 'Dark Mode', fg: '#FFFFFF', bg: '#1F2937' },
];

export function QRCodeDesigner({ value, defaultSize = 300, showDownload = true, onChange }: QRCodeDesignerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling({
    width: defaultSize,
    height: defaultSize,
    type: 'svg',
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 10
    }
  }));

  const [config, setConfig] = useState<QRConfig>({
    fgColor: '#2D2721',
    bgColor: '#FFFFFF',
    dotsStyle: 'square',
    cornerSquareStyle: 'square',
    cornerSquareColor: '#2D2721',
    cornerDotStyle: 'square',
    cornerDotColor: '#2D2721',
    size: defaultSize,
    level: 'Q',
    margin: 10,
    logo: null,
    logoSize: 0.4,
    logoMargin: 10,
  });

  const updateConfig = (updates: Partial<QRConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange?.(newConfig);
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      qrCode.append(ref.current);
    }
  }, [qrCode]);

  useEffect(() => {
    qrCode.update({
      width: config.size,
      height: config.size,
      data: value,
      image: config.logo || undefined,
      dotsOptions: {
        color: config.fgColor,
        type: config.dotsStyle,
      },
      backgroundOptions: {
        color: config.bgColor,
      },
      cornersSquareOptions: {
        color: config.cornerSquareColor,
        type: config.cornerSquareStyle,
      },
      cornersDotOptions: {
        color: config.cornerDotColor,
        type: config.cornerDotStyle,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: config.logoMargin,
        imageSize: config.logoSize,
      },
      qrOptions: {
        errorCorrectionLevel: config.level,
      },
      margin: config.margin
    });
  }, [value, config, qrCode]);

  const applyPreset = (preset: typeof presetColors[0]) => {
    updateConfig({
      fgColor: preset.fg,
      bgColor: preset.bg,
      cornerSquareColor: preset.fg,
      cornerDotColor: preset.fg,
    });
    toast.success(`Applied ${preset.name} theme`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateConfig({ logo: reader.result as string });
        toast.success('Logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    try {
      await qrCode.download({
        name: `qr-code-${Date.now()}`,
        extension: 'png'
      });
      toast.success('QR code downloaded!');
    } catch (err) {
      toast.error('Failed to download QR code');
    }
  };

  const renderColorInput = (id: string, label: string, color: string, onColorChange: (c: string) => void) => (
    <div>
      <Label htmlFor={id} className="text-[#2D2721] font-medium mb-2 block text-xs">
        {label}
      </Label>
      <div className="flex gap-2">
        <input
          type="color"
          id={id}
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-[rgba(139,115,85,0.2)] cursor-pointer p-0 overflow-hidden"
        />
        <Input
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="flex-1 rounded-lg border-[rgba(139,115,85,0.2)] bg-white h-10 font-mono text-xs uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Preview Section - Left/Top */}
      <div className="lg:col-span-5 space-y-4">
        <Label className="text-[#2D2721] font-medium block">Preview</Label>
        <WarmCard padding="lg" className="flex flex-col items-center sticky top-6">
          <div 
            className="p-8 rounded-[16px] border-2 border-[rgba(139,115,85,0.1)] mb-6 shadow-sm bg-white"
          >
            <div ref={ref} className="qr-code-container" />
          </div>
          
          {showDownload && (
            <WarmButton onClick={handleDownload} className="w-full">
              <Download className="h-5 w-5 mr-2" />
              Download PNG
            </WarmButton>
          )}

          <p className="text-xs text-[#8B7355] mt-4 text-center max-w-xs">
            Generate high-quality QR codes with custom shapes, colors, and logos.
          </p>
        </WarmCard>
      </div>

      {/* Customization Options - Right/Bottom */}
      <div className="lg:col-span-7">
        <WarmCard padding="none" className="overflow-hidden bg-white/50">
          <Tabs defaultValue="shape" className="w-full">
            <TabsList className="w-full h-auto p-1 bg-[#F8F6F1] border-b border-[rgba(139,115,85,0.1)] grid grid-cols-4">
              <TabsTrigger value="shape" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-3 gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Shape & Color</span>
              </TabsTrigger>
              <TabsTrigger value="corners" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-3 gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Corners</span>
              </TabsTrigger>
              <TabsTrigger value="logo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-3 gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Logo</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-3 gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="shape" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <Label className="text-[#2D2721] font-semibold">Shape Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DOT_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => updateConfig({ dotsStyle: style.value })}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          config.dotsStyle === style.value
                            ? 'border-[#FFC857] bg-[#FFF9ED] text-[#2D2721] font-medium'
                            : 'border-[rgba(139,115,85,0.1)] hover:border-[rgba(139,115,85,0.3)] text-[#6B5744]'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {renderColorInput('fg-color', 'Dots Color', config.fgColor, (c) => updateConfig({ fgColor: c }))}
                  {renderColorInput('bg-color', 'Background Color', config.bgColor, (c) => updateConfig({ bgColor: c }))}
                </div>

                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <Label className="text-[#2D2721] font-semibold mb-3 block">Quick Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {presetColors.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="p-2 rounded-lg border border-[rgba(139,115,85,0.1)] hover:border-[#FFC857] transition-all flex items-center gap-2"
                        title={preset.name}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: preset.fg }}
                        />
                         <div
                          className="w-4 h-4 rounded-full border border-gray-200 -ml-2"
                          style={{ backgroundColor: preset.bg }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="corners" className="space-y-6 mt-0">
                {/* Corner Squares */}
                <div className="space-y-4">
                  <Label className="text-[#2D2721] font-semibold">Corner Frame Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {CORNER_SQUARE_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => updateConfig({ cornerSquareStyle: style.value })}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          config.cornerSquareStyle === style.value
                            ? 'border-[#FFC857] bg-[#FFF9ED] text-[#2D2721] font-medium'
                            : 'border-[rgba(139,115,85,0.1)] hover:border-[rgba(139,115,85,0.3)] text-[#6B5744]'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  {renderColorInput('corner-square-color', 'Corner Frame Color', config.cornerSquareColor, (c) => updateConfig({ cornerSquareColor: c }))}
                </div>

                <div className="border-t border-[rgba(139,115,85,0.1)] my-4" />

                {/* Corner Dots */}
                <div className="space-y-4">
                  <Label className="text-[#2D2721] font-semibold">Corner Center Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CORNER_DOT_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => updateConfig({ cornerDotStyle: style.value })}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          config.cornerDotStyle === style.value
                            ? 'border-[#FFC857] bg-[#FFF9ED] text-[#2D2721] font-medium'
                            : 'border-[rgba(139,115,85,0.1)] hover:border-[rgba(139,115,85,0.3)] text-[#6B5744]'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  {renderColorInput('corner-dot-color', 'Corner Center Color', config.cornerDotColor, (c) => updateConfig({ cornerDotColor: c }))}
                </div>
              </TabsContent>

              <TabsContent value="logo" className="space-y-6 mt-0">
                {!config.logo ? (
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center gap-2 p-8 rounded-[12px] border-2 border-dashed border-[rgba(139,115,85,0.3)] cursor-pointer hover:border-[#FFC857] hover:bg-[#FFF9ED] transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFF9ED] flex items-center justify-center mb-2">
                      <Upload className="h-6 w-6 text-[#FFC857]" />
                    </div>
                    <span className="font-medium text-[#2D2721]">Click to upload logo</span>
                    <span className="text-xs text-[#8B7355]">Supports PNG, JPG, SVG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] bg-white">
                      <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden p-2">
                        <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#2D2721]">Logo Uploaded</div>
                        <div className="text-xs text-[#8B7355]">Will be placed in the center</div>
                      </div>
                      <button
                        onClick={() => updateConfig({ logo: null })}
                        className="p-2 rounded-lg hover:bg-[#FEE2E2] text-[#E17B5C] transition-colors"
                        title="Remove logo"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-[#2D2721] text-xs font-medium mb-2 block">
                          Logo Size
                        </Label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.5"
                          step="0.05"
                          value={config.logoSize}
                          onChange={(e) => updateConfig({ logoSize: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-[#F2EDE3] rounded-lg appearance-none cursor-pointer accent-[#FFC857]"
                        />
                      </div>
                      <div>
                        <Label className="text-[#2D2721] text-xs font-medium mb-2 block">
                          Logo Margin
                        </Label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={config.logoMargin}
                          onChange={(e) => updateConfig({ logoMargin: parseInt(e.target.value) })}
                          className="w-full h-2 bg-[#F2EDE3] rounded-lg appearance-none cursor-pointer accent-[#FFC857]"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-[#F8F6F1] rounded-lg text-xs text-[#6B5744]">
                  <strong>Note:</strong> Using a logo automatically sets the error correction level to High to ensure scanability.
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="size" className="text-[#2D2721] font-medium mb-2 block">
                      Resolution: {config.size}px
                    </Label>
                    <input
                      type="range"
                      id="size"
                      min="200"
                      max="1000"
                      step="50"
                      value={config.size}
                      onChange={(e) => updateConfig({ size: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#F2EDE3] rounded-lg appearance-none cursor-pointer accent-[#FFC857]"
                    />
                    <div className="flex justify-between text-xs text-[#8B7355] mt-1">
                      <span>200px</span>
                      <span>1000px</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="level" className="text-[#2D2721] font-medium mb-2 block">
                      Error Correction Level
                    </Label>
                    <Select
                      value={config.level}
                      onValueChange={(value) => updateConfig({ level: value as ErrorCorrectionLevel })}
                    >
                      <SelectTrigger id="level" className="h-12 rounded-[12px] border-[rgba(139,115,85,0.2)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="margin" className="text-[#2D2721] font-medium mb-2 block">
                      Margin: {config.margin}px
                    </Label>
                    <input
                      type="range"
                      id="margin"
                      min="0"
                      max="50"
                      step="5"
                      value={config.margin}
                      onChange={(e) => updateConfig({ margin: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#F2EDE3] rounded-lg appearance-none cursor-pointer accent-[#FFC857]"
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </WarmCard>
      </div>
    </div>
  );
}
