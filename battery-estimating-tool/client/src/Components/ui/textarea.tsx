import * as React from "react"

import { cn } from "#Constants/cn"

// Grows to fit its content instead of scrolling, and can't be manually
// resized (no drag handle).
function Textarea({
  className,
  onInput,
  ...props
}: React.ComponentProps<"textarea">) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [])

  React.useEffect(() => {
    resize()
  }, [props.value, resize])

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      onInput={(e) => {
        resize()
        onInput?.(e)
      }}
      className={cn(
        "flex min-h-16 w-full resize-none overflow-hidden rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
