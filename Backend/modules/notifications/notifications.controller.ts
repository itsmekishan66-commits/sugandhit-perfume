import type { Request, Response } from 'express';
import * as service from './notifications.service.js';

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const notifications = await service.list(Number(userId));
    const unread = await service.unreadCount(Number(userId));
    res.json({ success: true, notifications, unread });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const adminListNotifications = async (_req: Request, res: Response) => {
  try {
    const notifications = await service.adminList();
    res.json({ success: true, notifications });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, link } = req.body;
    await service.create({ userId, type, title, message, link });
    res.json({ success: true, message: 'Notification sent.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { userId, notificationId } = req.body;
    await service.markRead(Number(userId), notificationId ? Number(notificationId) : undefined);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const removeNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await service.remove(Number(id));
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};