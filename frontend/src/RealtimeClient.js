import request from 'superagent';
import mqtt from 'mqtt';

const LAST_WILL_TOPIC = 'last-will';
const MESSAGE_TOPIC = 'message';
const CLIENT_CONNECTED = 'client-connected';
const CLIENT_DISCONNECTED = 'client-disconnected';

const getNotification = (clientId, username) => JSON.stringify({clientId, username}, null, 4);

const validateClientConnected = (client) => {
	if (!client) {
		throw new Error('Client is not connected. Call client.connect() first');
	}
};

export default (clientId, username) => {
	const options = {
		will: {
			topic: LAST_WILL_TOPIC,
			payload: getNotification(clientId, username)
		}
	};

	let client = null;

	const clientWrapper = {};

	clientWrapper.connect = () => request('/iot-presigned-url')
		.then(response => {
			client = mqtt.connect(response.body.url, options);

			client.on('connect', () => {
				console.log('Connected to AWS IoT Broker');
				client.subscribe(MESSAGE_TOPIC);
				client.subscribe(CLIENT_CONNECTED);
				client.subscribe(CLIENT_DISCONNECTED);

				const connectNotification = getNotification(clientId, username);
				client.publish(CLIENT_CONNECTED, connectNotification);
				console.log(`Sent message: ${CLIENT_CONNECTED} - ${connectNotification}`);
			});

			client.on('close', () => {
				console.log('Connection to AWS IoT Broker closed');
				client.end();
			});
		});

	clientWrapper.onConnect = (cb) => {
		validateClientConnected(client);
		client.on('connect', cb);
		return clientWrapper;
	};

	clientWrapper.onDisconnect = (cb) => {
		validateClientConnected(client);
		client.on('close', cb);
		return clientWrapper;
	};

	clientWrapper.onMessageReceived = (cb) => {
		validateClientConnected(client);
		client.on('message', (topic, msg) => {
			console.log(`Received message: ${topic} - ${msg}`);
			cb(topic, JSON.parse(msg.toString('utf8')));
		});
		return clientWrapper;
	};

	clientWrapper.sendMessage = (msg) => {
		validateClientConnected(client);
		client.publish(MESSAGE_TOPIC, JSON.stringify(msg, null, 4));
		console.log(`Sent message: ${MESSAGE_TOPIC} - ${JSON.stringify(msg, null, 4)}`);
		return clientWrapper;
	};

	return clientWrapper;
}