import env from '$lib/env/server';
import jwt from 'jsonwebtoken';

export function signJWT<T>(data: T) {
  return jwt.sign(data as string | object | Buffer, env.JWT_SECRET, {
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });
}

export function verifyJWT<T>(token?: string) {
  if (!token) {
    return undefined;
  }

  try {
    return jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256']
    }) as T;
  } catch {
    return undefined;
  }
}
