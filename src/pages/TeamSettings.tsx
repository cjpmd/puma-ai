import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Settings } from "lucide-react";
import { AttributeSettingsManager } from "@/components/settings/AttributeSettingsManager";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const TeamSettings = () => {
  const [teamName, setTeamName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamSettings();
  }, []);

  const fetchTeamSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('team_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setTeamName(data?.team_name ?? "");
    } catch (error) {
      console.error('Error fetching team settings:', error);
      toast({
        title: "Error",
        description: "Failed to load team settings",
        variant: "destructive",
      });
    }
  };

  const updateTeamName = async (newName: string) => {
    try {
      const { error } = await supabase
        .from('team_settings')
        .upsert({ 
          team_name: newName,
          id: '00000000-0000-0000-0000-000000000000'
        });

      if (error) throw error;
      setTeamName(newName);
      toast({
        title: "Success",
        description: "Team name updated successfully",
      });
    } catch (error) {
      console.error('Error updating team name:', error);
      toast({
        title: "Error",
        description: "Failed to update team name",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto space-y-8"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Team Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="max-w-sm"
              />
              <Button onClick={() => updateTeamName(teamName)}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Attribute Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible>
              <CollapsibleTrigger className="w-full text-left">
                <Button variant="ghost" className="w-full justify-start">
                  Show Attribute Settings
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <AttributeSettingsManager />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TeamSettings;