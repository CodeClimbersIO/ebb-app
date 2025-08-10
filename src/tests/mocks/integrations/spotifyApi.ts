export type PlaybackState = unknown

export const SpotifyApiService = {
  async initSdkScript() {},
  async createPlayer() {
    return {
      addListener: () => {},
      disconnect: () => {},
      pause: async () => {},
    }
  },
  async transferPlaybackToComputerDevice() {},
  async startPlayback() {},
}

export const getSpotifyIdFromUri = () => ''
export const openSpotifyLink = async () => {}

