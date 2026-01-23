import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActionHistory } from '@/hooks/useActionHistory';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, ThumbsDown, Minus, Vote, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type VoteChoice = Database['public']['Enums']['vote_choice'];

interface CouncilVote {
  id: string;
  opinion_id: string;
  voter_id: string;
  vote: VoteChoice;
  comment: string | null;
  created_at: string;
}

interface CouncilVotingSectionProps {
  opinionId: string;
  opinionStatus: string;
}

const voteLabels: Record<VoteChoice, string> = {
  pour: 'Pour',
  contre: 'Contre',
  abstention: 'Abstention',
};

const voteColors: Record<VoteChoice, string> = {
  pour: 'bg-green-500/20 text-green-300 border-green-500/50',
  contre: 'bg-red-500/20 text-red-300 border-red-500/50',
  abstention: 'bg-muted text-muted-foreground border-muted',
};

export function CouncilVotingSection({ opinionId, opinionStatus }: CouncilVotingSectionProps) {
  const { user } = useAuth();
  const { logAction } = useActionHistory();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: votes, isLoading } = useQuery({
    queryKey: ['council-votes', opinionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('council_votes')
        .select('*')
        .eq('opinion_id', opinionId);

      if (error) throw error;
      return data as CouncilVote[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['archonte-profiles'],
    queryFn: async () => {
      // Get all users with knowledge access (archontes and guardian)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['archonte', 'guardian_supreme']);

      if (roleError) throw roleError;

      const userIds = roleData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, pseudonym')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profilesData;
    },
  });

  const getVoterName = (voterId: string) => {
    const profile = profiles?.find(p => p.id === voterId);
    return profile?.pseudonym || 'Inconnu';
  };

  const currentUserVote = votes?.find(v => v.voter_id === user?.id);
  const canVote = opinionStatus === 'deliberation';

  const voteMutation = useMutation({
    mutationFn: async (vote: VoteChoice) => {
      if (currentUserVote) {
        // Update existing vote
        const { error } = await supabase
          .from('council_votes')
          .update({ vote, comment: comment || null })
          .eq('id', currentUserVote.id);
        if (error) throw error;
      } else {
        // Insert new vote
        const { error } = await supabase.from('council_votes').insert({
          opinion_id: opinionId,
          voter_id: user!.id,
          vote,
          comment: comment || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vote) => {
      queryClient.invalidateQueries({ queryKey: ['council-votes', opinionId] });
      logAction.mutate({
        actionType: 'vote_cast',
        targetId: opinionId,
        targetType: 'council_opinion',
        description: `Vote enregistré: ${voteLabels[vote]}`,
      });
      toast.success('Vote enregistré');
      setComment('');
    },
    onError: () => {
      toast.error('Erreur lors du vote');
    },
  });

  // Calculate vote statistics
  const voteStats = {
    pour: votes?.filter(v => v.vote === 'pour').length || 0,
    contre: votes?.filter(v => v.vote === 'contre').length || 0,
    abstention: votes?.filter(v => v.vote === 'abstention').length || 0,
  };
  const totalVotes = voteStats.pour + voteStats.contre + voteStats.abstention;
  const pourPercentage = totalVotes > 0 ? (voteStats.pour / totalVotes) * 100 : 0;
  const contrePercentage = totalVotes > 0 ? (voteStats.contre / totalVotes) * 100 : 0;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement des votes...</div>;
  }

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Vote className="w-4 h-4 text-primary" />
        <Label className="text-sm font-medium">Votes du Conseil</Label>
        <Badge variant="outline" className="ml-auto">
          <Users className="w-3 h-3 mr-1" />
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Vote statistics */}
      {totalVotes > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 w-16">Pour ({voteStats.pour})</span>
            <Progress value={pourPercentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-10">{pourPercentage.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400 w-16">Contre ({voteStats.contre})</span>
            <Progress value={contrePercentage} className="h-2 flex-1 [&>div]:bg-red-500" />
            <span className="text-xs text-muted-foreground w-10">{contrePercentage.toFixed(0)}%</span>
          </div>
          {voteStats.abstention > 0 && (
            <p className="text-xs text-muted-foreground">
              {voteStats.abstention} abstention{voteStats.abstention !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Current user's vote status */}
      {currentUserVote && (
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">
            Votre vote : <Badge className={voteColors[currentUserVote.vote]}>{voteLabels[currentUserVote.vote]}</Badge>
          </p>
          {currentUserVote.comment && (
            <p className="text-xs text-muted-foreground mt-1 italic">"{currentUserVote.comment}"</p>
          )}
        </div>
      )}

      {/* Voting section */}
      {canVote && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Commentaire (optionnel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Justifiez votre vote..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => voteMutation.mutate('pour')}
              variant="outline"
              className="flex-1 gap-2 border-green-500/50 text-green-400 hover:bg-green-500/20"
              disabled={voteMutation.isPending}
            >
              <ThumbsUp className="w-4 h-4" />
              Pour
            </Button>
            <Button
              onClick={() => voteMutation.mutate('contre')}
              variant="outline"
              className="flex-1 gap-2 border-red-500/50 text-red-400 hover:bg-red-500/20"
              disabled={voteMutation.isPending}
            >
              <ThumbsDown className="w-4 h-4" />
              Contre
            </Button>
            <Button
              onClick={() => voteMutation.mutate('abstention')}
              variant="outline"
              className="flex-1 gap-2"
              disabled={voteMutation.isPending}
            >
              <Minus className="w-4 h-4" />
              Abstention
            </Button>
          </div>
        </div>
      )}

      {!canVote && opinionStatus !== 'deliberation' && (
        <p className="text-xs text-muted-foreground italic">
          Les votes sont possibles uniquement en phase de délibération.
        </p>
      )}

      {/* List of votes with comments */}
      {votes && votes.length > 0 && (
        <div className="space-y-2 mt-4">
          <Label className="text-xs text-muted-foreground">Détail des votes</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {votes.map((vote) => (
              <div key={vote.id} className="flex items-center gap-2 text-xs bg-muted/30 p-2 rounded">
                <span className="font-medium">{getVoterName(vote.voter_id)}</span>
                <Badge className={`${voteColors[vote.vote]} text-xs`}>{voteLabels[vote.vote]}</Badge>
                {vote.comment && (
                  <span className="text-muted-foreground italic truncate">— {vote.comment}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
