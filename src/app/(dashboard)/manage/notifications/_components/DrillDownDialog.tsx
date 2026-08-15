'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { NotificationSendLog } from '@/types/email-notifications';
import { CheckCircle2, XCircle, AlertTriangle, Eye, Clock } from 'lucide-react';

interface DrillDownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateCode: string | null;
  templateSubject: string | null;
  sends: NotificationSendLog[];
}

export function DrillDownDialog({
  open,
  onOpenChange,
  templateCode,
  templateSubject,
  sends,
}: DrillDownDialogProps) {
  const filteredSends = templateCode
    ? sends.filter((s) => s.template?.code === templateCode || s.trigger?.code === templateCode)
    : sends;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Send Audit Drill-Down: <code className="text-primary">{templateCode || 'All'}</code>
          </DialogTitle>
          <DialogDescription>
            {templateSubject || 'Detailed recipient activity log'} — {filteredSends.length} total records
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 border rounded-lg mt-2">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead>Recipient / Alumnus</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSends.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No sends logged for this template yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSends.map((send) => (
                  <TableRow key={send.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {send.alumni?.full_name || 'Alumnus'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {send.recipient_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {send.alumni?.campus || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {send.status === 'sent' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </Badge>
                      ) : send.skip_reason ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                          <AlertTriangle className="w-3 h-3" /> Skipped ({send.skip_reason})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                          <XCircle className="w-3 h-3" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {send.provider}
                    </TableCell>
                    <TableCell>
                      {send.opened_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          {send.open_count} {send.open_count === 1 ? 'open' : 'opens'}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(send.sent_at).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
