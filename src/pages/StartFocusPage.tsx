import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Music, Info } from 'lucide-react'
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

export const StartFocusPage = () => {
  const [objective, setObjective] = useState('')
  const [selectedTime, setSelectedTime] = useState('no-limit')
  const [customMinutes, setCustomMinutes] = useState('')
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
  const navigate = useNavigate()

  const blockCategories = [
    { id: 'gaming', label: 'Gaming', icon: '🎮' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'custom', label: 'Custom', icon: '⚙️' },
  ]

  const timePresets = [
    { value: 'no-limit', label: 'No time limit' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: 'custom', label: 'Custom' },
  ]

  const handleBegin = async () => {
    if (!objective) return

    const sessionId = await FlowSessionApi.startFlowSession(objective)
    const duration = selectedTime === 'custom' ? parseInt(customMinutes) : 
                    selectedTime === 'no-limit' ? null : parseInt(selectedTime)

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
                placeholder="💡 Code new side project"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                maxLength={50}
                className="w-full"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Session Duration</h2>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {timePresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTime === 'custom' && (
                <Input
                  type="number"
                  placeholder="Enter minutes"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Apps to Block</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {blockCategories.map(category => (
                    <Badge
                      key={category.id}
                      variant={selectedBlocks.includes(category.id) ? 'default' : 'outline'}
                      className={`cursor-pointer ${onlyAllowCreating ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => toggleBlock(category.id)}
                    >
                      {category.icon} {category.label}
                      {selectedBlocks.includes(category.id) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
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
                        <p>This will block every website and app categorized as consumption</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Music</h2>
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
            </div>

            <Button
              className="w-full"
              onClick={handleBegin}
              disabled={!objective || (selectedTime === 'custom' && !customMinutes)}
            >
              Start Focus Session
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
