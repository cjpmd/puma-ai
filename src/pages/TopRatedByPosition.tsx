import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PerformanceCategory } from "@/types/player";

interface PositionRankingData {
  player_id: string;
  player_name: string;
  position: string;
  suitability_score: number;
  player_category: string;
}

interface RawPositionData {
  player_id: string;
  suitability_score: number;
  players: {
    name: string;
    team_category: string;
  };
  position_definitions: {
    abbreviation: string;
    full_name: string;
  };
}

const positionTitles: Record<string, string> = {
  "GK": "Goalkeeper",
  "SK": "Sweeper Keeper",
  "DL": "Left Back",
  "DCL": "Centre Back (L)",
  "DCR": "Centre Back (R)",
  "DR": "Right Back",
  "WBL": "Wing Back (L)",
  "DMCL": "Central Defensive Midfielder (L)",
  "DMCR": "Central Defensive Midfielder (R)",
  "WBR": "Wing Back Right",
  "ML": "Left Midfielder",
  "MCL": "Midfield (Centre Left)",
  "MCR": "Midfield (Centre Right)",
  "MR": "Right Midfielder",
  "AML": "Attacking Midfielder (Left)",
  "AMCL": "Attacking Midfielder (Centre Left)",
  "AMCR": "Attacking Midfielder (Centre Right)",
  "AMR": "Attacking Midfielder (Right)",
  "STCL": "Striker (L)",
  "STCR": "Striker (R)"
};

const TopRatedByPosition = () => {
  const [selectedCategory, setSelectedCategory] = useState<PerformanceCategory | null>(null);
  
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["position-rankings", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("position_suitability")
        .select(`
          player_id,
          suitability_score,
          players!inner (
            name,
            team_category
          ),
          position_definitions!inner (
            abbreviation,
            full_name
          )
        `)
        .order("position_definitions(abbreviation)", { ascending: true });

      if (selectedCategory) {
        query = query.eq("players.team_category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedData = (data as unknown as RawPositionData[]).map((item) => ({
        player_id: item.player_id,
        player_name: item.players.name,
        position: item.position_definitions.abbreviation,
        suitability_score: Number(item.suitability_score || 0),
        player_category: item.players.team_category
      }));

      return transformedData.reduce((acc: Record<string, PositionRankingData[]>, curr) => {
        if (!acc[curr.position]) {
          acc[curr.position] = [];
        }
        acc[curr.position].push(curr);
        return acc;
      }, {});
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading rankings...</div>;
  }

  const RankingCard = ({ position }: { position: string }) => (
    <Card className="w-64 bg-white/90 backdrop-blur-sm">
      <CardHeader className="py-2">
        <CardTitle className="text-sm font-medium">{positionTitles[position] || position}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[200px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right w-16">Suitability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings?.[position]?.slice(0, 5).map((ranking: any, index: number) => (
                <TableRow key={`${ranking.player_id}-${index}`}>
                  <TableCell className="py-1">{index + 1}</TableCell>
                  <TableCell className="py-1">{ranking.player_name}</TableCell>
                  <TableCell className="text-right py-1">
                    {`${ranking.suitability_score.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto space-y-8"
      >
        <div className="flex items-center gap-4">
          <Link to="/squad">
            <Button variant="ghost" size="icon" className="text-white hover:bg-green-700/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">Top Rated by Position</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="text-white bg-green-700 hover:bg-green-600"
          >
            All Players
          </Button>
          <Button
            variant={selectedCategory === "MESSI" ? "default" : "outline"}
            onClick={() => setSelectedCategory("MESSI")}
            className="text-white bg-green-700 hover:bg-green-600"
          >
            Messi Category
          </Button>
          <Button
            variant={selectedCategory === "RONALDO" ? "default" : "outline"}
            onClick={() => setSelectedCategory("RONALDO")}
            className="text-white bg-green-700 hover:bg-green-600"
          >
            Ronaldo Category
          </Button>
          <Button
            variant={selectedCategory === "JAGS" ? "default" : "outline"}
            onClick={() => setSelectedCategory("JAGS")}
            className="text-white bg-green-700 hover:bg-green-600"
          >
            Jags Category
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-8">
          {/* Strikers */}
          <div className="flex justify-center gap-4">
            <RankingCard position="STCL" />
            <RankingCard position="STCR" />
          </div>

          {/* Attacking Midfielders */}
          <div className="flex justify-center gap-4">
            <RankingCard position="AML" />
            <RankingCard position="AMCL" />
            <RankingCard position="AMCR" />
            <RankingCard position="AMR" />
          </div>

          {/* Central Midfielders */}
          <div className="flex justify-center gap-4">
            <RankingCard position="ML" />
            <RankingCard position="MCL" />
            <RankingCard position="MCR" />
            <RankingCard position="MR" />
          </div>

          {/* Defensive Midfielders / Wing Backs */}
          <div className="flex justify-center gap-4">
            <RankingCard position="WBL" />
            <RankingCard position="DMCL" />
            <RankingCard position="DMCR" />
            <RankingCard position="WBR" />
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-4">
            <RankingCard position="DL" />
            <RankingCard position="DCL" />
            <RankingCard position="DCR" />
            <RankingCard position="DR" />
          </div>

          {/* Goalkeepers */}
          <div className="flex justify-center gap-4">
            <RankingCard position="GK" />
            <RankingCard position="SK" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopRatedByPosition;
