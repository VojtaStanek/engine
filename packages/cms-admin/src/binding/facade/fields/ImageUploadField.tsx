import * as React from 'react'
import { FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { SimpleRelativeSingleField } from '../auxiliary'
import { UploadField } from './UploadField'

export interface ImageUploadFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export const ImageUploadField = SimpleRelativeSingleField<ImageUploadFieldProps>(
	props => (
		<UploadField name={props.name} label={props.label} accept="image/*" emptyText={'No image'}>
			{url => <img src={url} />}
		</UploadField>
	),
	'ImageUploadField'
)
