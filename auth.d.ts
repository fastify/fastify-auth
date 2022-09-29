import { ContextConfigDefault, FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest, FastifySchema, preHandlerHookHandler } from 'fastify';
import { RouteGenericInterface } from 'fastify/types/route';

export type FastifyAuthFunction = (
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void
) => void;

/**
 * @link [`fastify-auth` options documentation](https://github.com/fastify/fastify-auth#options)
 */
export interface FastifyAuthPluginOptions {
  /**
   * The default relation between the functions. It can be either `or` or `and`.
   *
   * - Default value: `or`
   */
   defaultRelation?: 'and' | 'or',
}

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

declare const fastifyAuth: FastifyPluginCallback<FastifyAuthPluginOptions>
export default fastifyAuth;
