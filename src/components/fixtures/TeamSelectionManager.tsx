import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormationSelector } from "@/components/FormationSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamSelectionManagerProps {
  fixture: any | null;
}

export const TeamSelectionManager = ({ fixture }: TeamSelectionManagerProps) => {
  const { toast } = useToast();
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [periods, setPeriods] = useState<Array<{ id: string; duration: number }>>([
    { id: "period-1", duration: 20 }
  ]);
  const [activeTeam, setActiveTeam] = useState<string>("1");
  const [selections, setSelections] = useState<Record<string, Record<string, Record<string, { playerId: string; position: string; performanceCategory?: string }>>>>({});
  const [performanceCategories, setPerformanceCategories] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: availablePlayers } = useQuery({
    queryKey: ["available-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const fetchSelections = async () => {
      if (!fixture) return;

      const { data, error } = await supabase
        .from('team_selections')
        .select('*')
        .eq('event_id', fixture.id)
        .eq('event_type', 'FIXTURE');

      if (error) {
        console.error("Error fetching selections:", error);
        return;
      }

      const transformedSelections: Record<string, Record<string, Record<string, { playerId: string; position: string; performanceCategory?: string }>>> = {};
      
      data.forEach(selection => {
        const periodKey = `period-${selection.period_number || 1}`;
        const teamKey = selection.team_number.toString();
        
        if (!transformedSelections[periodKey]) {
          transformedSelections[periodKey] = {};
        }
        if (!transformedSelections[periodKey][teamKey]) {
          transformedSelections[periodKey][teamKey] = {};
        }

        transformedSelections[periodKey][teamKey][selection.position] = {
          playerId: selection.player_id,
          position: selection.position,
          performanceCategory: selection.performance_category
        };

        setPerformanceCategories(prev => ({
          ...prev,
          [`${periodKey}-${teamKey}`]: selection.performance_category || 'MESSI'
        }));
      });

      setSelections(transformedSelections);
      
      const newSelectedPlayers = new Set<string>();
      data.forEach(selection => {
        if (selection.player_id !== "unassigned") {
          newSelectedPlayers.add(selection.player_id);
        }
      });
      setSelectedPlayers(newSelectedPlayers);
    };

    fetchSelections();
  }, [fixture]);

  const handleDeletePeriod = (periodId: string) => {
    setPeriods(prev => prev.filter(p => p.id !== periodId));
    setSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[periodId];
      return newSelections;
    });
  };

  const handleTeamSelectionChange = (periodId: string, teamId: string, teamSelections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => {
    setSelections(prev => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        [teamId]: teamSelections
      }
    }));

    const newSelectedPlayers = new Set<string>();
    Object.values(selections).forEach(periodSelections => {
      Object.values(periodSelections).forEach(teamSelections => {
        Object.values(teamSelections).forEach(selection => {
          if (selection.playerId !== "unassigned") {
            newSelectedPlayers.add(selection.playerId);
          }
        });
      });
    });
    setSelectedPlayers(newSelectedPlayers);
  };

  const handlePerformanceCategoryChange = (periodId: string, teamId: string, category: string) => {
    setPerformanceCategories(prev => ({
      ...prev,
      [`${periodId}-${teamId}`]: category
    }));

    setSelections(prev => ({
      ...prev,
      [periodId]: {
        ...prev[periodId],
        [teamId]: Object.fromEntries(
          Object.entries(prev[periodId]?.[teamId] || {}).map(([pos, sel]) => [
            pos,
            { ...sel, performanceCategory: category }
          ])
        )
      }
    }));
  };

  const handleSave = async () => {
    if (!fixture) return;

    try {
      setIsSaving(true);

      const periodPromises = periods.map(async (period) => {
        const periodNumber = parseInt(period.id.split('-')[1]);
        const { data, error } = await supabase
          .from('event_periods')
          .upsert({
            event_id: fixture.id,
            event_type: 'FIXTURE',
            period_number: periodNumber,
            duration_minutes: period.duration
          }, {
            onConflict: 'event_id,event_type,period_number'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const periodRecords = await Promise.all(periodPromises);

      await supabase
        .from("team_selections")
        .delete()
        .match({
          event_id: fixture.id,
          event_type: 'FIXTURE'
        });

      const allSelections = Object.entries(selections).flatMap(([periodKey, periodSelections]) =>
        Object.entries(periodSelections).flatMap(([teamNumber, teamSelections]) =>
          Object.entries(teamSelections)
            .filter(([_, selection]) => selection.playerId !== "unassigned")
            .map(([_, selection]) => {
              const periodNumber = parseInt(periodKey.split('-')[1]);
              const currentPeriodId = periodRecords.find(p => p.period_number === periodNumber)?.id;
              const performanceCategory = performanceCategories[`${periodKey}-${teamNumber}`] || 'MESSI';
              
              return {
                event_id: fixture.id,
                event_type: 'FIXTURE',
                team_number: parseInt(teamNumber),
                player_id: selection.playerId,
                position: selection.position,
                period_id: currentPeriodId,
                performance_category: performanceCategory
              };
            })
        )
      );

      if (allSelections.length > 0) {
        const { error } = await supabase
          .from("team_selections")
          .insert(allSelections);

        if (error) throw error;
      }

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
    } finally {
      setIsSaving(false);
    }
  };

  if (!fixture || !availablePlayers) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Selection - {fixture.opponent}</h2>
        <div className="space-x-2">
          <Button 
            onClick={() => {
              const newPeriodId = `period-${periods.length + 1}`;
              setPeriods([...periods, { id: newPeriodId, duration: 20 }]);
              
              // Copy performance categories from the last period
              const lastPeriod = periods[periods.length - 1];
              if (lastPeriod) {
                const newCategories: Record<string, string> = {};
                Object.entries(performanceCategories).forEach(([key, value]) => {
                  if (key.startsWith(`${lastPeriod.id}-`)) {
                    const teamId = key.split('-')[2];
                    newCategories[`${newPeriodId}-${teamId}`] = value;
                  }
                });
                setPerformanceCategories(prev => ({
                  ...prev,
                  ...newCategories
                }));
              }
            }} 
            variant="outline"
          >
            Add Period
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Selections'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="1" className="w-full" onValueChange={setActiveTeam}>
        <TabsList className="w-full mb-4">
          {Array.from({ length: fixture.number_of_teams || 1 }).map((_, index) => (
            <TabsTrigger 
              key={index} 
              value={(index + 1).toString()}
              className="flex-1"
            >
              Team {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {Array.from({ length: fixture.number_of_teams || 1 }).map((_, teamIndex) => (
          <TabsContent 
            key={teamIndex} 
            value={(teamIndex + 1).toString()}
            className="mt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {periods.map((period) => (
                <Card key={period.id} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3"
                    onClick={() => handleDeletePeriod(period.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-4">
                    <CardTitle>Period {period.id.split('-')[1]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-end">
                        <Select
                          value={performanceCategories[`${period.id}-${teamIndex + 1}`] || "MESSI"}
                          onValueChange={(value) => handlePerformanceCategoryChange(period.id, (teamIndex + 1).toString(), value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MESSI">Messi</SelectItem>
                            <SelectItem value="RONALDO">Ronaldo</SelectItem>
                            <SelectItem value="JAGS">Jags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormationSelector
                        format={fixture.format as "7-a-side"}
                        teamName={fixture.team_name}
                        onSelectionChange={(teamSelections) => 
                          handleTeamSelectionChange(period.id, (teamIndex + 1).toString(), teamSelections)
                        }
                        selectedPlayers={selectedPlayers}
                        availablePlayers={availablePlayers}
                        initialSelections={selections[period.id]?.[teamIndex + 1]}
                        performanceCategory={performanceCategories[`${period.id}-${teamIndex + 1}`]}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
