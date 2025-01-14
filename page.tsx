import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

export default async function Page({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: player, error } = await supabase
    .from('players')
    .select(`
      *,
      player_attributes (*),
      fixture_player_positions (
        *,
        fixtures (
          date,
          opponent
        ),
        fixture_playing_periods (
          duration_minutes
        )
      ),
      fixture_team_selections (
        is_captain
      )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching player:', error)
    throw error
  }

  if (!player) {
    notFound()
  }

  // Calculate position minutes
  const positionMinutes: Record<string, number> = {}
  player.fixture_player_positions?.forEach((position) => {
    const minutes = position.fixture_playing_periods?.duration_minutes || 0
    if (position.position) {
      positionMinutes[position.position] = (positionMinutes[position.position] || 0) + minutes
    }
  })

  // Calculate captain appearances
  const captainAppearances = player.fixture_team_selections?.filter(
    selection => selection.is_captain
  ).length || 0

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Player Details</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl">{player.name} - #{player.squad_number}</h2>
          <p className="text-gray-600">Category: {player.player_category}</p>
        </div>
        
        <div className="border rounded">
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent">
              <h3 className="font-semibold">Attributes</h3>
              <ChevronDown className="h-5 w-5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <ul className="space-y-1">
                {player.player_attributes?.map((attr) => (
                  <li key={attr.id} className="flex justify-between">
                    <span>{attr.name}</span>
                    <span className="font-medium">{attr.value}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="border rounded">
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent">
              <h3 className="font-semibold">Game Metrics</h3>
              <ChevronDown className="h-5 w-5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Appearances</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Appearances</p>
                    <p className="font-medium">{player.fixture_player_positions?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Captain Appearances</p>
                    <p className="font-medium">{captainAppearances}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Minutes by Position</h4>
                <ul className="space-y-1">
                  {Object.entries(positionMinutes).map(([position, minutes]) => (
                    <li key={position} className="flex justify-between">
                      <span>{position}</span>
                      <span className="font-medium">{minutes} mins</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Games</h4>
                <ul className="space-y-2">
                  {player.fixture_player_positions?.slice(0, 5).map((game) => (
                    <li key={game.id} className="flex justify-between text-sm">
                      <span>vs {game.fixtures?.opponent} ({game.position})</span>
                      <span>{game.fixture_playing_periods?.duration_minutes || 0} mins</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}