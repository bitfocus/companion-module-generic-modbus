import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variableDefinitions = []
	for (let i = 1; i <= 8; i++) {
		variableDefinitions.push({
			variableId: `input${i}_status`,
			name: `Input ${i} Status`,
		})
	}
	self.setVariableDefinitions(variableDefinitions)
}
