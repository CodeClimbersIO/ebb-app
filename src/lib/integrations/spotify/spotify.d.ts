export {}

declare global {
  namespace Spotify {
    interface PlaybackState {
      track_window: {
        current_track: {
          name: string;
          uri: string;
          id: string;
          artists: Array<{ name: string; uri: string, id: string }>;
          album: {
            name: string;
            uri: string;
            id: string;
          }
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
      pause(): Promise<void>;
      resume(): Promise<void>;
      togglePlay(): Promise<void>;
      seek(position_ms: number): Promise<void>;
      previousTrack(): Promise<void>;
      nextTrack(): Promise<void>;
      getCurrentState(): Promise<PlaybackState | null>;
      setVolume(volume: number): Promise<void>;
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
