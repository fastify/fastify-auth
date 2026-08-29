'use strict'

/**
 * @type {{
 *   DEFAULT_RELATION: import('../types/index').FastifyAuthRelation,
 *   ALLOWED_RELATIONS: import('../types/index').FastifyAuthRelation[]
 * }}
 */
module.exports = {
  DEFAULT_RELATION: 'or',
  ALLOWED_RELATIONS: ['or', 'and']
}
