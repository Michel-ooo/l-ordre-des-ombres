import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  UserPlus,
  AlertTriangle,
  LogOut,
  Shield,
  Check,
  X,
  Eye,
  Trash2,
  Search,
  Edit,
  Plus,
  Medal,
  Award,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type InitiationRequest = {
  id: string;
  desired_pseudonym: string;
  email: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Profile = {
  id: string;
  pseudonym: string;
  grade: string;
  status: string;
  joined_at: string;
};

type ExitRequest = {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: { pseudonym: string } | null;
};

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
};

type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  reason: string | null;
  badges?: BadgeItem | null;
  profiles?: { pseudonym: string } | null;
};
type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  is_reviewed: boolean;
  created_at: string;
  reporter?: { pseudonym: string } | null;
  reported?: { pseudonym: string } | null;
};

const gradeLabels: Record<string, string> = {
  novice: 'Novice',
  apprenti: 'Apprenti',
  compagnon: 'Compagnon',
  maitre: 'Maître',
  sage: 'Sage',
  oracle: 'Oracle',
};

const grades = ['novice', 'apprenti', 'compagnon', 'maitre', 'sage', 'oracle'];

const statusLabels: Record<string, string> = {
  active: 'Actif',
  under_surveillance: 'Sous surveillance',
  pending: 'En attente',
  exclusion_requested: 'Exclusion demandée',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  under_surveillance: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-blue-500/20 text-blue-400',
  exclusion_requested: 'bg-red-500/20 text-red-400',
};

const GuardianDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Data states
  const [initiationRequests, setInitiationRequests] = useState<InitiationRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<InitiationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  
  // Create account dialog
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPseudonym, setNewPseudonym] = useState('');
  const [newGrade, setNewGrade] = useState<string>('novice');
  
  // Edit profile dialog
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editPseudonym, setEditPseudonym] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Badge states
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [awardBadgeOpen, setAwardBadgeOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [badgeReason, setBadgeReason] = useState('');

  // Create badge states
  const [createBadgeOpen, setCreateBadgeOpen] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDescription, setNewBadgeDescription] = useState('');
  const [newBadgeIcon, setNewBadgeIcon] = useState('🏅');
  const [newBadgeCategory, setNewBadgeCategory] = useState('general');
  const [newBadgeRarity, setNewBadgeRarity] = useState('common');
  const [editBadgeOpen, setEditBadgeOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeItem | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);

    const [requestsRes, profilesRes, exitRes, reportsRes, badgesRes, userBadgesRes] = await Promise.all([
      supabase.from('initiation_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('joined_at', { ascending: false }),
      supabase.from('exit_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('badges').select('*').order('name'),
      supabase.from('user_badges').select('*').order('awarded_at', { ascending: false }),
    ]);

    if (requestsRes.data) setInitiationRequests(requestsRes.data as InitiationRequest[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (exitRes.data) {
      // Fetch profile names for exit requests
      const exitWithProfiles = await Promise.all(exitRes.data.map(async (exit) => {
        const { data: profile } = await supabase.from('profiles').select('pseudonym').eq('id', exit.user_id).maybeSingle();
        return { ...exit, profiles: profile } as ExitRequest;
      }));
      setExitRequests(exitWithProfiles);
    }
    if (reportsRes.data) {
      // Fetch profile names for reports
      const reportsWithProfiles = await Promise.all(reportsRes.data.map(async (report) => {
        const [reporterRes, reportedRes] = await Promise.all([
          supabase.from('profiles').select('pseudonym').eq('id', report.reporter_id).maybeSingle(),
          supabase.from('profiles').select('pseudonym').eq('id', report.reported_id).maybeSingle(),
        ]);
        return { ...report, reporter: reporterRes.data, reported: reportedRes.data } as Report;
      }));
      setReports(reportsWithProfiles);
    }
    if (badgesRes.data) setBadges(badgesRes.data as BadgeItem[]);
    if (userBadgesRes.data && profilesRes.data) {
      const ubWithDetails = userBadgesRes.data.map((ub) => {
        const badge = badgesRes.data?.find((b: BadgeItem) => b.id === ub.badge_id) || null;
        const prof = profilesRes.data?.find((p: Profile) => p.id === ub.user_id) || null;
        return { ...ub, badges: badge, profiles: prof ? { pseudonym: prof.pseudonym } : null } as UserBadge;
      });
      setUserBadges(ubWithDetails);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approve initiation request - create user via edge function
  const handleApproveRequest = async () => {
    if (!selectedRequest || !tempPassword) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'create_user',
          email: selectedRequest.email,
          password: tempPassword,
          pseudonym: selectedRequest.desired_pseudonym,
          grade: 'novice',
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update request status
      await supabase
        .from('initiation_requests')
        .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', selectedRequest.id);

      toast({
        title: "Initiation réussie",
        description: `${selectedRequest.desired_pseudonym} a été admis dans l'Ordre.`,
      });

      setSelectedRequest(null);
      setTempPassword('');
      fetchData();
    } catch (err) {
      console.error('Approve error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte. Veuillez réessayer.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Reject initiation request
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    await supabase
      .from('initiation_requests')
      .update({ 
        status: 'rejected', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason 
      })
      .eq('id', selectedRequest.id);

    toast({
      title: "Demande refusée",
      description: `La demande de ${selectedRequest.desired_pseudonym} a été rejetée.`,
    });

    setSelectedRequest(null);
    setRejectionReason('');
    fetchData();
  };

  // Update member grade
  const handleGradeChange = async (profileId: string, newGrade: 'novice' | 'apprenti' | 'compagnon' | 'maitre' | 'sage' | 'oracle') => {
    await supabase
      .from('profiles')
      .update({ grade: newGrade })
      .eq('id', profileId);

    toast({
      title: "Grade modifié",
      description: `Le grade a été mis à jour.`,
    });

    fetchData();
  };

  // Update member status
  const handleStatusChange = async (profileId: string, newStatus: 'active' | 'under_surveillance' | 'pending' | 'exclusion_requested') => {
    await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', profileId);

    toast({
      title: "Statut modifié",
      description: `Le statut a été mis à jour.`,
    });

    fetchData();
  };

  // Delete member via edge function
  const handleDeleteMember = async () => {
    if (!profileToDelete) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'delete_user',
          userId: profileToDelete.id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Membre exclu",
          description: `${profileToDelete.pseudonym} a été exclu de l'Ordre.`,
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce membre.",
        variant: "destructive",
      });
    }

    setDeleteConfirmOpen(false);
    setProfileToDelete(null);
    setLoading(false);
    fetchData();
  };

  // Create account directly
  const handleCreateAccount = async () => {
    if (!newEmail || !newPassword || !newPseudonym) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'create_user',
          email: newEmail,
          password: newPassword,
          pseudonym: newPseudonym,
          grade: newGrade,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Compte créé",
          description: `${newPseudonym} a été admis dans l'Ordre.`,
        });
        setCreateAccountOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewPseudonym('');
        setNewGrade('novice');
        fetchData();
      }
    } catch (err) {
      console.error('Create account error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  // Update profile (including password)
  const handleUpdateProfile = async () => {
    if (!editingProfile) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'update_user',
          targetUserId: editingProfile.id,
          email: editEmail || undefined,
          password: editPassword || undefined,
          pseudonym: editPseudonym || undefined,
          grade: editGrade || undefined,
          status: editStatus || undefined,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profil mis à jour",
          description: `Les informations de ${editingProfile.pseudonym} ont été modifiées.`,
        });
        setEditProfileOpen(false);
        setEditingProfile(null);
        fetchData();
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const openEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setEditPseudonym(profile.pseudonym);
    setEditGrade(profile.grade);
    setEditStatus(profile.status);
    setEditEmail('');
    setEditPassword('');
    setEditProfileOpen(true);
  };

  // Mark report as reviewed
  const handleMarkReportReviewed = async (reportId: string) => {
    await supabase
      .from('reports')
      .update({ is_reviewed: true, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', reportId);

    toast({
      title: "Signalement traité",
    });

    fetchData();
  };

  // Approve exit request
  const handleApproveExit = async (exitRequest: ExitRequest) => {
    setLoading(true);

    // First update the request
    await supabase
      .from('exit_requests')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', exitRequest.id);

    // Then delete the user via edge function
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'delete_user',
          userId: exitRequest.user_id,
        },
      });

      if (error || data?.error) {
        toast({
          title: "Demande approuvée",
          description: "La demande a été approuvée. Le compte sera supprimé.",
        });
      } else {
        toast({
          title: "Membre libéré",
          description: "Le membre a quitté l'Ordre.",
        });
      }
    } catch (err) {
      console.error('Exit approval error:', err);
      toast({
        title: "Demande approuvée",
        description: "La demande a été approuvée.",
      });
    }

    setLoading(false);
    fetchData();
  };

  // Award badge
  const handleAwardBadge = async () => {
    if (!selectedBadgeId || !selectedMemberId || !user) return;
    setLoading(true);
    const { error } = await supabase.from('user_badges').insert([{
      badge_id: selectedBadgeId,
      user_id: selectedMemberId,
      awarded_by: user.id,
      reason: badgeReason || null,
    }]);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Médaille attribuée', description: 'La médaille a été attribuée avec succès.' });
      setAwardBadgeOpen(false);
      setSelectedBadgeId('');
      setSelectedMemberId('');
      setBadgeReason('');
      fetchData();
    }
    setLoading(false);
  };

  // Create badge
  const handleCreateBadge = async () => {
    if (!newBadgeName || !newBadgeDescription) return;
    setLoading(true);
    const { error } = await supabase.from('badges').insert([{
      name: newBadgeName,
      description: newBadgeDescription,
      icon: newBadgeIcon || '🏅',
      category: newBadgeCategory,
      rarity: newBadgeRarity,
    }]);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Médaille créée', description: `"${newBadgeName}" a été ajoutée.` });
      setCreateBadgeOpen(false);
      setNewBadgeName('');
      setNewBadgeDescription('');
      setNewBadgeIcon('🏅');
      setNewBadgeCategory('general');
      setNewBadgeRarity('common');
      fetchData();
    }
    setLoading(false);
  };

  // Update badge
  const handleUpdateBadge = async () => {
    if (!editingBadge) return;
    setLoading(true);
    const { error } = await supabase.from('badges').update({
      name: newBadgeName,
      description: newBadgeDescription,
      icon: newBadgeIcon,
      category: newBadgeCategory,
      rarity: newBadgeRarity,
    }).eq('id', editingBadge.id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Médaille modifiée' });
      setEditBadgeOpen(false);
      setEditingBadge(null);
      fetchData();
    }
    setLoading(false);
  };

  const openEditBadge = (badge: BadgeItem) => {
    setEditingBadge(badge);
    setNewBadgeName(badge.name);
    setNewBadgeDescription(badge.description);
    setNewBadgeIcon(badge.icon);
    setNewBadgeCategory(badge.category);
    setNewBadgeRarity(badge.rarity);
    setEditBadgeOpen(true);
  };

  // Delete badge
  const handleDeleteBadge = async (badgeId: string) => {
    const { error } = await supabase.from('badges').delete().eq('id', badgeId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Médaille supprimée' });
      fetchData();
    }
  };

  const handleRevokeBadge = async (ubId: string) => {
    const { error } = await supabase.from('user_badges').delete().eq('id', ubId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Médaille retirée' });
      fetchData();
    }
  };

  // Filter profiles by search
  const filteredProfiles = profiles.filter(p => 
    p.pseudonym.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = initiationRequests.filter(r => r.status === 'pending');
  const pendingExits = exitRequests.filter(r => r.status === 'pending');
  const unreadReports = reports.filter(r => !r.is_reviewed);

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-mystic-gold" />
            <h1 className="font-heading text-3xl tracking-wide">Panneau du Gardien</h1>
          </div>
          <p className="text-muted-foreground">
            Contrôle centralisé de l'Ordre
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="ritual-card p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-heading">{profiles.length}</p>
            <p className="text-xs text-muted-foreground">Initiés</p>
          </div>
          <div className="ritual-card p-4 text-center">
            <UserPlus className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-heading">{pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground">Demandes</p>
          </div>
          <div className="ritual-card p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-heading">{unreadReports.length}</p>
            <p className="text-xs text-muted-foreground">Signalements</p>
          </div>
          <div className="ritual-card p-4 text-center">
            <LogOut className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-heading">{pendingExits.length}</p>
            <p className="text-xs text-muted-foreground">Sorties</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-secondary/50 mb-6">
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="w-4 h-4 hidden sm:block" />
              <span className="text-xs sm:text-sm">Demandes</span>
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="directory" className="gap-2">
              <Users className="w-4 h-4 hidden sm:block" />
              <span className="text-xs sm:text-sm">Annuaire</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="w-4 h-4 hidden sm:block" />
              <span className="text-xs sm:text-sm">Signalements</span>
              {unreadReports.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{unreadReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exits" className="gap-2">
              <LogOut className="w-4 h-4 hidden sm:block" />
              <span className="text-xs sm:text-sm">Sorties</span>
              {pendingExits.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{pendingExits.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Medal className="w-4 h-4 hidden sm:block" />
              <span className="text-xs sm:text-sm">Médailles</span>
            </TabsTrigger>
          </TabsList>

          {/* Initiation Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : initiationRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune demande d'initiation</div>
            ) : (
              initiationRequests.map((request) => (
                <div key={request.id} className="ritual-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg">{request.desired_pseudonym}</h3>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className={request.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : request.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {request.status === 'pending' ? 'En attente' : request.status === 'approved' ? 'Approuvée' : 'Refusée'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground line-clamp-2">{request.motivation}</p>
                  {request.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => setSelectedRequest(request)} className="gap-2">
                        <Eye className="w-4 h-4" />
                        Examiner
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Directory Tab */}
          <TabsContent value="directory" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un initié..."
                  className="pl-10 cipher-input"
                />
              </div>
              <Button onClick={() => setCreateAccountOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Créer un compte</span>
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun initié trouvé</div>
            ) : (
              filteredProfiles.map((profile) => (
                <div key={profile.id} className="ritual-card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-heading text-lg">{profile.pseudonym}</h3>
                      <p className="text-xs text-muted-foreground">
                        Initié le {new Date(profile.joined_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={profile.grade} onValueChange={(v) => handleGradeChange(profile.id, v as 'novice' | 'apprenti' | 'compagnon' | 'maitre' | 'sage' | 'oracle')}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((g) => (
                            <SelectItem key={g} value={g}>{gradeLabels[g]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={profile.status} onValueChange={(v) => handleStatusChange(profile.id, v as 'active' | 'under_surveillance' | 'pending' | 'exclusion_requested')}>
                        <SelectTrigger className="w-[150px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditProfile(profile)}
                        className="text-primary hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProfileToDelete(profile);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucun signalement</div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className={`ritual-card p-4 ${report.is_reviewed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">De:</span>{' '}
                        <span className="font-heading">{report.reporter?.pseudonym || 'Inconnu'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Contre:</span>{' '}
                        <span className="font-heading text-red-400">{report.reported?.pseudonym || 'Inconnu'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {report.is_reviewed ? (
                      <Badge className="bg-green-500/20 text-green-400">Traité</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400">Non lu</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-3 p-3 bg-secondary/30 rounded">{report.reason}</p>
                  {!report.is_reviewed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkReportReviewed(report.id)}
                      className="mt-3"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Marquer comme traité
                    </Button>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Exit Requests Tab */}
          <TabsContent value="exits" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : exitRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Aucune demande de sortie</div>
            ) : (
              exitRequests.map((exitReq) => (
                <div key={exitReq.id} className="ritual-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg">{exitReq.profiles?.pseudonym || 'Membre inconnu'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(exitReq.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className={exitReq.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : exitReq.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {exitReq.status === 'pending' ? 'En attente' : exitReq.status === 'approved' ? 'Approuvée' : 'Refusée'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-3 p-3 bg-secondary/30 rounded">{exitReq.reason}</p>
                  {exitReq.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => handleApproveExit(exitReq)} className="gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        <Check className="w-4 h-4" />
                        Approuver la sortie
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" onClick={() => {
                setNewBadgeName('');
                setNewBadgeDescription('');
                setNewBadgeIcon('🏅');
                setNewBadgeCategory('general');
                setNewBadgeRarity('common');
                setCreateBadgeOpen(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer une médaille
              </Button>
              <Button onClick={() => setAwardBadgeOpen(true)} className="gap-2">
                <Award className="w-4 h-4" />
                Attribuer une médaille
              </Button>
            </div>

            {/* Available badges */}
            <div className="mb-6">
              <h3 className="font-heading text-lg mb-3 text-gold-dim">Médailles disponibles</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((badge) => {
                  const rarityColor = badge.rarity === 'spécial' ? 'bg-purple-500/20 text-purple-300' :
                    badge.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300' :
                    badge.rarity === 'epic' ? 'bg-fuchsia-500/20 text-fuchsia-300' :
                    badge.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-secondary text-secondary-foreground';
                  return (
                    <div key={badge.id} className="ritual-card p-3 text-center relative group">
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditBadge(badge)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteBadge(badge.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-2xl block mb-1">{badge.icon}</span>
                      <p className="text-sm font-heading">{badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
                      <Badge className={`mt-2 text-[10px] ${rarityColor}`}>{badge.rarity}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Awarded badges history */}
            <div>
              <h3 className="font-heading text-lg mb-3 text-gold-dim">Médailles attribuées</h3>
              {userBadges.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Aucune médaille attribuée</p>
              ) : (
                userBadges.map((ub) => (
                  <div key={ub.id} className="ritual-card p-3 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ub.badges?.icon || '🏅'}</span>
                      <div>
                        <p className="text-sm font-heading">{ub.badges?.name || 'Médaille'}</p>
                        <p className="text-xs text-muted-foreground">
                          → {ub.profiles?.pseudonym || 'Inconnu'} • {new Date(ub.awarded_at).toLocaleDateString('fr-FR')}
                        </p>
                        {ub.reason && <p className="text-[10px] text-muted-foreground italic">{ub.reason}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRevokeBadge(ub.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Award Badge Dialog */}
        <Dialog open={awardBadgeOpen} onOpenChange={setAwardBadgeOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Attribuer une médaille</DialogTitle>
              <DialogDescription>
                Choisissez un membre et une médaille à lui attribuer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Membre</label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un membre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.pseudonym} ({gradeLabels[p.grade]})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Médaille</label>
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une médaille..." />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.icon} {b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Raison (optionnel)</label>
                <Textarea
                  value={badgeReason}
                  onChange={(e) => setBadgeReason(e.target.value)}
                  placeholder="Raison de l'attribution..."
                  className="cipher-input"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setAwardBadgeOpen(false)}>Annuler</Button>
              <Button onClick={handleAwardBadge} disabled={!selectedBadgeId || !selectedMemberId || loading}>
                <Award className="w-4 h-4 mr-2" />
                Attribuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Badge Dialog */}
        <Dialog open={createBadgeOpen} onOpenChange={setCreateBadgeOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Créer une médaille</DialogTitle>
              <DialogDescription>Définissez les caractéristiques de la nouvelle médaille.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nom</label>
                <Input value={newBadgeName} onChange={(e) => setNewBadgeName(e.target.value)} placeholder="Nom de la médaille..." className="cipher-input" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Textarea value={newBadgeDescription} onChange={(e) => setNewBadgeDescription(e.target.value)} placeholder="Description..." className="cipher-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Icône (emoji)</label>
                  <Input value={newBadgeIcon} onChange={(e) => setNewBadgeIcon(e.target.value)} placeholder="🏅" className="cipher-input" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Catégorie</label>
                  <Select value={newBadgeCategory} onValueChange={setNewBadgeCategory}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="combat">Combat</SelectItem>
                      <SelectItem value="wisdom">Sagesse</SelectItem>
                      <SelectItem value="loyalty">Loyauté</SelectItem>
                      <SelectItem value="mystery">Mystère</SelectItem>
                      <SelectItem value="special">Spécial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rareté</label>
                <Select value={newBadgeRarity} onValueChange={setNewBadgeRarity}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Commune</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Épique</SelectItem>
                    <SelectItem value="legendary">Légendaire</SelectItem>
                    <SelectItem value="spécial">✦ Spécial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setCreateBadgeOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateBadge} disabled={!newBadgeName || !newBadgeDescription || loading}>
                <Plus className="w-4 h-4 mr-2" />
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Badge Dialog */}
        <Dialog open={editBadgeOpen} onOpenChange={setEditBadgeOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Modifier la médaille</DialogTitle>
              <DialogDescription>Modifiez les caractéristiques de cette médaille.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nom</label>
                <Input value={newBadgeName} onChange={(e) => setNewBadgeName(e.target.value)} className="cipher-input" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Textarea value={newBadgeDescription} onChange={(e) => setNewBadgeDescription(e.target.value)} className="cipher-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Icône (emoji)</label>
                  <Input value={newBadgeIcon} onChange={(e) => setNewBadgeIcon(e.target.value)} className="cipher-input" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Catégorie</label>
                  <Select value={newBadgeCategory} onValueChange={setNewBadgeCategory}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="combat">Combat</SelectItem>
                      <SelectItem value="wisdom">Sagesse</SelectItem>
                      <SelectItem value="loyalty">Loyauté</SelectItem>
                      <SelectItem value="mystery">Mystère</SelectItem>
                      <SelectItem value="special">Spécial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Rareté</label>
                <Select value={newBadgeRarity} onValueChange={setNewBadgeRarity}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Commune</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Épique</SelectItem>
                    <SelectItem value="legendary">Légendaire</SelectItem>
                    <SelectItem value="spécial">✦ Spécial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setEditBadgeOpen(false)}>Annuler</Button>
              <Button onClick={handleUpdateBadge} disabled={!newBadgeName || !newBadgeDescription || loading}>
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Demande d'initiation</DialogTitle>
              <DialogDescription>
                Examinez cette demande et décidez d'accepter ou refuser le candidat.
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pseudonyme désiré</p>
                  <p className="font-heading text-lg">{selectedRequest.desired_pseudonym}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Motivation</p>
                  <p className="text-sm p-3 bg-secondary/30 rounded max-h-40 overflow-y-auto">
                    {selectedRequest.motivation}
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Pour approuver, créez un mot de passe temporaire:</p>
                  <Input
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Mot de passe temporaire..."
                    className="cipher-input"
                    type="password"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Raison du refus (optionnel):</p>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette demande est refusée..."
                    className="cipher-input"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleRejectRequest}>
                <X className="w-4 h-4 mr-2" />
                Refuser
              </Button>
              <Button onClick={handleApproveRequest} disabled={!tempPassword}>
                <Check className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-heading text-destructive">Exclusion d'un membre</DialogTitle>
              <DialogDescription>
                Êtes-vous certain de vouloir exclure {profileToDelete?.pseudonym} de l'Ordre ? 
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteMember}>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirmer l'exclusion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Account Dialog */}
        <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Créer un compte</DialogTitle>
              <DialogDescription>
                Créez directement un compte pour un nouvel initié sans passer par une demande.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="cipher-input"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pseudonyme</label>
                <Input
                  value={newPseudonym}
                  onChange={(e) => setNewPseudonym(e.target.value)}
                  placeholder="Pseudonyme mystique..."
                  className="cipher-input"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Mot de passe</label>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe..."
                  className="cipher-input"
                  type="password"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Grade initial</label>
                <Select value={newGrade} onValueChange={setNewGrade}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>{gradeLabels[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setCreateAccountOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateAccount} disabled={!newEmail || !newPassword || !newPseudonym || loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer le compte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Modifier un initié</DialogTitle>
              <DialogDescription>
                Modifiez toutes les informations de {editingProfile?.pseudonym}, y compris le mot de passe.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Pseudonyme</label>
                <Input
                  value={editPseudonym}
                  onChange={(e) => setEditPseudonym(e.target.value)}
                  placeholder="Pseudonyme..."
                  className="cipher-input"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email (laisser vide pour ne pas modifier)</label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Nouvel email..."
                  className="cipher-input"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Nouveau mot de passe (laisser vide pour ne pas modifier)</label>
                <Input
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nouveau mot de passe..."
                  className="cipher-input"
                  type="password"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Grade</label>
                <Select value={editGrade} onValueChange={setEditGrade}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>{gradeLabels[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Statut</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setEditProfileOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </MainLayout>
  );
};

export default GuardianDashboard;
