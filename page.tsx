import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { PlayerHeader } from '@/components/player/PlayerHeader'
import { PlayerAttributes } from '@/components/player/PlayerAttributes'
import { GameMetrics } from '@/components/player/GameMetrics'

export default async function Page({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound()
  }

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const [playerResult, statsResult] = await Promise.all([
    supabase
      .from('players')
      .select(`
        *,
        player_attributes (*),
        fixture_player_positions!inner (
          *,
          fixtures (
            id,
            date,
            opponent,
            motm_player_id
          ),
          fixture_playing_periods (
            duration_minutes
          )
        ),
        fixture_team_selections (
          fixture_id,
          is_captain
        )
      `)
      .eq('id', params.id)
      .maybeSingle(),
    
    supabase
      .from('player_fixture_stats')
      .select('*')
      .eq('player_id', params.id)
      .maybeSingle()
  ])

  if (playerResult.error) {
    console.error('Error fetching player:', playerResult.error)
    throw playerResult.error
  }

  const player = playerResult.data
  const stats = statsResult.data

  if (!player) {
    notFound()
  }

  // Create a map of fixture IDs to consolidate positions and minutes
  const gamesByFixture = player.fixture_player_positions?.reduce((acc, curr) => {
    const fixtureId = curr.fixtures?.id
    if (!fixtureId || !curr.fixtures) return acc
    
    if (!acc[fixtureId]) {
      acc[fixtureId] = {
        opponent: curr.fixtures.opponent,
        date: curr.fixtures.date,
        totalMinutes: 0,
        positions: {},
        isMotm: curr.fixtures.motm_player_id === player.id,
        isCaptain: player.fixture_team_selections?.some(
          selection => selection.fixture_id === fixtureId && selection.is_captain
        )
      }
    }
    
    const minutes = curr.fixture_playing_periods?.duration_minutes || 0
    acc[fixtureId].totalMinutes += minutes
    if (curr.position) {
      acc[fixtureId].positions[curr.position] = (acc[fixtureId].positions[curr.position] || 0) + minutes
    }
    
    return acc
  }, {} as Record<string, any>)

  const sortedGames = Object.values(gamesByFixture || {}).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate MOTM count correctly by counting unique fixtures where player was MOTM
  const motmCount = new Set(
    player.fixture_player_positions
      ?.filter(pos => pos.fixtures?.motm_player_id === player.id)
      .map(pos => pos.fixtures?.id)
  ).size

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Player Details</h1>
      
      <div className="space-y-6">
        <PlayerHeader 
          name={player.name}
          squadNumber={player.squad_number}
          category={player.player_category}
        />
        
        <PlayerAttributes attributes={player.player_attributes} />

        <GameMetrics 
          stats={stats}
          motmCount={motmCount}
          recentGames={sortedGames}
        />
      </div>
    </div>
  )
}