
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import type { Fixture } from "@/types/fixture";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FixtureCardHeader } from "./FixtureCard/FixtureCardHeader";
import { TeamScores } from "./FixtureCard/TeamScores";
import { TeamSelectionDialog } from "./FixtureCard/TeamSelectionDialog";

interface FixtureCardProps {
  fixture: Fixture;
  onEdit: (fixture: Fixture) => void;
  onDelete: (fixtureId: string) => void;
  onDateChange: (newDate: Date) => void;
}

export const FixtureCard = ({
  fixture,
  onEdit,
  onDelete,
  onDateChange
}: FixtureCardProps) => {
  const [isTeamSelectionOpen, setIsTeamSelectionOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [motmName, setMotmName] = useState<string | null>(null);

  const {
    data: teamData,
    isLoading,
    refetch: refetchTeamData
  } = useQuery({
    queryKey: ["team-data", fixture.id],
    queryFn: async () => {
      const [scoresResponse, timesResponse] = await Promise.all([
        supabase
          .from('fixture_team_scores')
          .select('*')
          .eq('fixture_id', fixture.id)
          .order('team_number'),
        supabase
          .from('fixture_team_times')
          .select('*')
          .eq('fixture_id', fixture.id)
          .order('team_number')
      ]);

      if (scoresResponse.error) throw scoresResponse.error;
      if (timesResponse.error) throw timesResponse.error;

      // If there are no scores yet, create default scores
      if (!scoresResponse.data || scoresResponse.data.length === 0) {
        const defaultScores = Array.from(
          { length: fixture.number_of_teams || 1 },
          (_, index) => ({
            team_number: index + 1,
            score: 0,
            fixture_id: fixture.id
          })
        );

        const { error: insertError } = await supabase
          .from('fixture_team_scores')
          .insert(defaultScores);

        if (insertError) {
          console.error('Error creating default scores:', insertError);
          return {
            scores: defaultScores,
            times: timesResponse.data || []
          };
        }

        // Refetch scores after inserting defaults
        const { data: updatedScores, error: refetchError } = await supabase
          .from('fixture_team_scores')
          .select('*')
          .eq('fixture_id', fixture.id)
          .order('team_number');

        if (refetchError) throw refetchError;

        return {
          scores: updatedScores,
          times: timesResponse.data || []
        };
      }

      return {
        scores: scoresResponse.data,
        times: timesResponse.data || []
      };
    }
  });

  useEffect(() => {
    const fetchMotmName = async () => {
      if (!fixture.motm_player_id) {
        setMotmName(null);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('name')
        .eq('id', fixture.motm_player_id)
        .single();

      if (error) {
        console.error('Error fetching MOTM player:', error);
        setMotmName('Unknown Player');
        return;
      }

      if (data) {
        setMotmName(data.name);
      }
    };

    fetchMotmName();
  }, [fixture.motm_player_id]);

  return (
    <>
      <Card className="hover:bg-accent/50 transition-colors">
        <FixtureCardHeader
          fixture={fixture}
          isCalendarOpen={isCalendarOpen}
          setIsCalendarOpen={setIsCalendarOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onTeamSelection={() => setIsTeamSelectionOpen(true)}
          onDateChange={onDateChange}
        />
        <CardContent onClick={() => onEdit(fixture)} className="cursor-pointer">
          <p className="font-semibold text-muted-foreground mb-4 text-sm">
            Date: {format(parseISO(fixture.date), "MMMM do, yyyy")}
          </p>

          {!isLoading && teamData && (
            <TeamScores
              scores={teamData.scores}
              times={teamData.times}
              outcome={fixture.outcome}
              fixture={{
                opponent: fixture.opponent,
                team_name: fixture.team_name,
                is_home: fixture.is_home
              }}
            />
          )}

          <div className="space-y-1 mt-4 text-sm text-muted-foreground">
            {fixture.location && <p>Location: {fixture.location}</p>}
            {fixture.motm_player_id && motmName && (
              <p>Man of the Match: {motmName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <TeamSelectionDialog
        isOpen={isTeamSelectionOpen}
        onOpenChange={setIsTeamSelectionOpen}
        fixture={fixture}
        onSuccess={() => {
          refetchTeamData();
        }}
      />
    </>
  );
};
