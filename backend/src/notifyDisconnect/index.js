'use strict';

const AWS = require('aws-sdk');

AWS.config.regon = process.env.IOT_AWS_REGION;
const iotData = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT_HOST });

exports.handler = (message) => {
	let params = {
		topic: 'client-disconnected',
		payload: JSON.stringify(message),
		qos: 0
	};

	ioData.publish(params, (err, data) => {
		const msg = (err) ?
			`Unable to notify IoT of stories update: ${err}` :
			`Notified IoT of stories update: ${data}`;
		console.log(msg);
	});
}