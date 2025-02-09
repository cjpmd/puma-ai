import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeamSelectionManager } from "@/components/fixtures/TeamSelectionManager";
import { FixtureForm } from "@/components/fixtures/FixtureForm";
import { sendFixtureNotification } from "@/components/fixtures/FixtureNotification";
import { Fixture } from "@/types/fixture";

interface AddFixtureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess: () => void;
  editingFixture?: Fixture | null;
  showDateSelector?: boolean;
}

export const AddFixtureDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedDate: initialSelectedDate,
  onSuccess,
  editingFixture,
  showDateSelector = false
}: AddFixtureDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate);
  const [newFixture, setNewFixture] = useState<Fixture | null>(null);

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, squad_number")
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      if (!selectedDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a date",
        });
        return;
      }

      let outcome: string | null = null;
      if (data.home_score && data.away_score) {
        const homeScore = parseInt(data.home_score);
        const awayScore = parseInt(data.away_score);
        if (homeScore > awayScore) {
          outcome = 'WIN';
        } else if (homeScore === awayScore) {
          outcome = 'DRAW';
        } else {
          outcome = 'LOSS';
        }
      }

      const fixtureData = {
        opponent: data.opponent,
        location: data.location,
        team_name: "Broughty Pumas 2015s",
        date: format(selectedDate, "yyyy-MM-dd"),
        home_score: data.home_score ? parseInt(data.home_score) : null,
        away_score: data.away_score ? parseInt(data.away_score) : null,
        motm_player_id: data.motm_player_id || null,
        time: data.time || null,
        outcome,
        format: data.format || "7-a-side",
        number_of_teams: parseInt(data.number_of_teams) || 1,
        is_home: data.is_home,
        meeting_time: data.meeting_time || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
      };

      let savedFixture: Fixture;
      
      if (editingFixture) {
        const { error } = await supabase
          .from("fixtures")
          .update(fixtureData)
          .eq("id", editingFixture.id);
          
        if (error) throw error;
        savedFixture = { ...editingFixture, ...fixtureData } as Fixture;
      } else {
        const { data: insertedFixture, error } = await supabase
          .from("fixtures")
          .insert(fixtureData)
          .select()
          .single();
          
        if (error) throw error;
        savedFixture = insertedFixture;
        setNewFixture(savedFixture);

        try {
          await sendFixtureNotification({
            type: 'FIXTURE',
            date: format(selectedDate, "dd/MM/yyyy"),
            time: data.time,
            opponent: data.opponent,
            location: data.location,
            category: data.category
          });
        } catch (notificationError) {
          console.error('Error sending WhatsApp notification:', notificationError);
          toast({
            title: "Warning",
            description: "Fixture created but there was an error sending notifications",
            variant: "destructive",
          });
        }
      }

      onSuccess();
      if (!showTeamSelection) {
        onOpenChange(false);
      }
      toast({
        title: "Success",
        description: editingFixture 
          ? "Fixture updated successfully" 
          : "Fixture added successfully",
      });
    } catch (error) {
      console.error("Error saving fixture:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save fixture",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingFixture ? "Edit Fixture" : "Add New Fixture"}</DialogTitle>
          <DialogDescription>
            Fill in the fixture details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        {!showTeamSelection ? (
          <FixtureForm
            onSubmit={onSubmit}
            selectedDate={selectedDate}
            editingFixture={editingFixture}
            players={players}
            isSubmitting={isSubmitting}
            showDateSelector={showDateSelector}
          />
        ) : (
          <TeamSelectionManager 
            fixture={editingFixture || newFixture} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
