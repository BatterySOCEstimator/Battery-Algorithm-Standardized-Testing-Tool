import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { IconColumns3, IconGripVertical } from "@tabler/icons-react";
import { cn } from "#Constants/cn";
import { Button } from "#Components/ui/button";
import { Checkbox } from "#Components/ui/checkbox";
import { Label } from "#Components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "#Components/ui/dropdown-menu";

// A single reorderable row: a grip handle (the only drag surface — the
// checkbox/label stay independently clickable) plus the visibility toggle.
// Deliberately no DragOverlay here — the row just translates itself via its
// own CSS transform, which is always relative to its own layout position,
// so there's no separate cursor-anchored element to mis-position (that's
// what was causing the dragged row to land well below the cursor when this
// used DragOverlay inside this popup).
const SortableColumnRow = ({ col, checked, onCheckedChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md py-0.5 pr-1.5 pl-0.5 text-sm select-none",
        isDragging ? "relative z-10 bg-popover shadow-md" : "hover:bg-accent",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${col} column`}
        className="flex touch-none items-center rounded p-1 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <IconGripVertical className="h-4 w-4" />
      </button>
      <Checkbox id={`col-${col}`} checked={checked} onCheckedChange={onCheckedChange} />
      {/* Every row must stay exactly one line — verticalListSortingStrategy
          assumes uniform item heights, and a taller wrapped row throws off
          its reorder math, which looks like the dragged item jumping. */}
      <Label
        htmlFor={`col-${col}`}
        title={col}
        className="flex-1 cursor-pointer overflow-hidden py-0.5 pl-1.5 font-normal text-ellipsis whitespace-nowrap"
      >
        {col}
      </Label>
    </div>
  );
};

// Column visibility + order menu, shared by the Leaderboard and Submissions
// tables. Order lives in the parent (it drives both the visible table
// columns and the "current view" CSV export), this just renders the
// drag-to-reorder checklist and reports reordering back via onOrderChange.
const ColumnsMenu = ({ order, onOrderChange, visibility, onVisibilityChange }) => {
  // A small activation distance keeps a plain click on the handle from
  // being misread as a drag, without needing a separate press-and-hold delay.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id);
    const newIndex = order.indexOf(over.id);
    onOrderChange(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <IconColumns3 className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5">
              {order.map((col) => (
                <SortableColumnRow
                  key={col}
                  col={col}
                  checked={visibility[col]}
                  onCheckedChange={(checked) =>
                    onVisibilityChange((prev) => ({ ...prev, [col]: checked }))
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnsMenu;
