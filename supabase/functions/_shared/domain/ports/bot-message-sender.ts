export interface BotMessageSender {
    sendMessage(chatId: number, text: string): Promise<void>;
}
