export type PlaybackState = any

export const SpotifyApiService = {
  async initSdkScript() {},
  async createPlayer() {
    return {
      addListener: (_name: string, _cb: any) => {},
      disconnect: () => {},
      pause: async () => {},
    }
  },
  async transferPlaybackToComputerDevice() {},
  async startPlayback(_playlistId?: string, _deviceId?: string) {},
}

export const getSpotifyIdFromUri = (_uri: string) => ''
export const openSpotifyLink = async (_uri: string) => {}

