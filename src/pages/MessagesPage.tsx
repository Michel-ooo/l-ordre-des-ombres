import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Send, 
  Inbox, 
  ChevronLeft, 
  Trash2,
  Circle,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { pseudonym: string };
  recipient?: { pseudonym: string };
}

interface Member {
  id: string;
  pseudonym: string;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  
  // Compose form state
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Fetch inbox (received messages)
    const { data: inboxData, error: inboxError } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(pseudonym)
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });
    
    if (inboxError) {
      console.error("Error fetching inbox:", inboxError);
    } else {
      setInbox(inboxData || []);
    }
    
    // Fetch sent messages
    const { data: sentData, error: sentError } = await supabase
      .from("messages")
      .select(`
        *,
        recipient:profiles!messages_recipient_id_fkey(pseudonym)
      `)
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });
    
    if (sentError) {
      console.error("Error fetching sent:", sentError);
    } else {
      setSent(sentData || []);
    }
    
    setIsLoading(false);
  };

  const fetchMembers = async () => {
    if (!user) return;
    
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
  };

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    
    // Subscribe to new messages
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user?.id}`,
        },
        (payload) => {
          toast({
            title: "📬 Nouveau message",
            description: "Vous avez reçu un nouveau message.",
          });
          fetchMessages();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!recipientId || !subject || !content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    const { error } = await supabase.from("messages").insert({
      sender_id: user?.id,
      recipient_id: recipientId,
      subject,
      content,
    });
    
    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Message envoyé",
        description: "Votre message a été transmis avec succès.",
      });
      setRecipientId("");
      setSubject("");
      setContent("");
      setIsComposing(false);
      fetchMessages();
    }
    
    setIsSending(false);
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's in inbox and unread
    if (message.recipient_id === user?.id && !message.is_read) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id);
      
      setInbox(prev => 
        prev.map(m => m.id === message.id ? { ...m, is_read: true } : m)
      );
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);
    
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé.",
      });
      setSelectedMessage(null);
      fetchMessages();
    }
  };

  const unreadCount = inbox.filter(m => !m.is_read).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MessageList = ({ messages, type }: { messages: Message[]; type: "inbox" | "sent" }) => (
    <div className="space-y-2">
      {messages.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Aucun message
        </p>
      ) : (
        messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 border border-primary/20 rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
              !message.is_read && type === "inbox" ? "bg-primary/10 border-primary/40" : ""
            }`}
            onClick={() => handleOpenMessage(message)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {!message.is_read && type === "inbox" && (
                  <Circle className="w-2 h-2 fill-primary text-primary flex-shrink-0" />
                )}
                <span className="font-medium text-primary truncate">
                  {type === "inbox" 
                    ? message.sender?.pseudonym || "Inconnu"
                    : message.recipient?.pseudonym || "Inconnu"
                  }
                </span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(message.created_at)}
              </span>
            </div>
            <p className="font-semibold mt-1 truncate">{message.subject}</p>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {message.content}
            </p>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary font-cinzel">
              Messagerie Secrète
            </h1>
            <p className="text-muted-foreground mt-2">
              Communications internes de l'Ordre
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedMessage ? (
              <motion.div
                key="message-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-primary/20 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedMessage(null)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedMessage.sender_id === user?.id ? "À:" : "De:"}
                      </p>
                      <p className="font-semibold text-primary">
                        {selectedMessage.sender_id === user?.id
                          ? selectedMessage.recipient?.pseudonym
                          : selectedMessage.sender?.pseudonym
                        }
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedMessage.created_at)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Sujet:</p>
                    <p className="text-xl font-semibold">{selectedMessage.subject}</p>
                  </div>
                  
                  <div className="border-t border-primary/20 pt-4">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="message-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog open={isComposing} onOpenChange={setIsComposing}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Send className="w-4 h-4" />
                        Nouveau message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-cinzel text-primary">
                          Nouveau Message
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Destinataire
                          </label>
                          <Select value={recipientId} onValueChange={setRecipientId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un membre..." />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.pseudonym}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Sujet
                          </label>
                          <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Sujet du message..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Message
                          </label>
                          <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Votre message..."
                            rows={6}
                          />
                        </div>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={isSending}
                          className="w-full gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {isSending ? "Envoi..." : "Envoyer"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchMessages}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <Tabs defaultValue="inbox" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="inbox" className="gap-2">
                      <Inbox className="w-4 h-4" />
                      Reçus
                      {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="gap-2">
                      <Send className="w-4 h-4" />
                      Envoyés
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="inbox">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </div>
                    ) : (
                      <MessageList messages={inbox} type="inbox" />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="sent">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </div>
                    ) : (
                      <MessageList messages={sent} type="sent" />
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

export default MessagesPage;
