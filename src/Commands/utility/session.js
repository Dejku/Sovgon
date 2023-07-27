import {
    SlashCommandBuilder,
    ThreadAutoArchiveDuration,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    GuildScheduledEventManager,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventEntityType,
} from 'discord.js';
import client from '../../Structure/client.js';
import { Color, Embed, Emoji, Permission, isDateValid, Epoch } from '../../Utilities/Utilities.js';
import Session from '../../Data/models/sessionModel.js';

const data = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Tworzy nową sesję testową')
    .addSubcommand(subcommand => subcommand
        .setName('new')
        .setDescription('Tworzy nową sesję testową w danej kategorii')
        .addChannelOption(option => option
            .setName('forum')
            .setDescription('Forum, w którym stworzyć nowy wątek')
            .setRequired(true))
        .addStringOption(option => option
            .setName('link')
            .setDescription('Link do materiałów')
            .setRequired(true))
        .addIntegerOption(option => option
            .setName('rozpoczęcie')
            .setDescription('Data rozpoczęcia testów (zostaw puste aby ustawić na za 5 minut)'))
        .addIntegerOption(option => option
            .setName('zakończenie')
            .setDescription('Data zakończenia testów (zostaw puste aby ustawić na za tydzień)')))
    .addSubcommand(subcommand => subcommand
        .setName('close')
        .setDescription('Zamyka wybraną sesję (zostaw puste dla aktualnego kanału)')
        .addStringOption(option => option
            .setName('sesja')
            .setDescription('ID kanału sesji do zamknięcia')));

async function execute(interaction) {
    function CheckPermissions(member) {
        if (member.roles.cache.some(role => role.name.toLowerCase() === Permission.developer))
            return true;
        else
            return false;
    }

    const GetDate = () => `${DATE.getDate()}/${DATE.getMonth() + 1}/${DATE.getFullYear()}`;

    const formatTag = (num, places) => String(num).padStart(places, '0');

    if (!CheckPermissions(interaction.member)) {
        const EMBED = Embed.CreateEmbed(Embed.type.error, 'Nie posiadasz odpowiednich uprawnień do używania tej komendy!');
        return interaction.reply({ embeds: [EMBED], ephemeral: true });
    }

    const DATE = new Date();
    const TODAY_EPOCH = Math.floor(DATE.getTime() / 1000);
    const USER = interaction.user;
    const GUILD = interaction.guild;
    const REASON = `New Session Created By ${USER.username}`;
    const EVENT_MANAGER = new GuildScheduledEventManager(GUILD);

    if (interaction.options.getSubcommand() === 'new') {
        const FORUM = interaction.options.getChannel('forum');
        const LINK = interaction.options.getString('link');
        const STARTING_DATE_EPOCH = interaction.options.getInteger('rozpoczęcie') ?? TODAY_EPOCH + Epoch.fiveMinutes;
        const ENDING_DATE_EPOCH = interaction.options.getInteger('zakończenie') ?? TODAY_EPOCH + Epoch.oneWeek;

        if (!isDateValid(new Date(STARTING_DATE_EPOCH)) || !isDateValid(new Date(ENDING_DATE_EPOCH))) {
            const EMBED = Embed.CreateEmbed(Embed.type.error, 'Niepoprawna data!');
            return interaction.reply({ embeds: [EMBED], ephemeral: true });
        }

        let embed = new EmbedBuilder()
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Zaplanowo nową sesję testową!`)
            .setDescription(`Poświęć trochę swojego czasu na przetestowanie aktualnie dostępnych funkcji. Kliknij w przycisk "Pobierz materiały" znajdujący się poniżej aby pobrać wszystkie wymagane pliki. **Udanych łowów**`)
            .addFields(
                { name: 'Rozpoczęcie', value: `<t:${STARTING_DATE_EPOCH}:R>`, inline: true },
                { name: 'Zakończenie', value: `<t:${ENDING_DATE_EPOCH}:R>`, inline: true },
                { name: 'Stworzone przez', value: `<@${USER.id}>`, inline: true },
            );

        const LINK_BUTTON = new ButtonBuilder()
            .setLabel('Pobierz materiały')
            .setStyle(ButtonStyle.Link)
            .setURL(LINK);

        const BUTTONS = new ActionRowBuilder()
            .addComponents(LINK_BUTTON);

            let sessionTag;
        await Session.find().sort({ sessionTAG: -1 }).limit(1).then(result => {
            if (result.length < 1) sessionTag = 1;
            else sessionTag = result[0].sessionTAG + 1;
        });
        if (isNaN(sessionTag)) sessionTag = 1;
        sessionTag = formatTag(sessionTag, 5);

        const SESSION_NAME = `#${GetDate()}/${sessionTag}`;
        const THREAD = await FORUM.threads.create({
            name: SESSION_NAME,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: REASON,
            message: { content: "@everyone", embeds: [embed], components: [BUTTONS] },
        });
        await THREAD.setLocked(true);

        await EVENT_MANAGER.create({
            name: 'Sesja Testowa',
            description: `Identyfikator sesji: **${SESSION_NAME}**`,
            scheduledStartTime: STARTING_DATE_EPOCH * 1000,
            scheduledEndTime: ENDING_DATE_EPOCH * 1000,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.External,
            entityMetadata: {
                location: THREAD.url,
            },
            reason: REASON,
        });

        await Session.create({
            sessionTAG: sessionTag,
            channelID: THREAD.id,
            createdBy: USER.id,
            startingDate: STARTING_DATE_EPOCH,
            endingDate: ENDING_DATE_EPOCH,
        });

        embed = Embed.CreateEmbed(Embed.type.success, `Pomyślnie utworzono nową sesję ${THREAD.url}`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'close') {
        const THREAD_ID = interaction.options.getString('sesja');
        const THREAD = client.channels.cache.get(THREAD_ID) ?? interaction.channel;

        if (THREAD === undefined) {
            const EMBED = Embed.CreateEmbed(Embed.type.error, `Nie znaleziono odpowiedniego kanału podczas zamykania sesji testowej`);
            return interaction.reply({ embeds: [EMBED], ephemeral: true });
        }

        if (!THREAD.isThread()) {
            const EMBED = Embed.CreateEmbed(Embed.type.error, `Wybrany kanał nie jest wątkiem w forum`);
            return interaction.reply({ embeds: [EMBED], ephemeral: true });
        }

        let embed = new EmbedBuilder()
            .setColor(Color.error)
            .setTitle(`${Emoji.error()}  Sesja została zamknięta`)
            .setDescription(`Sesja została ręcznie zamknięta przez <@${USER.id}>`);
        await THREAD.send({ embeds: [embed] });
        await Session.updateOne({ channelID: THREAD.id }, { $set: { "isFinished": true } }).catch(error => console.error(error));

        const REPLY_TEXT = THREAD_ID ? `Pomyślnie zamknięto podaną sesję ${THREAD.url}` : "Pomyślnie zamknięto sesję";
        embed = Embed.CreateEmbed(Embed.type.success, REPLY_TEXT);
        await interaction.reply({ embeds: [embed], ephemeral: true });

        return THREAD.setLocked(true);
    }
}

export { data, execute };