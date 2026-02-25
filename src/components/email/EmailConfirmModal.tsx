'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types/lead';
import { useToast } from '@/components/ui/Toast';
import { Send, Mail, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailConfirmModal({ lead, open, onClose, onSuccess }: Props) {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  const generatePreview = useCallback(async () => {
    if (!lead) return;
    setGenerating(true);
    setGenerated(false);
    try {
      const res = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadName: lead.name, leadEmail: lead.email }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubject(data.data.subject || '');
        setBody(data.data.body || '');
        setGenerated(true);
      } else {
        toast(`Erreur: ${data.error || 'Generation echouee'}`, 'error');
      }
    } catch {
      toast('Erreur de connexion avec n8n', 'error');
    } finally {
      setGenerating(false);
    }
  }, [lead, toast]);

  useEffect(() => {
    if (open && lead) {
      setSubject('');
      setBody('');
      setGenerated(false);
      generatePreview();
    }
  }, [open, lead, generatePreview]);

  if (!lead) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast('Sujet et contenu requis', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          leadEmail: lead.email,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Email envoye a ${lead.name}`, 'success');
        onSuccess();
        onClose();
      } else {
        toast(`Erreur: ${data.error}`, 'error');
      }
    } catch {
      toast('Erreur de connexion', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Email personnalise" size="lg">
      <div className="space-y-5">
        {/* Lead info header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{lead.name}</p>
            <p className="text-sm text-white/50 truncate">{lead.email}</p>
          </div>
        </div>

        {/* Loading state */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/80">Generation par l&apos;IA en cours...</p>
              <p className="text-xs text-white/40 mt-1">Analyse du prospect et redaction de l&apos;email</p>
            </div>
          </div>
        )}

        {/* Email preview / edit form */}
        {generated && !generating && (
          <>
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                  Contenu
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={sending}
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors text-sm leading-relaxed resize-none"
                />
              </div>
            </div>

            <p className="text-xs text-white/30">
              Mode test : envoi a libasselaye01@gmail.com (CC: libasselaye97@icloud.com)
            </p>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={sending}>
            Annuler
          </Button>
          {generated && !generating && (
            <>
              <Button variant="ghost" onClick={generatePreview} disabled={sending}>
                <RefreshCw className="w-4 h-4" />
                Regenerer
              </Button>
              <Button className="flex-1" loading={sending} onClick={handleSend}>
                <Send className="w-4 h-4" />
                Envoyer
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
