import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { AddSessionDialog } from "@/components/training/AddSessionDialog";
import { AddFixtureDialog } from "@/components/calendar/AddFixtureDialog";
import { Plus, Trophy, Handshake, Users } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FixtureCard } from "@/components/calendar/FixtureCard";
import { SessionCard } from "@/components/training/SessionCard";
import { EditObjectiveDialog } from "@/components/calendar/EditObjectiveDialog";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Fixture } from "@/types/fixture";

export const CalendarPage = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [isAddFriendlyOpen, setIsAddFriendlyOpen] = useState(false);
  const [isAddTournamentOpen, setIsAddTournamentOpen] = useState(false);
  const [isAddFestivalOpen, setIsAddFestivalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [isEditObjectiveOpen, setIsEditObjectiveOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  
  const { toast } = useToast();

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ["training-sessions", date],
    queryFn: async () => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from("training_sessions")
        .select(`
          *,
          training_drills (
            *,
            training_files (*)
          )
        `)
        .eq("date", format(date, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data;
    },
  });

  const { data: fixtures, refetch: refetchFixtures } = useQuery({
    queryKey: ["fixtures", date],
    queryFn: async () => {
      if (!date) return [];
      
      const { data, error } = await supabase
        .from("fixtures")
        .select("*")
        .eq("date", format(date, "yyyy-MM-dd"))
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: objectives, refetch: refetchObjectives } = useQuery({
    queryKey: ["objectives", date],
    queryFn: async () => {
      if (!date) return [];
      
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      const { data, error } = await supabase
        .from('player_objectives')
        .select(`
          *,
          players (
            name
          ),
          profiles:coach_id (
            name
          )
        `)
        .gte('review_date', format(startDate, 'yyyy-MM-dd'))
        .lte('review_date', format(endDate, 'yyyy-MM-dd'))
        .order('review_date', { ascending: true });

      if (error) throw error;
      
      return data.filter(objective => 
        objective.review_date && 
        isSameMonth(parseISO(objective.review_date), date)
      );
    },
    enabled: !!date,
  });

  const handleDeleteFixture = async (fixtureId: string) => {
    try {
      const { error } = await supabase
        .from("fixtures")
        .delete()
        .eq("id", fixtureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fixture deleted successfully",
      });
      refetchFixtures();
    } catch (error) {
      console.error("Error deleting fixture:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete fixture",
      });
    }
  };

  const handleUpdateFixtureDate = async (fixtureId: string, newDate: Date) => {
    try {
      const { error } = await supabase
        .from("fixtures")
        .update({
          date: format(newDate, "yyyy-MM-dd"),
        })
        .eq("id", fixtureId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fixture date updated successfully",
      });
      refetchFixtures();
    } catch (error) {
      console.error("Error updating fixture date:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update fixture date",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Main Add Button */}
            <Button
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full bg-primary hover:bg-primary/90 transition-all duration-300",
                isAddMenuOpen && "rotate-45"
              )}
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            >
              <Plus className="h-6 w-6" />
            </Button>

            {/* Expanded Options */}
            <div className={cn(
              "absolute right-0 mt-2 space-y-2 transition-all duration-300",
              isAddMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-start bg-white hover:bg-primary/5"
                onClick={() => {
                  setIsAddFixtureOpen(true);
                  setIsAddMenuOpen(false);
                }}
              >
                <Trophy className="h-4 w-4" />
                Add Fixture
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-start bg-white hover:bg-primary/5"
                onClick={() => {
                  setIsAddFriendlyOpen(true);
                  setIsAddMenuOpen(false);
                }}
              >
                <Handshake className="h-4 w-4" />
                Add Friendly
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-start bg-white hover:bg-primary/5"
                onClick={() => {
                  setIsAddTournamentOpen(true);
                  setIsAddMenuOpen(false);
                }}
              >
                <Trophy className="h-4 w-4" />
                Add Tournament
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-start bg-white hover:bg-primary/5"
                onClick={() => {
                  setIsAddFestivalOpen(true);
                  setIsAddMenuOpen(false);
                }}
              >
                <Users className="h-4 w-4" />
                Add Festival
              </Button>
            </div>
          </div>
          <Link to="/fixtures">
            <Button variant="secondary">
              View Fixtures
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Training</span>
                <div className="w-3 h-3 rounded bg-orange-500 ml-4"></div>
                <span>Fixture</span>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border"
                weekStartsOn={1}
                modifiers={{
                  training: (day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    return sessions?.some(session => session.date === dateStr) || false;
                  },
                  fixture: (day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    return fixtures?.some(fixture => fixture.date === dateStr) || false;
                  }
                }}
                modifiersStyles={{
                  training: {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  },
                  fixture: {
                    backgroundColor: 'rgba(249, 115, 22, 0.1)'
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fixtures?.map((fixture) => (
                <FixtureCard 
                  key={fixture.id} 
                  fixture={fixture}
                  onEdit={(fixture) => {
                    setEditingFixture(fixture);
                    setIsAddFixtureOpen(true);
                  }}
                  onDelete={handleDeleteFixture}
                  onDateChange={(newDate) => handleUpdateFixtureDate(fixture.id, newDate)}
                />
              ))}
              {sessions?.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={{
                    id: session.id,
                    title: session.title,
                    drills: session.training_drills.map(drill => ({
                      id: drill.id,
                      title: drill.title,
                      instructions: drill.instructions,
                      training_files: drill.training_files
                    }))
                  }}
                  onDeleteSession={() => {}}
                />
              ))}
              {(!sessions?.length && !fixtures?.length) && (
                <div className="text-center py-8 text-muted-foreground">
                  No events scheduled for this date
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Objectives Section */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Objectives for {date ? format(date, 'MMMM yyyy') : 'Selected Month'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {objectives?.map((objective) => (
                <div 
                  key={objective.id} 
                  className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setEditingObjective(objective);
                    setIsEditObjectiveOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{objective.title}</h4>
                      <p className="text-sm text-muted-foreground">{objective.description}</p>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Player: {objective.players?.name}</span>
                        <span className="mx-2">•</span>
                        <span>Coach: {objective.profiles?.name}</span>
                        <span className="mx-2">•</span>
                        <span>Review: {format(new Date(objective.review_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        objective.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                        objective.status === 'IMPROVING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {objective.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {objectives?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No objectives scheduled for review this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddFixtureOpen} onOpenChange={setIsAddFixtureOpen}>
        <AddFixtureDialog 
          isOpen={isAddFixtureOpen}
          onOpenChange={setIsAddFixtureOpen}
          selectedDate={date}
          onSuccess={() => {
            refetchFixtures();
            setIsAddFixtureOpen(false);
            setEditingFixture(null);
          }}
          editingFixture={editingFixture}
        />
      </Dialog>

      <Dialog open={isAddFriendlyOpen} onOpenChange={setIsAddFriendlyOpen}>
        <AddFixtureDialog 
          isOpen={isAddFriendlyOpen}
          onOpenChange={setIsAddFriendlyOpen}
          selectedDate={date}
          onSuccess={() => {
            refetchFixtures();
            setIsAddFriendlyOpen(false);
          }}
          showDateSelector
        />
      </Dialog>
    </div>
  );
};