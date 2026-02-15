import { useState, useRef } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Lock, Mail, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfileSettingsPage = () => {
  const { user, profile, refreshProfile, isGuardianSupreme } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pseudonym, setPseudonym] = useState(profile?.pseudonym || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>((profile as any)?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner une image.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erreur', description: 'L\'image ne doit pas dépasser 2 Mo.', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erreur', description: uploadError.message, variant: 'destructive' });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newUrl })
      .eq('id', user.id);

    if (updateError) {
      toast({ title: 'Erreur', description: updateError.message, variant: 'destructive' });
    } else {
      setAvatarUrl(newUrl);
      await refreshProfile();
      toast({ title: 'Avatar mis à jour' });
    }
    setUploadingAvatar(false);
  };

  const handleSavePseudonym = async () => {
    if (!pseudonym.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ pseudonym: pseudonym.trim() }).eq('id', user.id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Pseudonyme mis à jour' });
    }
    setSaving(false);
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email mis à jour', description: 'Un email de confirmation a été envoyé à la nouvelle adresse.' });
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 6 caractères.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mot de passe mis à jour' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto py-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-heading tracking-wider text-primary text-center mb-2">PARAMÈTRES</h1>
          <p className="text-center text-muted-foreground text-sm mb-8">Gérez votre identité au sein de l'Ordre</p>
        </motion.div>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="ritual-card p-6 text-center"
        >
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 border-2 border-primary/40">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-heading">
                {getInitials(profile?.pseudonym || 'U')}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/80 transition-colors"
            >
              {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <p className="text-xs text-muted-foreground mt-3">Cliquez sur l'icône pour changer votre avatar (max 2 Mo)</p>
        </motion.div>

        {/* Pseudonym */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="ritual-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-sm tracking-wider">PSEUDONYME</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pseudonym">Votre nom dans l'Ordre</Label>
            <Input id="pseudonym" value={pseudonym} onChange={e => setPseudonym(e.target.value)} />
          </div>
          <Button onClick={handleSavePseudonym} disabled={saving || !pseudonym.trim()} className="w-full gap-2">
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </motion.div>

        {/* Email */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="ritual-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-sm tracking-wider">ADRESSE E-MAIL</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail de connexion</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleUpdateEmail} disabled={saving || !email.trim()} className="w-full gap-2">
            <Save className="w-4 h-4" /> Modifier l'e-mail
          </Button>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="ritual-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-sm tracking-wider">MOT DE PASSE</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleUpdatePassword} disabled={saving || !newPassword || !confirmPassword} className="w-full gap-2">
            <Lock className="w-4 h-4" /> Changer le mot de passe
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default ProfileSettingsPage;
