import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlayerPositionSelect } from "./formation/PlayerPositionSelect";
import { TeamSettingsHeader } from "./formation/TeamSettingsHeader";
import { SubstitutesList } from "./formation/SubstitutesList";
import { cn } from "@/lib/utils";

interface FormationSelectorProps {
  format: "5-a-side" | "7-a-side" | "9-a-side" | "11-a-side";
  teamName: string;
  onSelectionChange: (selections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => void;
  selectedPlayers: Set<string>;
  availablePlayers?: Array<{ id: string; name: string; squad_number?: number }>;
}

export const FormationSelector = ({
  format,
  teamName,
  onSelectionChange,
  selectedPlayers,
  availablePlayers: initialPlayers,
}: FormationSelectorProps) => {
  const [selections, setSelections] = useState<Record<string, { playerId: string; position: string; performanceCategory?: string }>>({});

  // Fetch players if not provided
  const { data: fetchedPlayers } = useQuery({
    queryKey: ["available-players", teamName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, squad_number")
        .eq("team_category", teamName)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !initialPlayers,
  });

  // Use provided players or fetched players
  const players = initialPlayers || fetchedPlayers || [];

  console.log("Available players:", players); // Debug log

  const handlePlayerSelection = (slotId: string, playerId: string) => {
    const position = slotId.split("-")[0].toUpperCase();
    setSelections((prev) => {
      const newSelections = {
        ...prev,
        [slotId]: {
          ...prev[slotId],
          playerId,
          position,
        },
      };
      onSelectionChange(newSelections);
      return newSelections;
    });
  };

  const getFormationSlots = () => {
    switch (format) {
      case "5-a-side":
        return [
          { id: "gk-1", label: "GK", className: "col-span-5" },
          { id: "def-1", label: "DEF", className: "col-span-5" },
          { id: "mid-1", label: "MID", className: "col-start-2 col-span-3" },
          { id: "str-1", label: "STR", className: "col-start-3" },
        ];
      case "7-a-side":
        return [
          { id: "gk-1", label: "GK", className: "col-span-5" },
          { id: "def-1", label: "DEF", className: "col-start-2" },
          { id: "def-2", label: "DEF", className: "col-start-4" },
          { id: "mid-1", label: "MID", className: "col-start-2" },
          { id: "mid-2", label: "MID", className: "col-start-4" },
          { id: "str-1", label: "STR", className: "col-start-3" },
        ];
      case "9-a-side":
        return [
          { id: "gk-1", label: "GK", className: "col-span-5" },
          { id: "def-1", label: "DEF", className: "col-start-2" },
          { id: "def-2", label: "DEF", className: "col-start-3" },
          { id: "def-3", label: "DEF", className: "col-start-4" },
          { id: "mid-1", label: "MID", className: "col-start-2" },
          { id: "mid-2", label: "MID", className: "col-start-3" },
          { id: "mid-3", label: "MID", className: "col-start-4" },
          { id: "str-1", label: "STR", className: "col-start-3" },
        ];
      case "11-a-side":
        return [
          { id: "gk-1", label: "GK", className: "col-span-5" },
          { id: "def-1", label: "DEF", className: "col-start-1" },
          { id: "def-2", label: "DEF", className: "col-start-2" },
          { id: "def-3", label: "DEF", className: "col-start-3" },
          { id: "def-4", label: "DEF", className: "col-start-4" },
          { id: "mid-1", label: "MID", className: "col-start-2" },
          { id: "mid-2", label: "MID", className: "col-start-3" },
          { id: "mid-3", label: "MID", className: "col-start-4" },
          { id: "str-1", label: "STR", className: "col-start-2" },
          { id: "str-2", label: "STR", className: "col-start-3" },
        ];
      default:
        return [];
    }
  };

  const maxSubstitutes = {
    "5-a-side": 3,
    "7-a-side": 3,
    "9-a-side": 4,
    "11-a-side": 5,
  }[format];

  return (
    <div className="space-y-8">
      <TeamSettingsHeader />
      
      <div className="grid grid-cols-5 gap-4">
        {getFormationSlots().map((slot) => (
          <div key={slot.id} className={cn("space-y-2", slot.className)}>
            <PlayerPositionSelect
              key={slot.id}
              slotId={slot.id}
              position={slot.label}
              playerId={selections[slot.id]?.playerId || "unassigned"}
              availablePlayers={players}
              onSelectionChange={(playerId) => handlePlayerSelection(slot.id, playerId)}
              selectedPlayers={selectedPlayers}
            />
          </div>
        ))}
      </div>

      <SubstitutesList
        maxSubstitutes={maxSubstitutes}
        selections={selections}
        availablePlayers={players}
        onSelectionChange={handlePlayerSelection}
        selectedPlayers={selectedPlayers}
      />
    </div>
  );
};