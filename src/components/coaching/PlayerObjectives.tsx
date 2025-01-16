import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@supabase/auth-helpers-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditObjectiveDialog } from "../calendar/EditObjectiveDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlayerObjectivesProps {
  playerId: string;
}

export const PlayerObjectives = ({ playerId }: PlayerObjectivesProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("5");
  const [reviewDate, setReviewDate] = useState<Date>();
  const [isSaving, setIsSaving] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [deleteObjectiveId, setDeleteObjectiveId] = useState<string | null>(null);
  const { toast } = useToast();
  const session = useSession();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) {
        console.error('Profile error:', error);
        return null;
      }
      return data;
    },
    enabled: !!session?.user,
  });

  const { data: objectives, refetch } = useQuery({
    queryKey: ["player-objectives", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_objectives')
        .select(`
          *,
          profiles:coach_id (
            name
          )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching objectives:', error);
        throw error;
      }
      return data;
    },
  });

  const handleAddObjective = async () => {
    setIsSaving(true);
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add objectives.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    if (!reviewDate) {
      toast({
        title: "Error",
        description: "Please select a review date.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('player_objectives')
        .insert([
          {
            player_id: playerId,
            coach_id: profile.id,
            title,
            description,
            points: parseInt(points),
            status: 'ONGOING',
            review_date: format(reviewDate, 'yyyy-MM-dd')
          }
        ]);

      if (error) throw error;

      setTimeout(() => {
        setTitle("");
        setDescription("");
        setPoints("5");
        setReviewDate(undefined);
        setIsSaving(false);
        refetch();
      }, 1000);
      
      toast({
        title: "Success",
        description: "New objective has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding objective:', error);
      toast({
        title: "Error",
        description: "Failed to add objective. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleDeleteObjective = async () => {
    if (!deleteObjectiveId) return;

    try {
      const { error } = await supabase
        .from('player_objectives')
        .delete()
        .eq('id', deleteObjectiveId);

      if (error) throw error;

      refetch();
      setDeleteObjectiveId(null);
      
      toast({
        title: "Success",
        description: "Objective deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: "Failed to delete objective.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Objectives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="Objective title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Objective description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
              max="20"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !reviewDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reviewDate ? format(reviewDate, "PPP") : <span>Pick a review date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reviewDate}
                  onSelect={setReviewDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              onClick={handleAddObjective} 
              disabled={!title.trim() || !profile?.id || !reviewDate || isSaving}
              className={`transition-all ${isSaving ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Saved!
                </span>
              ) : (
                'Add Objective'
              )}
            </Button>
          </div>

          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="space-y-4 pr-4">
              {objectives?.map((objective) => (
                <div 
                  key={objective.id} 
                  className="p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-accent/5"
                  onClick={() => setEditingObjective(objective)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{objective.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{objective.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Added by {objective.profiles?.name || 'Anonymous Coach'}</span>
                        <span>•</span>
                        <span>Created: {format(new Date(objective.created_at), 'MMM d, yyyy')}</span>
                        {objective.review_date && (
                          <>
                            <span>•</span>
                            <span>Review on: {format(new Date(objective.review_date), 'MMM d, yyyy')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{objective.points} points</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteObjectiveId(objective.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <Select
                      value={objective.status}
                      onValueChange={(value) => {
                        const updatedObjective = { ...objective, status: value };
                        setEditingObjective(updatedObjective);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                        <SelectItem value="IMPROVING">Improving</SelectItem>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      {editingObjective && (
        <EditObjectiveDialog
          objective={editingObjective}
          isOpen={!!editingObjective}
          onOpenChange={(open) => !open && setEditingObjective(null)}
          onSuccess={() => {
            setEditingObjective(null);
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deleteObjectiveId} onOpenChange={() => setDeleteObjectiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the objective.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteObjective}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
