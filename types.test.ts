import * as http from 'http';
import * as fastify from 'fastify';
import fastifyAuth = require('./');

const app = fastify();

app.register(fastifyAuth).after((err) => {
  app.auth([
    (
      _request: fastify.FastifyRequest<
        http.IncomingMessage,
        fastify.DefaultQuery,
        fastify.DefaultParams,
        fastify.DefaultHeaders,
        any
      >,
      _reply: fastify.FastifyReply<http.ServerResponse>,
      done
    ) => {
      done(new Error());
      done();
    },
  ], {relation: 'or'});
  app.auth([
    (
      _request: fastify.FastifyRequest<
        http.IncomingMessage,
        fastify.DefaultQuery,
        fastify.DefaultParams,
        fastify.DefaultHeaders,
        any
      >,
      _reply: fastify.FastifyReply<http.ServerResponse>,
      done
    ) => {
      done(new Error());
      done();
    },
  ]);
});
