import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold tracking-[-0.02em] sm:text-2xl">
      {children}
    </h2>
  );
}

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm bg-muted/30 px-6 py-20 text-center">
      {children}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <StateShell>
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-1 h-11 rounded-full px-6 transition-transform active:scale-[0.98]",
        )}
      >
        다시 시도
      </button>
    </StateShell>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <StateShell>
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <p className="mt-1 text-base font-semibold tracking-tight">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      <Link
        to={actionTo}
        className={cn(
          buttonVariants(),
          "mt-2 h-11 rounded-full px-6 transition-transform active:scale-[0.98]",
        )}
      >
        {actionLabel}
      </Link>
    </StateShell>
  );
}
