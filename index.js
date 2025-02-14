const util = require('util');
const WebSocket = require('ws');
const { Extension, log, PLATFORMS, INPUT_METHOD } = require("deckboard-kit");

class PulseSyncExtension extends Extension {
	constructor(props) {
		super(props);
		log.error(util.inspect(props, false, null, false /* enable colors */))
		this.dialog = props.dialog;
		this.setValue = props.setValue;
		this.setLabel = props.setLabel;
		this.data = props.data;

		this.websocket = undefined;
		this.clients = new Set();

		this.name = "PulseSync Controls";
		this.platforms = [PLATFORMS.WINDOWS];
		this.inputs = [
			{
				label: 'Forward',
				value: "forward",
				icon: "forward",
				color: '#3C78D8'
			},
			{
				label: 'Backward',
				value: "backward",
				icon: "backward",
				color: '#3C78D8'
			},
			{
				label: "Pause",
				value: "pause",
				icon: "pause",
				color: '#3C78D8'
			},
			{
				label: "Volume Up",
				value: "volume-up",
				icon: "volume-up",
				color: '#3C78D8',
				input: [
					{
						label: "Percent",
						ref: "upPercent",
						type: INPUT_METHOD.INPUT_TEXT
					},
				],
			},
			{
				label: "Volume Down",
				value: "volume-down",
				icon: "volume-down",
				color: '#3C78D8',
				input: [
					{
						label: "Percent",
						ref: "downPercent",
						type: INPUT_METHOD.INPUT_TEXT
					},
				],
			}
		];
		this.configs = {
			port: {
				descriptions: "WebSocket port",
				name: "Port",
				type: "text",
				value: "",
			},
		};
		this.initExtension();
	}

	// Executes when the extensions loaded every time the app start.
	initExtension() {
		this.initPlugin().catch((e) => log.error(e));
	}

	get selections() {
		return [
			{
				header: this.name,
			},
			...this.inputs,
		];
	}

	async initPlugin() {
		try {
			this.websocket = new WebSocket.Server({ port: Number(this.configs.port.value) || 8765 });

			this.websocket.on('connection', (ws) => {
				this.clients.add(ws);

				ws.send(JSON.stringify({ type: 'connected', data: 'Successfully connected!' }));

				ws.on('close', () => {
					this.clients.delete(ws);
				});
			});

			this.websocket.on('error', (e) => {
				log.error(e);
			});


		} catch (e) {
			log.error(e);
		}
	}

	broadcast(message) {
		try {
			for (const client of this.clients) {
				client.send(JSON.stringify(message));
			}
		} catch (e) {
			log.error(e);
		}
	}

	execute(action, args) {
		switch (action) {
			case "forward":
				return this.broadcast({ type: 'forward' });
			case "backward":
				return this.broadcast({ type: 'backward' });
			case "pause":
				return this.broadcast({ type: 'pause' });
			case "volume-up":
				return this.broadcast({ type: 'volume-up', data: args.upPercent || 5 });
			case "volume-down":
				return this.broadcast({ type: 'volume-down', data: args.downPercent || 5 });
		}
	}
}

module.exports = (sendData) => new PulseSyncExtension(sendData);