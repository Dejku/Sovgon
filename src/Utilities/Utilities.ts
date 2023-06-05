import {
    TextChannel,
    ColorResolvable,
    EmbedBuilder,
    GuildEmoji,
} from "discord.js";
import client from "../Structure/client.js";
import { config } from "dotenv";
config();

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

enum EmbedTypes {
    success = `DarkGreen,${EmojiEnum.success}`,
    info = `DarkBlue,${EmojiEnum.info}`,
    warning = `Yellow,${EmojiEnum.warning}`,
    error = `Red,${EmojiEnum.error}`,
    loading = `Blue,${EmojiEnum.loading}`
}

export class Embed {
    static type = EmbedTypes;

    static CreateEmbed(embedType: EmbedTypes, description: string): EmbedBuilder {
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

export class Logger {
    /**
     * Sends informational message in log channel
     * @param {string} message Message content
     */
    static success(message: string): void {
        const TITLE = `${Emoji.success()}  Success`;
        const COLOR = "DarkGreen";

        sendLoggerEmbedMessage(TITLE, message, COLOR);
    }

    /**
     * Sends informational message in log channel
     * @param {string} message Message content
     */
    static info(message: string): void {
        const TITLE = `${Emoji.info()}  Information`;
        const COLOR = "DarkBlue";

        sendLoggerEmbedMessage(TITLE, message, COLOR);
    }

    /**
     * Sends warning message in log channel
     * @param {string} message Message content
     */
    static warn(message: string): void {
        const TITLE = `${Emoji.warning()}  Warning`;
        const COLOR = "Yellow";

        sendLoggerEmbedMessage(TITLE, message, COLOR);
    }

    /**
     * Sends error message in log channel
     * @param {string} message Message content
     */
    static error(message: string): void {
        const TITLE = `${Emoji.error()}  Error`;
        const COLOR = "Red";

        sendLoggerEmbedMessage(TITLE, message, COLOR);
    }
};

function sendLoggerEmbedMessage(title: string, message: string, color: ColorResolvable): void {
    const EMBED = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp();

    const CHANNEL = client.channels.cache.get(process.env.logsChannelID as string);
    (CHANNEL as TextChannel).send({ embeds: [EMBED] });
}