import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Generate WebSocket URL based on API URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/dashboard';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 messages
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { messages, isConnected };
}
