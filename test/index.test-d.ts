import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyAuth from '..'
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
});