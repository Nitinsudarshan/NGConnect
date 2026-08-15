'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotificationProviderSettings, EmailProviderType } from '@/types/email-notifications';
import {
  Send,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Mail,
  Flame,
  Globe,
  Lock,
} from 'lucide-react';

const DEFAULT_SETTINGS: NotificationProviderSettings = {
  id: 1,
  active_provider: 'dry_run',
  from_name: 'NGConnect',
  from_email: 'notifications@navgurukul.org',
  reply_to: null,
  sandbox_mode: true,
  sandbox_redirect_email: null,
  kill_switch: false,
  ses_region: null,
  updated_at: new Date().toISOString(),
};

interface SettingsClientProps {
  initialSettings?: NotificationProviderSettings | null;
  dbError?: string | null;
}

export function SettingsClient({ initialSettings, dbError }: SettingsClientProps) {
  const [settings, setSettings] = useState<NotificationProviderSettings>(
    initialSettings || DEFAULT_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Test Email state
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSubject, setTestSubject] = useState('NGConnect Notifications Test Email');
  const [testBody, setTestBody] = useState('<p>Hello!</p><p>This is a test notification email sent from NGConnect.</p>');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    providerUsed?: string;
    providerMessageId?: string;
    previewUrl?: string;
    error?: string;
  } | null>(null);

  const handleSave = async (updatedSettings: Partial<NotificationProviderSettings>) => {
    setSaving(true);
    setSaveMessage(null);
    const newSettings = { ...settings, ...updatedSettings };

    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await res.json();
      setSettings(data);
      setSaveMessage('Settings updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error saving notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient,
          subject: testSubject,
          html: testBody,
          provider: settings.active_provider,
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || 'Network request failed' });
    } finally {
      setSendingTest(false);
    }
  };

  const getProviderBadge = (provider: EmailProviderType) => {
    switch (provider) {
      case 'dry_run':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Zero Credentials (Dry Run)</Badge>;
      case 'ethereal':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">Test Inbox (Ethereal SMTP)</Badge>;
      case 'gmail_smtp':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Gmail SMTP</Badge>;
      case 'ses':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">AWS SES</Badge>;
      case 'resend':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resend API</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
              Notification System Settings
            </h1>
            {getProviderBadge(settings.active_provider)}
          </div>
          <p className="text-muted-foreground text-sm">
            Manage active email dispatchers, sandbox modes, sender identities, and security kill switch.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="shadow-sm gap-2">
                <Send className="w-4 h-4" />
                Send Test Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Send Test Email
                </DialogTitle>
                <DialogDescription>
                  Dispatches a single email through the active provider (<code>{settings.active_provider}</code>) to verify connectivity.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendTest} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="testRecipient">Recipient Email Address</Label>
                  <Input
                    id="testRecipient"
                    type="email"
                    placeholder="you@navgurukul.org"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testSubject">Subject</Label>
                  <Input
                    id="testSubject"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testBody">HTML Body</Label>
                  <Input
                    id="testBody"
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    required
                  />
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg border text-sm space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  }`}>
                    <div className="flex items-center gap-2 font-medium">
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Email sent successfully via {testResult.providerUsed}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          Send Failed: {testResult.error}
                        </>
                      )}
                    </div>
                    {testResult.providerMessageId && (
                      <p className="text-xs font-mono opacity-80">Message ID: {testResult.providerMessageId}</p>
                    )}
                    {testResult.previewUrl && (
                      <div className="pt-1">
                        <a
                          href={testResult.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline hover:opacity-80"
                        >
                          Open Ethereal Preview Inbox <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setTestEmailOpen(false)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={sendingTest}>
                    {sendingTest ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Dispatch Test Send'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {saveMessage && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Database Warning Banner if tables not migrated */}
      {dbError && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Database Table Warning</p>
            <p className="text-xs opacity-90 mt-0.5">
              Could not read <code>notification_provider_settings</code> table ({dbError}). Showing default settings. Please execute migration script <code>20260813000002_email_notifications_system.sql</code> in the Supabase SQL Editor to enable persistent settings.
            </p>
          </div>
        </div>
      )}

      {/* Global Safety & Kill Switch Banner */}
      <Card className={`border-2 transition-all ${
        settings.kill_switch ? 'bg-destructive/10 border-destructive' : 'bg-card border-border/80'
      }`}>
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.kill_switch ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Emergency System Kill Switch
                {settings.kill_switch && <Badge variant="destructive">SYSTEM HALTED</Badge>}
              </h3>
              <p className="text-xs text-muted-foreground">
                When activated, immediately halts all outbound email sending across all triggers and queue background jobs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="killSwitch" className="font-semibold text-sm cursor-pointer">
              {settings.kill_switch ? 'Active (Halted)' : 'Inactive (Normal)'}
            </Label>
            <Switch
              id="killSwitch"
              checked={settings.kill_switch}
              onCheckedChange={(checked) => handleSave({ kill_switch: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Provider Selection Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sliders className="w-5 h-5 text-primary" />
              Active Email Provider Dispatcher
            </CardTitle>
            <CardDescription>
              Select the active email backend. Non-credential test providers (<code>dry_run</code> & <code>ethereal</code>) allow full end-to-end testing immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="providerSelect">Provider Strategy</Label>
              <Select
                value={settings.active_provider}
                onValueChange={(val: EmailProviderType) => handleSave({ active_provider: val })}
              >
                <SelectTrigger id="providerSelect">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry_run">
                    <div className="flex flex-col">
                      <span className="font-semibold">dry_run (Console & DB Log)</span>
                      <span className="text-xs text-muted-foreground">Logs send payload without making external network calls</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ethereal">
                    <div className="flex flex-col">
                      <span className="font-semibold">ethereal (nodemailer Test Account)</span>
                      <span className="text-xs text-muted-foreground">Sends over real SMTP to throwaway inbox with preview link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gmail_smtp">
                    <div className="flex flex-col">
                      <span className="font-semibold">gmail_smtp (Nodemailer SMTP)</span>
                      <span className="text-xs text-muted-foreground">Uses SMTP_HOST/PORT/USER/PASS env vars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ses">
                    <div className="flex flex-col">
                      <span className="font-semibold">ses (AWS SES)</span>
                      <span className="text-xs text-muted-foreground">Uses AWS_REGION/ACCESS_KEY/SECRET env vars</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="resend">
                    <div className="flex flex-col">
                      <span className="font-semibold">resend (Resend HTTP API)</span>
                      <span className="text-xs text-muted-foreground">Uses RESEND_API_KEY env var</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.active_provider === 'ses' && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="sesRegion">AWS SES Region</Label>
                <Input
                  id="sesRegion"
                  placeholder="us-east-1"
                  value={settings.ses_region || ''}
                  onChange={(e) => setSettings({ ...settings, ses_region: e.target.value })}
                  onBlur={() => handleSave({ ses_region: settings.ses_region })}
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Security Rule & Credentials Policy
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                API Key secrets (<code>RESEND_API_KEY</code>, <code>AWS_SECRET_ACCESS_KEY</code>, <code>SMTP_PASS</code>) stay securely in server environment variables and are never stored in the database.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sender Identity & Sandbox Mode */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              Sender Identity & Sandbox Routing
            </CardTitle>
            <CardDescription>
              Configure default sender headers and sandbox safety redirects for pre-production testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Display Name</Label>
                <Input
                  id="fromName"
                  value={settings.from_name || ''}
                  onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                  onBlur={() => handleSave({ from_name: settings.from_name })}
                  placeholder="NGConnect"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.from_email || ''}
                    onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                    onBlur={() => handleSave({ from_email: settings.from_email })}
                    placeholder="notifications@navgurukul.org"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={settings.reply_to || ''}
                    onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
                    onBlur={() => handleSave({ reply_to: settings.reply_to })}
                    placeholder="support@navgurukul.org"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sandboxMode" className="font-semibold cursor-pointer">
                    Sandbox Redirect Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Redirects all outbound triggers to a test inbox instead of real alumni recipients.
                  </p>
                </div>
                <Switch
                  id="sandboxMode"
                  checked={settings.sandbox_mode}
                  onCheckedChange={(checked) => handleSave({ sandbox_mode: checked })}
                />
              </div>

              {settings.sandbox_mode && (
                <div className="space-y-2 animate-in fade-in">
                  <Label htmlFor="sandboxRedirect">Sandbox Target Email</Label>
                  <Input
                    id="sandboxRedirect"
                    type="email"
                    placeholder="admin-test@navgurukul.org"
                    value={settings.sandbox_redirect_email || ''}
                    onChange={(e) => setSettings({ ...settings, sandbox_redirect_email: e.target.value })}
                    onBlur={() => handleSave({ sandbox_redirect_email: settings.sandbox_redirect_email })}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
