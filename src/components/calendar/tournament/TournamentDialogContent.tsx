import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TournamentForm } from "./TournamentForm";
import { TournamentTeamSelection } from "./TournamentTeamSelection";

interface TeamSelection {
  playerId: string;
  position: string;
  is_substitute: boolean;
}

interface TournamentDialogContentProps {
  showTeamSelection: boolean;
  editingTournament?: any;
  selectedDate?: Date;
  onSubmit: (data: any) => Promise<void>;
  teams: Array<{ id: string; name: string; category: string }>;
  format: string;
  onTeamSelectionsChange: (selections: Record<string, TeamSelection[]>) => void;
}

export const TournamentDialogContent = ({
  showTeamSelection,
  editingTournament,
  selectedDate,
  onSubmit,
  teams,
  format,
  onTeamSelectionsChange,
}: TournamentDialogContentProps) => {
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingTournament ? (showTeamSelection ? 'Team Selection' : 'Edit Tournament') : 'Add New Tournament'}
        </DialogTitle>
        <DialogDescription>
          {showTeamSelection 
            ? "Select players for each team in the tournament."
            : "Fill in the tournament details below. All fields marked with * are required."}
        </DialogDescription>
      </DialogHeader>

      {!showTeamSelection ? (
        <TournamentForm
          onSubmit={onSubmit}
          editingTournament={editingTournament}
          selectedDate={selectedDate}
        />
      ) : (
        <TournamentTeamSelection
          teams={teams}
          format={format}
          onTeamSelectionsChange={onTeamSelectionsChange}
        />
      )}
    </DialogContent>
  );
};