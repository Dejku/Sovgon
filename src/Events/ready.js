import chalk from 'chalk';

const name = 'ready';
const once = true;

async function execute(client) {
	await client.user.setPresence({ status: 'online', activities: [{ name: '/help' }] });
	console.log(`Status: ${chalk.greenBright('READY')}`);
}

export { name, once, execute };