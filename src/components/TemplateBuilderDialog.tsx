import { useState, useEffect } from "react";
import { useDocStore } from "@/store/useDocStore";
import { TEMPLATES } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function TemplateBuilderDialog({ open, onOpenChange, onSave }) {
  const saveCustomTemplate = useDocStore((s) => s.saveCustomTemplate);

  const [name, setName] = useState("");
  const [baseTemplate, setBaseTemplate] = useState("corporate");
  
  // Page Background & Margins
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderStyle, setBorderStyle] = useState("none");
  const [borderWidth, setBorderWidth] = useState(2);
  const [marginTop, setMarginTop] = useState(75);
  const [marginBottom, setMarginBottom] = useState(75);
  const [marginLeft, setMarginLeft] = useState(83);
  const [marginRight, setMarginRight] = useState(83);

  // Header
  const [headerLogoUrl, setHeaderLogoUrl] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [headerLayout, setHeaderLayout] = useState("logo-left");
  const [headerBorder, setHeaderBorder] = useState(false);

  // Footer
  const [footerText, setFooterText] = useState("");
  const [footerBannerColor, setFooterBannerColor] = useState("");
  const [footerTextColor, setFooterTextColor] = useState("#ffffff");
  const [footerLayout, setFooterLayout] = useState("center");

  // Watermark
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkColor, setWatermarkColor] = useState("#dddddd");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);

  useEffect(() => {
    if (open) {
      setName("Advanced Template");
      const base = TEMPLATES[baseTemplate] || TEMPLATES["corporate"];
      setBorderColor(base.styles.page.borderColor || "#000000");
      setBorderStyle(base.styles.page.borderStyle || "none");
      setBorderWidth(base.styles.page.borderWidth || 2);
      setMarginTop(base.styles.page.customMargin?.top ?? 75);
      setMarginBottom(base.styles.page.customMargin?.bottom ?? 75);
      setMarginLeft(base.styles.page.customMargin?.left ?? 83);
      setMarginRight(base.styles.page.customMargin?.right ?? 83);
      setBackgroundUrl("");
      setHeaderLogoUrl("");
      setHeaderText("");
      setHeaderLayout("logo-left");
      setHeaderBorder(false);
      setFooterText("");
      setFooterBannerColor("");
      setFooterTextColor("#ffffff");
      setFooterLayout("center");
      setWatermarkText("");
    }
  }, [open, baseTemplate]);

  const handleImageUpload = (setter) => (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setter(ev.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const id = "custom_" + Date.now();
    const base = JSON.parse(JSON.stringify(TEMPLATES[baseTemplate].styles));

    base.page.borderColor = borderColor;
    base.page.borderStyle = borderStyle;
    base.page.borderWidth = borderWidth;
    base.page.customMargin = {
      top: marginTop,
      bottom: marginBottom,
      left: marginLeft,
      right: marginRight,
    };
    base.page.margin = base.page.customMargin; // Pass to getPageGeometry

    if (backgroundUrl) base.page.backgroundUrl = backgroundUrl;

    if (watermarkText) {
      base.watermark = { text: watermarkText, color: watermarkColor, opacity: watermarkOpacity };
    }
    
    if (headerText || headerLogoUrl) {
      base.header = {
        text: headerText,
        logoUrl: headerLogoUrl,
        layout: headerLayout,
        borderBottom: headerBorder,
      };
    }

    if (footerText || footerBannerColor) {
      base.footer = {
        text: footerText,
        bannerColor: footerBannerColor,
        textColor: footerTextColor,
        layout: footerLayout,
      };
    }

    const config = {
      id,
      name: name || "Untitled Template",
      styles: base,
      isCustom: true,
    };

    saveCustomTemplate(config);
    onOpenChange(false);
    if (onSave) onSave(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <DialogTitle>Advanced Corporate Template Builder</DialogTitle>
        </div>
        <div className="grid grid-cols-5 gap-6 py-4 max-h-[75vh] overflow-hidden pr-2">
          {/* Form Side */}
          <div className="col-span-3 overflow-y-auto pr-4 space-y-4">
            <div className="flex gap-4">
              <div className="space-y-1 flex-1">
                <Label>Template Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1 flex-1">
                <Label>Base Typography</Label>
                <Select value={baseTemplate} onValueChange={setBaseTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATES).map(([k, t]) => (
                      <SelectItem key={k} value={k}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="page" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="page">Page</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
                <TabsTrigger value="watermark">Watermark</TabsTrigger>
              </TabsList>
              
              <TabsContent value="page" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Letterhead / Background Image</Label>
                  <p className="text-xs text-muted-foreground">Upload a full-page design (like an A4 letterhead). Text will flow over it.</p>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" className="flex-1" onChange={handleImageUpload(setBackgroundUrl)} />
                    {backgroundUrl && <Button variant="outline" size="sm" onClick={() => setBackgroundUrl("")}>Clear</Button>}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>Page Margins (px)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1 text-xs"><Label>Top</Label><Input type="number" value={marginTop} onChange={(e) => setMarginTop(Number(e.target.value))} /></div>
                    <div className="space-y-1 text-xs"><Label>Bottom</Label><Input type="number" value={marginBottom} onChange={(e) => setMarginBottom(Number(e.target.value))} /></div>
                    <div className="space-y-1 text-xs"><Label>Left</Label><Input type="number" value={marginLeft} onChange={(e) => setMarginLeft(Number(e.target.value))} /></div>
                    <div className="space-y-1 text-xs"><Label>Right</Label><Input type="number" value={marginRight} onChange={(e) => setMarginRight(Number(e.target.value))} /></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>Page Border</Label>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-8 p-1" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
                    <Select value={borderStyle} onValueChange={setBorderStyle}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-16" value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} min={1} max={10} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="header" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Header Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" className="flex-1" onChange={handleImageUpload(setHeaderLogoUrl)} />
                    {headerLogoUrl && <Button variant="outline" size="sm" onClick={() => setHeaderLogoUrl("")}>Clear</Button>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Header Text (e.g. Company Name)</Label>
                  <Input placeholder="Cybertechmind" value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>Layout</Label>
                    <Select value={headerLayout} onValueChange={setHeaderLayout}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="logo-left">Logo Left, Text Right</SelectItem>
                        <SelectItem value="logo-right">Text Left, Logo Right</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch id="header-border" checked={headerBorder} onCheckedChange={setHeaderBorder} />
                      <Label htmlFor="header-border">Bottom Border</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="footer" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Footer Text (Address, CIN, TAN)</Label>
                  <Input placeholder="www.cybertechmind.com" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label>Banner Color</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="w-12 h-8 p-1" value={footerBannerColor || "#0055aa"} onChange={(e) => setFooterBannerColor(e.target.value)} />
                      <Button variant="outline" size="sm" onClick={() => setFooterBannerColor("")}>Transparent</Button>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Text Color</Label>
                    <Input type="color" className="w-12 h-8 p-1" value={footerTextColor} onChange={(e) => setFooterTextColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select value={footerLayout} onValueChange={setFooterLayout}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center Align</SelectItem>
                      <SelectItem value="split">Split Ends (Left/Right)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="watermark" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Watermark Text</Label>
                  <Input placeholder="CONFIDENTIAL" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input type="color" className="w-12 h-8 p-1" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Opacity</Label>
                    <Slider 
                      value={[watermarkOpacity]} 
                      onValueChange={(v) => setWatermarkOpacity(v[0])} 
                      min={0.05} max={1} step={0.05} 
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </div>

          {/* Preview Side */}
          <div className="col-span-2 rounded-lg border bg-muted/30 p-4 flex flex-col items-center justify-center relative overflow-hidden h-[500px]">
             <div className="text-xs text-muted-foreground mb-4 absolute top-2">Preview</div>
             <div 
               className="bg-white shadow-sm ring-1 ring-black/10 relative overflow-hidden flex flex-col"
               style={{ 
                 width: "240px", 
                 height: "336px",
                 backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
                 backgroundSize: "cover",
                 backgroundPosition: "center"
               }}
             >
               {borderStyle !== "none" && (
                 <div style={{
                   position: "absolute", top: 8, left: 8, right: 8, bottom: 8,
                   border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                   pointerEvents: "none", zIndex: 10
                 }}/>
               )}
               
               {/* Header Preview */}
               {(headerText || headerLogoUrl) && (
                 <div style={{
                   position: "absolute", top: 0, left: 0, right: 0, padding: "8px 12px",
                   display: "flex", alignItems: "center", 
                   justifyContent: headerLayout === "center" ? "center" : "space-between",
                   flexDirection: headerLayout === "logo-right" ? "row-reverse" : "row",
                   borderBottom: headerBorder ? `1px solid ${borderColor}` : "none",
                   zIndex: 11
                 }}>
                   {headerLogoUrl && <img src={headerLogoUrl} alt="Logo" style={{ maxHeight: "16px", maxWidth: "40px", objectFit: "contain" }} />}
                   {headerText && <span style={{ fontSize: "6pt", fontWeight: "bold", color: borderColor }}>{headerText}</span>}
                 </div>
               )}

               {/* Watermark Preview */}
               {watermarkText && (
                 <div style={{
                   position: "absolute", top: "50%", left: "50%",
                   transform: "translate(-50%, -50%) rotate(-45deg)",
                   color: watermarkColor, opacity: watermarkOpacity,
                   fontSize: "24pt", fontWeight: "bold", whiteSpace: "nowrap",
                   zIndex: 0
                 }}>
                   {watermarkText}
                 </div>
               )}

               {/* Footer Preview */}
               {(footerText || footerBannerColor) && (
                 <div style={{
                   position: "absolute", bottom: 0, left: 0, right: 0,
                   height: "20px", backgroundColor: footerBannerColor || "transparent",
                   display: "flex", alignItems: "center",
                   justifyContent: footerLayout === "split" ? "space-between" : "center",
                   padding: "0 12px", zIndex: 11
                 }}>
                   {footerText && <span style={{ fontSize: "5pt", color: footerTextColor || "#fff" }}>{footerText}</span>}
                 </div>
               )}
               
               <div className="p-6 space-y-2 relative z-1 mt-[25px]">
                 <div className="h-2 w-3/4 bg-gray-300 rounded" />
                 <div className="h-1 w-full bg-gray-200 rounded mt-4" />
                 <div className="h-1 w-full bg-gray-200 rounded" />
                 <div className="h-1 w-5/6 bg-gray-200 rounded" />
               </div>
             </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
