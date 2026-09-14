export interface BotKeyboard {
    rows: readonly (readonly string[])[];
    resize: boolean;
    persistent: boolean;
    oneTime: boolean;
}

export interface BotMessageOptions {
    keyboard?: BotKeyboard;
}

export interface BotMessageSender {
    sendMessage(
        chatId: number,
        text: string,
        options?: BotMessageOptions,
    ): Promise<void>;
}
