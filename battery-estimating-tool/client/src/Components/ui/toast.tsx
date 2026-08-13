"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { IconX, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react"

import { cn } from "#Constants/cn"
import { toastManager } from "#Constants/toast"

// Wraps the app so any component (or modelActions.js, via the shared
// toastManager) can push a toast onto the shared queue.
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      {children}
      <ToastViewportPortal />
    </ToastPrimitive.Provider>
  )
}

// Renders the current queue of toasts, colored by type: green for
// "success", red for "error", neutral otherwise.
function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={(state) =>
        cn(
          "relative flex w-full items-start gap-2.5 rounded-lg border p-3 pr-8 shadow-lg backdrop-blur-sm transition-all data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          state.type === "success" && "border-primary bg-primary/10 text-primary",
          state.type === "error" && "border-red-600 bg-red-500/10 text-red-600",
          !state.type && "border-border bg-popover/80 text-popover-foreground"
        )
      }
    >
      {toast.type === "success" && <IconCircleCheck className="mt-0.5 size-4 shrink-0" />}
      {toast.type === "error" && <IconAlertCircle className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">
        <ToastPrimitive.Title className="text-sm font-medium" />
        <ToastPrimitive.Description className="text-sm opacity-90" />
      </div>
      <ToastPrimitive.Close className="absolute top-2 right-2 rounded-md p-1 opacity-70 outline-none transition-opacity hover:opacity-100">
        <IconX className="size-3.5" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

function ToastViewportPortal() {
  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-100 flex w-full max-w-sm flex-col gap-2 outline-none">
        <ToastList />
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  )
}

export { ToastProvider, toastManager }
