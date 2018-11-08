import {IncomingMessage, Server, ServerResponse} from 'http';
import {
  DefaultQuery,
  DefaultParams,
  DefaultHeaders,
  FastifyMiddleware,
  FastifyRequest,
  FastifyReply,
  Plugin,
  DefaultBody,
} from 'fastify';

declare namespace fastifyAuth {
  interface Options {}
  type AuthFunction = (
    request: FastifyRequest<
      IncomingMessage,
      DefaultQuery,
      DefaultParams,
      DefaultHeaders,
      DefaultBody
    >,
    reply: FastifyReply<ServerResponse>,
    done: (error?: Error) => void
  ) => void;
}

declare module 'fastify' {
  interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse
  > {
    auth(
      functions: fastifyAuth.AuthFunction[]
    ): FastifyMiddleware<
      HttpServer,
      HttpRequest,
      HttpResponse,
      DefaultQuery,
      DefaultParams,
      DefaultHeaders,
      DefaultBody
    >;
  }
}

declare let fastifyAuth: Plugin<Server, IncomingMessage, ServerResponse, fastifyAuth.Options>;

export = fastifyAuth;
