import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Send, ChevronLeft, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmojiPicker } from '@/components/EmojiPicker';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  min_grade: string | null;
}

interface GroupMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Profile {
  id: string;
  pseudonym: string;
}

const gradeOrder = ['novice', 'apprenti', 'compagnon', 'maitre', 'sage', 'oracle'];

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const ChannelsPage = () => {
  const { user, profile, isGuardianSupreme } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data } = await supabase.from('group_channels').select('*');
      if (data) {
        // Filter by grade
        const userGradeIndex = gradeOrder.indexOf(profile?.grade || 'novice');
        const accessible = (data as Channel[]).filter(c => {
          if (isGuardianSupreme) return true;
          const minIndex = gradeOrder.indexOf(c.min_grade || 'novice');
          return userGradeIndex >= minIndex;
        });
        setChannels(accessible);
      }
    };

    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('id, pseudonym');
      if (data) {
        const map = new Map<string, Profile>();
        data.forEach(p => map.set(p.id, p));
        setProfiles(map);
      }
    };

    fetchChannels();
    fetchProfiles();
  }, [profile, isGuardianSupreme]);

  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('channel_id', selectedChannel.id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as GroupMessage[]);
    };

    fetchMessages();

    const channel = supabase
      .channel(`group-${selectedChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `channel_id=eq.${selectedChannel.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as GroupMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;
    setIsSending(true);
    const { error } = await supabase.from('group_messages').insert({
      channel_id: selectedChannel.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)]">
        <AnimatePresence mode="wait">
          {selectedChannel ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-[calc(100vh-12rem)]"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-primary/20 bg-card/80 backdrop-blur-sm rounded-t-xl mt-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedChannel(null)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Hash className="w-5 h-5 text-gold" />
                <div className="flex-1">
                  <h2 className="font-heading text-sm text-foreground tracking-wider">{selectedChannel.name}</h2>
                  {selectedChannel.description && (
                    <p className="text-[10px] text-muted-foreground">{selectedChannel.description}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-2 bg-card/30">
                <div className="space-y-3 py-2">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    const sender = profiles.get(msg.sender_id);
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <Avatar className="h-7 w-7 bg-secondary">
                            <AvatarFallback className="text-foreground text-xs">
                              {getInitials(sender?.pseudonym || '?')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!isMine && (
                            <p className="text-[10px] text-gold-dim mb-0.5 font-heading-text">{sender?.pseudonym || 'Inconnu'}</p>
                          )}
                          <div className={`max-w-[75vw] sm:max-w-[320px] px-4 py-2.5 rounded-2xl shadow-sm ${
                            isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-primary/20 bg-card/80 backdrop-blur-sm rounded-b-xl mb-4">
                <div className="flex gap-2 items-center">
                  <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={`Message #${selectedChannel.name}...`}
                    className="flex-1 bg-background/50"
                    disabled={isSending}
                  />
                  <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || isSending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 mt-4"
            >
              <div className="text-center">
                <h1 className="font-heading text-2xl tracking-[0.15em] text-gold mb-2 flex items-center justify-center gap-2">
                  <Users className="w-6 h-6" /> CANAUX DE GROUPE
                </h1>
                <p className="text-muted-foreground text-sm">Salons de discussion de l'Ordre</p>
              </div>

              <div className="space-y-3">
                {channels.map((ch, i) => (
                  <motion.button
                    key={ch.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedChannel(ch)}
                    className="ritual-card p-5 w-full text-left hover:lunar-glow transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        {ch.is_private ? <Lock className="w-5 h-5 text-crimson-bright" /> : <Hash className="w-5 h-5 text-gold" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading text-sm text-foreground tracking-wider group-hover:text-gold transition-colors">
                          {ch.name}
                        </h3>
                        {ch.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                        )}
                      </div>
                      {ch.min_grade && ch.min_grade !== 'novice' && (
                        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded capitalize">
                          {ch.min_grade}+
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default ChannelsPage;
