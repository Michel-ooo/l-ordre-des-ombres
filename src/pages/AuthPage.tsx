import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo-ordre.png';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Identifiant invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { toast } = useToast();
  const { signIn, user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img 
          src={logo} 
          alt="L'Ordre" 
          className="w-20 h-20 animate-pulse-slow lunar-glow"
        />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Accès refusé',
        description: 'Identifiants incorrects ou compte inexistant.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="L'Ordre"
            className="w-24 h-24 mx-auto mb-6 lunar-glow"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <h1 className="font-heading text-2xl tracking-widest mb-2">
            PORTAIL D'ACCÈS
          </h1>
          <p className="text-muted-foreground text-sm">
            Seuls les initiés peuvent pénétrer ces lieux
          </p>
        </div>

        {/* Login Form */}
        <div className="ritual-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Identifiant
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.identifiant@ordre.secret"
                className="cipher-input"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground font-heading tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cipher-input pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? 'Vérification...' : 'Entrer dans l\'Ordre'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                const email = prompt('Entrez votre adresse email pour recevoir un lien de réinitialisation :');
                if (email) {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) {
                    toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                  } else {
                    toast({ title: 'Email envoyé', description: 'Vérifiez votre boîte de réception.' });
                  }
                }
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Vous souhaitez rejoindre l'Ordre ?
            </p>
            <Button
              variant="ghost"
              className="w-full mt-2 text-sm"
              onClick={() => window.location.href = '/initiation-request'}
            >
              Soumettre une demande d'initiation
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/50">
            ☽ L'Ordre des Ombres ☽
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
