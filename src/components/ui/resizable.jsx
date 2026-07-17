import * as React from "react"
import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}) => (
  <Group
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle = true,
  className,
  ...props
}) => (
  <Separator
    className={cn(
      "relative flex w-px z-[9999] items-center justify-center bg-border transition-colors hover:bg-primary active:bg-primary after:absolute after:inset-y-0 after:left-1/2 after:w-8 after:-translate-x-1/2 cursor-col-resize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-8 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:translate-y-1/2",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-7 w-4 items-center justify-center rounded-md border bg-background shadow-md hover:border-primary/50 hover:bg-accent transition-all cursor-col-resize">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
      </div>
    )}
  </Separator>
)

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
}
