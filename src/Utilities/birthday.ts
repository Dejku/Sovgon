import { EmbedBuilder, GuildEmoji, TextChannel } from 'discord.js';
import Birthday from '../Data/models/birthdayModel.js';
import client from '../Structure/client.js';
import cron from 'node-cron';
import { EMOJIS, WISHES } from '../Data/birthdaysWishes.js';

cron.schedule('00 13 * * *', async () => {
    try {
        const TODAY = new Date();
        const DAY = TODAY.getUTCDate();
        const MONTH = TODAY.getUTCMonth() + 1;

        function GetEmoji(): GuildEmoji | undefined {
            const RANDOM_NUMBER = Math.floor(Math.random() * EMOJIS.length);
            const EMOJI = EMOJIS[RANDOM_NUMBER].id;
            return client.emojis.cache.get(EMOJI);
        }

        function GetWish(): String {
            const RANDOM_NUMBER = Math.floor(Math.random() * WISHES.length);
            return WISHES[RANDOM_NUMBER].wish;
        }

        await Birthday.find({
            day: DAY,
            month: MONTH,
        }).then(async results => {
            if (results.length < 1) return;

            let birthdayGuests = [];
            birthdayGuests = results.map(element => {
                return `<@${element.personID}>`;
            });

            const WISH = GetWish();

            const EMBED = new EmbedBuilder()
                .setTitle(`:birthday:  Dzisiejszego dnia urodziny obchodzi:  :birthday:`)
                .setDescription(`${birthdayGuests}\n\n > *${WISH}* ${GetEmoji()}`)
                .setColor(0x779ba5);

            const CHANNEL_ID = '730099942227443732';

            let channel = client.channels.cache.get(CHANNEL_ID);

            return (channel as TextChannel).send({ embeds: [EMBED] });
        });
    } catch (err) { console.error(err); }
}, { scheduled: true, timezone: "Europe/Warsaw" });