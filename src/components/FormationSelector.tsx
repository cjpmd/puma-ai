import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PrintTeamSelection } from "./fixtures/PrintTeamSelection";
import { PeriodTable } from "./fixtures/team-selection/PeriodTable";

interface Player {
  id: string;
  name: string;
  squad_number: number;
}

interface FormationSelectorProps {
  players: Player[];
  fixtureId: string;
  format: string;
}

export const FormationSelector = ({ players, fixtureId, format }: FormationSelectorProps) => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [fixture, setFixture] = useState<any>(null);
  const { toast } = useToast();

  const getPositionsForFormat = (format: string) => {
    const formatPositions: { [key: string]: { abbreviation: string; full_name: string }[] } = {
      "4-a-side": [
        { abbreviation: "GK", full_name: "Goalkeeper" },
        { abbreviation: "D", full_name: "Defender" },
        { abbreviation: "M", full_name: "Midfielder" },
        { abbreviation: "ST", full_name: "Striker" }
      ],
      "5-a-side": [
        { abbreviation: "GK", full_name: "Goalkeeper" },
        { abbreviation: "DL", full_name: "Left Defender" },
        { abbreviation: "DR", full_name: "Right Defender" },
        { abbreviation: "M", full_name: "Midfielder" },
        { abbreviation: "ST", full_name: "Striker" }
      ],
      "7-a-side": [
        { abbreviation: "GK", full_name: "Goalkeeper" },
        { abbreviation: "DL", full_name: "Left Defender" },
        { abbreviation: "DCR", full_name: "Central Defender" },
        { abbreviation: "DR", full_name: "Right Defender" },
        { abbreviation: "ML", full_name: "Left Midfielder" },
        { abbreviation: "MR", full_name: "Right Midfielder" },
        { abbreviation: "ST", full_name: "Striker" }
      ],
      "9-a-side": [
        { abbreviation: "GK", full_name: "Goalkeeper" },
        { abbreviation: "DL", full_name: "Left Defender" },
        { abbreviation: "DC", full_name: "Central Defender" },
        { abbreviation: "DR", full_name: "Right Defender" },
        { abbreviation: "ML", full_name: "Left Midfielder" },
        { abbreviation: "MC", full_name: "Central Midfielder" },
        { abbreviation: "MR", full_name: "Right Midfielder" },
        { abbreviation: "AMC", full_name: "Attacking Midfielder" },
        { abbreviation: "ST", full_name: "Striker" }
      ],
      "11-a-side": [
        { abbreviation: "GK", full_name: "Goalkeeper" },
        { abbreviation: "DL", full_name: "Left Back" },
        { abbreviation: "DCL", full_name: "Left Center Back" },
        { abbreviation: "DCR", full_name: "Right Center Back" },
        { abbreviation: "DR", full_name: "Right Back" },
        { abbreviation: "ML", full_name: "Left Midfielder" },
        { abbreviation: "MC", full_name: "Central Midfielder" },
        { abbreviation: "MR", full_name: "Right Midfielder" },
        { abbreviation: "AML", full_name: "Left Winger" },
        { abbreviation: "ST", full_name: "Striker" },
        { abbreviation: "AMR", full_name: "Right Winger" }
      ]
    };

    return formatPositions[format] || formatPositions["7-a-side"];
  };

  useEffect(() => {
    const fetchFixture = async () => {
      const { data, error } = await supabase
        .from("fixtures")
        .select("*")
        .eq("id", fixtureId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching fixture:", error);
        return;
      }

      setFixture(data);
    };

    fetchFixture();
  }, [fixtureId]);

  useEffect(() => {
    const fetchPeriods = async () => {
      if (!fixtureId) return;
      
      // First check if the fixture exists
      const { data: fixtureExists, error: fixtureError } = await supabase
        .from("fixtures")
        .select("id")
        .eq("id", fixtureId)
        .maybeSingle();

      if (fixtureError || !fixtureExists) {
        console.error("Fixture does not exist:", fixtureError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load fixture details",
        });
        return;
      }

      const { data: existingPeriods, error } = await supabase
        .from("fixture_playing_periods")
        .select("*")
        .eq("fixture_id", fixtureId)
        .order("start_minute", { ascending: true });

      if (error) {
        console.error("Error fetching periods:", error);
        return;
      }

      if (existingPeriods.length === 0) {
        try {
          // Create default periods if none exist
          const { data: newPeriod, error: insertError } = await supabase
            .from("fixture_playing_periods")
            .insert({
              fixture_id: fixtureId,
              start_minute: 0,
              duration_minutes: 20
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          setPeriods([newPeriod]);
        } catch (error) {
          console.error("Error creating period:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create playing period",
          });
        }
      } else {
        setPeriods(existingPeriods);
      }
    };

    if (fixtureId) {
      fetchPeriods();
    }
  }, [fixtureId, toast]);

  if (!fixture) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PrintTeamSelection
          fixture={fixture}
          periods={periods}
          players={players}
        />
      </div>

      {periods.map((period) => (
        <PeriodTable
          key={period.id}
          periods={[period]}
          positions={getPositionsForFormat(format)}
          players={players}
          format={format}
          onPositionChange={() => {}}
          onPlayerChange={() => {}}
          onSubstituteChange={() => {}}
          onDurationChange={() => {}}
          onRemovePeriod={() => {}}
        />
      ))}
    </div>
  );
};
