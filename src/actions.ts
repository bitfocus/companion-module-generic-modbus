import type { ModuleInstance } from './main.js'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		output_relay: {
			name: 'Set output relay status',
			options: [
				{
					id: 'output',
					type: 'textinput',
					label: 'Output',
					default: '1',
					useVariables: true,
				},
				{
					id: 'status',
					type: 'textinput',
					label: 'Status (1 = on, 0 = off)',
					default: '1',
					useVariables: true,
				},
			],
			callback: async (event) => {
				//self.log('info', 'Run' + self.client)
				if (self.client) {
					const output = parseInt(await self.parseVariablesInString(event.options.output as string))
					const status = parseInt(await self.parseVariablesInString(event.options.status as string))
					self.log('info', output + ' ' + status)
					if (!isNaN(output) && !isNaN(status)) {
						self.client.writeSingleCoil(output - 1, status === 1 ? true : false).catch((e) => console.error(e))
					}
				}
			},
		},
	})
}
