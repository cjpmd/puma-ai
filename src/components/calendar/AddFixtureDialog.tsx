import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamSelectionManager } from "@/components/fixtures/TeamSelectionManager";

const formSchema = z.object({
  opponent: z.string().min(1, "Opponent name is required"),
  location: z.string().optional(),
  category: z.enum(["Ronaldo", "Messi", "Jags"]),
  home_score: z.string().optional(),
  away_score: z.string().optional(),
  motm_player_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddFixtureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess: () => void;
  editingFixture?: {
    id: string;
    opponent: string;
    home_score: number | null;
    away_score: number | null;
    category?: string;
    location?: string;
    motm_player_id?: string | null;
  } | null;
}

export const AddFixtureDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedDate,
  onSuccess,
  editingFixture 
}: AddFixtureDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(editingFixture?.category || "Ronaldo");
  
  const { data: players } = useQuery({
    queryKey: ["players", selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .eq("player_category", selectedCategory);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      opponent: editingFixture?.opponent || "",
      location: editingFixture?.location || "",
      category: (editingFixture?.category as "Ronaldo" | "Messi" | "Jags") || "Ronaldo",
      home_score: editingFixture?.home_score?.toString() || "",
      away_score: editingFixture?.away_score?.toString() || "",
      motm_player_id: editingFixture?.motm_player_id || "none",
    },
  });

  // Update form when editing fixture changes
  useEffect(() => {
    if (editingFixture) {
      form.reset({
        opponent: editingFixture.opponent,
        location: editingFixture.location || "",
        category: (editingFixture.category as "Ronaldo" | "Messi" | "Jags") || "Ronaldo",
        home_score: editingFixture.home_score?.toString() || "",
        away_score: editingFixture.away_score?.toString() || "",
        motm_player_id: editingFixture.motm_player_id || "none",
      });
      setSelectedCategory(editingFixture.category || "Ronaldo");
    }
  }, [editingFixture, form]);

  const onSubmit = async (data: FormData) => {
    try {
      if (!selectedDate) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a date",
        });
        return;
      }

      const fixtureData = {
        opponent: data.opponent,
        location: data.location,
        category: data.category,
        date: format(selectedDate, "yyyy-MM-dd"),
        home_score: data.home_score ? parseInt(data.home_score) : null,
        away_score: data.away_score ? parseInt(data.away_score) : null,
        motm_player_id: data.motm_player_id === "none" ? null : data.motm_player_id,
      };

      if (editingFixture) {
        await supabase
          .from("fixtures")
          .update(fixtureData)
          .eq("id", editingFixture.id);
        setShowTeamSelection(true);
      } else {
        const { data: newFixture } = await supabase
          .from("fixtures")
          .insert([fixtureData])
          .select()
          .single();
          
        if (newFixture) {
          setShowTeamSelection(true);
        }
      }

      onSuccess();
      if (!showTeamSelection) {
        form.reset();
        onOpenChange(false);
      }
      toast({
        title: "Success",
        description: editingFixture 
          ? "Fixture updated successfully" 
          : "Fixture added successfully",
      });
    } catch (error) {
      console.error("Error adding fixture:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save fixture",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editingFixture ? "Edit Fixture" : "Add New Fixture"}</DialogTitle>
        </DialogHeader>
        
        {!showTeamSelection ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                        // Reset MOTM when category changes
                        form.setValue("motm_player_id", "none");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ronaldo">Ronaldo</SelectItem>
                        <SelectItem value="Messi">Messi</SelectItem>
                        <SelectItem value="Jags">Jags</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="home_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puma Score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="away_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent Score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="motm_player_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Man of the Match</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {players?.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {editingFixture ? "Save Changes" : "Add Fixture"}
              </Button>
            </form>
          </Form>
        ) : (
          <TeamSelectionManager 
            fixtureId={editingFixture?.id || ""} 
            category={form.getValues("category")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};