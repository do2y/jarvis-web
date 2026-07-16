import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Inquiry } from "../types";
import { InquiryStatusBadge } from "./InquiryStatusBadge";

export function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const [open, setOpen] = useState(false);
  const expandable = inquiry.status === "ANSWERED";

  const header = (
    <div className="flex items-center gap-3">
      <InquiryStatusBadge status={inquiry.status} />
      <span className="min-w-0 flex-1 truncate text-base font-medium">
        {inquiry.title}
      </span>
      <span className="shrink-0 text-sm text-muted-foreground">
        {inquiry.createdAt.replace(/-/g, ".")}
      </span>
      {expandable && (
        <ChevronRight
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      )}
    </div>
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-sm border bg-background",
        expandable && "transition-shadow duration-200 hover:shadow-sm",
      )}
    >
      {expandable ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center px-5 py-4 text-left transition-colors hover:bg-muted/30"
        >
          {header}
        </button>
      ) : (
        <div className="px-5 py-4">{header}</div>
      )}

      {expandable && (
        <div
          className={cn(
            "grid border-t transition-[grid-template-rows] duration-300 ease-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-t-transparent",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  문의
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {inquiry.content}
                </p>
              </div>
              <div className="rounded-sm bg-muted/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    답변
                  </p>
                  {inquiry.answeredAt && (
                    <span className="text-xs text-muted-foreground">
                      {inquiry.answeredAt.replace(/-/g, ".")}
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {inquiry.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
