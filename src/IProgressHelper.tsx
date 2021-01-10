export interface IProgressHelper {
    AddSubscriber(name:string): boolean;
    SetSubscriberCount(name: string, count: number): void;
    SetSubscriberTotal(name: string, total: number): void;
    SendMessage(message: string): void;
    GetCurrentPercentage(): number;
}