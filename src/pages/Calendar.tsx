import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AddSessionDialog } from "@/components/training/AddSessionDialog";
import { AddFixtureDialog } from "@/components/calendar/AddFixtureDialog";
import { Dialog } from "@/components/ui/dialog";
import { EditObjectiveDialog } from "@/components/calendar/EditObjectiveDialog";
import { AddEventMenu } from "@/components/calendar/AddEventMenu";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ObjectivesList } from "@/components/calendar/ObjectivesList";
import { DailyEvents } from "@/components/calendar/DailyEvents";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useCalendarEventHandlers } from "@/components/calendar/CalendarEventHandlers";
import { Fixture } from "@/types/fixture";
import { AddFestivalDialog } from "@/components/calendar/AddFestivalDialog";

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
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const { 
    sessions, 
    fixtures, 
    festivals,
    tournaments,
    objectives,
    refetchSessions,
    refetchFixtures,
    refetchFestivals,
    refetchTournaments,
    refetchObjectives 
  } = useCalendarData(date);

  const {
    handleDeleteFixture,
    handleUpdateFixtureDate,
    handleDeleteSession
  } = useCalendarEventHandlers();

  const handleAddDrill = (sessionId: string) => {
    console.log("Adding drill to session:", sessionId);
  };

  const handleEditDrill = (sessionId: string, drill: any) => {
    console.log("Editing drill:", drill, "in session:", sessionId);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <AddEventMenu
            isOpen={isAddMenuOpen}
            onOpenChange={setIsAddMenuOpen}
            onAddFixture={() => setIsAddFixtureOpen(true)}
            onAddFriendly={() => setIsAddFriendlyOpen(true)}
            onAddTournament={() => setIsAddTournamentOpen(true)}
            onAddFestival={() => setIsAddFestivalOpen(true)}
          />
          <Link to="/fixtures">
            <Button variant="secondary">
              View Fixtures
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CalendarView
          date={date}
          onDateSelect={(newDate) => newDate && setDate(newDate)}
          sessions={sessions}
          fixtures={fixtures}
          festivals={festivals}
          tournaments={tournaments}
        />

        <DailyEvents
          date={date}
          fixtures={fixtures || []}
          sessions={sessions || []}
          festivals={festivals || []}
          tournaments={tournaments || []}
          fileUrls={fileUrls}
          onEditFixture={(fixture) => {
            setEditingFixture(fixture);
            setIsAddFixtureOpen(true);
          }}
          onDeleteFixture={async (fixtureId) => {
            const success = await handleDeleteFixture(fixtureId);
            if (success) refetchFixtures();
          }}
          onUpdateFixtureDate={async (fixtureId, newDate) => {
            const success = await handleUpdateFixtureDate(fixtureId, newDate);
            if (success) refetchFixtures();
          }}
          onAddDrill={handleAddDrill}
          onEditDrill={handleEditDrill}
          onDeleteSession={async (sessionId) => {
            const success = await handleDeleteSession(sessionId);
            if (success) refetchSessions();
          }}
        />

        <ObjectivesList
          date={date}
          objectives={objectives || []}
          onEditObjective={(objective) => {
            setEditingObjective(objective);
            setIsEditObjectiveOpen(true);
          }}
        />
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

      <Dialog open={isAddFestivalOpen} onOpenChange={setIsAddFestivalOpen}>
        <AddFestivalDialog
          isOpen={isAddFestivalOpen}
          onOpenChange={setIsAddFestivalOpen}
          selectedDate={date}
          onSuccess={() => {
            refetchFestivals();
            setIsAddFestivalOpen(false);
          }}
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