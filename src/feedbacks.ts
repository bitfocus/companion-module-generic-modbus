import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		InputState: {
			name: 'Input State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'input_number',
					type: 'number',
					label: 'Input Number',
					default: 1,
					min: 1,
					max: 8,
				},
			],
			callback: (feedback) => {
				return self.getVariableValue(`input${feedback.options.input_number}_status`) ? true : false
			},
		},
	})
}
