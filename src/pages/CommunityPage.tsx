import { Layout } from '@/components/Layout'
import { CommunityPreview } from '@/components/CommunityPreview'
import { useConnectedStore } from '../lib/stores/connectedStore'
import { Globe } from '@/components/ui/globe'
import { useTheme } from '@/components/ThemeProvider'
import { EbbLocation, useUserLocations } from '../api/hooks/useUsers'
import { Marker } from 'cobe'
import { cn } from '../lib/utils/tailwind.util'
import { useEffect, useState } from 'react'

const geLocationsAsMarkers = (userLocations?: EbbLocation[]): Marker[] => {
  if (!userLocations) return []
  const markers = userLocations.filter(
    ({online_status}) => online_status === 'active' || online_status === 'flowing' || online_status === 'online'
  ).map(location => {
    return {
      location: [location.latitude, location.longitude] as [number, number],
      size: 0.1,
    }
  })

  return [...markers]
}

interface CommunityStatusCardProps {
  locations: EbbLocation[]
  title: string
  onLocationHover: (location: EbbLocation) => void
}

const CommunityStatusCard = ({ locations, title, onLocationHover }: CommunityStatusCardProps) => {
  const color = title === 'Online' ? 'bg-green-500' : 'bg-primary'
  return (
    <div
      key={'1'}
      className={cn(
        'bg-card text-card-foreground p-2.5 rounded-lg shadow-sm w-full text-left transition-colors border',
        'border-border',
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{locations.length} {title}</h3>
        <div className=" items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 flex-column">
            {locations.map((location, index) => (
              <div 
                key={index} 
                className={cn('h-2 w-2 rounded-full animate-pulse hover:scale-125 transition-transform cursor-pointer', color)}
                onMouseEnter={() => onLocationHover(location)}
              />
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}

export const CommunityPage = () => {
  const { data: userLocations } = useUserLocations()

  const { connected } = useConnectedStore()
  const { theme } = useTheme()
  const [location, setLocation] = useState<[number, number]>()

  const onlineLocations = userLocations?.filter(location => location.online_status === 'active' || location.online_status === 'online' || location.online_status === 'flowing') || []
  const flowingLocations = userLocations?.filter(location => location.online_status === 'flowing') || []

  const handleLocationHover = (newLocation: EbbLocation) => {
    const [newLatitude, newLongitude] = [newLocation.latitude, newLocation.longitude]
    setLocation([newLatitude, newLongitude])
  }

  const markers = geLocationsAsMarkers(userLocations)
  
  useEffect(() => {
    const firstMarkerLongitude = markers[0]?.location[1] || 0
    const defaultFocusLocation = [0, firstMarkerLongitude] as [number, number]
    if(markers.length > 0) {
      setLocation(defaultFocusLocation)
    }
  }, [userLocations])

  return (
    <Layout>
      <div className="p-8 relative">
        <div className="max-w-5xl mx-auto">
          {!connected && <CommunityPreview />}
          {connected && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] items-center">
              <div className="relative w-full aspect-square max-w-[500px] justify-self-center">
                <Globe 
                  focusLocation={location} 
                  config={{
                    dark: theme === 'dark' ? 1 : 0,
                    baseColor: [0.42, 0.3, 0.9], // Primary color from theme
                    glowColor: [0.42, 0.15, 0.85], // Primary color
                    markerColor: [0.42, 0.15, 0.85], // Primary color
                    markers,
                    mapBrightness: 3,
                    diffuse: 1.2
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 md:max-w-[200px] self-center">
                <h3 className="text-sm font-bold">Community</h3>
                <CommunityStatusCard 
                  locations={onlineLocations} 
                  title="Online" 
                  onLocationHover={handleLocationHover}
                />
                <CommunityStatusCard 
                  locations={flowingLocations} 
                  title="Flowing" 
                  onLocationHover={handleLocationHover}
                />
              </div>

            </div>
          ) }
        </div>


      </div>
    </Layout>
  )
} 
