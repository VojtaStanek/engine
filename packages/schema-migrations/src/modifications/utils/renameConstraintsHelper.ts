import { Model } from '@contember/schema'
import { MigrationBuilder } from 'node-pg-migrate'
import { EntityUpdater } from '../schemaUpdateUtils'

type NameGenerator = (constraint: Model.UniqueConstraint) => string | null
export const renameConstraintsSqlBuilder = (
	builder: MigrationBuilder,
	entity: Model.Entity,
	nameGenerator: NameGenerator,
) => {
	const tableName = entity.tableName
	for (const constraint of Object.values(entity.unique)) {
		const newName = nameGenerator(constraint)
		if (newName === null) {
			continue
		}
		builder.renameConstraint(tableName, constraint.name, newName)
	}
}

export const renameConstraintSchemaUpdater = (nameGenerator: NameGenerator): EntityUpdater => {
	return entity => {
		const newConstraints: Model.UniqueConstraints = {}
		for (const constraint of Object.values(entity.unique)) {
			const newName = nameGenerator(constraint)
			if (newName === null) {
				newConstraints[constraint.name] = constraint
			} else {
				newConstraints[newName] = { ...constraint, name: newName }
			}
		}
		return { ...entity, unique: newConstraints }
	}
}
