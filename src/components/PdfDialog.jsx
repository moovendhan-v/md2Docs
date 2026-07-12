import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useDocStore } from "@/store/useDocStore";
import { renderPdf, downloadBlobUrl } from "@/lib/exportPdf";

/* Renders the PDF in-app (from the same page slices as the preview),
   shows it in a viewer, then lets you download the file. */
export default function PdfDialog({ open, onOpenChange }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileName = useDocStore((s) => s.fileName);
  const urlRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { pages, styles } = useDocStore.getState();
    renderPdf(pages, styles)
      .then((blobUrl) => {
        if (cancelled) { URL.revokeObjectURL(blobUrl); return; }
        urlRef.current = blobUrl;
        setUrl(blobUrl);
      })
      .catch(() => !cancelled && setError("PDF rendering failed. Try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
      setUrl(null);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <div className="flex items-center justify-between pr-8">
          <DialogTitle>PDF preview — {fileName}.pdf</DialogTitle>
          <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!url} onClick={() => downloadBlobUrl(url, fileName)}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
        <div className="mt-3 h-[70vh] overflow-hidden rounded-md border bg-muted">
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Rendering PDF…
            </div>
          )}
          {error && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{error}</div>}
          {url && !loading && <iframe title="PDF preview" src={url} className="h-full w-full" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
