import { EmbedBuilder, ThreadChannel } from 'discord.js';
import Session from '../Data/models/sessionModel.js';
import client from '../Structure/client.js';
import cron from 'node-cron';
import { Color, Emoji, Logger } from './Utilities.js';

cron.schedule('* * * * *', async () => {
    try {
        await Session.find({
            isFinished: false,
        }).then(async results => {
            if (results.length < 1) return;

            results.forEach(async session => {
                const TODAY_DATE = new Date();
                const SESSION_ENDING_EPOCH = session.endingDate;
                const SESSION_DATE = new Date(SESSION_ENDING_EPOCH * 1000);

                function isNow(): boolean {
                    return SESSION_DATE.getDate() == TODAY_DATE.getDate() && SESSION_DATE.getMonth() == TODAY_DATE.getMonth() && SESSION_DATE.getHours() == TODAY_DATE.getHours() && SESSION_DATE.getMinutes() == TODAY_DATE.getMinutes();
                };

                if (isNow()) {
                    const THREAD_ID = session.channelID.toString();
                    const THREAD = client.channels.cache.get(THREAD_ID) as ThreadChannel;
                    if (THREAD === undefined) return Logger.error("Nie znaleziono odpowiedniego kanału podczas zamykania sesji testowej", Logger.guild.akang);

                    const EMBED = new EmbedBuilder()
                        .setColor(Color.error)
                        .setTitle(`${Emoji.error()}  Sesja została zamknięta`)
                        .setDescription(`Czas sesji dobiegł końca. Dziękuję za udział`);
                    await THREAD.send({ embeds: [EMBED] });
                    await THREAD.setLocked(true);

                    await Session.updateOne({ channelID: session.channelID }, { $set: { "isFinished": true } }).catch(error => console.error(error));
                };
            })
        });
    } catch (err) { console.error(err); }
}, { scheduled: true, timezone: "Europe/Warsaw" });