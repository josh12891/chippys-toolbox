import { StairsTool } from "../components/tools/stairs-tool.tsx"
import { UnlockGate } from "../components/unlock-gate.tsx"

export function StairsPage() {
  return (
    <UnlockGate title="Stair set-out">
      <StairsTool />
    </UnlockGate>
  )
}
