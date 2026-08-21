import { useState } from "react";
import { IconBan, IconCircleCheck, IconDots, IconLogout2 } from "@tabler/icons-react";

import { Button } from "#Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from "#Components/ui/textarea";
import { Label } from "#Components/ui/label";
import { banUser, unbanUser, revokeSessions } from "#Constants/adminActions";

const BAN_REASON_MAX_LENGTH = 500;

// Per-row "..." actions menu for the admin users table: ban/unban
// (POST /api/admin/users/:id/ban|unban) and force-logout via session
// revocation (POST /api/admin/users/:id/revoke-sessions).
// Only patches the row locally via onRowUpdate once a request actually succeeds.
const UserRowActions = ({ row, currentUserId, onRowUpdate }) => {
  const [banOpen, setBanOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);

  const isSelf = row.id === currentUserId;

  // Opening a Dialog from a DropdownMenuItem's onClick, in the same tick the
  // menu closes, can get its own "outside click" dismissed by the menu's own
  // close handling, deferring to the next macrotask lets the menu fully
  // close first (same fix as SubmissionRowActions).
  const openAfterMenuCloses = (setOpen) => {
    setTimeout(() => setOpen(true), 0);
  };

  const handleConfirmBan = async () => {
    setBanOpen(false);
    const success = await banUser(row.id, reason.trim() || undefined);
    if (success) {
      onRowUpdate(row.id, { banned: true, banReason: reason.trim() || null });
      setReason("");
    }
  };

  const handleUnban = async () => {
    const success = await unbanUser(row.id);
    if (success) onRowUpdate(row.id, { banned: false, banReason: null });
  };

  const handleConfirmRevoke = async () => {
    setRevokeOpen(false);
    await revokeSessions(row.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={isSelf}>
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => openAfterMenuCloses(setRevokeOpen)}>
            <IconLogout2 className="h-4 w-4" />
            Revoke Sessions
          </DropdownMenuItem>
          {row.banned ? (
            <DropdownMenuItem onClick={handleUnban}>
              <IconCircleCheck className="h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onClick={() => openAfterMenuCloses(setBanOpen)}>
              <IconBan className="h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBan className="h-5 w-5 text-destructive" />
              Ban {row.name}?
            </DialogTitle>
            <DialogDescription>
              They'll be signed out and unable to log back in until unbanned.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Why is this account being banned?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={BAN_REASON_MAX_LENGTH}
            />
            <span className="self-end text-xs text-muted-foreground">
              {reason.length}/{BAN_REASON_MAX_LENGTH}
            </span>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmBan}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconLogout2 className="h-5 w-5 text-destructive" />
              Revoke sessions for {row.name}?
            </DialogTitle>
            <DialogDescription>
              They'll be signed out of every device and will need to log in again. This
              doesn't ban the account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmRevoke}>
              Revoke Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserRowActions;
