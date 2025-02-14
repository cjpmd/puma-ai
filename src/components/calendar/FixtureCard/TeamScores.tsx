
import { Trophy, Minus, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type TeamTime = Database['public']['Tables']['fixture_team_times']['Row'];
type TeamScore = Database['public']['Tables']['fixture_team_scores']['Row'];

interface TeamScoresProps {
  scores: TeamScore[];
  times: TeamTime[];
  outcome: string | null | undefined;
  fixture: {
    opponent: string;
    team_name: string;
    is_home: boolean;
  };
}

const getTeamOutcome = (ourScore: number, theirScore: number) => {
  if (ourScore > theirScore) return 'WIN';
  if (ourScore < theirScore) return 'LOSS';
  return 'DRAW';
};

const getOutcomeIcon = (outcome: string | null | undefined) => {
  switch (outcome) {
    case 'WIN':
      return <Trophy className="h-4 w-4 text-green-500" />;
    case 'DRAW':
      return <Minus className="h-4 w-4 text-amber-500" />;
    case 'LOSS':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

export const TeamScores = ({
  scores,
  times,
  fixture
}: TeamScoresProps) => {
  const { profile } = useAuth();
  
  const { data: teamSettings } = useQuery({
    queryKey: ['team-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (!scores || scores.length === 0) {
    return <p className="text-muted-foreground">Score not yet recorded</p>;
  }

  const shouldHideScores = teamSettings?.hide_scores_from_parents && profile?.role === 'parent';

  return (
    <div className="space-y-4">
      {scores.map((teamScore, index) => {
        const teamTime = times.find(t => t.team_number === teamScore.team_number);
        const performanceCategory = teamTime?.performance_category || 'MESSI';
        const ourTeamName = `Team ${teamScore.team_number} (${performanceCategory})`;
        const theirScore = scores.find(s => s.team_number === teamScore.team_number + 1)?.score || 0;

        const displayScore = shouldHideScores 
          ? 'Score hidden' 
          : `${teamScore.score} - ${theirScore}`;

        const outcome = !shouldHideScores ? getTeamOutcome(teamScore.score, theirScore) : null;

        return (
          <div key={teamScore.team_number} className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-base">
                {fixture.is_home 
                  ? `${ourTeamName}: ${displayScore} ${fixture.opponent}`
                  : `${fixture.opponent}: ${displayScore} ${ourTeamName}`
                }
              </p>
              {!shouldHideScores && getOutcomeIcon(outcome)}
            </div>

            {teamTime && (
              <div className="text-sm text-muted-foreground">
                {teamTime.meeting_time && <p>Meeting: {teamTime.meeting_time}</p>}
                {teamTime.start_time && <p>Start: {teamTime.start_time}</p>}
                {teamTime.end_time && <p>End: {teamTime.end_time}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
