import type { SSEConnection } from '$types';

export function createSSEListener<T extends SSEConnection>(
  endpoint: string,
  handleMessages: T['handle']
) {
  const listener = new EventSource(endpoint);

  function onMessage(e: MessageEvent) {
    const data = JSON.parse(e.data) as T['message'];
    const fn = handleMessages[data.type as keyof T['handle']];

    if (!fn) {
      console.warn('Unknown message type', data.type);
      return;
    }

    if (data.type === 'error') {
      fn(`${data.data}. Try to refresh the page to solve this issue.`);
      listener.close();
      return;
    }

    fn(data.data);
  }

  listener.addEventListener('message', onMessage);
  return () => {
    listener.close();
    listener.removeEventListener('message', onMessage);
  };
}
