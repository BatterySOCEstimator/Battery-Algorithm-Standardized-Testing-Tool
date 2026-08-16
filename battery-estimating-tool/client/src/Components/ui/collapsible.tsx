"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

import { cn } from "#Constants/cn"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

// Animates open/close with a CSS `grid-template-rows: 0fr -> 1fr` trick,
// driven directly off the plain `open` boolean the caller already tracks in
// React state. Measured this directly (sampling the panel's real computed
// height frame-by-frame): closing genuinely animated smoothly, but opening
// jumped straight to the final height in the very first frame. The cause is
// Base UI's own `hidden` attribute on its Panel — closing keeps it off for
// the whole transition, but opening removes it in the same commit that also
// expands the row, and a browser can't transition an element from "not
// rendered" to "rendered with the new value" in one step; there's no
// previous painted frame for it to interpolate from.
// So the animated element here is a plain, always-rendered div that Base UI
// never touches — Collapsible.Panel is nested inside it purely for its
// aria-controls/id wiring and eventual `hidden`-when-closed state, which no
// longer has any bearing on what's visually animating.
function CollapsiblePanel({
  className,
  children,
  open,
  ...props
}: CollapsiblePrimitive.Panel.Props & { open: boolean }) {
  return (
    <div
      className={cn(
        "grid w-full transition-[grid-template-rows] duration-300 ease-in-out",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      {/* Grid items default to `min-height: auto`, which refuses to shrink
          below the content's own natural size no matter how small the grid
          track is sized — without min-h-0 the track can visually shrink
          only partway before hitting that content-driven floor, and the
          rest of the collapse happens as an abrupt cut instead of a slide.
          The opacity fade isn't just decorative: Base UI decides when it's
          safe to apply `hidden` (and unmount, without keepMounted) by
          watching for an active CSS animation directly on this element via
          getAnimations() — without something real transitioning here it
          finds nothing to wait for and hides the panel the instant `open`
          flips, cutting off the outer grid-rows slide before it can run. */}
      <CollapsiblePrimitive.Panel
        data-slot="collapsible-panel"
        keepMounted
        className={cn(
          "min-h-0 overflow-hidden transition-opacity duration-300 ease-in-out",
          open ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Panel>
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel }
