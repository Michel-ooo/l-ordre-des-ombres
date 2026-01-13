import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import logo from '@/assets/logo-ordre.png';

const requestSchema = z.object({
  pseudonym: z.string().min(3, 'Le pseudonyme doit contenir au moins 3 caractères').max(50),
  email: z.string().email('Email invalide'),
  motivation: z.string().min(50, 'Votre motivation doit contenir au moins 50 caractères').max(1000),
});

const InitiationRequestPage = () => {
  const [pseudonym, setPseudonym] = useState('');
  const [email, setEmail] = useState('');
  const [motivation, setMotivation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ pseudonym?: string; email?: string; motivation?: string }>({});
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = requestSchema.safeParse({ pseudonym, email, motivation });
    if (!validation.success) {
      const fieldErrors: { pseudonym?: string; email?: string; motivation?: string } = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof fieldErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('initiation_requests')
      .insert({
        desired_pseudonym: pseudonym,
        email,
        motivation,
      });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de soumettre votre demande. Veuillez réessayer.',
        variant: 'destructive',
      });
    } else {
      setIsSubmitted(true);
    }

    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-mystic-gold" />
          <h1 className="font-heading text-2xl tracking-widest mb-4">
            DEMANDE TRANSMISE
          </h1>
          <p className="text-muted-foreground mb-8">
            Votre demande d'initiation a été reçue par l'Ordre. 
            Le Gardien Suprême examinera votre candidature avec attention.
            Vous serez contacté si votre demande est acceptée.
          </p>
          <Link to="/auth">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au portail
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/auth" className="inline-block mb-6">
            <img
              src={logo}
              alt="L'Ordre"
              className="w-20 h-20 mx-auto lunar-glow"
            />
          </Link>
          <h1 className="font-heading text-2xl tracking-widest mb-2">
            DEMANDE D'INITIATION
          </h1>
          <p className="text-muted-foreground text-sm">
            Exposez vos motivations pour rejoindre l'Ordre
          </p>
        </div>

        {/* Warning */}
        <div className="ritual-card p-4 mb-6 border-l-2 border-mystic-gold">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-heading">AVERTISSEMENT :</span>{' '}
            L'Ordre n'accepte pas tous les aspirants. Seuls ceux jugés dignes 
            par le Gardien Suprême se verront accorder l'initiation.
          </p>
        </div>

        {/* Form */}
        <div className="ritual-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Pseudonyme désiré
              </label>
              <Input
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="Votre nom au sein de l'Ordre"
                className="cipher-input"
                disabled={isSubmitting}
                maxLength={50}
              />
              {errors.pseudonym && (
                <p className="text-xs text-destructive">{errors.pseudonym}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Email de contact
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.secret"
                className="cipher-input"
                disabled={isSubmitting}
                maxLength={255}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Motivation
              </label>
              <Textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Pourquoi souhaitez-vous rejoindre l'Ordre des Ombres ? Qu'est-ce qui vous attire dans notre fraternité ?"
                className="cipher-input min-h-[150px]"
                disabled={isSubmitting}
                maxLength={1000}
              />
              <div className="flex justify-between">
                {errors.motivation ? (
                  <p className="text-xs text-destructive">{errors.motivation}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {motivation.length}/1000
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Envoi en cours...' : 'Soumettre ma demande'}
            </Button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour au portail d'accès
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default InitiationRequestPage;
