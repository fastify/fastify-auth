import fastify, { FastifyRequest, FastifyReply, preHandlerHookHandler, FastifyInstance } from 'fastify';
import fastifyAuth from '../auth'
import { expectType } from 'tsd';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'

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
  app.auth([
    function (request, reply, done) {
      expectType<FastifyInstance>(this)
    },
  ]);
  const auth = app.auth([(request, reply, done) => {}]);
  expectType<preHandlerHookHandler>(auth);
  app.get('/secret', {preHandler: auth}, (request, reply) => {});
  app.get('/private', {preHandler: [auth]}, (request, reply) => {});
});

const typebox = fastify().withTypeProvider<TypeBoxTypeProvider>()
typebox.register(fastifyAuth)
typebox.route({
  method: 'GET',
  url: '/',
  preHandler: typebox.auth([]),
  handler: () => {}
})

const jsonSchemaToTS = fastify().withTypeProvider<JsonSchemaToTsProvider>()
jsonSchemaToTS.register(fastifyAuth)
jsonSchemaToTS.route({
  method: 'GET',
  url: '/',
  preHandler: jsonSchemaToTS.auth([]),
  handler: () => {}
})