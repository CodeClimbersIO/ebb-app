export {}

declare global {
  namespace Spotify {
    interface Player {
      addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): void;
      addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
      connect(): Promise<boolean>;
      disconnect(): void;
    }
  }

  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => Spotify.Player;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}
