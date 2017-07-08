# fastify-auth

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)  [![Build Status](https://travis-ci.org/fastify/fastify-auth.svg?branch=master)](https://travis-ci.org/fastify/fastify-auth)

Fastify authorization - proof of concept.

## Usage
Install the dependencies and run the server:
```
npm i
npm start
```

Then use the following to test the server:
```
# route without authorizatrion
curl  http://localhost:3000/no-auth

# route with authorizatrion
curl -H "auth: authstring" http://localhost:3000/auth

# register a new user
curl -H "Content-Type: application/json" -X POST -d '{"user":"abc","password":xyz"}' http://localhost:3000/register
```

If you want to reset the database, run `npm run clean`.  
For the tests: `npm test`.

## Acknowledgements

This project is kindly sponsored by:
- [LetzDoIt](http://www.letzdoitapp.com/)

## License

Licensed under [MIT](./LICENSE).
