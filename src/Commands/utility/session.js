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
import { Color, Embed, Emoji, Permission, isDateValid } from '../../Utilities/Utilities.js';
import Session from '../../Data/models/sessionModel.js';

const data = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Tworzy nową sesję testową')
    .addSubcommand(subcommand => subcommand
        .setName('info')
        .setDescription('Wyświetla informację o sesji testowej'))
    .addSubcommand(subcommand => subcommand
        .setName('setup')
        .setDescription('Przygotowuje nowy kanał zawierający informację na temat sesji')
        .addChannelOption(option => option
            .setName('forum')
            .setDescription('Forum, w którym stworzyć nowy wątek')
            .setRequired(true)))
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

    function GetDate() {
        return `${DATE.getDate()}/${DATE.getMonth() + 1}/${DATE.getFullYear()}`;
    }

    const formatTag = (num, places) => String(num).padStart(places, '0');
    const SESSION_DESC = `**Czym one są?**\nSesja testowa jest to okres w którym trwają testy nad różnymi funkcjami. Testerzy mają ustalony czas na pobranie materiałów. przetestowanie ich oraz opublikowanie wyników. Każda sesja posiada własny dedykowany kanał stwarzany gdy tylko sesja się rozpocznie.\n\n**Jak przebiega cały proces?**\nStworzony zostanie nowy wątek w forum, następnie pierwsza wiadomość będzie zawierała przycisk z linkiem do materiałów do pobrania. Testerzy po swoich próbach, wysyłają wyniki na kanał przeznaczony tej sesji z której brali materiały do testowania. Każda sesja posiada swój własny identyfikator, przykład - **SESJA NR#14/6/2023/27153**.\n\n**Ile trwają sesje?**\nRóżnie, domyślnie jest to tydzień, lecz zawsze czas ten może być zmieniony. Data rozpoczęcia oraz planowana data zakończenia sesji są zawsze podane na kanale sesji.`;

    if (interaction.options.getSubcommand() === 'info') {
        const EMBED = new EmbedBuilder()
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Informacje na temat sesji testowych`)
            .setDescription(SESSION_DESC);
        return interaction.reply({ embeds: [EMBED], ephemeral: true });
    }

    if (!CheckPermissions(interaction.member)) {
        const EMBED = Embed.CreateEmbed(Embed.type.error, 'Nie posiadasz odpowiednich uprawnień do używania tej komendy!');
        return interaction.reply({ embeds: [EMBED], ephemeral: true });
    }

    const DATE = new Date();
    const TODAY_EPOCH = Math.floor(DATE.getTime() / 1000);
    const ONE_WEEK_EPOCH = 604800;
    const CREATED_BY = interaction.user;

    if (interaction.options.getSubcommand() === 'setup') {
        const FORUM = interaction.options.getChannel('forum');

        let embed = new EmbedBuilder()
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Informacje na temat sesji testowych`)
            .setDescription(SESSION_DESC);

        const THREAD = await FORUM.threads.create({
            name: `INFORMACJE NA TEMAT SESJI TESTOWYCH`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: `Requested by ${CREATED_BY.username}`,
            message: { embeds: [embed] },
        });

        embed = Embed.CreateEmbed(Embed.type.success, `Pomyślnie stworzono kanał informacyjny ${THREAD.url}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

        await THREAD.setLocked(true);
        return await THREAD.pin();
    }

    if (interaction.options.getSubcommand() === 'new') {
        const FORUM = interaction.options.getChannel('forum');
        const LINK = interaction.options.getString('link');
        const ENDING_DATE_EPOCH = interaction.options.getInteger('zakończenie') ?? TODAY_EPOCH + ONE_WEEK_EPOCH;

        if (!isDateValid(new Date(ENDING_DATE_EPOCH))) {
            const EMBED = Embed.CreateEmbed(Embed.type.error, 'Niepoprawna data!');
            return interaction.reply({ embeds: [EMBED], ephemeral: true });
        }

        let embed = new EmbedBuilder()
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Rozpoczęto sesję testową!`)
            .setDescription(`Przed rozpoczęciem, jeśli tego jeszcze nie zrobiłeś(-aś), zapoznaj się z instrukcją w przypiętej wiadomości na samej górze tego [forum](${FORUM.url}). Następnie kliknij w przycisk "Pobierz materiały" znajdujący się poniżej, a później możesz już rozpocząć testowanie. **Udanych łowów**`)
            .addFields(
                { name: 'Rozpoczęcie', value: `<t:${TODAY_EPOCH}:R>`, inline: true },
                { name: 'Zakończenie', value: `<t:${ENDING_DATE_EPOCH}:R>`, inline: true },
                { name: 'Stworzone przez', value: `<@${CREATED_BY.id}>`, inline: true },
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

        const THREAD_ID = `${GetDate()}/${sessionTag}`;
        const THREAD = await FORUM.threads.create({
            name: `SESJA NR#${THREAD_ID}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: `Requested by ${CREATED_BY.username}`,
            message: { embeds: [embed], components: [BUTTONS] },
        });

        await Session.create({
            sessionTAG: sessionTag,
            channelID: THREAD.id,
            createdBy: CREATED_BY.id,
            startingDate: TODAY_EPOCH,
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
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Sesja została zamknięta`);
        await THREAD.send({ embeds: [embed] });
        await Session.updateOne({ channelID: THREAD.id }, { $set: { "isFinished": true } }).catch(error => console.error(error));

        const REPLY_TEXT = THREAD_ID ? `Pomyślnie zamknięto podaną sesję ${THREAD.url}` : "Pomyślnie zamknięto sesję";
        embed = Embed.CreateEmbed(Embed.type.success, REPLY_TEXT);
        await interaction.reply({ embeds: [embed], ephemeral: true });

        return THREAD.setLocked(true);
    }
}

export { data, execute };