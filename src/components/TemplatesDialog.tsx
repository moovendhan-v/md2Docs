import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TemplateGallery from "@/components/TemplateGallery";

export default function TemplatesDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-6">
        <div className="flex flex-col gap-1 pr-6">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground">Document Templates Gallery</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Select a design preset below to define your document style. Once chosen, you can customize fonts, margins, colors, and borders in the Design drawer.
          </p>
        </div>
        <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
          <TemplateGallery columns={3} onSelect={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
