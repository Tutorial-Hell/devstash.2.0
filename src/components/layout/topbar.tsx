import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-background px-4">
      <div className="flex items-center gap-2 w-48 shrink-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background">
          <span className="text-xs font-bold text-white leading-none">DS</span>
        </div>
        <span className="text-sm font-semibold text-foreground">DevStash</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8 h-8 bg-muted border-0 text-sm"
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-2 w-48 justify-end shrink-0">
        <Button variant="outline" size="sm">
          New Collection
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New Item
        </Button>
      </div>
    </header>
  );
}
