import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Lottery from '../../Data/models/lotteryModel.js';
import BLOCKED_RESULTS from '../../Data/blockedResults.js';
import client from '../../Structure/client.js';
import { Embed, Logger } from '../../Utilities/Utilities.js';

const permissions = 'cmd';
const data = new SlashCommandBuilder()
    .setName('loteria')
    .setDescription('Komendy dotyczące loterii mikołajkowej')
    .addSubcommand(subcommand => subcommand
        .setName('wynik')
        .setDescription('Losuje pary z listy osób zapisanych na losowanie mikołajkowe'))
    .addSubcommand(subcommand => subcommand
        .setName('lista')
        .setDescription('Wyświetla listę osób aktualnie biorących udział w losowaniu'))
    .addSubcommand(subcommand => subcommand
        .setName('usuń')
        .setDescription('Usuwa podaną osobę z losowania lub czyści całą listę')
        .addUserOption(option => option.setName('kto')
            .setDescription('Kogo usunąć? (zostaw puste dla całej listy)')))
    .addSubcommand(subcommand => subcommand
        .setName('dodaj')
        .setDescription('Dodaje wskazaną osobę do losowania')
        .addUserOption(option => option.setName('kto')
            .setDescription('Kogo dodać?')
            .setRequired(true)));

async function execute(interaction) {
    let countToStopLoop, loopCount, embedDescription, embedLotteryUsers, embedContent, sendersArray, recipientsArray;
    let isBlocked = false;

    await interaction.deferReply();

    function StartLoop(array) {
        countToStopLoop = 2000;
        loopCount = 0;
        sendersArray = array;
        recipientsArray = array;
    }

    if (interaction.options.getSubcommand() === 'wynik') {
        await Lottery.find()
            .then(async (senders) => {
                const MIN_PERSON = 2;
                embedDescription = `Wyniki nie mogły zostać rozlosowane. Sprawdź szczegóły poniżej!`;

                if (senders.length === 0)
                    embedContent = 'Brak członków w loterii. Aby kogoś dodać użyj "/loteria dodaj".';
                else if (senders.length < MIN_PERSON)
                    embedContent = `Za mało uczestników <a:warning:1033698158921928754> Aktualnie: ${senders.length} | Minimum: ${MIN_PERSON}`;
                else if (senders.length >= MIN_PERSON) {
                    embedDescription = `O to super-pro-elo tegoroczna loteria mikołajkowa  :christmas_tree:\nWyniki zostaną wylosowane oraz wysłane do odpowiednich osób.`;
                    embedContent = 'Wyniki zostały wysłane  :tada:  Have Fun';

                    try {
                        StartLoop(senders);
                        const SENDERS_COUNT = senders.length;

                        for (loopCount = 0; loopCount < SENDERS_COUNT;) {
                            countToStopLoop--;
                            if (countToStopLoop <= 0) {
                                embedDescription = `Maksymalna liczna prób została osiągnięta. Wstrzymywanie następnych...`;
                                embedContent = `Timeout! <a:warning:1033698158921928754> Spróbuj ponownie za chwilę`;
                                break;
                            }

                            const RANDOM_SENDER = Math.floor(Math.random() * sendersArray.length);
                            const RANDOM_RECIPIENT = Math.floor(Math.random() * recipientsArray.length);

                            const SENDER = sendersArray[RANDOM_SENDER];
                            const RECIPIENT = recipientsArray[RANDOM_RECIPIENT];

                            if (SENDER === undefined || RECIPIENT === undefined)
                                continue;

                            if (SENDER.personID === RECIPIENT.personID) {
                                if (sendersArray.length === 1 && recipientsArray.length === 1)
                                    StartLoop(senders);
                                else
                                    continue;
                            }
                            const BLOCKED_USERS = Object.entries(BLOCKED_RESULTS);
                            // eslint-disable-next-line no-unused-vars
                            for (const [key, value] of BLOCKED_USERS) {
                                if (SENDER.personID.toString().includes(value.senderID) && RECIPIENT.personID.toString().includes(value.recipientID))
                                    isBlocked = true;
                                else
                                    isBlocked = false;
                            }

                            if (isBlocked)
                                continue;

                            sendersArray = sendersArray.filter(sender => sender.person !== SENDER.person);
                            recipientsArray = recipientsArray.filter(recipient => recipient.person !== RECIPIENT.person);

                            const EMBED = new EmbedBuilder()
                                .setTitle(':mx_claus:  Czas Na Mi-Mi-Mikołajki  :mx_claus:')
                                .setDescription(`W tegorocznych mikołajkach prezent podarujesz: **${RECIPIENT.person}** :partying_face: Miłej zabawy!`)
                                .setColor(15267570)
                                .setFooter({ text: `Niechaj prezenty pójdą w ruch!`, iconURL: 'https://cdn.discordapp.com/attachments/572515362290270220/1096812065240387624/sovgon.png' });

                            await client.users.send(`${SENDER.personID}`, { embeds: [EMBED] });

                            loopCount++;
                            if (loopCount >= senders.length)
                                Logger.success(`Lottery: **All good!** Sending DMs to **${senders.length}** persons...`);
                        }

                    } catch (error) {
                        embedDescription = `Nie udało się wysłać wyników, szczegóły znajdziesz poniżej.`;
                        embedContent = `Coś poszło nie tak! <a:warning:1033698158921928754> ${error}`;
                    }
                }
            })
            .catch(error => {
                embedDescription = `Nie udało się wczytać wyników, szczegóły znajdziesz poniżej.`;
                embedContent = `Coś poszło nie tak! <a:warning:1033698158921928754> ${error}`;
            });
    } else if (interaction.options.getSubcommand() === 'lista') {
        await Lottery.find()
            .then(results => {
                if (results.length == 0) {
                    embedContent = 'Brak członków w loterii. Aby kogoś dodać użyj "/loteria dodaj".';
                } else {
                    embedContent = [];
                    results.forEach(element => {
                        embedContent.push(`> ${element.person}`);
                    });
                }
                embedDescription = `O to super-pro-elo lista osób biorących udział w tegorocznych mikołajkach :christmas_tree:\nPary zostaną wylosowane po użyciu komendy "/loteria wynik".`;
            })
            .catch(error => {
                embedDescription = `Nie udało się wyświetlić listy, szczegóły znajdziesz poniżej.`;
                embedContent = `Coś poszło nie tak! <a:warning:1033698158921928754> ${error}`;
            });
    } else if (interaction.options.getSubcommand() === 'usuń') {
        if (interaction.options.getUser('kto') != null) {
            const LOTTERY_USER = interaction.options.getUser('kto');

            await Lottery.deleteOne({ personID: LOTTERY_USER.id })
                .then(result => {
                    if (result.deletedCount === 0) {
                        embedDescription = `Nie znaleziono podanej osoby.`;
                        embedContent = `Ta osoba nie była zapisana w loterii.`;
                    } else {
                        embedDescription = `Usunięta została jedna osoba z loterii,\naby dodać nową użyj "/loteria dodaj".`;
                        embedContent = `Usunięto <@${LOTTERY_USER.id}> z loterii.`;
                    }
                }).catch(error => {
                    embedDescription = error;
                    embedContent = `Coś poszło nie tak! <a:warning:1033698158921928754>`;
                });
        } else {
            let recordCount = 0;
            await Lottery.find().then(result => recordCount = result.length);

            if (recordCount === 0) {
                embedDescription = `Przecież tu nikogo nie ma...`;
                embedContent = `Lista jest już pusta! <a:warning:1033698158921928754>`;
            } else {
                await Lottery.deleteMany()
                    .then(() => {
                        embedDescription = `Zostali usunięci wszyscy uczestnicy loterii,\naby dodać nowych użyj "/loteria dodaj".`;
                        embedContent = `Usunięto wszystkich uczestników loterii <a:warning:1033698158921928754>`;
                    }).catch(error => {
                        embedDescription = error;
                        embedContent = `Coś poszło nie tak! <a:warning:1033698158921928754>`;
                    });
            }
        }
    } else if (interaction.options.getSubcommand() === 'dodaj') {
        const LOTTERY_USER = interaction.options.getUser('kto');

        let isCopy = false;
        await Lottery.find({ personID: LOTTERY_USER.id })
            .then(result => {
                if (result.length != 0)
                    isCopy = true;
            });

        if (isCopy) {
            const EMBED = Embed.CreateEmbed(Embed.type.warning, `Ta osoba jest już zapisana do loterii`);
            return interaction.editReply({ embeds: [EMBED], ephemeral: true });
        }
        else {

            await Lottery.create({
                person: LOTTERY_USER.username,
                personID: LOTTERY_USER.id,
            })
                .then(() => {
                    embedDescription = `Nowa osoba została dodana do loterii.`;
                    embedContent = `Użytkownik <@${LOTTERY_USER.id}> został dodany do loterii!`;
                })
                .catch(error => console.error(error));
        }
    }

    await Lottery.find().then(results => embedLotteryUsers = results.length);

    if (typeof embedContent === "object")
        embedContent = embedContent.join(',').replace(/,/g, '\n').split();

    const EMBED = new EmbedBuilder()
        .setTitle(':mx_claus:  Loteria Mikołajkowa  :mx_claus:')
        .setDescription(embedDescription)
        .setColor(15267570)
        .setFields(
            { name: `Osoby biorące udział: ${embedLotteryUsers}`, value: `${embedContent}` });

    return interaction.editReply({ embeds: [EMBED] });
}

export { permissions, data, execute };