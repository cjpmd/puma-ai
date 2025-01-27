import { useEffect } from "react";
import { useTeamSelection } from "@/hooks/useTeamSelection";
import { FormationSelector } from "@/components/FormationSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormationView } from "@/components/fixtures/FormationView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FestivalTeamSelectionProps {
  teams: Array<{ id: string; name: string; category: string }>;
  format: string;
  onTeamSelectionsChange: (selections: Record<string, Record<string, { playerId: string; position: string }>>) => void;
}

export const FestivalTeamSelection = ({ 
  teams, 
  format, 
  onTeamSelectionsChange,
}: FestivalTeamSelectionProps) => {
  const { selectedPlayers, clearSelectedPlayers } = useTeamSelection();
  const [teamSelections, setTeamSelections] = useState<Record<string, Record<string, { playerId: string; position: string }>>>({});

  const { data: players } = useQuery({
    queryKey: ["all-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    clearSelectedPlayers();
  }, [teams]);

  const handleSelectionChange = (teamId: string, selections: Record<string, { playerId: string; position: string }>) => {
    const newSelections = {
      ...teamSelections,
      [teamId]: selections
    };
    setTeamSelections(newSelections);
    onTeamSelectionsChange(newSelections);
  };

  const formatSelectionsForFormation = (selections: Record<string, { playerId: string; position: string }>) => {
    return Object.entries(selections)
      .filter(([key]) => !key.startsWith('sub-'))
      .map(([_, { playerId, position }]) => ({
        position: position.split('-')[0].toUpperCase(),
        playerId
      }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      {teams.map(team => (
        <Card key={team.id} className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">{team.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamSelections[team.id] && (
              <FormationView
                positions={formatSelectionsForFormation(teamSelections[team.id])}
                players={players || []}
                periodNumber={1}
                duration={20}
              />
            )}
            <FormationSelector
              format={format as any}
              teamCategory={team.category}
              onSelectionChange={(selections) => handleSelectionChange(team.id, selections)}
              performanceCategory={team.category}
              selectedPlayers={selectedPlayers}
              onCategoryChange={(category) => {
                // Handle performance category change
                const currentSelections = teamSelections[team.id] || {};
                const updatedSelections = Object.entries(currentSelections).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key]: { ...value, performanceCategory: category }
                }), {});
                handleSelectionChange(team.id, updatedSelections);
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};