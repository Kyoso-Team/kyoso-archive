import { trpc as trpc$ } from '$lib/server/services';
import { signJWT } from '$lib/server/utils';
import { createTestUser } from '$tests/utils';
import { router } from '$trpc/router';

class MockCookies {
  private session: Awaited<ReturnType<typeof createTestUser>> | undefined;

  public get(key: string) {
    if (key === 'session') {
      return signJWT(this.session);
    }

    throw Error("This key hasn't been mocked");
  }

  public async setSessionCookie(user?: Parameters<typeof createTestUser>[0]) {
    const session = user ? await createTestUser(user) : undefined;
    this.session = session;
    return session;
  }
}

class MockClientAddress {
  public ip = '127.0.0.1';

  public set(ip: string) {
    this.ip = ip;
  }
}

export const cookies = new MockCookies();
export const clientAddress = new MockClientAddress();

export const trpc = trpc$.createCallerFactory(router)({
  cookies: cookies as any,
  getClientAddress: () => clientAddress.ip
});
