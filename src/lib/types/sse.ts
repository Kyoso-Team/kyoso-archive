import type * as v from 'valibot';
import type { Simplify } from './utils';
import type { notificationListenRespSchema } from '$lib/validation';

export type SSEConnection<
  T1 extends Record<string, any> = Record<string, any>,
  T2 = T1 & { error: string }
> = Simplify<{
  message: {
    [K in keyof T2]: { type: K; data: T2[K] };
  }[keyof T2];
  handle: {
    [K in keyof T2]: (data: T2[K]) => void;
  };
}>;

export interface SSEConnections {
  notifications: SSEConnection<{
    notification_count: number;
    new_notification: Omit<v.InferOutput<typeof notificationListenRespSchema>, 'notify'>;
  }>;
}

export type SSEConnectionData<S extends SSEConnection, K extends S['message']['type']> = Simplify<
  Extract<S['message'], { type: K }>['data']
>;