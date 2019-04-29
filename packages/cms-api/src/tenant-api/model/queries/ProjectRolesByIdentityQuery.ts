import DbQuery from '../../../core/database/DbQuery'
import DbQueryable from '../../../core/database/DbQueryable'

class ProjectRolesByIdentityQuery extends DbQuery<ProjectRolesByIdentityQuery.Result> {
	constructor(private readonly projectId: string, private readonly identityId: string) {
		super()
	}

	async fetch(queryable: DbQueryable): Promise<ProjectRolesByIdentityQuery.Result> {
		const result = await queryable
			.createSelectBuilder<ProjectRolesByIdentityQuery.Result>()
			.select('roles')
			.from('project_member')
			.where({
				identity_id: this.identityId,
				project_id: this.projectId,
			})
			.getResult()

		const row = this.fetchOneOrNull(result)

		return row ? row : { roles: [] }
	}
}

namespace ProjectRolesByIdentityQuery {
	export type Result = {
		roles: string[]
	}
}

export default ProjectRolesByIdentityQuery
