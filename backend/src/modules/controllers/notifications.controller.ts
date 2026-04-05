import { Response, Router } from 'express';
import { prisma } from '../../prisma/prismaClient';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all notification routes
router.use(requireAuth);

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly = 'false', limit = '50' } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: unreadOnly === 'true' ? false : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            type: true,
            client: {
              select: {
                prenom: true,
                nom: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Erreur lors du marquage comme lu' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Erreur lors du marquage comme lu' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export const notificationsRouter = router;

// Helper function to create notifications
export async function createNotification(data: {
  userId: string;
  senderId?: string;
  type: 'order_created' | 'order_updated' | 'order_status_changed' | 'order_completed' | 'invoice_created' | 'invoice_paid' | 'message' | 'alert';
  title: string;
  message: string;
  orderId?: string;
  invoiceId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        senderId: data.senderId,
        type: data.type,
        title: data.title,
        message: data.message,
        orderId: data.orderId,
        invoiceId: data.invoiceId,
        priority: data.priority || 'medium',
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}
