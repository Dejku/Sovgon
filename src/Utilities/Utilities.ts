import {
    TextChannel,
    ColorResolvable,
    EmbedBuilder,
    GuildEmoji,
} from "discord.js";
import client from "../Structure/client.js";
import { config } from "dotenv";
config();

// PERMISSIONS
export enum Permission {
    cmd = 'cmd',
    developer = 'developer',
}

// COLORS
export enum Color {
    success = `DarkGreen`,
    info = `DarkBlue`,
    warning = `Yellow`,
    error = `Red`,
    loading = `Blue`
}

// EMOJI
enum EmojiEnum {
    success = "1114590500096327690",
    info = "1108516851673219153",
    warning = "1108520756331167744",
    error = "1108516848800116767",
    loading = "1033687018389131274"
}

export class Emoji {
    static success(): GuildEmoji | undefined {
        return client.emojis.cache.get(EmojiEnum.success);
    }
    static info(): GuildEmoji | undefined {
        return client.emojis.cache.get(EmojiEnum.info);
    }
    static warning(): GuildEmoji | undefined {
        return client.emojis.cache.get(EmojiEnum.warning);
    }
    static error(): GuildEmoji | undefined {
        return client.emojis.cache.get(EmojiEnum.error);
    }
    static loading(): GuildEmoji | undefined {
        return client.emojis.cache.get(EmojiEnum.loading);
    }
}

// EMBED
enum EmbedType {
    success = `${Color.success},${EmojiEnum.success}`,
    info = `${Color.info},${EmojiEnum.info}`,
    warning = `${Color.warning},${EmojiEnum.warning}`,
    error = `${Color.error},${EmojiEnum.error}`,
    loading = `${Color.loading},${EmojiEnum.loading}`
}

export class Embed {
    static type = EmbedType;

    static CreateEmbed(embedType: EmbedType, description: string): EmbedBuilder {
        let color = 'Random'; let emoji: GuildEmoji | undefined;

        const OPTIONS = embedType.split(",");
        color = OPTIONS[0];
        emoji = client.emojis.cache.get(OPTIONS[1]);

        const EMBED = new EmbedBuilder()
            .setColor(color as ColorResolvable)
            .setDescription(`${emoji}  ${description}`);

        return EMBED;
    }
}

// LOGGER

enum Guild {
    dev = `1094372846727348305`,
    akang = `1118549625993965689`
}

export class Logger {
    static guild = Guild;

    /**
     * Sends informational message in log channel
     * @param {string} message Message content
     * @param {Guild} guild Guild where the message will be sent. Default: dev
     */
    static success(message: string, guild?: Guild): void {
        const TITLE = `${Emoji.success()}  Success`;
        const COLOR = "DarkGreen";

        sendLoggerEmbedMessage(COLOR, TITLE, message, guild);
    }

    /**
     * Sends informational message in log channel
     * @param {string} message Message content
     * @param {Guild} guild Guild where the message will be sent. Default: dev
     */
    static info(message: string, guild?: Guild): void {
        const TITLE = `${Emoji.info()}  Information`;
        const COLOR = "DarkBlue";

        sendLoggerEmbedMessage(COLOR, TITLE, message, guild);
    }

    /**
     * Sends warning message in log channel
     * @param {string} message Message content
     * @param {Guild} guild Guild where the message will be sent. Default: dev
     */
    static warn(message: string, guild?: Guild): void {
        const TITLE = `${Emoji.warning()}  Warning`;
        const COLOR = "Yellow";

        sendLoggerEmbedMessage(COLOR, TITLE, message, guild);
    }

    /**
     * Sends error message in log channel
     * @param {string} message Message content
     * @param {Guild} guild Guild where the message will be sent. Default: dev
     */
    static error(message: string, guild?: Guild): void {
        const TITLE = `${Emoji.error()}  Error`;
        const COLOR = "Red";

        sendLoggerEmbedMessage(COLOR, TITLE, message, guild);
    }
};

function sendLoggerEmbedMessage(color: ColorResolvable, title: string, message: string, guild?: Guild): void {
    const EMBED = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp();

    if (guild == undefined) guild = Guild.dev;
    const CHANNEL = client.channels.cache.get(guild);
    (CHANNEL as TextChannel).send({ embeds: [EMBED] });
}