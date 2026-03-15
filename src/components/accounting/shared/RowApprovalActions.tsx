import { useState } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Check, X } from "lucide-react";

interface RowApprovalActionsProps {
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  requireComment?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}

export function RowApprovalActions({
  onApprove,
  onReject,
  requireComment = false,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: RowApprovalActionsProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  const handleApprove = () => {
    if (requireComment && !approveComment.trim()) {
      return;
    }
    onApprove(approveComment || undefined);
    setApproveComment("");
    setIsApproveModalOpen(false);
  };

  const handleReject = () => {
    if (requireComment && !rejectComment.trim()) {
      return;
    }
    onReject(rejectComment || undefined);
    setRejectComment("");
    setIsRejectModalOpen(false);
  };

  const handleQuickApprove = () => {
    if (requireComment) {
      setIsApproveModalOpen(true);
    } else {
      onApprove();
    }
  };

  const handleQuickReject = () => {
    setIsRejectModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
          style={{ borderRadius: 'var(--radius-xs)' }}
          onClick={handleQuickApprove}
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          {approveLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
          style={{ borderRadius: 'var(--radius-xs)' }}
          onClick={handleQuickReject}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          {rejectLabel}
        </Button>
      </div>

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Entry</DialogTitle>
            <DialogDescription>
              Add a comment for this approval (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[14px]">Comment</Label>
              <Textarea
                placeholder="Add approval notes..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                className="min-h-[100px]"
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
              {requireComment && !approveComment.trim() && (
                <p className="text-[12px] text-red-600">Comment is required</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveComment("");
                  setIsApproveModalOpen(false);
                }}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={requireComment && !approveComment.trim()}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Entry</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[14px]">
                Reason {requireComment && <span className="text-red-600">*</span>}
              </Label>
              <Textarea
                placeholder="Explain why this entry is being rejected..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                className="min-h-[100px]"
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
              {requireComment && !rejectComment.trim() && (
                <p className="text-[12px] text-red-600">Reason is required</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectComment("");
                  setIsRejectModalOpen(false);
                }}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={requireComment && !rejectComment.trim()}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
