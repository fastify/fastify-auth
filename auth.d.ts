import { FastifyPlugin, FastifyRequest, FastifyReply } from 'fastify';

export type FastifyAuthFunction = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void
) => void;

declare module 'fastify' {
  interface FastifyInstance {
    auth(
      functions: FastifyAuthFunction[],
      options?: {
        relation?: 'and' | 'or',
        run?: 'all'
      }
    ): void;
  }
}

declare const fastifyAuth: FastifyPlugin;
export default fastifyAuth;
