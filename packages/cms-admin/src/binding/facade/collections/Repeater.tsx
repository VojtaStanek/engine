import * as React from 'react'
import { FormGroup, FormGroupProps } from '../../../components/ui'
import {
	DataContext,
	EnforceSubtypeRelation,
	EnvironmentContext,
	SyntheticChildrenProvider,
	ToMany,
	ToManyProps,
} from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { AddNewButton, RemoveButton, RemoveButtonProps } from '../buttons'

export interface RepeaterProps extends ToManyProps, Repeater.EntityCollectionPublicProps {}

class Repeater extends React.PureComponent<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) =>
					QueryLanguage.wrapRelativeEntityList(
						this.props.field,
						atomicPrimitiveProps => (
							<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
								{(field: EntityCollectionAccessor) => {
									return (
										<Repeater.EntityCollection
											entities={field}
											label={this.props.label}
											enableAddingNew={this.props.enableAddingNew}
											enableUnlink={this.props.enableUnlink}
											enableUnlinkAll={this.props.enableUnlinkAll}
											removeType={this.props.removeType}
										>
											{this.props.children}
										</Repeater.EntityCollection>
									)
								}}
							</ToMany.AccessorRetriever>
						),
						environment,
					)
				}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: RepeaterProps): React.ReactNode {
		return <ToMany field={props.field}>{props.children}</ToMany>
	}
}

namespace Repeater {
	export interface ItemPublicProps {
		removeType?: RemoveButtonProps['removeType']
		children?: React.ReactNode
	}

	export interface ItemProps extends ItemPublicProps {
		entity: EntityAccessor
		displayUnlinkButton: boolean
	}

	export class Item extends React.PureComponent<ItemProps> {
		public render() {
			return (
				<DataContext.Provider value={this.props.entity}>
					<div className="repeaterItem">
						<div className="repeaterItem-in">
							<div className="repeaterItem-content">{this.props.children}</div>
							{this.props.displayUnlinkButton && (
								<RemoveButton className="repeaterItem-button" removeType={this.props.removeType} />
							)}
						</div>
					</div>
				</DataContext.Provider>
			)
		}
	}

	export interface EntityCollectionPublicProps extends ItemPublicProps {
		label?: FormGroupProps['label']
		enableUnlink?: boolean
		enableUnlinkAll?: boolean
		enableAddingNew?: boolean
	}

	export interface EntityCollectionProps extends EntityCollectionPublicProps {
		entities: EntityCollectionAccessor
	}

	export class EntityCollection extends React.PureComponent<EntityCollectionProps> {
		public render() {
			const entities = filterEntities(this.props.entities)
			return (
				// Intentionally not applying label system middleware
				<FormGroup label={this.props.label}>
					<Cloneable appendNew={this.props.entities.addNew} enableAddingNew={this.props.enableAddingNew}>
						{entities.map(entity => (
							<Item
								displayUnlinkButton={
									this.props.enableUnlink !== false && (entities.length > 1 || this.props.enableUnlinkAll === true)
								}
								entity={entity}
								key={entity.getKey()}
								removeType={this.props.removeType}
							>
								{this.props.children}
							</Item>
						))}
					</Cloneable>
				</FormGroup>
			)
		}
	}

	export interface CloneableProps {
		prependNew?: EntityCollectionAccessor['addNew']
		appendNew?: EntityCollectionAccessor['addNew']
		enableAddingNew?: boolean
	}

	export class Cloneable extends React.PureComponent<CloneableProps> {
		public render() {
			return this.props.enableAddingNew === false ? (
				this.props.children
			) : (
				<div className="cloneable">
					{this.props.prependNew && <AddNewButton addNew={this.props.prependNew} className="cloneable-button" />}
					<div className="cloneable-content">{this.props.children}</div>
					{this.props.appendNew && <AddNewButton addNew={this.props.appendNew} className="cloneable-button" />}
				</div>
			)
		}
	}

	export const filterEntities = (
		entities: EntityCollectionAccessor,
		excludeUnpersisted: boolean = false,
	): EntityAccessor[] => {
		return entities.entities.filter(
			(item): item is EntityAccessor => item instanceof EntityAccessor && (!excludeUnpersisted || item.isPersisted()),
		)
	}
}

export { Repeater }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, SyntheticChildrenProvider<RepeaterProps>>