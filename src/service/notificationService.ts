// notificationService.ts
import { Client } from '@stomp/stompjs';
import { API_ENDPOINTS } from '../api/endpoint';
import { authFetch } from '../api/apiAuth';

// 1. Defina a interface para a resposta paginada
export interface PageableResponse<T> {
  content: T[];
  pageable: {
    page_number: number;
    page_size: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  total_elements: number;
  total_pages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  number_of_elements: number;
  empty: boolean;
}

// 2. Atualize o tipo NotificationType para incluir os novos enums do backend
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'LOW_STOCK' | 'NEW_SUPPLY' | 'NEW_REGION' | 'NEW_USER';
  is_read: boolean;
  created_at: string;
  read_at?: string;
  link?: string;
  metadata?: string;
}

class NotificationService {
  private client: Client | null = null;
  private listeners: ((notification: Notification) => void)[] = [];

  connect(userId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = import.meta.env.VITE_API_URL?.replace(/https?:\/\//, '');
    const wsUrl = `${protocol}://${host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {},
      debug: () => {
        //console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected for user:', userId);

      this.client?.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        console.log('Received notification:', message.body);
        const notification: Notification = JSON.parse(message.body);
        this.notifyListeners(notification);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketError = () => {
      //   console.error('WebSocket error:', event);
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      console.log('WebSocket disconnected');
    }
  }

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // 3. Ajuste a função getNotifications para lidar com a resposta paginada
  async getNotifications(): Promise<Notification[]> {
    try {
      // O authFetch agora deve esperar uma PageableResponse<Notification>
      const response = await authFetch<PageableResponse<Notification>>(`${API_ENDPOINTS.notifications}`, {
        method: 'GET',
      });

      console.log('Fetched paginated notifications:', response);
      // Retorne apenas o array 'content'
      return response.content || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const data = await authFetch<{ count: number }>(`${API_ENDPOINTS.notifications}/unread/count`, {
        method: 'GET',
      });

      console.log('Fetched unread count:', data);
      return data?.count || 0;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await authFetch(`${API_ENDPOINTS.notifications}/${notificationId}/read`, {
        method: 'PUT',
      });
      console.log('Marked notification as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await authFetch(`${API_ENDPOINTS.notifications}/read-all`, {
        method: 'PUT',
      });
      console.log('Marked all notifications as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);

      throw error;
    }
  }
}

export const notificationService = new NotificationService();