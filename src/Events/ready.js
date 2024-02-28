import chalk from 'chalk';

const name = 'ready';
const once = true;

function execute() {
	console.log(`Status: ${chalk.greenBright('READY')}`);
}

export { name, once, execute };