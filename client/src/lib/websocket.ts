import { WebSocketMessage } from '@/types/trading';

export interface WebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private reconnectAttempts: number = 0;
  private isReconnecting: boolean = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected: boolean = false;

  // Event handlers
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onMessage?: (message: WebSocketMessage) => void;
  private onError?: (error: Event) => void;
  private onReconnect?: (attempt: number) => void;

  constructor(options: WebSocketOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
    this.onMessage = options.onMessage;
    this.onError = options.onError;
    this.onReconnect = options.onReconnect;
  }

  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
      this.isManuallyDisconnected = false;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnection();
    }
  }

  public disconnect(): void {
    this.isManuallyDisconnected = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  public send(message: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    
    console.warn('WebSocket is not connected. Message not sent:', message);
    return false;
  }

  public getReadyState(): number | null {
    return this.ws ? this.ws.readyState : null;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.startHeartbeat();
      
      if (this.onConnect) {
        this.onConnect();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle heartbeat response
        if (message.type === 'pong') {
          console.debug('Received heartbeat pong');
          return;
        }
        
        if (this.onMessage) {
          this.onMessage(message);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.clearTimers();
      
      if (this.onDisconnect) {
        this.onDisconnect();
      }

      // Attempt reconnection if not manually disconnected
      if (!this.isManuallyDisconnected && event.code !== 1000) {
        this.handleReconnection();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      if (this.onError) {
        this.onError(error);
      }
    };
  }

  private handleReconnection(): void {
    if (this.isManuallyDisconnected || this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.onReconnect) {
      this.onReconnect(this.reconnectAttempts);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    this.clearReconnectTimer();
  }
}

// Factory function for creating WebSocket instances
export function createWebSocket(options: Omit<WebSocketOptions, 'url'>): WebSocketClient {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  return new WebSocketClient({
    ...options,
    url: wsUrl
  });
}

// Hook-compatible WebSocket manager
export class WebSocketManager {
  private client: WebSocketClient | null = null;
  private subscribers: Set<(message: WebSocketMessage) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private isConnected: boolean = false;

  public connect(): void {
    if (this.client) {
      return;
    }

    this.client = createWebSocket({
      onConnect: () => {
        this.isConnected = true;
        this.notifyConnectionListeners(true);
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.notifyConnectionListeners(false);
      },
      onMessage: (message) => {
        this.notifySubscribers(message);
      },
      onError: (error) => {
        console.error('WebSocket manager error:', error);
      },
      onReconnect: (attempt) => {
        console.log(`WebSocket manager reconnecting (attempt ${attempt})`);
      }
    });

    this.client.connect();
  }

  public disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners(false);
  }

  public send(message: any): boolean {
    return this.client ? this.client.send(message) : false;
  }

  public subscribe(callback: (message: WebSocketMessage) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    // Immediately call with current state
    callback(this.isConnected);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private notifySubscribers(message: WebSocketMessage): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket subscriber callback:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in WebSocket connection listener:', error);
      }
    });
  }
}

// Singleton instance for global use
export const webSocketManager = new WebSocketManager();

// Auto-connect when the module is imported
if (typeof window !== 'undefined') {
  webSocketManager.connect();
}
