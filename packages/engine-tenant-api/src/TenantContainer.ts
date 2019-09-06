import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { DatabaseCredentials, MigrationsRunner, Identity } from '@contember/engine-common'
import { QueryHandler } from '@contember/queryable'
import { Connection, DatabaseQueryable } from '@contember/database'
import { Builder } from '@contember/dic'
import {
	AddProjectMemberMutationResolver,
	ApiKeyManager,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	createMigrationFilesManager,
	DisableApiKeyMutationResolver,
	IdentityTypeResolver,
	MeQueryResolver,
	PasswordChangeManager,
	PermissionsFactory,
	ProjectManager,
	ProjectMemberManager,
	RemoveProjectMemberMutationResolver,
	ResolverFactory,
	Schema,
	SetupMutationResolver,
	SignInManager,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpManager,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './'
import { CommandBus } from './model/commands/CommandBus'
import { Providers } from './model/providers'

interface TenantContainer {
	projectMemberManager: ProjectMemberManager
	apiKeyManager: ApiKeyManager
	signUpManager: SignUpManager
	projectManager: ProjectManager
	dbMigrationsRunner: MigrationsRunner
	resolvers: Schema.Resolvers
	authorizator: Authorizator<Identity>
}

namespace TenantContainer {
	export class Factory {
		create(tenantDbCredentials: DatabaseCredentials, providers: Providers): TenantContainer {
			return this.createBuilder(tenantDbCredentials, providers)
				.build()
				.pick(
					'apiKeyManager',
					'projectMemberManager',
					'projectManager',
					'dbMigrationsRunner',
					'signUpManager',
					'resolvers',
					'authorizator',
				)
		}

		createBuilder(tenantDbCredentials: DatabaseCredentials, providers: Providers) {
			return new Builder({})
				.addService('connection', (): Connection.ConnectionLike & Connection.ClientFactory => {
					return new Connection(tenantDbCredentials, {})
				})
				.addService('db', ({ connection }) => connection.createClient('tenant'))
				.addService('providers', () => providers)
				.addService('commandBus', ({ db, providers }) => new CommandBus(db, providers))
				.addService(
					'dbMigrationsRunner',
					() => new MigrationsRunner(tenantDbCredentials, 'tenant', createMigrationFilesManager().directory),
				)
				.addService('queryHandler', ({ db }) => {
					const handler = new QueryHandler(
						new DatabaseQueryable(db, {
							get(): QueryHandler<DatabaseQueryable> {
								return handler
							},
						}),
					)

					return handler
				})
				.addService(
					'accessEvaluator',
					({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()),
				)
				.addService('authorizator', ({ accessEvaluator }) => new Authorizator.Default(accessEvaluator))

				.addService('apiKeyManager', ({ queryHandler, commandBus }) => new ApiKeyManager(queryHandler, commandBus))
				.addService('signUpManager', ({ queryHandler, commandBus }) => new SignUpManager(queryHandler, commandBus))
				.addService('passwordChangeManager', ({ commandBus }) => new PasswordChangeManager(commandBus))
				.addService(
					'signInManager',
					({ queryHandler, apiKeyManager }) => new SignInManager(queryHandler, apiKeyManager),
				)
				.addService(
					'projectMemberManager',
					({ queryHandler, commandBus }) => new ProjectMemberManager(queryHandler, commandBus),
				)
				.addService('projectManager', ({ queryHandler, commandBus }) => new ProjectManager(queryHandler, commandBus))

				.addService('meQueryResolver', () => new MeQueryResolver())
				.addService(
					'signUpMutationResolver',
					({ signUpManager, apiKeyManager }) => new SignUpMutationResolver(signUpManager, apiKeyManager),
				)
				.addService('signInMutationResolver', ({ signInManager }) => new SignInMutationResolver(signInManager))
				.addService(
					'signOutMutationResolver',
					({ apiKeyManager, queryHandler }) => new SignOutMutationResolver(apiKeyManager, queryHandler),
				)
				.addService(
					'changePasswordMutationResolver',
					({ passwordChangeManager, queryHandler }) =>
						new ChangePasswordMutationResolver(passwordChangeManager, queryHandler),
				)
				.addService(
					'addProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new AddProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'setupMutationResolver',
					({ signUpManager, apiKeyManager }) => new SetupMutationResolver(signUpManager, apiKeyManager),
				)
				.addService(
					'updateProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new UpdateProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'removeProjectMemberMutationResolver',
					({ projectMemberManager, projectManager }) =>
						new RemoveProjectMemberMutationResolver(projectMemberManager, projectManager),
				)
				.addService(
					'createApiKeyMutationResolver',
					({ apiKeyManager, projectManager }) => new CreateApiKeyMutationResolver(apiKeyManager, projectManager),
				)
				.addService(
					'disableApiKeyMutationResolver',
					({ apiKeyManager }) => new DisableApiKeyMutationResolver(apiKeyManager),
				)
				.addService(
					'identityTypeResolver',
					({ queryHandler, projectMemberManager }) => new IdentityTypeResolver(queryHandler, projectMemberManager),
				)

				.addService('resolvers', container => new ResolverFactory(container).create())
		}
	}
}

export { TenantContainer }