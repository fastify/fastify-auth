import { FastifyPlugin, FastifyRequest, FastifyReply, preHandlerHookHandler, FastifyInstance } from 'fastify';

export type FastifyAuthFunction = (
  this: FastifyInstance,
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
    ): preHandlerHookHandler;
  }
}

declare const fastifyAuth: FastifyPlugin;
export default fastifyAuth;
