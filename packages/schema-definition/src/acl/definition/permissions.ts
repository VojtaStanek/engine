import { Acl } from '@contember/schema'
import { Role } from './roles.js'
import { VariableDefinition } from './variables.js'
import { PredicateEvaluationReference } from './references.js'
import { allowDefinitionsStore } from './internal/stores.js'
import { DecoratorFunction, EntityConstructor } from '../../model/definition/types.js'

export type PredicateExtra = PredicateEvaluationReference | VariableDefinition
export type WhenDefinition = Acl.PredicateDefinition<PredicateExtra>

export interface AllowDefinition<E> {
	when?: WhenDefinition
	name?: string
	create?: true | (keyof E)[]
	update?: true | (keyof E)[]
	read?: true | (keyof E)[]
	delete?: true
}

export const allow = <E, R extends Role<string>>(role: R | R[], args: AllowDefinition<E>): DecoratorFunction<E> => {
	return (entity: EntityConstructor<E>) => {
		(Array.isArray(role) ? role : [role]).forEach(role => {
			allowDefinitionsStore.update(entity, val => [...val, { ...args, role }])
		})
	}
}


