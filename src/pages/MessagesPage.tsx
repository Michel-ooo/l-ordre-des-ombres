import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  ChevronLeft,
  Circle,
  MessageCircle,
  Crown
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmojiPicker } from "@/components/EmojiPicker";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Member {
  id: string;
  pseudonym: string;
}

interface Conversation {
  memberId: string;
  pseudonym: string;
  lastMessage: Message;
  unreadCount: number;
}

const MessagesPage = () => {
  const { user, isGuardianSupreme } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAllMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
    }
    
    setIsLoading(false);
  };

  const fetchMembers = async () => {
    if (!user) return;
    
    // Fetch all active members
    const { data, error } = await supabase
      .from("profiles")
      .select("id, pseudonym")
      .neq("id", user.id)
      .eq("status", "active");
    
    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(data || []);
    }

    // Fetch Guardian Supreme ID
    const { data: guardianData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "guardian_supreme")
      .maybeSingle();
    
    if (guardianData) {
      setGuardianId(guardianData.user_id);
    }
  };

  // Build conversations from messages
  useEffect(() => {
    if (!user || !members.length) return;

    const convMap = new Map<string, Conversation>();
    
    messages.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      const member = members.find(m => m.id === otherId);
      if (!member) return;
      
      const existing = convMap.get(otherId);
      const isUnread = msg.recipient_id === user.id && !msg.is_read;
      
      if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
        convMap.set(otherId, {
          memberId: otherId,
          pseudonym: member.pseudonym,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0)
        });
      } else if (isUnread) {
        existing.unreadCount++;
      }
    });
    
    const sortedConvs = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
    
    setConversations(sortedConvs);
  }, [messages, members, user]);

  useEffect(() => {
    fetchAllMessages();
    fetchMembers();
    
    // Subscribe to new messages
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            if (newMsg.sender_id === user?.id || newMsg.recipient_id === user?.id) {
              setMessages(prev => [...prev, newMsg]);
              if (newMsg.recipient_id === user?.id && newMsg.sender_id !== selectedMember?.id) {
                toast({
                  title: "💬 Nouveau message",
                  description: "Vous avez reçu un nouveau message.",
                });
              }
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedMember]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!selectedMember || !user) return;
    
    const unreadMessages = messages.filter(
      m => m.sender_id === selectedMember.id && m.recipient_id === user.id && !m.is_read
    );
    
    if (unreadMessages.length > 0) {
      Promise.all(
        unreadMessages.map(m => 
          supabase.from("messages").update({ is_read: true }).eq("id", m.id)
        )
      ).then(() => {
        setMessages(prev => 
          prev.map(m => 
            unreadMessages.some(u => u.id === m.id) ? { ...m, is_read: true } : m
          )
        );
      });
    }
  }, [selectedMember, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMember) return;
    
    setIsSending(true);
    
    const { error } = await supabase.from("messages").insert({
      sender_id: user?.id,
      recipient_id: selectedMember.id,
      subject: "SMS",
      content: newMessage.trim(),
    });
    
    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationMessages = () => {
    if (!selectedMember || !user) return [];
    return messages.filter(
      m => (m.sender_id === selectedMember.id && m.recipient_id === user.id) ||
           (m.sender_id === user.id && m.recipient_id === selectedMember.id)
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    }
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              // Chat View
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-[calc(100vh-12rem)]"
              >
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-primary/20 bg-card/50 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMember(null)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <h2 className="font-semibold text-primary font-cinzel">
                      {selectedMember.pseudonym}
                    </h2>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {getConversationMessages().map((message) => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-primary/20 bg-card/50 backdrop-blur-sm">
                  <div className="flex gap-2 items-center">
                    <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Message..."
                      className="flex-1"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Conversations List
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                <div className="text-center mb-6">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-primary font-cinzel">
                    Messages
                  </h1>
                  {totalUnread > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalUnread} message{totalUnread > 1 ? "s" : ""} non lu{totalUnread > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Contact Guardian Button */}
                {!isGuardianSupreme && guardianId && (
                  <Button
                    variant="outline"
                    className="w-full mb-4 gap-2 border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/10"
                    onClick={() => {
                      const guardian = members.find(m => m.id === guardianId);
                      if (guardian) {
                        setSelectedMember(guardian);
                      } else {
                        // Guardian might not be in members list if already conversing
                        supabase.from("profiles").select("id, pseudonym").eq("id", guardianId).maybeSingle().then(({ data }) => {
                          if (data) setSelectedMember(data);
                        });
                      }
                    }}
                  >
                    <Crown className="w-4 h-4" />
                    Contacter le Gardien Suprême
                  </Button>
                )}

                {/* New Conversation Button */}
                <div className="mb-4">
                  <select
                    className="w-full p-3 rounded-lg bg-card border border-primary/20 text-foreground"
                    onChange={(e) => {
                      const member = members.find(m => m.id === e.target.value);
                      if (member) setSelectedMember(member);
                      e.target.value = "";
                    }}
                    value=""
                  >
                    <option value="" disabled>+ Nouvelle conversation...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.pseudonym} {member.id === guardianId ? '👑' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conversations */}
                <div className="space-y-2">
                  {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">
                      Chargement...
                    </p>
                  ) : conversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune conversation
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <motion.div
                        key={conv.memberId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          conv.unreadCount > 0 
                            ? "bg-primary/10 border-primary/40" 
                            : "bg-card/50 border-primary/20 hover:border-primary/40"
                        }`}
                        onClick={() => {
                          const member = members.find(m => m.id === conv.memberId);
                          if (member) setSelectedMember(member);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {conv.unreadCount > 0 && (
                              <Circle className="w-2 h-2 fill-primary text-primary flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate">
                                {conv.pseudonym}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage.sender_id === user?.id ? "Vous: " : ""}
                                {conv.lastMessage.content}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
