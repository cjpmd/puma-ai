import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FestivalForm } from "./FestivalForm";
import { TeamSelectionManager } from "@/components/TeamSelectionManager";
import { useToast } from "@/hooks/use-toast";

interface TeamSelection {
  playerId: string;
  position: string;
  is_substitute: boolean;
  performanceCategory?: string;
}

interface FestivalDialogContentProps {
  showTeamSelection: boolean;
  editingFestival?: any;
  selectedDate?: Date;
  onSubmit: (data: any) => Promise<void>;
  teams: Array<{ id: string; name: string; category: string }>;
  format: string;
  onTeamSelectionsChange: (selections: Record<string, TeamSelection[]>) => void;
}

export const FestivalDialogContent = ({
  showTeamSelection,
  editingFestival,
  selectedDate,
  onSubmit,
  teams,
  format,
  onTeamSelectionsChange,
}: FestivalDialogContentProps) => {
  const { toast } = useToast();

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingFestival 
            ? (showTeamSelection ? 'Team Selection' : 'Edit Festival') 
            : 'Add New Festival'}
        </DialogTitle>
        <DialogDescription>
          {showTeamSelection 
            ? "Select players for each team in the festival."
            : "Fill in the festival details below. All fields marked with * are required."}
        </DialogDescription>
      </DialogHeader>

      {!showTeamSelection ? (
        <FestivalForm
          onSubmit={onSubmit}
          editingFestival={editingFestival}
          selectedDate={selectedDate}
        />
      ) : (
        <div className="space-y-6">
          <TeamSelectionManager
            teams={teams}
            format={format}
            onTeamSelectionsChange={(selections) => {
              try {
                const formattedSelections = Object.entries(selections).reduce<Record<string, TeamSelection[]>>(
                  (acc, [teamId, teamSelections]) => {
                    acc[teamId] = Object.entries(teamSelections).map(([_, selection]) => ({
                      playerId: selection.playerId,
                      position: selection.position,
                      is_substitute: selection.position.startsWith('sub-'),
                      performanceCategory: selection.performanceCategory || 'MESSI'
                    }));
                    return acc;
                  }, 
                  {}
                );
                onTeamSelectionsChange(formattedSelections);
              } catch (error) {
                console.error('Error formatting team selections:', error);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to update team selections",
                });
              }
            }}
          />
        </div>
      )}
    </DialogContent>
  );
};