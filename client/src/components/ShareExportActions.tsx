import { Clipboard, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareExportActionsProps {
  title: string;
  text: string;
  filename: string;
  compact?: boolean;
}

export function ShareExportActions({ title, text, filename, compact = false }: ShareExportActionsProps) {
  const copy = async () => {
    await navigator.clipboard?.writeText(text);
    toast.success("Copied to clipboard");
  };
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href });
      return;
    }
    await copy();
  };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };
  return (
    <div className="share-export-actions" aria-label={`${title} sharing and export`}>
      <Button variant="outline" size={compact ? "sm" : "default"} onClick={() => void copy()}><Clipboard size={15} /> <span>Copy</span></Button>
      <Button variant="outline" size={compact ? "sm" : "default"} onClick={() => void share()}><Share2 size={15} /> <span>Share</span></Button>
      <Button variant="outline" size={compact ? "sm" : "default"} onClick={download}><Download size={15} /> <span>Export</span></Button>
    </div>
  );
}
