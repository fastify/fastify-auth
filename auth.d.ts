import { ContextConfigDefault, FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest, FastifySchema, preHandlerHookHandler } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';

export type FastifyAuthFunction = (
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void
) => void;

declare module 'fastify' {
  interface FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider> {
    auth(
      functions: FastifyAuthFunction[],
      options?: {
        relation?: 'and' | 'or',
        run?: 'all'
      }
    ): preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGenericInterface, ContextConfigDefault, FastifySchema, TypeProvider>;
  }
}

declare const fastifyAuth: FastifyPluginCallback;
export default fastifyAuth;
