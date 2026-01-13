import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Send, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';

type Profile = {
  id: string;
  pseudonym: string;
};

const reportSchema = z.object({
  reportedId: z.string().min(1, 'Sélectionnez un membre'),
  reason: z.string().min(20, 'La raison doit contenir au moins 20 caractères').max(1000),
});

const ReportMemberPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ reportedId?: string; reason?: string }>({});

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, pseudonym')
        .neq('id', user?.id);

      if (data) {
        setMembers(data);
      }
    };

    if (user) {
      fetchMembers();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = reportSchema.safeParse({ reportedId: selectedMember, reason });
    if (!validation.success) {
      const fieldErrors: { reportedId?: string; reason?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'reportedId') fieldErrors.reportedId = err.message;
        if (err.path[0] === 'reason') fieldErrors.reason = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user?.id,
        reported_id: selectedMember,
        reason,
      });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de soumettre le signalement.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signalement envoyé',
        description: 'Le Gardien Suprême a été notifié.',
      });
      navigate('/');
    }

    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="font-heading text-2xl tracking-wide mb-2">
            SIGNALEMENT INTERNE
          </h1>
          <p className="text-muted-foreground text-sm">
            Rapportez un comportement contraire aux règles de l'Ordre
          </p>
        </div>

        <div className="ritual-card p-4 mb-6 border-l-2 border-yellow-500">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-heading">ATTENTION :</span>{' '}
            Les signalements abusifs sont sanctionnés. 
            Ne signalez que les violations graves des règles de l'Ordre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="ritual-card p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-heading tracking-wide">
              Membre à signaler
            </label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="cipher-input">
                <SelectValue placeholder="Sélectionnez un membre..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.pseudonym}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reportedId && (
              <p className="text-xs text-destructive">{errors.reportedId}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-heading tracking-wide">
              Raison du signalement
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez précisément les faits reprochés..."
              className="cipher-input min-h-[150px]"
              maxLength={1000}
            />
            <div className="flex justify-between">
              {errors.reason ? (
                <p className="text-xs text-destructive">{errors.reason}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">{reason.length}/1000</p>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au sanctuaire
            </span>
          </Link>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ReportMemberPage;
