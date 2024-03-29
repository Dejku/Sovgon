import mongoose from 'mongoose';
import chalk from 'chalk';
import { Logger } from '../Utilities/Utilities.js';

import { config } from 'dotenv';
config();

mongoose.set('strictQuery', false);
mongoose.connect(process.env.database).catch(error => Logger.error(error));

mongoose.connection.on('connected', () => { console.log("\nDatabase: ", chalk.greenBright('OK')); });
mongoose.connection.on('disconnected', message => {
    console.log("\nDatabase: ", chalk.redBright('DISCONNECTED'), message);
    Logger.error(message);
});
mongoose.connection.on('error', error => {
    console.log("\nDatabase: ", chalk.redBright('ERROR'), error);
    Logger.error(error);
});