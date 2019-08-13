import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import { SelectedDimension } from '../../state/request'
import SystemMiddleware = Environment.SystemMiddleware

class Environment {
	public constructor(
		private readonly names: Environment.NameStore = {
			dimensions: {},
		},
	) {}

	public hasName(name: keyof Environment.NameStore): boolean {
		return name in this.names
	}

	public hasDimension(dimensionName: keyof SelectedDimension): boolean {
		return dimensionName in this.names.dimensions
	}

	public getValueOrElse<F>(name: keyof Environment.NameStore, fallback: F): Environment.Value | F {
		if (!this.hasName(name)) {
			return fallback
		}
		return this.names[name]
	}

	public getDimensionOrElse<F>(dimensionName: keyof SelectedDimension, fallback: F): string[] | F {
		if (!this.hasDimension(dimensionName)) {
			return fallback
		}
		return this.names.dimensions[dimensionName]
	}

	public getValue(name: keyof Environment.NameStore): Environment.Value {
		return this.names[name]
	}

	public getDimension(dimensionName: keyof SelectedDimension): string[] {
		return this.names.dimensions[dimensionName]
	}

	public getAllNames(): Environment.NameStore {
		return { ...this.names }
	}

	public getAllDimensions(): SelectedDimension {
		return { ...this.names.dimensions }
	}

	public getSystemVariable<N extends Environment.SystemVariableName>(name: N): Environment.SystemVariables[N] {
		return this.names[name]
	}

	public putName(name: Environment.Name, value: Environment.Value): Environment {
		return new Environment({
			...this.names,
			dimensions: { ...this.names.dimensions },
			[name]: value,
		})
	}

	public putSystemVariable<N extends Environment.SystemVariableName>(
		name: N,
		value: Environment.SystemVariables[N],
	): Environment {
		return this.putName(name, value)
	}

	public putDelta(delta: Partial<Environment.NameStore>): Environment {
		const currentNames = this.getAllNames()

		for (const newName in delta) {
			const deltaValue = delta[newName]
			if (deltaValue === undefined) {
				delete currentNames[newName]
			} else {
				currentNames[newName] = deltaValue
			}
		}

		return new Environment(currentNames)
	}

	public updateDimensionsIfNecessary(
		dimensions: Environment.NameStore['dimensions'],
		defaultDimensions: Environment.NameStore['dimensions'],
	): Environment {
		const normalizedDimensions: Environment.NameStore['dimensions'] = {
			...defaultDimensions,
			...dimensions,
		}

		const dimensionsEqual = JSON.stringify(this.names.dimensions) === JSON.stringify(normalizedDimensions)
		return dimensionsEqual
			? this
			: new Environment({
					...this.names,
					dimensions: { ...normalizedDimensions },
			  })
	}

	public static generateDelta(
		currentEnvironment: Environment,
		delta: Environment.DeltaFactory,
	): Partial<Environment.NameStore> {
		const newDelta: Partial<Environment.NameStore> = {}

		for (const name in delta) {
			const value = delta[name]

			newDelta[name] =
				value && value instanceof Function && !Environment.systemVariableNames.includes(name as any)
					? value(currentEnvironment)
					: delta[name]
		}

		return newDelta
	}

	public applySystemMiddleware<
		N extends Environment.SystemMiddlewareName,
		A extends Parameters<Exclude<Environment.SystemMiddleware[N], undefined>>
	>(name: N, ...args: A): ReturnType<Exclude<Environment.SystemMiddleware[N], undefined>> | A {
		const middleware: SystemMiddleware[N] = this.names[name]
		if (typeof middleware === 'function') {
			return (middleware as (...args: A) => any)(...args)
		}
		return args
	}
}

namespace Environment {
	export type Name = string | number

	export type Value = React.ReactNode

	export interface SystemVariables {
		labelMiddleware?: (label: IFormGroupProps['label']) => React.ReactNode
	}

	export const systemVariableNames: SystemVariableName[] = ['labelMiddleware']

	export type SystemVariableName = keyof SystemVariables

	export interface NameStore extends SystemVariables {
		dimensions: SelectedDimension

		[name: string]: Value
	}

	export type DeltaFactory = { [N in string]: ((environment: Environment) => Environment.Value) | Environment.Value } &
		{ [N in keyof SystemVariables]: SystemVariables[N] }

	export type SystemMiddleware = {
		[N1 in {
			[N2 in SystemVariableName]: SystemVariables[N2] extends (undefined | ((...args: any[]) => any)) ? N2 : never
		}[SystemVariableName]]: SystemVariables[N1]
	}

	export type SystemMiddlewareName = keyof SystemMiddleware
}

export { Environment }