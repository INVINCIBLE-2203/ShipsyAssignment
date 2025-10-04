export interface Mention {
    username: string;
    userId?: string;
}

export class MentionParserUtil {
    /**
     * Parses content to extract mentions.
     * Format: @[username] or @[user:userId]
     * @param content The text content to parse.
     * @returns An array of found mentions.
     */
    static parse(content: string): Mention[] {
        const mentions: Mention[] = [];
        // Regex to find @[username] or @[user:userId]
        const regex = /@\[(?:user:)?([^\]]+)\]/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const identifier = match[1];
            // This is a simplified parser. A real implementation would
            // need to differentiate between username and userId and validate them.
            // For now, we'll treat them all as usernames.
            mentions.push({ username: identifier });
        }

        return mentions;
    }
}
