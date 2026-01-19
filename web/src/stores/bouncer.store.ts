// ============================================================================
// BOUNCER STORE
// Manages notification lobby and delivery queue
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

import type { ChronosNotification, LobbyQueue, NotificationPriority, NotificationSource } from '../types';
import { db } from '../db/schema';
import { BOUNCER_CONFIG } from '../lib/config';
import { routeNotification } from '../services/bouncer.service';
import { useUserStore } from './user.store';

interface BouncerStore {
  lobby: LobbyQueue;
  delivered: ChronosNotification[];
  loading: boolean;

  addNotification: (input: {
    source: NotificationSource;
    title: string;
    body: string;
    priority: NotificationPriority;
    actionUrl?: string | null;
  }) => Promise<ChronosNotification>;
  deliverLobbyNow: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearDelivered: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}

export const useBouncerStore = create<BouncerStore>()(
  persist(
    immer((set, get) => ({
      lobby: {
        notifications: [],
        nextDeliveryTime: null,
      },
      delivered: [],
      loading: false,

      addNotification: async (input) => {
        const userState = useUserStore.getState();
        const notification: ChronosNotification = {
          id: nanoid(),
          source: input.source,
          title: input.title,
          body: input.body,
          priority: input.priority,
          createdAt: new Date(),
          deliveredAt: null,
          heldUntil: null,
          dismissed: false,
          actionUrl: input.actionUrl ?? null,
        };

        const decision = routeNotification(notification, userState);

        set((state) => {
          if (decision === 'bypass') {
            notification.deliveredAt = new Date();
            state.delivered.unshift(notification);
          } else {
            notification.heldUntil = getNextDeliveryTime();
            state.lobby.notifications.unshift(notification);
            state.lobby.nextDeliveryTime = notification.heldUntil;
          }
        });

        await db.notifications.add(notification);
        return notification;
      },

      deliverLobbyNow: async () => {
        const now = new Date();
        const lobbyItems = get().lobby.notifications;

        set((state) => {
          lobbyItems.forEach((n) => {
            n.deliveredAt = now;
            n.heldUntil = null;
            state.delivered.unshift(n);
          });
          state.lobby.notifications = [];
          state.lobby.nextDeliveryTime = null;
        });

        await db.notifications.bulkPut(lobbyItems);
      },

      dismissNotification: async (id) => {
        set((state) => {
          const delivered = state.delivered.find((n) => n.id === id);
          const lobby = state.lobby.notifications.find((n) => n.id === id);

          if (delivered) delivered.dismissed = true;
          if (lobby) lobby.dismissed = true;

          state.delivered = state.delivered.filter((n) => !n.dismissed);
          state.lobby.notifications = state.lobby.notifications.filter((n) => !n.dismissed);
        });

        const notification = await db.notifications.get(id);
        if (notification) {
          notification.dismissed = true;
          await db.notifications.put(notification);
        }
      },

      clearDelivered: async () => {
        const delivered = get().delivered;

        set((state) => {
          state.delivered = [];
        });

        await db.notifications.bulkPut(
          delivered.map((n) => ({ ...n, dismissed: true }))
        );
      },

      loadFromDb: async () => {
        set((state) => {
          state.loading = true;
        });

        const notifications = await db.notifications
          .where('dismissed')
          .equals(false)
          .toArray();

        set((state) => {
          state.delivered = notifications.filter((n) => n.deliveredAt !== null);
          state.lobby.notifications = notifications.filter((n) => n.deliveredAt === null);
          state.lobby.nextDeliveryTime =
            state.lobby.notifications[0]?.heldUntil ?? null;
          state.loading = false;
        });
      },
    })),
    {
      name: 'chronos-bouncer',
      partialize: (state) => ({
        lobby: state.lobby,
        delivered: state.delivered,
      }),
    }
  )
);

function getNextDeliveryTime(): Date {
  const next = new Date();
  next.setMilliseconds(next.getMilliseconds() + BOUNCER_CONFIG.batchDeliveryDelayMs);
  return next;
}
