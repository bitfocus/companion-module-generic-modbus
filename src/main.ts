import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import Modbus from 'jsmodbus'
import net from 'net'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()
	pollTimeout?: NodeJS.Timeout
	socket?: net.Socket
	client?: Modbus.ModbusTCPClient

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		void this.initConnection()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		if (this.socket) {
			clearTimeout(this.pollTimeout)
			this.socket.destroy()
			this.socket = undefined
		}
		void this.initConnection()
	}

	async initConnection(): Promise<void> {
		try {
			this.updateStatus(InstanceStatus.Connecting)
			this.log('info', 'Connecting...' + JSON.stringify(this.config))
			const socket = new net.Socket()
			this.socket = socket
			const client = new Modbus.client.TCP(socket, 1) // 1 = unitId/slaveId
			this.client = client
			const options = {
				host: this.config.host || '127.0.0.1',
				port: this.config.port || 502,
			}

			socket.connect(options)
			socket.on('error', (e) => {
				this.log('error', 'error ' + e)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})
			socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok)
				this.log('info', 'Connected to Modbus server!')
				const currentValues: Record<string, boolean> = {}
				const poll = async () => {
					try {
						const resp = await client.readDiscreteInputs(0, 8)
						const relayValues = Object.fromEntries(
							resp.response.body.valuesAsArray
								.slice(0, 8)
								.map((value, index) => [`input${index + 1}_status`, Boolean(value)] as const)
								.filter(([key, value]) => currentValues[key] !== value),
						)
						if (Object.values(relayValues).length > 0) {
							this.setVariableValues(relayValues)
							this.checkFeedbacks('InputState')
						}
					} catch (err) {
						console.error(err)
					}
					this.pollTimeout = setTimeout(poll as () => void, 100)
				}
				void poll()
			})
		} catch (e) {
			this.log('error', 'Error when initializing Modbus connection ' + e)
		}
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
