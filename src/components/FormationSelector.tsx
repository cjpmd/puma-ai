import { useState, useEffect } from "react";
import { PlayerPositionSelect } from "./formation/PlayerPositionSelect";
import { SubstitutesList } from "./formation/SubstitutesList";
import { TeamSettingsHeader } from "./formation/TeamSettingsHeader";

interface FormationSelectorProps {
  format: "4-a-side" | "5-a-side" | "7-a-side" | "9-a-side" | "11-a-side";
  teamName: string;
  onSelectionChange: (selections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => void;
  selectedPlayers: Set<string>;
  availablePlayers: Array<{
    id: string;
    name: string;
    squad_number?: number;
  }>;
}

export const FormationSelector = ({
  format,
  teamName,
  onSelectionChange,
  selectedPlayers,
  availablePlayers,
}: FormationSelectorProps) => {
  const [positions, setPositions] = useState<Array<{ id: string; position: string }>>([]);
  const [selections, setSelections] = useState<Record<string, { playerId: string; position: string; performanceCategory?: string }>>({});

  useEffect(() => {
    // Initialize positions based on the format with unique IDs
    const getPositionsForFormat = (format: string) => {
      switch (format) {
        case "4-a-side":
          return [
            { id: "pos-1", position: "GK" },
            { id: "pos-2", position: "DEF" },
            { id: "pos-3", position: "MID" },
            { id: "pos-4", position: "FWD" }
          ];
        case "5-a-side":
          return [
            { id: "pos-1", position: "GK" },
            { id: "pos-2", position: "DEF" },
            { id: "pos-3", position: "DEF" },
            { id: "pos-4", position: "MID" },
            { id: "pos-5", position: "FWD" }
          ];
        case "7-a-side":
          return [
            { id: "pos-1", position: "GK" },
            { id: "pos-2", position: "DEF" },
            { id: "pos-3", position: "DEF" },
            { id: "pos-4", position: "MID" },
            { id: "pos-5", position: "MID" },
            { id: "pos-6", position: "FWD" },
            { id: "pos-7", position: "FWD" }
          ];
        case "9-a-side":
          return [
            { id: "pos-1", position: "GK" },
            { id: "pos-2", position: "DEF" },
            { id: "pos-3", position: "DEF" },
            { id: "pos-4", position: "MID" },
            { id: "pos-5", position: "MID" },
            { id: "pos-6", position: "MID" },
            { id: "pos-7", position: "FWD" },
            { id: "pos-8", position: "FWD" },
            { id: "pos-9", position: "FWD" }
          ];
        case "11-a-side":
          return [
            { id: "pos-1", position: "GK" },
            { id: "pos-2", position: "DEF" },
            { id: "pos-3", position: "DEF" },
            { id: "pos-4", position: "DEF" },
            { id: "pos-5", position: "MID" },
            { id: "pos-6", position: "MID" },
            { id: "pos-7", position: "MID" },
            { id: "pos-8", position: "FWD" },
            { id: "pos-9", position: "FWD" },
            { id: "pos-10", position: "FWD" },
            { id: "pos-11", position: "FWD" }
          ];
        default:
          return [];
      }
    };

    setPositions(getPositionsForFormat(format));
  }, [format]);

  const handlePlayerSelection = (positionId: string, playerId: string) => {
    const position = positions.find(p => p.id === positionId)?.position || "";
    const newSelections = {
      ...selections,
      [positionId]: { playerId, position, performanceCategory: "MESSI" },
    };
    setSelections(newSelections);
    onSelectionChange(newSelections);
  };

  return (
    <div className="space-y-6">
      <TeamSettingsHeader 
        captain=""
        duration="90"
        onCaptainChange={() => {}}
        onDurationChange={() => {}}
        availablePlayers={availablePlayers}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map(({ id, position }) => (
          <PlayerPositionSelect
            key={id}
            slotId={id}
            position={position}
            playerId={selections[id]?.playerId || "unassigned"}
            availablePlayers={availablePlayers}
            onSelectionChange={(playerId) => handlePlayerSelection(id, playerId)}
            selectedPlayers={selectedPlayers}
          />
        ))}
      </div>

      <SubstitutesList
        maxSubstitutes={5}
        selections={selections}
        availablePlayers={availablePlayers}
        onSelectionChange={(slotId, playerId) => handlePlayerSelection(slotId, playerId)}
        selectedPlayers={selectedPlayers}
      />
    </div>
  );
};