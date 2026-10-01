import { getAuthToken, BASE_URL } from './api';

export type WSEvent = {
  type: string;
  data: any;
};

type WSCallback = (event: WSEvent) => void;

function getDefaultWSUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  // Auto derive WS URL from HTTP BASE_URL
  if (BASE_URL) {
    const wsProtocol = BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
    const hostAndPath = BASE_URL.replace(/^https?:\/\//, '');
    return `${wsProtocol}//${hostAndPath}/admin/ws`;
  }
  return 'ws://localhost:8000/api/v1/admin/ws';
}

class AdminWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: WSCallback[] = [];
  private isConnecting: boolean = false;
  private reconnectInterval: any = null;

  connect() {
    const token = getAuthToken();
    if (!token) return;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getDefaultWSUrl();
    this.isConnecting = true;
    
    try {
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);

      this.socket.onopen = () => {
        console.log('Connected to Admin WebSocket stream');
        this.isConnecting = false;
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WSEvent;
          this.listeners.forEach((callback) => callback(parsed));
        } catch (e) {
          console.error('Failed to parse WS payload', e);
        }
      };

      this.socket.onclose = () => {
        console.warn('Admin WS disconnected. Retrying in 5 seconds...');
        this.socket = null;
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error('Admin WS Error', err);
      };
    } catch (e) {
      console.error('Error initializing WS', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        this.connect();
      }, 5000);
    }
  }

  subscribe(callback: WSCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const wsClient = new AdminWebSocketClient();
