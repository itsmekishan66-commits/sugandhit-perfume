import type { Request, Response } from 'express';
import {
  createNotification,
  listAllNotifications,
  listUserNotifications,
  unreadCount,
  markNotificationRead,
  deleteNotification,
} from '../services/notification.service.js';

export const list = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const notifications = await listUserNotifications(Number(userId));
    const unread = await unreadCount(Number(userId));
    res.json({ success: true, notifications, unread });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const adminList = async (_req: Request, res: Response) => {
  try {
    const notifications = await listAllNotifications();
    res.json({ success: true, notifications });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, link } = req.body;
    await createNotification({ userId, type, title, message, link });
    res.json({ success: true, message: 'Notification sent.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { userId, notificationId } = req.body;
    await markNotificationRead(Number(userId), notificationId ? Number(notificationId) : undefined);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await deleteNotification(Number(id));
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};