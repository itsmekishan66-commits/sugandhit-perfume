export interface SerializedNotification {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: number;
  _id: string;
}

export interface NotificationInput {
  userId?: number | null;
  type: string;
  title: string;
  message: string;
  link?: string;
}