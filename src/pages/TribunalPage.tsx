import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Gavel, Video, MessageCircle, Users, ChevronLeft, Send, Crown,
  Clock, CheckCircle, XCircle, Shield, Eye, UserPlus, Play, Square,
} from 'lucide-react';

type TribunalSession = {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  status: string;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  presided_by: string;
  accused_id: string | null;
  verdict: string | null;
  verdict_details: string | null;
  daily_room_name: string | null;
  daily_room_url: string | null;
};

type Participant = {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  status: string;
  admitted_at: string | null;
  notes: string | null;
  profile?: { pseudonym: string } | null;
};

type TribunalMsg = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender?: { pseudonym: string } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: 'Planifiée', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  waiting_room: { label: 'Salle d\'attente', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-green-500/20 text-green-400', icon: Play },
  deliberation: { label: 'Délibération', color: 'bg-purple-500/20 text-purple-400', icon: Eye },
  completed: { label: 'Terminée', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

const roleLabels: Record<string, string> = {
  judge: 'Juge', accused: 'Accusé', witness: 'Témoin', defense: 'Défense', observer: 'Observateur',
};

const TribunalPage = () => {
  const { user, isGuardianSupreme } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TribunalSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TribunalSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<TribunalMsg[]>([]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audience');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [members, setMembers] = useState<{ id: string; pseudonym: string }[]>([]);
  const [newSession, setNewSession] = useState({ title: '', description: '', session_type: 'trial', scheduled_at: '' });
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('observer');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const myParticipation = participants.find(p => p.user_id === user?.id);
  // Guardian Supreme has full access to everything, always considered admitted + judge
  const isAdmitted = isGuardianSupreme || myParticipation?.status === 'admitted';
  const isJudge = isGuardianSupreme || myParticipation?.role === 'judge';

  useEffect(() => {
    fetchSessions();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchParticipants(selectedSession.id);
      fetchChatMessages(selectedSession.id);

      const channel = supabase
        .channel(`tribunal-${selectedSession.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tribunal_messages', filter: `session_id=eq.${selectedSession.id}` },
          async (payload) => {
            const msg = payload.new as TribunalMsg;
            const { data: profile } = await supabase.from('profiles').select('pseudonym').eq('id', msg.sender_id).maybeSingle();
            setChatMessages(prev => [...prev, { ...msg, sender: profile }]);
          }
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tribunal_participants', filter: `session_id=eq.${selectedSession.id}` },
          () => fetchParticipants(selectedSession.id)
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedSession?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase.from('tribunal_sessions').select('*').order('scheduled_at', { ascending: false });
    if (data) setSessions(data as TribunalSession[]);
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase.from('profiles').select('id, pseudonym').eq('status', 'active');
    if (data) setMembers(data);
  };

  const fetchParticipants = async (sessionId: string) => {
    const { data } = await supabase.from('tribunal_participants').select('*').eq('session_id', sessionId);
    if (data) {
      const withProfiles = await Promise.all(data.map(async (p) => {
        const { data: profile } = await supabase.from('profiles').select('pseudonym').eq('id', p.user_id).maybeSingle();
        return { ...p, profile } as Participant;
      }));
      setParticipants(withProfiles);
    }
  };

  const fetchChatMessages = async (sessionId: string) => {
    const { data } = await supabase.from('tribunal_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
    if (data) {
      const withSenders = await Promise.all(data.map(async (m) => {
        const { data: profile } = await supabase.from('profiles').select('pseudonym').eq('id', m.sender_id).maybeSingle();
        return { ...m, sender: profile } as TribunalMsg;
      }));
      setChatMessages(withSenders);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.title || !newSession.scheduled_at) return;
    const roomName = `tribunal-${Date.now()}`;
    const { error } = await supabase.from('tribunal_sessions').insert({
      title: newSession.title,
      description: newSession.description || null,
      session_type: newSession.session_type,
      scheduled_at: newSession.scheduled_at,
      presided_by: user!.id,
      daily_room_name: roomName,
      daily_room_url: `https://meet.jit.si/${roomName}`,
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Session créée' });
      setShowCreateDialog(false);
      setNewSession({ title: '', description: '', session_type: 'trial', scheduled_at: '' });
      fetchSessions();
    }
  };

  const handleInviteParticipant = async () => {
    if (!inviteUserId || !selectedSession) return;
    const { error } = await supabase.from('tribunal_participants').insert({
      session_id: selectedSession.id,
      user_id: inviteUserId,
      role: inviteRole,
      status: 'invited',
    });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      // Send in-app message invitation
      await supabase.from('messages').insert({
        sender_id: user!.id,
        recipient_id: inviteUserId,
        subject: `Convocation au Tribunal`,
        content: `Vous êtes convoqué(e) au Tribunal pour la session "${selectedSession.title}" en tant que ${roleLabels[inviteRole] || inviteRole}. Rendez-vous dans la section Tribunal.`,
      });
      toast({ title: 'Participant invité', description: 'Une convocation a été envoyée par message.' });
      setShowInviteDialog(false);
      setInviteUserId('');
      setInviteRole('observer');
      fetchParticipants(selectedSession.id);
    }
  };

  const handleAdmitParticipant = async (participantId: string) => {
    await supabase.from('tribunal_participants').update({ status: 'admitted', admitted_at: new Date().toISOString() }).eq('id', participantId);
    if (selectedSession) fetchParticipants(selectedSession.id);
  };

  const handleUpdateSessionStatus = async (newStatus: string) => {
    if (!selectedSession) return;
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'in_progress') updates.started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.ended_at = new Date().toISOString();
    await supabase.from('tribunal_sessions').update(updates).eq('id', selectedSession.id);
    setSelectedSession({ ...selectedSession, status: newStatus });
    fetchSessions();
  };

  const handleSendChat = async () => {
    if (!newChatMsg.trim() || !selectedSession) return;
    const { error } = await supabase.from('tribunal_messages').insert({
      session_id: selectedSession.id,
      sender_id: user!.id,
      content: newChatMsg.trim(),
      message_type: 'public',
    });
    if (!error) setNewChatMsg('');
  };

  const handleSetVerdict = async (verdict: string, details: string) => {
    if (!selectedSession) return;
    await supabase.from('tribunal_sessions').update({ verdict, verdict_details: details }).eq('id', selectedSession.id);
    setSelectedSession({ ...selectedSession, verdict, verdict_details: details });
    toast({ title: 'Verdict rendu' });
  };

  const jitsiUrl = selectedSession?.daily_room_url || (selectedSession?.daily_room_name ? `https://meet.jit.si/${selectedSession.daily_room_name}` : null);

  if (selectedSession) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-12rem)]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-heading tracking-wider text-primary">{selectedSession.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusConfig[selectedSession.status]?.color || ''}>
                  {statusConfig[selectedSession.status]?.label || selectedSession.status}
                </Badge>
                {selectedSession.session_type !== 'trial' && (
                  <Badge variant="outline" className="text-xs">{selectedSession.session_type}</Badge>
                )}
              </div>
            </div>
            {isGuardianSupreme && (
              <Select value={selectedSession.status} onValueChange={handleUpdateSessionStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifiée</SelectItem>
                  <SelectItem value="waiting_room">Salle d'attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="deliberation">Délibération</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedSession.description && (
            <p className="text-sm text-muted-foreground mb-4 pl-12">{selectedSession.description}</p>
          )}

          {/* Verdict display */}
          {selectedSession.verdict && (
            <div className="ritual-card p-4 mb-4 border-primary/40">
              <h3 className="font-heading text-sm tracking-wider text-primary mb-1">⚖️ VERDICT</h3>
              <p className="text-foreground font-semibold">{selectedSession.verdict}</p>
              {selectedSession.verdict_details && <p className="text-sm text-muted-foreground mt-1">{selectedSession.verdict_details}</p>}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="audience" className="flex-1 gap-2"><Video className="w-4 h-4" />Audience</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1 gap-2"><MessageCircle className="w-4 h-4" />Chat</TabsTrigger>
              <TabsTrigger value="participants" className="flex-1 gap-2"><Users className="w-4 h-4" />Participants</TabsTrigger>
            </TabsList>

            {/* Video Tab - Jitsi */}
            <TabsContent value="audience">
              {(selectedSession.status === 'in_progress' || selectedSession.status === 'deliberation') && jitsiUrl && isAdmitted ? (
                <div className="ritual-card overflow-hidden">
                  <iframe
                    src={`${jitsiUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true`}
                    className="w-full aspect-video border-0"
                    allow="camera; microphone; fullscreen; display-capture"
                    title="Tribunal - Salle d'audience"
                  />
                </div>
              ) : (
                <div className="ritual-card p-12 text-center">
                  {selectedSession.status === 'waiting_room' ? (
                    <>
                      <Clock className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                      <h3 className="font-heading text-lg tracking-wider mb-2">SALLE D'ATTENTE</h3>
                      <p className="text-muted-foreground text-sm">
                        {isAdmitted ? 'Vous êtes admis(e). L\'audience va bientôt commencer.' : 'En attente d\'admission par le juge.'}
                      </p>
                    </>
                  ) : selectedSession.status === 'scheduled' ? (
                    <>
                      <Gavel className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                      <h3 className="font-heading text-lg tracking-wider mb-2">SESSION PLANIFIÉE</h3>
                      <p className="text-muted-foreground text-sm">
                        Prévue le {new Date(selectedSession.scheduled_at).toLocaleDateString('fr-FR', { dateStyle: 'full' })}
                      </p>
                    </>
                  ) : selectedSession.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                      <h3 className="font-heading text-lg tracking-wider mb-2">SESSION TERMINÉE</h3>
                    </>
                  ) : !isAdmitted ? (
                    <>
                      <Shield className="w-16 h-16 text-destructive/40 mx-auto mb-4" />
                      <h3 className="font-heading text-lg tracking-wider mb-2">ACCÈS RESTREINT</h3>
                      <p className="text-muted-foreground text-sm">Vous n'êtes pas encore admis(e) à cette session.</p>
                    </>
                  ) : null}
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <div className="ritual-card flex flex-col h-[60vh]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'} ${msg.message_type === 'judges_only' ? 'border border-purple-500/50' : ''}`}>
                          {msg.sender_id !== user?.id && (
                            <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender?.pseudonym || 'Inconnu'}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {msg.message_type === 'judges_only' && ' 🔒 Juges'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                {isAdmitted && (
                  <div className="p-3 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={newChatMsg}
                        onChange={e => setNewChatMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                        placeholder="Message au tribunal..."
                        className="flex-1"
                      />
                      <Button size="icon" onClick={handleSendChat} disabled={!newChatMsg.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants">
              <div className="space-y-3">
                {isGuardianSupreme && (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="w-4 h-4" />Inviter un participant
                  </Button>
                )}
                {participants.map(p => (
                  <div key={p.id} className="ritual-card p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{p.profile?.pseudonym || 'Inconnu'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{roleLabels[p.role] || p.role}</Badge>
                        <Badge className={p.status === 'admitted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {p.status === 'admitted' ? 'Admis' : p.status === 'invited' ? 'Invité' : p.status}
                        </Badge>
                      </div>
                    </div>
                    {isGuardianSupreme && p.status === 'invited' && (
                      <Button size="sm" onClick={() => handleAdmitParticipant(p.id)}>Admettre</Button>
                    )}
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucun participant</p>
                )}
              </div>

              {/* Verdict Section (Guardian only) */}
              {isGuardianSupreme && selectedSession.status === 'deliberation' && !selectedSession.verdict && (
                <VerdictForm onSubmit={handleSetVerdict} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Invite Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un participant</DialogTitle>
              <DialogDescription>Sélectionnez un membre et son rôle au tribunal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={inviteUserId} onValueChange={setInviteUserId}>
                <SelectTrigger><SelectValue placeholder="Choisir un membre" /></SelectTrigger>
                <SelectContent>
                  {members.filter(m => m.id !== user?.id && !participants.some(p => p.user_id === m.id)).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.pseudonym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="judge">Juge</SelectItem>
                  <SelectItem value="accused">Accusé</SelectItem>
                  <SelectItem value="witness">Témoin</SelectItem>
                  <SelectItem value="defense">Défense</SelectItem>
                  <SelectItem value="observer">Observateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleInviteParticipant} disabled={!inviteUserId}>Inviter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Session Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une session</DialogTitle>
              <DialogDescription>Planifiez une nouvelle audience du Tribunal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Titre de la session" value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description (optionnel)" value={newSession.description} onChange={e => setNewSession(p => ({ ...p, description: e.target.value }))} />
              <Select value={newSession.session_type} onValueChange={v => setNewSession(p => ({ ...p, session_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Procès</SelectItem>
                  <SelectItem value="hearing">Audience</SelectItem>
                  <SelectItem value="deliberation">Délibération</SelectItem>
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={newSession.scheduled_at} onChange={e => setNewSession(p => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSession} disabled={!newSession.title || !newSession.scheduled_at}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainLayout>
    );
  }

  // Sessions list
  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gavel className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading tracking-widest">TRIBUNAL</h1>
          </div>
          {isGuardianSupreme && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Gavel className="w-4 h-4" />Nouvelle session
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="ritual-card p-12 text-center">
            <Gavel className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune session du Tribunal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const config = statusConfig[session.status];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ritual-card p-4 cursor-pointer hover:border-primary/60 transition-colors"
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-foreground tracking-wider">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(session.scheduled_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                        {' — '}
                        {new Date(session.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge className={config?.color || ''}>{config?.label || session.status}</Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Create Dialog (also accessible from list view) */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une session</DialogTitle>
              <DialogDescription>Planifiez une nouvelle audience du Tribunal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Titre de la session" value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description (optionnel)" value={newSession.description} onChange={e => setNewSession(p => ({ ...p, description: e.target.value }))} />
              <Select value={newSession.session_type} onValueChange={v => setNewSession(p => ({ ...p, session_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Procès</SelectItem>
                  <SelectItem value="hearing">Audience</SelectItem>
                  <SelectItem value="deliberation">Délibération</SelectItem>
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={newSession.scheduled_at} onChange={e => setNewSession(p => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSession} disabled={!newSession.title || !newSession.scheduled_at}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

// Verdict Form sub-component
const VerdictForm = ({ onSubmit }: { onSubmit: (verdict: string, details: string) => void }) => {
  const [verdict, setVerdict] = useState('');
  const [details, setDetails] = useState('');
  return (
    <div className="ritual-card p-4 mt-6 border-primary/40">
      <h3 className="font-heading text-sm tracking-wider text-primary mb-3">⚖️ RENDRE LE VERDICT</h3>
      <div className="space-y-3">
        <Select value={verdict} onValueChange={setVerdict}>
          <SelectTrigger><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="guilty">Coupable</SelectItem>
            <SelectItem value="not_guilty">Non coupable</SelectItem>
            <SelectItem value="acquitted">Acquitté</SelectItem>
            <SelectItem value="deferred">Ajourné</SelectItem>
          </SelectContent>
        </Select>
        <Textarea placeholder="Détails du verdict..." value={details} onChange={e => setDetails(e.target.value)} />
        <Button onClick={() => onSubmit(verdict, details)} disabled={!verdict} className="w-full">Prononcer le verdict</Button>
      </div>
    </div>
  );
};

export default TribunalPage;
