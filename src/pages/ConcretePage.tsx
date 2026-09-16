import { ConcreteTool } from "../components/tools/concrete-tool.tsx"
import { UnlockGate } from "../components/unlock-gate.tsx"

export function ConcretePage() {
  return (
    <UnlockGate title="Concrete volume">
      <ConcreteTool />
    </UnlockGate>
  )
}
