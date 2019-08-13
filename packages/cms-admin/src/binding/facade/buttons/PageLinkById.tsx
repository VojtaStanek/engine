import * as React from 'react'
import { ReactNode } from 'react'
import { InnerProps } from '../../../components/Link'
import PageLink, { AnyParams, PageConfig } from '../../../components/pageRouting/PageLink'
import { DataContext } from '../../coreComponents'
import { DataBindingError, EntityAccessor, EntityForRemovalAccessor } from '../../dao'

interface PageLinkByIdProps<P extends AnyParams> {
	change: (id: string) => PageConfig<P, keyof P>
	Component?: React.ComponentType<InnerProps>
	children?: ReactNode
}

export const PageLinkById = React.memo(function<P extends AnyParams>(props: PageLinkByIdProps<P>) {
	const data = React.useContext(DataContext)

	if (data instanceof EntityAccessor) {
		const id = data.primaryKey

		if (typeof id === 'string') {
			return (
				<PageLink change={() => props.change(id)} Component={props.Component}>
					{props.children}
				</PageLink>
			)
		}
		return null
	} else if (data instanceof EntityForRemovalAccessor) {
		return null // Do nothing
	}
	throw new DataBindingError('Corrupted data')
})