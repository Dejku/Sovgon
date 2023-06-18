import './Structure/events.js';
import './Structure/commands.js';
import './Utilities/birthday.js';
import './Utilities/Sessions.js';
import './Data/database.js';

import client from './Structure/client.js';

import { config } from 'dotenv';
config();

client.login(process.env.TOKEN);