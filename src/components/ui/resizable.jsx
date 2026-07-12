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
      "relative flex w-1.5 items-center justify-center bg-border/80 transition-colors hover:bg-primary/60 active:bg-primary after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 cursor-col-resize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:translate-y-1/2 first-of-type:pointer-events-none",
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
