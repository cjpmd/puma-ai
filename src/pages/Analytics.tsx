import { useState } from "react";
import { AttributeTrends } from "@/components/analytics/AttributeTrends";
import { ObjectiveStats } from "@/components/analytics/ObjectiveStats";
import { RadarChart } from "@/components/analytics/RadarChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculatePlayerPerformance, getPerformanceColor, getPerformanceText } from "@/utils/playerCalculations";
import { Player, PlayerCategory } from "@/types/player";
import { useNavigate } from "react-router-dom";

export const Analytics = () => {
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const navigate = useNavigate();

  const { data: players } = useQuery({
    queryKey: ["players-with-attributes"],
    queryFn: async () => {
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select(`
          *,
          player_attributes (*),
          position_suitability (
            suitability_score,
            position_definitions (
              abbreviation,
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (playersError) throw playersError;

      return playersData.map((player) => ({
        id: player.id,
        name: player.name,
        age: player.age,
        dateOfBirth: player.date_of_birth,
        squadNumber: player.squad_number,
        playerCategory: player.player_category as PlayerCategory,
        attributes: player.player_attributes.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          value: attr.value,
          category: attr.category,
          player_id: attr.player_id,
          created_at: attr.created_at,
        })),
        attributeHistory: {},
        topPositions: player.position_suitability
          ?.sort((a: any, b: any) => b.suitability_score - a.suitability_score)
          .slice(0, 3)
          .map((pos: any) => ({
            position: pos.position_definitions.abbreviation,
            suitability_score: pos.suitability_score
          })),
        created_at: player.created_at,
        updated_at: player.updated_at,
      })) as Player[];
    },
  });

  const filteredPlayers = players?.filter((player) => {
    if (performanceFilter === "all") return true;
    return calculatePlayerPerformance(player) === performanceFilter;
  });

  const handlePlayerClick = (playerId: string) => {
    navigate(`/player/${playerId}`);
  };

  const getRadarData = (player: Player, category: string) => {
    return player.attributes
      .filter((attr) => attr.category === category)
      .map((attr) => ({
        name: attr.name,
        value: attr.value,
      }));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select
          value={performanceFilter}
          onValueChange={setPerformanceFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Players</SelectItem>
            <SelectItem value="improving">Improving</SelectItem>
            <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
            <SelectItem value="maintaining">Maintaining</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredPlayers && (
        <div className="grid gap-4">
          {filteredPlayers.map((player) => {
            const performanceStatus = calculatePlayerPerformance(player);
            return (
              <Card 
                key={player.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handlePlayerClick(player.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle>{player.name}</CardTitle>
                      <div className="flex gap-2">
                        {player.topPositions?.map((pos, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            className={`${
                              index === 0 ? 'bg-green-500/10' : 
                              index === 1 ? 'bg-blue-500/10' : 
                              'bg-amber-500/10'
                            }`}
                          >
                            {pos.position} ({pos.suitability_score.toFixed(1)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Performance Status</h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-white ${
                        performanceStatus === "improving" ? "bg-green-500" :
                        performanceStatus === "needs-improvement" ? "bg-amber-500" :
                        performanceStatus === "neutral" ? "bg-gray-500" :
                        "bg-blue-500"
                      }`}>
                        {getPerformanceText(performanceStatus)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {["TECHNICAL", "MENTAL", "PHYSICAL", "GOALKEEPING"].map((category) => {
                        const attrs = player.attributes.filter((attr: any) => attr.category === category);
                        if (attrs.length === 0) return null;
                        const avg = attrs.reduce((acc: number, curr: any) => acc + curr.value, 0) / attrs.length;
                        return (
                          <div key={category} className="flex justify-between">
                            <span>{category}</span>
                            <span>{avg.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {["TECHNICAL", "MENTAL", "PHYSICAL", "GOALKEEPING"].map((category) => {
                      const radarData = getRadarData(player, category);
                      if (radarData.length === 0) return null;
                      return (
                        <RadarChart
                          key={`${player.id}-${category}`}
                          data={radarData}
                          title={category}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <div className="grid gap-8 md:grid-cols-2">
        <ObjectiveStats />
        <AttributeTrends />
      </div>
    </div>
  );
};
