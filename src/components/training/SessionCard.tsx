import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { DrillCard } from "./DrillCard";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    drills: {
      id: string;
      title: string;
      instructions: string | null;
      training_files: {
        id: string;
        file_name: string;
        file_path: string;
      }[];
    }[];
  };
  fileUrls: Record<string, string>;
  onAddDrillClick: (sessionId: string) => void;
  onEditDrillClick: (sessionId: string, drill: SessionCardProps["session"]["drills"][0]) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SessionCard = ({ 
  session, 
  fileUrls, 
  onAddDrillClick,
  onEditDrillClick,
  onDeleteSession,
}: SessionCardProps) => {
  return (
    <Card key={session.id}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{session.title}</span>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => onAddDrillClick(session.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Drill
                </Button>
              </DialogTrigger>
            </Dialog>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onDeleteSession(session.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {session.drills?.length > 0 ? (
          <div className="space-y-4">
            {session.drills.map((drill) => (
              <DrillCard 
                key={drill.id} 
                drill={drill} 
                fileUrls={fileUrls}
                onEdit={(drill) => onEditDrillClick(session.id, drill)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No drills added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};