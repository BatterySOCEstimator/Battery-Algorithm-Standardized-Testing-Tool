import { useState } from "react";
import {
  IconDots,
  IconLock,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconFileZip,
  IconChartBar,
} from "@tabler/icons-react";

import { Button } from "#Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "#Components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "#Components/ui/dialog";
import { Input } from "#Components/ui/input";
import { Textarea } from "#Components/ui/textarea";
import { Label } from "#Components/ui/label";
import LabeledSelect from "../LabeledSelect/LabeledSelect";
import {
  modelTypes,
  MODEL_NAME_MAX_LENGTH,
  MODEL_DESCRIPTION_MAX_LENGTH,
} from "../../Constants/Helperfunc.js";
import { updateModel, deleteModel, downloadModelFile } from "#Constants/modelActions";

// Strip characters that aren't safe in a filename across OSes, so the
// downloaded file is still named after the model even if its display name
// has slashes, colons, etc. in it.
const sanitizeFilename = (name) => name.replace(/[\\/:*?"<>|]/g, "_").trim() || "model";

// Per-row "..." actions menu for the submissions table: toggle privacy,
// edit the model's basic info, or delete it. Each action calls its real
// endpoint (updateModel/deleteModel) and only patches the row locally via
// onRowUpdate/onRowDelete once that call actually succeeds — a failed
// request leaves the row as-is and shows a red toast with the error
// instead of pretending the change went through.
const SubmissionRowActions = ({ row, onRowUpdate, onRowDelete }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form fields, seeded from the row's current values.
  const [editName, setEditName] = useState(row["Model Name"] ?? "");
  const [editDescription, setEditDescription] = useState(row.Description ?? "");
  const [editModelType, setEditModelType] = useState(row["Model Type"] ?? modelTypes[0]);

  const isPrivate = row.Visibility === "Private";

  // Privacy is just another field on the model, so it goes through the
  // same updateModel endpoint as the edit form.
  const handleTogglePrivate = async (checked) => {
    const nextVisibility = checked ? "Private" : "Public";
    const success = await updateModel(
      row.Submission,
      { isPrivate: checked },
      "Privacy updated",
    );
    if (success) onRowUpdate(row.Submission, { Visibility: nextVisibility });
  };

  const handleSaveEdit = async () => {
    setEditOpen(false);

    // Only send fields that actually changed, matching the backend's
    // partial-update contract and keeping the toast's "x, y updated"
    // message accurate to what really changed.
    const changes = {};
    const rowUpdates = {};
    if (editName !== (row["Model Name"] ?? "")) {
      changes.name = editName;
      rowUpdates["Model Name"] = editName;
    }
    if (editDescription !== (row.Description ?? "")) {
      changes.description = editDescription;
      rowUpdates.Description = editDescription;
    }
    if (editModelType !== (row["Model Type"] ?? modelTypes[0])) {
      changes.modelType = editModelType;
      rowUpdates["Model Type"] = editModelType;
    }

    if (Object.keys(changes).length === 0) return;

    const success = await updateModel(row.Submission, changes);
    if (success) onRowUpdate(row.Submission, rowUpdates);
  };

  const handleConfirmDelete = async () => {
    setDeleteOpen(false);
    const success = await deleteModel(row.Submission);
    if (success) onRowDelete(row.Submission);
  };

  // Only available once evaluation has actually produced a model + results
  // to download.
  const canDownload = row.Status === "ready";
  const downloadName = sanitizeFilename(row["Model Name"] ?? "model");

  // Opening a Dialog from a DropdownMenuItem's onSelect, in the same tick
  // the menu closes, can get its own "outside click" dismissed by the
  // menu's own close handling. Deferring to the next macrotask lets the
  // menu fully close first.
  const openAfterMenuCloses = (setOpen) => {
    setTimeout(() => setOpen(true), 0);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuCheckboxItem checked={isPrivate} onCheckedChange={handleTogglePrivate}>
            <IconLock className="h-4 w-4" />
            Private
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {/* Base UI's MenuItem only has onClick, not onSelect (a Radix-ism) —
              using onSelect here silently did nothing, which is why these
              dialogs never opened. */}
          <DropdownMenuItem onClick={() => openAfterMenuCloses(setEditOpen)}>
            <IconPencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {canDownload && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadModelFile(row.ModelFileToken, `${downloadName}.zip`)}>
                <IconFileZip className="h-4 w-4" />
                Download Model
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadModelFile(row.ResultsFileToken, `${downloadName}-results.zip`)}
              >
                <IconChartBar className="h-4 w-4" />
                Download Results
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => openAfterMenuCloses(setDeleteOpen)}
          >
            <IconTrash className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog: title, description, model type */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit submission</DialogTitle>
            <DialogDescription>Update this model's basic info.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={MODEL_NAME_MAX_LENGTH}
              />
              <span className="self-end text-xs text-muted-foreground">
                {editName.length}/{MODEL_NAME_MAX_LENGTH}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter model description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={MODEL_DESCRIPTION_MAX_LENGTH}
              />
              <span className="self-end text-xs text-muted-foreground">
                {editDescription.length}/{MODEL_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <LabeledSelect
              label="Model Type"
              options={modelTypes}
              value={editModelType}
              onFilterChange={(_label, value) => setEditModelType(value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation: makes the irreversibility explicit before acting */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
              Delete this submission?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete "{row["Model Name"]}". This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubmissionRowActions;
