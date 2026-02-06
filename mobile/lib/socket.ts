import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the same base URL as api.ts
const getBaseUrl = () => {
    const envUrl =
        process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;

    if (
        envUrl &&
        !envUrl.includes("localhost") &&
        !envUrl.includes("10.0.2.2")
    ) {
        return envUrl;
    }

    if (__DEV__) {
        const manifestHost = Constants.expoConfig?.hostUri?.split(":")?.[0];
        if (manifestHost && manifestHost !== "localhost") {
            return `http://${manifestHost}:3000`;
        }

        const realDeviceIP = Constants.expoConfig?.extra?.localIP;
        if (realDeviceIP) {
            return `http://${realDeviceIP}:3000`;
        }

        if (Platform.OS === "android") {
            return "http://10.0.2.2:3000";
        }
        return "http://localhost:3000";
    }

    return envUrl || "http://localhost:3000";
};

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;

    connect(token: string): Socket | null {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.token = token;
        const baseUrl = getBaseUrl();

        this.socket = io(baseUrl, {
            auth: {
                token: token,
            },
            extraHeaders: {
                Authorization: `Bearer ${token}`,
            },
            transports: ['websocket', 'polling'],
            forceNew: true,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
        });

        return this.socket;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Chat methods
    sendMessage(receiverId: string, content: string): void {
        if (!this.socket) return;

        this.socket.emit('sendMessage', {
            receiverId,
            content,
        });
    }

    joinConversation(otherUserId: string): void {
        if (!this.socket) return;

        this.socket.emit('joinConversation', { otherUserId });
    }

    leaveConversation(otherUserId: string): void {
        if (!this.socket) return;

        this.socket.emit('leaveConversation', { otherUserId });
    }

    setTyping(receiverId: string, isTyping: boolean): void {
        if (!this.socket) return;

        this.socket.emit('typing', { receiverId, isTyping });
    }

    // Event listeners
    onNewMessage(callback: (message: any) => void): void {
        if (!this.socket) return;
        this.socket.on('newMessage', callback);
    }

    onMessageSent(callback: (message: any) => void): void {
        if (!this.socket) return;
        this.socket.on('messageSent', callback);
    }

    onUserTyping(callback: (data: { userId: string; userName: string; isTyping: boolean }) => void): void {
        if (!this.socket) return;
        this.socket.on('userTyping', callback);
    }

    onUserOnline(callback: (data: { userId: string; name: string }) => void): void {
        if (!this.socket) return;
        this.socket.on('userOnline', callback);
    }

    onUserOffline(callback: (data: { userId: string }) => void): void {
        if (!this.socket) return;
        this.socket.on('userOffline', callback);
    }

    // Remove listeners
    off(event: string, callback?: any): void {
        if (!this.socket) return;
        this.socket.off(event, callback);
    }
}

export const socketService = new SocketService();
export default socketService;
