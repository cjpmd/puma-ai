
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FormationSelector } from "@/components/FormationSelector";
import { TeamSettingsHeader } from "@/components/formation/TeamSettingsHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface TeamPeriodCardProps {
  periodId: string;
  periodNumber: number;
  teamId: string;
  format: string;
  teamName: string;
  onSelectionChange: (periodId: string, teamId: string, selections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => void;
  selectedPlayers: Set<string>;
  availablePlayers: any[];
  initialSelections?: Record<string, { playerId: string; position: string; performanceCategory?: string }>;
  performanceCategory?: string;
  onDeletePeriod: (teamId: string, periodId: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

export const TeamPeriodCard = ({
  periodId,
  periodNumber,
  teamId,
  format,
  teamName,
  onSelectionChange,
  selectedPlayers,
  availablePlayers,
  initialSelections,
  performanceCategory = 'MESSI',
  onDeletePeriod,
  duration,
  onDurationChange
}: TeamPeriodCardProps) => {
  const [localDuration, setLocalDuration] = useState(duration);
  const [localPerformanceCategory, setLocalPerformanceCategory] = useState(performanceCategory);
  const [localSelections, setLocalSelections] = useState(initialSelections || {});

  // Update local state when props change
  useEffect(() => {
    setLocalDuration(duration);
    setLocalPerformanceCategory(performanceCategory);
    setLocalSelections(initialSelections || {});
  }, [duration, performanceCategory, initialSelections]);

  const handleDurationChange = (newDuration: string) => {
    const parsedDuration = parseInt(newDuration);
    setLocalDuration(parsedDuration);
    onDurationChange(parsedDuration);
  };

  const handleSelectionChange = (selections: Record<string, { playerId: string; position: string; performanceCategory?: string }>) => {
    const updatedSelections = Object.entries(selections).reduce((acc, [position, selection]) => {
      acc[position] = {
        ...selection,
        performanceCategory: localPerformanceCategory
      };
      return acc;
    }, {} as Record<string, { playerId: string; position: string; performanceCategory?: string }>);
    
    setLocalSelections(updatedSelections);
    onSelectionChange(periodId, teamId, updatedSelections);
  };

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3"
        onClick={() => onDeletePeriod(teamId, periodId)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Period {periodNumber}</span>
          <Select
            value={localPerformanceCategory}
            onValueChange={(value) => {
              setLocalPerformanceCategory(value);
              handleSelectionChange(localSelections);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MESSI">Messi</SelectItem>
              <SelectItem value="RONALDO">Ronaldo</SelectItem>
              <SelectItem value="JAGS">Jags</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TeamSettingsHeader
          duration={localDuration.toString()}
          onDurationChange={handleDurationChange}
        />
        <div className="min-h-[500px]">
          <FormationSelector
            format={format as "7-a-side"}
            teamName={teamName}
            onSelectionChange={handleSelectionChange}
            selectedPlayers={selectedPlayers}
            availablePlayers={availablePlayers}
            initialSelections={localSelections}
            performanceCategory={localPerformanceCategory}
          />
        </div>
      </CardContent>
    </Card>
  );
};
