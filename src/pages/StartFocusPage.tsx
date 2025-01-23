import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Music, Info, Plus, Minus } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { LogoContainer } from '@/components/LogoContainer'
import { FlowSessionApi } from '../api/ebbApi/flowSessionApi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getAppsByCategory } from '../lib/app-directory/apps-list'
import { useSettings } from '../hooks/useSettings'
import { AppCategory, categoryEmojis } from '../lib/app-directory/apps-types'
import { TimeSelector } from '@/components/TimeSelector'

export const StartFocusPage = () => {
  const { userRole } = useSettings()
  const [objective, setObjective] = useState('')
  const [duration, setDuration] = useState<number | null>(null)
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [musicService, setMusicService] = useState<{
    type: 'spotify' | 'apple' | null,
    connected: boolean,
    playlists: { id: string, name: string }[]
  }>({
    type: 'spotify', // This should come from your auth state
    connected: true, // This should come from your auth state
    playlists: [     // This should come from your API
      { id: '1', name: 'Focus Flow' },
      { id: '2', name: 'Deep Work' },
      { id: '3', name: 'Coding Mode' },
    ]
  })
  const [onlyAllowCreating, setOnlyAllowCreating] = useState(false)
  const [showBlockingSection, setShowBlockingSection] = useState(false)
  const [showMusicSection, setShowMusicSection] = useState(false)
  const navigate = useNavigate()

  const blockCategories = [
    ...(['Gaming', 'Social Media', 'Communication', 'Entertainment', 'News', 'Shopping', 'Travel'] as AppCategory[])
      .map(category => ({
        id: category.toLowerCase().replace(' ', ''),
        label: category,
        icon: categoryEmojis[category],
        tooltip: getAppsByCategory(category)
          .map(app => app.type === 'website' ? app.websiteUrl : app.name)
          .join(', ')
      })),
    { 
      id: 'custom', 
      label: 'Custom', 
      icon: '⚙️', 
      tooltip: 'Add your own websites to block'
    },
  ]

  const getPlaceholderByRole = () => {
    switch (userRole) {
      case 'developer':
        return '💻 Build new feature...'
      case 'designer':
        return '🎨 Design landing page...'
      case 'creator':
        return '🎥 Create new content...'
      default:
        return '💡 Enter your goal...'
    }
  }

  const handleBegin = async () => {
    if (!objective) return

    const sessionId = await FlowSessionApi.startFlowSession(objective)

    navigate('/breathing-exercise', {
      state: {
        startTime: Date.now(),
        objective,
        sessionId,
        duration,
        blocks: onlyAllowCreating ? 'all' : selectedBlocks,
        onlyAllowCreating,
        playlist: selectedPlaylist ? {
          id: selectedPlaylist,
          service: musicService.type
        } : null
      }
    })
  }

  const toggleBlock = (blockId: string) => {
    setSelectedBlocks(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    )
  }

  const CollapsibleSectionHeader = ({ 
    title, 
    isExpanded, 
    onToggle,
    type
  }: { 
    title: string, 
    isExpanded: boolean, 
    onToggle: () => void,
    type: 'blocking' | 'music'
  }) => (
    <div 
      className="flex items-center justify-between cursor-pointer" 
      onClick={onToggle}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {!isExpanded && (
          <span className="text-sm text-muted-foreground">
            {type === 'music' 
              ? `Playing ${musicService.type === 'spotify' ? 'Spotify' : 'Apple Music'}`
              : 'Applying last used'
            }
          </span>
        )}
        {isExpanded ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <div className="flex">
        <LogoContainer />
        <TopNav variant="modal" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[400px]">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Goal</h2>
              <Input
                placeholder={getPlaceholderByRole()}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                maxLength={50}
                className="w-full"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Session Duration</h2>
              <TimeSelector
                value={duration}
                onChange={setDuration}
              />
            </div>

            <div>
              <CollapsibleSectionHeader 
                title="Blocking"
                isExpanded={showBlockingSection}
                onToggle={() => setShowBlockingSection(!showBlockingSection)}
                type="blocking"
              />
              {showBlockingSection && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {blockCategories.map(category => (
                      <TooltipProvider key={category.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Badge
                                variant={selectedBlocks.includes(category.id) ? 'default' : 'outline'}
                                className={`cursor-pointer ${onlyAllowCreating ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => toggleBlock(category.id)}
                              >
                                {category.icon} {category.label}
                                {selectedBlocks.includes(category.id) && (
                                  <X className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>{category.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={onlyAllowCreating}
                        onCheckedChange={(checked) => {
                          setOnlyAllowCreating(checked)
                          if (checked) {
                            setSelectedBlocks([]) // Clear all selected blocks when enabling Creation Only Mode
                          }
                        }}
                      />
                      <span className="text-sm text-muted-foreground">Creation Only Mode</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This will block every website and app not categorized as creating</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </div>

            <div>
              <CollapsibleSectionHeader 
                title="Music"
                isExpanded={showMusicSection}
                onToggle={() => setShowMusicSection(!showMusicSection)}
                type="music"
              />
              {showMusicSection && (
                <>
                  <div className="flex items-center gap-2 mt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${musicService.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-muted-foreground">
                        {musicService.type === 'spotify' ? 'Spotify' : 'Apple Music'} 
                        {musicService.connected ? ' Connected' : ' Disconnected'}
                      </span>
                    </div>
                  </div>
                  
                  {musicService.connected ? (
                    <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a playlist" />
                      </SelectTrigger>
                      <SelectContent>
                        {musicService.playlists.map(playlist => (
                          <SelectItem key={playlist.id} value={playlist.id}>
                            <div className="flex items-center">
                              <Music className="h-4 w-4 mr-2" />
                              {playlist.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {/* Handle connection */}}
                    >
                      Connect {musicService.type === 'spotify' ? 'Spotify' : 'Apple Music'}
                    </Button>
                  )}
                </>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleBegin}
              disabled={!objective}
            >
              Start Focus Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
