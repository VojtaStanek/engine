import * as React from 'react'
import {
	Component,
	DataBindingError,
	Environment,
	Field,
	FieldValue,
	OptionallyVariableFieldValue,
	SugaredRelativeSingleField,
	useEnvironment,
	useRelativeSingleField,
	VariableInputTransformer,
} from '../../../../binding'
import { ChoiceFieldData } from './ChoiceFieldData'

export interface StaticOption {
	label: string
	description?: React.ReactNode
}

export interface NormalizedStaticOption extends StaticOption {
	value: FieldValue
}

export interface OptionallyVariableStaticOption extends StaticOption {
	value: OptionallyVariableFieldValue
}

export interface StaticChoiceFieldProps<Arity extends ChoiceFieldData.ChoiceArity = ChoiceFieldData.ChoiceArity>
	extends SugaredRelativeSingleField {
	options: OptionallyVariableStaticOption[]
	arity: Arity
}

const normalizeOptions = (options: OptionallyVariableStaticOption[], environment: Environment) =>
	options.map(
		(options): NormalizedStaticOption => ({
			value: VariableInputTransformer.transformValue(options.value, environment),
			label: options.label,
			description: options.description,
		}),
	)

export const useStaticChoiceField = <Arity extends ChoiceFieldData.ChoiceArity>(
	props: StaticChoiceFieldProps<Arity>,
): ChoiceFieldData.MetadataByArity[Arity] => {
	if (props.arity === 'multiple') {
		throw new DataBindingError('Static multiple-choice choice fields are not supported yet.')
	}

	const environment = useEnvironment()
	const field = useRelativeSingleField(props)
	const options = React.useMemo(() => normalizeOptions(props.options, environment), [environment, props.options])
	const currentValue: ChoiceFieldData.ValueRepresentation = options.findIndex(({ value }) => field.hasValue(value))
	const data = React.useMemo(
		() =>
			options.map(({ label, description, value: actualValue }, i) => ({
				key: i,
				description,
				label,
				actualValue,
			})),
		[options],
	)
	const onChange = React.useCallback(
		(newValue: ChoiceFieldData.ValueRepresentation) => {
			field.updateValue && field.updateValue(options[newValue].value)
		},
		[field, options],
	)
	const metadata = React.useMemo<ChoiceFieldData.MetadataByArity['single']>(
		() => ({
			currentValue,
			data,
			onChange,
			errors: field.errors,
		}),
		[currentValue, data, field.errors, onChange],
	)

	return metadata as any // TS… 🙁
}

export const StaticChoiceField = Component<StaticChoiceFieldProps<any> & ChoiceFieldData.MetadataPropsByArity>(
	props => {
		const metadata = useStaticChoiceField(props)

		return props.children(metadata)
	},
	props => <Field {...props} />,
	'StaticChoiceField',
)
