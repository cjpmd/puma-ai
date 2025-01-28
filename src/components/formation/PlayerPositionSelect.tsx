import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PlayerPositionSelectProps {
  slotId: string;
  position: string;
  playerId: string;
  positionDefinitions?: any[];
  availablePlayers?: Array<{ id: string; name: string; squad_number?: number }>;
  onSelectionChange: (playerId: string, position: string) => void;
  selectedPlayers: Set<string>;
}

export const PlayerPositionSelect = ({
  slotId,
  position,
  playerId,
  positionDefinitions = [],
  availablePlayers = [],
  onSelectionChange,
  selectedPlayers,
}: PlayerPositionSelectProps) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Position</Label>
          <Select 
            value={position || "unassigned"} 
            onValueChange={(value) => onSelectionChange(playerId, value)}
          >
            <SelectTrigger className="text-left h-9">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">None</SelectItem>
              {positionDefinitions?.map(pos => (
                <SelectItem key={pos.id} value={pos.abbreviation.toLowerCase()}>
                  {pos.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Player</Label>
          <Select 
            value={playerId} 
            onValueChange={(value) => onSelectionChange(value, position)}
          >
            <SelectTrigger className="text-left h-9">
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">None</SelectItem>
              {availablePlayers?.map(player => (
                <SelectItem 
                  key={player.id} 
                  value={player.id}
                  className={cn(
                    selectedPlayers.has(player.id) && player.id !== playerId && "opacity-50"
                  )}
                >
                  {player.name} {player.squad_number ? `(${player.squad_number})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};