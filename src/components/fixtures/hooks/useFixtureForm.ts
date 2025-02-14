
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FixtureFormData } from "../schemas/fixtureFormSchema";

interface UseFixtureFormProps {
  onSubmit: (data: FixtureFormData) => void;
  editingFixture?: any;
  selectedDate?: Date;
}

export const useFixtureForm = ({ onSubmit, editingFixture, selectedDate }: UseFixtureFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FixtureFormData) => {
    setIsSubmitting(true);
    try {
      const dateToUse = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      console.log("Using date:", dateToUse);

      const fixtureData = {
        opponent: data.opponent,
        location: data.location,
        team_name: data.team_name,
        format: data.format,
        number_of_teams: parseInt(data.number_of_teams || "1"),
        is_home: data.is_home,
        home_score: data.home_score ? parseInt(data.home_score) : null,
        away_score: data.away_score ? parseInt(data.away_score) : null,
        date: dateToUse,
        potm_player_id: data.motm_player_ids?.[0] || null
      };

      console.log("Saving fixture with data:", fixtureData);

      let fixtureResult;
      
      if (editingFixture?.id) {
        fixtureResult = await supabase
          .from('fixtures')
          .update(fixtureData)
          .eq('id', editingFixture.id)
          .select('*')
          .single();
      } else {
        fixtureResult = await supabase
          .from('fixtures')
          .insert(fixtureData)
          .select('*')
          .single();
      }

      if (fixtureResult.error) {
        console.error("Error saving fixture:", fixtureResult.error);
        throw fixtureResult.error;
      }

      console.log("Fixture saved successfully:", fixtureResult.data);
      
      const fixtureId = fixtureResult.data.id;

      if (fixtureId) {
        // Insert team times if provided
        if (data.team_times && data.team_times.length > 0) {
          const teamTimesData = data.team_times.map((teamTime, index) => ({
            fixture_id: fixtureId,
            team_number: index + 1,
            meeting_time: teamTime.meeting_time || null,
            start_time: teamTime.start_time || null,
            end_time: teamTime.end_time || null,
            performance_category: teamTime.performance_category || "MESSI"
          }));

          console.log("Saving team times:", teamTimesData);

          const { data: teamTimesResult, error: teamTimesError } = await supabase
            .from('fixture_team_times')
            .upsert(teamTimesData)
            .select();

          if (teamTimesError) {
            console.error("Error saving team times:", teamTimesError);
            throw teamTimesError;
          }

          console.log("Team times saved:", teamTimesResult);
        }

        // Insert scores if provided
        if (data.home_score || data.away_score) {
          const scoresData = [
            {
              fixture_id: fixtureId,
              team_number: 1,
              score: parseInt(data.home_score) || 0
            },
            {
              fixture_id: fixtureId,
              team_number: 2,
              score: parseInt(data.away_score) || 0
            }
          ];

          console.log("Saving team scores:", scoresData);

          const { data: scoresResult, error: scoresError } = await supabase
            .from('fixture_team_scores')
            .upsert(scoresData)
            .select();

          if (scoresError) {
            console.error("Error saving team scores:", scoresError);
            throw scoresError;
          }

          console.log("Team scores saved:", scoresResult);
        }

        // Create default event attendance entries for all players
        const { data: attendanceResult, error: attendanceError } = await supabase
          .from('event_attendance')
          .insert({
            event_id: fixtureId,
            event_type: 'FIXTURE',
            status: 'PENDING'
          })
          .select();

        if (attendanceError) {
          console.error("Error creating attendance:", attendanceError);
          throw attendanceError;
        }

        console.log("Attendance created:", attendanceResult);

        const savedFixture = {
          ...fixtureResult.data,
          ...data,
          id: fixtureId
        };

        await onSubmit(savedFixture);
        
        toast({
          title: "Success",
          description: editingFixture ? "Fixture updated successfully" : "Fixture created successfully",
        });
        
        return savedFixture;
      }
    } catch (error) {
      console.error("Error saving fixture:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save fixture",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
