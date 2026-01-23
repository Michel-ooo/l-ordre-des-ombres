import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { useActionHistory } from '@/hooks/useActionHistory';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileQuestion, Check, X, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type RequestType = Database['public']['Enums']['request_type'];
type RequestStatus = Database['public']['Enums']['request_status'];

interface CouncilRequest {
  id: string;
  requester_id: string;
  request_type: RequestType;
  subject: string;
  message: string;
  status: RequestStatus;
  council_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const requestTypeLabels: Record<RequestType, string> = {
  entry: 'Demande d\'entrée',
  exit: 'Demande de sortie',
  pardon: 'Demande de pardon',
  access: 'Demande d\'accès',
  promotion: 'Demande d\'élévation',
  other: 'Autre demande',
};

const statusLabels: Record<RequestStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  adjourned: 'Ajournée',
};

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  approved: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
  adjourned: 'bg-blue-500/20 text-blue-300',
};

export function CouncilRequestsTab() {
  const { user, profile } = useAuth();
  const { isGuardianSupreme, isArchonte } = useKnowledgeAccess();
  const { logAction } = useActionHistory();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CouncilRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  
  const [formData, setFormData] = useState({
    request_type: 'other' as RequestType,
    subject: '',
    message: '',
  });

  const canManageRequests = isGuardianSupreme || isArchonte;

  const { data: requests, isLoading } = useQuery({
    queryKey: ['council-requests', canManageRequests],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('council_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CouncilRequest[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudonym, grade, status');
      if (error) throw error;
      return data;
    },
    enabled: canManageRequests,
  });

  const getRequesterName = (requesterId: string) => {
    const requesterProfile = profiles?.find(p => p.id === requesterId);
    return requesterProfile?.pseudonym || 'Inconnu';
  };

  const getRequesterInfo = (requesterId: string) => {
    return profiles?.find(p => p.id === requesterId);
  };

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('council_requests').insert({
        requester_id: user!.id,
        request_type: formData.request_type,
        subject: formData.subject,
        message: formData.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['council-requests'] });
      logAction.mutate({
        actionType: 'request_submitted',
        description: `Demande soumise: ${formData.subject}`,
        metadata: { type: formData.request_type },
      });
      toast.success('Demande envoyée au Conseil');
      setIsCreateOpen(false);
      setFormData({ request_type: 'other', subject: '', message: '' });
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de la demande');
    },
  });

  const resolveRequestMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: RequestStatus; response: string }) => {
      const { error } = await supabase
        .from('council_requests')
        .update({
          status,
          council_response: response,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['council-requests'] });
      logAction.mutate({
        actionType: 'request_resolved',
        targetId: variables.id,
        targetType: 'council_request',
        description: `Demande ${statusLabels[variables.status].toLowerCase()}`,
      });
      toast.success('Demande traitée');
      setSelectedRequest(null);
      setResponseText('');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading">Demandes Officielles</h2>
          <p className="text-sm text-muted-foreground">
            {canManageRequests 
              ? 'Toutes les demandes adressées au Conseil'
              : 'Vos demandes au Conseil'}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FileQuestion className="w-4 h-4" />
              Nouvelle demande
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Soumettre une demande au Conseil</DialogTitle>
              <DialogDescription>
                Votre demande sera examinée par le Conseil des Archontes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de demande</Label>
                <Select
                  value={formData.request_type}
                  onValueChange={(value: RequestType) => 
                    setFormData(prev => ({ ...prev, request_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(requestTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sujet</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Objet de votre demande"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Exposez votre demande en détail..."
                  rows={5}
                />
              </div>

              <Button
                onClick={() => createRequestMutation.mutate()}
                className="w-full"
                disabled={!formData.subject || !formData.message}
              >
                Envoyer la demande
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : requests?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune demande
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {requests?.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card 
                  className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setResponseText(request.council_response || '');
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {requestTypeLabels[request.request_type]}
                        </Badge>
                        <CardTitle className="text-base">{request.subject}</CardTitle>
                        {canManageRequests && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <User className="w-3 h-3" />
                            {getRequesterName(request.requester_id)}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={statusColors[request.status]}>
                        {statusLabels[request.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(request.created_at), 'PPP', { locale: fr })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.subject}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="mr-2">
                {selectedRequest && requestTypeLabels[selectedRequest.request_type]}
              </Badge>
              <Badge className={selectedRequest ? statusColors[selectedRequest.status] : ''}>
                {selectedRequest && statusLabels[selectedRequest.status]}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Requester info for Council */}
                {canManageRequests && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Demandeur</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">
                        {getRequesterName(selectedRequest.requester_id)}
                      </span>
                      {(() => {
                        const info = getRequesterInfo(selectedRequest.requester_id);
                        return info && (
                          <Badge variant="outline">{info.grade}</Badge>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>

                {/* Council response */}
                {selectedRequest.council_response && (
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Réponse du Conseil</Label>
                    <p className="text-sm mt-1">{selectedRequest.council_response}</p>
                  </div>
                )}

                {/* Actions for Council */}
                {canManageRequests && selectedRequest.status === 'pending' && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Réponse du Conseil</Label>
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Rédigez la réponse officielle..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => resolveRequestMutation.mutate({
                          id: selectedRequest.id,
                          status: 'approved',
                          response: responseText,
                        })}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Approuver
                      </Button>
                      <Button
                        onClick={() => resolveRequestMutation.mutate({
                          id: selectedRequest.id,
                          status: 'rejected',
                          response: responseText,
                        })}
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <X className="w-4 h-4" />
                        Rejeter
                      </Button>
                      <Button
                        onClick={() => resolveRequestMutation.mutate({
                          id: selectedRequest.id,
                          status: 'adjourned',
                          response: responseText,
                        })}
                        variant="outline"
                        className="flex-1 gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Ajourner
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
