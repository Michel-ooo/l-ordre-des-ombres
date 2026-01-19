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
  MessageCircle,
  Crown,
  MoreVertical,
  Trash2,
  Search,
  User
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmojiPicker } from "@/components/EmojiPicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  grade?: string;
}

interface Conversation {
  memberId: string;
  pseudonym: string;
  grade?: string;
  lastMessage: Message;
  unreadCount: number;
}

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-primary/80",
    "bg-mystic-gold/80",
    "bg-mystic-purple/80",
    "bg-emerald-600/80",
    "bg-rose-600/80",
    "bg-cyan-600/80",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
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
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, pseudonym, grade")
      .neq("id", user.id)
      .eq("status", "active");
    
    if (error) {
      console.error("Error fetching members:", error);
    } else {
      setMembers(data || []);
    }

    const { data: guardianData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "guardian_supreme")
      .maybeSingle();
    
    if (guardianData) {
      setGuardianId(guardianData.user_id);
    }
  };

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
          grade: member.grade,
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
          } else if (payload.eventType === "DELETE") {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
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

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message.",
        variant: "destructive",
      });
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé.",
      });
    }
    setMessageToDelete(null);
  };

  const handleDeleteConversation = async (memberId: string) => {
    const conversationMessages = messages.filter(
      m => (m.sender_id === memberId && m.recipient_id === user?.id) ||
           (m.sender_id === user?.id && m.recipient_id === memberId)
    );

    const { error } = await supabase
      .from("messages")
      .delete()
      .in("id", conversationMessages.map(m => m.id));
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation.",
        variant: "destructive",
      });
    } else {
      setMessages(prev => prev.filter(m => !conversationMessages.some(cm => cm.id === m.id)));
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée.",
      });
    }
    setConversationToDelete(null);
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

  const filteredConversations = conversations.filter(conv =>
    conv.pseudonym.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(member =>
    member.pseudonym.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-b from-background via-background to-primary/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-[calc(100vh-12rem)]"
              >
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-primary/20 bg-card/80 backdrop-blur-sm rounded-t-xl mt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMember(null)}
                    className="shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className={`h-10 w-10 ${getAvatarColor(selectedMember.pseudonym)}`}>
                    <AvatarFallback className="text-white font-semibold text-sm">
                      {getInitials(selectedMember.pseudonym)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-primary font-cinzel truncate flex items-center gap-2">
                      {selectedMember.pseudonym}
                      {selectedMember.id === guardianId && (
                        <Crown className="w-4 h-4 text-mystic-gold" />
                      )}
                    </h2>
                    {selectedMember.grade && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedMember.grade}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setConversationToDelete(selectedMember.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer la conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-2 bg-card/30">
                  <div className="space-y-3 py-2">
                    {getConversationMessages().map((message) => {
                      const isMine = message.sender_id === user?.id;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          {!isMine && (
                            <Avatar className={`h-7 w-7 ${getAvatarColor(selectedMember.pseudonym)} shrink-0`}>
                              <AvatarFallback className="text-white text-xs">
                                {getInitials(selectedMember.pseudonym)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="group relative">
                            <div
                              className={`max-w-[75vw] sm:max-w-[320px] px-4 py-2.5 rounded-2xl shadow-sm ${
                                isMine
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                              <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatTime(message.created_at)}
                                {isMine && message.is_read && " ✓✓"}
                              </p>
                            </div>
                            {isMine && (
                              <button
                                onClick={() => setMessageToDelete(message.id)}
                                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-full"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            )}
                          </div>
                          {isMine && (
                            <Avatar className="h-7 w-7 bg-primary/80 shrink-0">
                              <AvatarFallback className="text-white text-xs">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
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
                      onKeyPress={handleKeyPress}
                      placeholder="Message..."
                      className="flex-1 bg-background/50"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                      className="shrink-0"
                    >
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
                className="py-6"
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

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 bg-card/50"
                  />
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
                        supabase.from("profiles").select("id, pseudonym, grade").eq("id", guardianId).maybeSingle().then(({ data }) => {
                          if (data) setSelectedMember(data);
                        });
                      }
                    }}
                  >
                    <Crown className="w-4 h-4" />
                    Contacter le Gardien Suprême
                  </Button>
                )}

                {/* New Conversation */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Nouvelle conversation</p>
                  <div className="flex flex-wrap gap-2">
                    {filteredMembers.slice(0, 5).map(member => (
                      <Button
                        key={member.id}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedMember(member)}
                      >
                        <Avatar className={`h-6 w-6 ${getAvatarColor(member.pseudonym)}`}>
                          <AvatarFallback className="text-white text-[10px]">
                            {getInitials(member.pseudonym)}
                          </AvatarFallback>
                        </Avatar>
                        {member.pseudonym}
                        {member.id === guardianId && <Crown className="w-3 h-3 text-mystic-gold" />}
                      </Button>
                    ))}
                    {filteredMembers.length > 5 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            +{filteredMembers.length - 5} autres
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {filteredMembers.slice(5).map(member => (
                            <DropdownMenuItem key={member.id} onClick={() => setSelectedMember(member)}>
                              <Avatar className={`h-6 w-6 mr-2 ${getAvatarColor(member.pseudonym)}`}>
                                <AvatarFallback className="text-white text-[10px]">
                                  {getInitials(member.pseudonym)}
                                </AvatarFallback>
                              </Avatar>
                              {member.pseudonym}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Conversations */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Conversations</p>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune conversation
                    </p>
                  ) : (
                    filteredConversations.map((conv) => (
                      <motion.div
                        key={conv.memberId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group p-3 rounded-xl cursor-pointer transition-all border ${
                          conv.unreadCount > 0 
                            ? "bg-primary/10 border-primary/40" 
                            : "bg-card/50 border-primary/20 hover:border-primary/40 hover:bg-card/80"
                        }`}
                        onClick={() => {
                          const member = members.find(m => m.id === conv.memberId);
                          if (member) setSelectedMember(member);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={`h-12 w-12 ${getAvatarColor(conv.pseudonym)}`}>
                              <AvatarFallback className="text-white font-semibold">
                                {getInitials(conv.pseudonym)}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-semibold truncate ${conv.unreadCount > 0 ? "text-primary" : "text-foreground"}`}>
                                {conv.pseudonym}
                              </p>
                              {conv.memberId === guardianId && (
                                <Crown className="w-4 h-4 text-mystic-gold shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage.sender_id === user?.id ? "Vous: " : ""}
                              {conv.lastMessage.content}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conv.memberId);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-full"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
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

      {/* Delete Message Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le message sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={() => setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les messages de cette conversation seront supprimés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conversationToDelete && handleDeleteConversation(conversationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default MessagesPage;
