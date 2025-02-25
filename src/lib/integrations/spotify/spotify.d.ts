export {}

declare global {
  namespace Spotify {
    interface PlaybackState {
      track_window: {
        current_track: {
          name: string;
          artists: Array<{ name: string }>;
        };
      };
      paused: boolean;
      duration: number;
      position: number;
    }

    interface Player {
      addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): void;
      addListener(event: 'ready' | 'not_ready', callback: (data: { device_id: string }) => void): void;
      addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', 
                  callback: (data: { message: string }) => void): void;
      connect(): Promise<boolean>;
      disconnect(): void;
    }
  }

  interface SpotifyPlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerOptions) => Spotify.Player;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}
