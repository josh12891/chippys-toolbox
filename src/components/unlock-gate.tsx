import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnlock } from "@/components/unlock-provider";
import { UNLOCK_PRODUCT_ID } from "@/lib/unlock";

export function UnlockCta({
  afterWin = false,
  toolLabel,
}: {
  afterWin?: boolean;
  toolLabel?: string;
}) {
  const { purchaseUnlock, restorePurchases, priceLabel, busy, footnote } = useUnlock();
  const [status, setStatus] = useState<string | null>(null);
  const winLine = toolLabel
    ? `That's your free ${toolLabel}. Unlock once to keep using stairs and concrete.`
    : "That's your free calculation. Unlock once to keep using stairs and concrete.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unlock set-out</CardTitle>
        <CardDescription>
          {afterWin
            ? winLine
            : `One-time ${priceLabel}. Unlocks stair set-out and concrete volume forever.`}
        </CardDescription>
      </CardHeader>
      <ul className="mb-5 flex flex-col gap-1.5 text-sm text-ink">
        <li>— Stair set-out, with soft NCC / AS 1657 hints</li>
        <li>— Concrete volume</li>
        <li>— Same unlock for both — not a separate purchase</li>
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
          {busy ? "Working…" : `Unlock both · ${priceLabel}`}
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
  );
}
