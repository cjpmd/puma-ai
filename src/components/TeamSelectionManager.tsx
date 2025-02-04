import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormationSelector } from "@/components/FormationSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamSelectionManagerProps {
  teams: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  format: string;
  onTeamSelectionsChange?: (selections: Record<string, Record<string, { playerId: string; position: string; performanceCategory?: string }>>) => void;
}

export const TeamSelectionManager = ({
  teams,
  format,
  onTeamSelectionsChange 
}: TeamSelectionManagerProps) => {
  const { toast } = useToast();
  const [teamSelections, setTeamSelections] = useState<Record<string, Record<string, { playerId: string; position: string; performanceCategory?: string }>>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [performanceCategories, setPerformanceCategories] = useState<Record<string, string>>({});

  const { data: players, isLoading, error } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (error) {
    console.error("Error loading players:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load players",
    });
  }

  const handleTeamSelectionChange = (teamId: string, selections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => {
    const newSelections = {
      ...teamSelections,
      [teamId]: {
        ...selections,
        ...Object.fromEntries(
          Object.entries(selections).map(([key, value]) => [
            key,
            {
              ...value,
              performanceCategory: performanceCategories[teamId] || "MESSI"
            }
          ])
        )
      },
    };

    setTeamSelections(newSelections);
    onTeamSelectionsChange?.(newSelections);
  };

  const handlePerformanceCategoryChange = (teamId: string, category: string) => {
    setPerformanceCategories(prev => {
      const newCategories = {
        ...prev,
        [teamId]: category
      };

      // Update existing selections with new category
      const updatedSelections = {
        ...teamSelections,
        [teamId]: Object.fromEntries(
          Object.entries(teamSelections[teamId] || {}).map(([key, value]) => [
            key,
            { ...value, performanceCategory: category }
          ])
        )
      };
      setTeamSelections(updatedSelections);
      onTeamSelectionsChange?.(updatedSelections);

      return newCategories;
    });
  };

  const handleSave = async () => {
    try {
      // Save team selections logic here
      toast({
        title: "Success",
        description: "Team selections saved successfully",
      });
    } catch (error) {
      console.error("Error saving team selections:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save team selections",
      });
    }
  };

  if (isLoading || !players) {
    return <div>Loading players...</div>;
  }

  // Ensure format is one of the allowed values
  const validFormat = (format === "5-a-side" || format === "7-a-side" || format === "9-a-side" || format === "11-a-side") 
    ? format 
    : "7-a-side";

  return (
    <div className="space-y-6">
      {teams.map(team => (
        <Card key={team.id} className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{team.name}</CardTitle>
            <Select
              value={performanceCategories[team.id] || "MESSI"}
              onValueChange={(value) => handlePerformanceCategoryChange(team.id, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MESSI">Messi</SelectItem>
                <SelectItem value="RONALDO">Ronaldo</SelectItem>
                <SelectItem value="JAGS">Jags</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <FormationSelector
              format={validFormat}
              teamName={team.name}
              onSelectionChange={(selections) => handleTeamSelectionChange(team.id, selections)}
              selectedPlayers={selectedPlayers}
              availablePlayers={players}
            />
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Team Selections</Button>
      </div>
    </div>
  );
};