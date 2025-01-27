import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TeamSelectionManager } from "../TeamSelectionManager";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FestivalFormFields, formSchema, FormData } from "./FestivalFormFields";
import type { Database } from "@/integrations/supabase/types";

type Festival = Database["public"]["Tables"]["festivals"]["Insert"];

interface AddFestivalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess: () => void;
  editingFestival?: any;
}

export const AddFestivalDialog = ({
  isOpen,
  onOpenChange,
  selectedDate,
  onSuccess,
  editingFestival,
}: AddFestivalDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [festivalId, setFestivalId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; category: string }>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: editingFestival?.date ? new Date(editingFestival.date) : selectedDate || new Date(),
      format: editingFestival?.format || "7-a-side",
      numberOfTeams: editingFestival?.number_of_teams || 2,
      location: editingFestival?.location || "",
      startTime: editingFestival?.start_time || "",
      endTime: editingFestival?.end_time || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const festivalData: Festival = {
        date: format(data.date, "yyyy-MM-dd"),
        start_time: data.startTime || null,
        end_time: data.endTime || null,
        location: data.location || null,
        format: data.format,
        number_of_teams: data.numberOfTeams,
        system_category: "FESTIVAL",
      };

      let festival;
      if (editingFestival) {
        const { data: updatedFestival, error } = await supabase
          .from("festivals")
          .update(festivalData)
          .eq("id", editingFestival.id)
          .select()
          .single();

        if (error) throw error;
        festival = updatedFestival;
      } else {
        const { data: newFestival, error } = await supabase
          .from("festivals")
          .insert(festivalData)
          .select()
          .single();

        if (error) throw error;
        festival = newFestival;
      }

      // Fetch existing teams for the festival
      const { data: existingTeams } = await supabase
        .from("festival_teams")
        .select("*")
        .eq("festival_id", festival.id);

      // Create new teams if needed
      if (!existingTeams || existingTeams.length === 0) {
        const teamPromises = Array.from({ length: data.numberOfTeams }, (_, i) => 
          supabase
            .from("festival_teams")
            .insert({
              festival_id: festival.id,
              team_name: `Team ${i + 1}`,
            })
            .select()
        );

        const teamResults = await Promise.all(teamPromises);
        const createdTeams = teamResults
          .map(result => result.data?.[0])
          .filter((team): team is NonNullable<typeof team> => team !== null)
          .map(team => ({
            id: team.id,
            name: team.team_name,
            category: team.category || "",
          }));

        setTeams(createdTeams);
      } else {
        setTeams(existingTeams.map(team => ({
          id: team.id,
          name: team.team_name,
          category: team.category || "",
        })));
      }

      setFestivalId(festival.id);
      setShowTeamSelection(true);

      // Invalidate and refetch calendar data
      queryClient.invalidateQueries({ queryKey: ["festivals"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-data"] });

      toast({
        title: "Success",
        description: `Festival ${editingFestival ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error("Error saving festival:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save festival",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingFestival ? 'Edit' : 'Add New'} Festival</DialogTitle>
          <DialogDescription>
            Fill in the festival details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        {!showTeamSelection ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FestivalFormFields form={form} />
              <Button type="submit" className="w-full">
                Save and Continue to Team Selection
              </Button>
            </form>
          </Form>
        ) : (
          <TeamSelectionManager
            teams={teams}
            format={form.getValues("format")}
            onTeamSelectionsChange={(selections) => {
              console.log("Team selections:", selections);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};