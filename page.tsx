import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { PlayerHeader } from '@/components/player/PlayerHeader'
import { PlayerAttributes } from '@/components/player/PlayerAttributes'
import { GameMetrics } from '@/components/player/GameMetrics'

export default async function Page({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  if (!params.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
    notFound()
  }

  const [playerResult, statsResult] = await Promise.all([
    supabase
      .from('players')
      .select(`
        *,
        player_attributes (*),
        fixture_player_positions (
          *,
          fixtures (
            id,
            date,
            opponent,
            motm_player_id,
            home_score,
            away_score,
            outcome,
            category
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

  // Group games by fixture ID to consolidate positions and minutes
  const gamesByFixture = player.fixture_player_positions?.reduce((acc, curr) => {
    const opponent = curr.fixtures?.opponent
    const fixtureId = curr.fixtures?.id
    if (!opponent || !fixtureId) return acc
    
    // Only create a new entry if this fixture hasn't been processed yet
    if (!acc[fixtureId]) {
      acc[fixtureId] = {
        id: fixtureId,
        opponent,
        date: curr.fixtures?.date,
        home_score: curr.fixtures?.home_score,
        away_score: curr.fixtures?.away_score,
        outcome: curr.fixtures?.outcome,
        category: curr.fixtures?.category,
        totalMinutes: 0,
        positions: {},
        isMotm: curr.fixtures?.motm_player_id === player.id,
        isCaptain: player.fixture_team_selections?.some(
          selection => selection.fixture_id === fixtureId && selection.is_captain
        )
      }
    }
    
    // Update minutes and positions for this fixture
    acc[fixtureId].totalMinutes += curr.fixture_playing_periods?.duration_minutes || 0
    if (curr.position) {
      acc[fixtureId].positions[curr.position] = (acc[fixtureId].positions[curr.position] || 0) + 
        (curr.fixture_playing_periods?.duration_minutes || 0)
    }
    
    return acc
  }, {} as Record<string, any>)

  const sortedGames = Object.values(gamesByFixture || {}).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Count unique MOTM appearances
  const motmCount = sortedGames.filter(game => game.isMotm).length

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