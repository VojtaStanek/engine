import * as React from 'react'
import { AccessorTreeStateContext, useAccessorTreeState } from '../accessorTree'
import { EntityName } from '../bindingTypes'
import { MarkerTreeRoot } from '../markers'
import { Component } from './Component'

interface EntityCreatorProps {
	entityName: EntityName
	children: React.ReactNode
}

export const EntityCreator = Component<EntityCreatorProps>(
	props => {
		const children = React.useMemo(() => <EntityCreator {...props}>{props.children}</EntityCreator>, [props])
		const [accessorTreeState] = useAccessorTreeState({
			nodeTree: children,
		})

		return (
			<AccessorTreeStateContext.Provider value={accessorTreeState}>{props.children}</AccessorTreeStateContext.Provider>
		)
	},
	{
		generateMarkerTreeRoot: (props, fields, environment) =>
			new MarkerTreeRoot(environment.getSystemVariable('treeIdFactory')(), props.entityName, fields, undefined),
	},
	'EntityCreator',
)
