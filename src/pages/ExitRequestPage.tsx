import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Send, ArrowLeft, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

const exitSchema = z.object({
  reason: z.string().min(20, 'Expliquez votre décision (min. 20 caractères)').max(1000),
});

const ExitRequestPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);
  const [errors, setErrors] = useState<{ reason?: string }>({});

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('exit_requests')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (data) {
        setExistingRequest(data);
      }
    };

    checkExistingRequest();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = exitSchema.safeParse({ reason });
    if (!validation.success) {
      const fieldErrors: { reason?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'reason') fieldErrors.reason = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('exit_requests')
      .insert({
        user_id: user?.id,
        reason,
      });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de soumettre votre demande.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Demande envoyée',
        description: 'Le Gardien Suprême examinera votre demande.',
      });
      navigate('/');
    }

    setIsSubmitting(false);
  };

  if (existingRequest) {
    return (
      <MainLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto text-center"
        >
          <Clock className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-heading text-2xl tracking-wide mb-4">
            DEMANDE EN ATTENTE
          </h1>
          <p className="text-muted-foreground mb-8">
            Votre demande de sortie est en cours d'examen par le Gardien Suprême.
            Vous serez notifié de sa décision.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au sanctuaire
            </Button>
          </Link>
        </motion.div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto"
      >
        <div className="text-center mb-8">
          <LogOut className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="font-heading text-2xl tracking-wide mb-2">
            QUITTER L'ORDRE
          </h1>
          <p className="text-muted-foreground text-sm">
            Soumettez une demande de sortie
          </p>
        </div>

        <div className="ritual-card p-4 mb-6 border-l-2 border-red-500">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-heading">AVERTISSEMENT :</span>{' '}
            Quitter l'Ordre est une décision définitive. 
            Votre compte sera supprimé et vous ne pourrez plus accéder aux secrets de l'Ordre.
            Le Gardien Suprême doit approuver votre départ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="ritual-card p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-heading tracking-wide">
              Raison de votre départ
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi vous souhaitez quitter l'Ordre..."
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

          <Button type="submit" variant="destructive" className="w-full gap-2" disabled={isSubmitting}>
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Envoi...' : 'Soumettre ma demande de sortie'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Annuler et retourner au sanctuaire
            </span>
          </Link>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default ExitRequestPage;
