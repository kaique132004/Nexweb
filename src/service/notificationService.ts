import { API_ENDPOINTS } from '../api/endpoint';
import { authFetch } from '../api/apiAuth';

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    page_number: number;
    page_size: number;
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  total_elements: number;
  total_pages: number;
  last: boolean;
  size: number;
  number: number;
  sort: { sorted: boolean; unsorted: boolean; empty: boolean };
  first: boolean;
  number_of_elements: number;
  empty: boolean;
}

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

// Máximo de erros consecutivos antes de desistir de reconectar
const MAX_CONSECUTIVE_ERRORS = 5;

class NotificationService {
  private eventSource: EventSource | null = null;
  private listeners: ((notification: Notification) => void)[] = [];
  private errorCount = 0;

  connect() {
    if (this.eventSource) return;

    const url = `${API_ENDPOINTS.notifications}/stream`;
    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.addEventListener('connected', () => {
      this.errorCount = 0;
    });

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      this.errorCount = 0;
      try {
        const notification: Notification = JSON.parse(event.data);
        this.notifyListeners(notification);
      } catch {
        // payload inválido — ignora
      }
    });

    this.eventSource.addEventListener('heartbeat', () => {
      this.errorCount = 0;
    });

    this.eventSource.onerror = () => {
      this.errorCount++;
      if (this.errorCount >= MAX_CONSECUTIVE_ERRORS) {
        this.disconnect();
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.errorCount = 0;
  }

  subscribe(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(l => l(notification));
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await authFetch<PageableResponse<Notification>>(API_ENDPOINTS.notifications);
      return response?.content ?? [];
    } catch {
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const data = await authFetch<{ count: number }>(`${API_ENDPOINTS.notifications}/unread/count`);
      return data?.count ?? 0;
    } catch {
      return 0;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    await authFetch(`${API_ENDPOINTS.notifications}/${notificationId}/read`, { method: 'PUT' });
  }

  async markAllAsRead(): Promise<void> {
    await authFetch(`${API_ENDPOINTS.notifications}/read-all`, { method: 'PUT' });
  }
}

export const notificationService = new NotificationService();
