import fastify, { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import fastifyAuth from '../auth'
import { expectType } from 'tsd';

const app = fastify();

type Done = (error?: Error) => void

app.register(fastifyAuth).after((err) => {
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ], {relation: 'or'});
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ], {run: 'all'});
  app.auth([
    (request, reply, done) => {
			expectType<FastifyRequest>(request)
			expectType<FastifyReply>(reply)
			expectType<Done>(done)
    },
  ]);
  const auth = app.auth([(request, reply, done) => {}]);
  expectType<preHandlerHookHandler>(auth);
  app.get('/secret', {preHandler: auth}, (request, reply) => {});
  app.get('/private', {preHandler: [auth]}, (request, reply) => {});
});
