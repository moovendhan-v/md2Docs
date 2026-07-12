import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TemplateGallery from "@/components/TemplateGallery";
import CustomizePanel from "@/components/CustomizePanel";

/* Right-side drawer: visual template gallery + per-element style controls.
   Everything applies live — the preview updates as you change values. */
export default function StylesDrawer({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[380px] flex-col p-0 sm:max-w-[380px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Design</SheetTitle>
          <SheetDescription>Pick a template, then customize any element. Changes apply live.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="templates" className="flex min-h-0 flex-1 flex-col px-5 pt-3">
          <TabsList className="w-full">
            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
            <TabsTrigger value="styles" className="flex-1">Styles</TabsTrigger>
          </TabsList>
          <TabsContent value="templates" className="min-h-0 flex-1 overflow-y-auto pb-5 pt-2">
            <TemplateGallery />
          </TabsContent>
          <TabsContent value="styles" className="min-h-0 flex-1 overflow-y-auto pb-5 pt-2">
            <CustomizePanel />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
