import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnlock } from "@/components/unlock-provider";
import { UNLOCK_PRODUCT_ID } from "@/lib/unlock";

export function UnlockGate({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { unlocked } = useUnlock();
  if (unlocked) return children;
  return <UnlockScreen toolTitle={title} />;
}

function UnlockScreen({ toolTitle }: { toolTitle: string }) {
  const { purchaseUnlock, restorePurchases, priceLabel, busy, footnote } = useUnlock();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <AppShell
      title={toolTitle}
      subtitle="Included in the one-time set-out unlock."
      back
    >
      <Card>
        <CardHeader>
          <CardTitle>Unlock set-out</CardTitle>
          <CardDescription>
            One-time {priceLabel}. No ads. Works offline. Metric.
          </CardDescription>
        </CardHeader>
        <ul className="mb-5 flex flex-col gap-1.5 text-sm text-ink">
          <li>— Stair set-out, with soft NCC / AS 1657 hints</li>
          <li>— Concrete volume</li>
          <li>— Set-out pack (same unlock, not a separate purchase)</li>
        </ul>
        <p className="mb-5 text-sm text-muted">
          Triangle calculator and running measurements stay free on this device.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => {
              void purchaseUnlock().then((result) => {
                if (!result.cancelled) setStatus(result.message || null);
              });
            }}
          >
            {busy ? "Working…" : `Unlock · ${priceLabel}`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => {
              void restorePurchases().then((result) => setStatus(result.message));
            }}
          >
            Restore purchases
          </Button>
        </div>
        {status ? (
          <p className="mt-3 text-sm text-muted" role="status">
            {status}
          </p>
        ) : null}
        <p className="mt-4 text-xs leading-normal text-subtle">
          {footnote} Product id {UNLOCK_PRODUCT_ID}.
        </p>
      </Card>
    </AppShell>
  );
}
