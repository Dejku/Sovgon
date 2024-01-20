import {
    SlashCommandBuilder,
    ThreadAutoArchiveDuration,
    EmbedBuilder,
    roleMention,
} from 'discord.js';
import client from '../../Structure/client.js';
import { Color, Embed, Emoji, Permission } from '../../Utilities/Utilities.js';
import Session from '../../Data/models/sessionModel.js';

const data = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Tworzy nową sesję testową')
    .addSubcommand(subcommand => subcommand
        .setName('create')
        .setDescription('Tworzy nową sesję testową w danej kategorii')
        .addChannelOption(option => option
            .setName('forum')
            .setDescription('Forum, w którym stworzyć nowy wątek')
            .setRequired(true))
        .addAttachmentOption(option => option
            .setName('attachment')
            .setDescription('Załącznik jako opis sesji')
            .setRequired(true)))
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
    const USER = interaction.user;
    const REASON = `New Session Created By ${USER.username}`;

    if (interaction.options.getSubcommand() === 'create') {
        const FORUM = interaction.options.getChannel('forum');
        const ATTACHMENT = interaction.options.getAttachment('attachment');

        let embed = new EmbedBuilder()
            .setColor(Color.info)
            .setTitle(`${Emoji.info()}  Stworzono nową sesję testową!`)
            .setDescription(`Poświęć trochę swojego czasu na przetestowanie aktualnie dostępnych funkcji. Kliknij w przycisk "Zdobądź materiały" znajdujący się poniżej aby pobrać wszystkie wymagane pliki. **Udanych łowów**`);

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
            message: {
                content: roleMention('1094699484119834704'),
                embeds: [embed],
                files: [{
                    attachment: ATTACHMENT.attachment,
                    name: ATTACHMENT.name,
                }],
            },
        });

        await Session.create({ sessionTAG: sessionTag });

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

        const REPLY_TEXT = THREAD_ID ? `Pomyślnie zamknięto podaną sesję ${THREAD.url}` : "Pomyślnie zamknięto sesję";
        embed = Embed.CreateEmbed(Embed.type.success, REPLY_TEXT);
        await interaction.reply({ embeds: [embed], ephemeral: true });

        return THREAD.setLocked(true);
    }
}

export { data, execute };