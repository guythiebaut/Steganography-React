/* eslint-disable no-mixed-spaces-and-tabs */
export interface IEventListener {
    addEventListener: any;
}

export class EventListener implements IEventListener {
    private eventListeners: string[] = []

    addEventListener = ((eventName: string, listener: EventListenerOrEventListenerObject) => {
    	if (!this.eventExists(eventName) && eventName.trim() !== '') {
    		window.self.addEventListener(eventName, listener);
    		this.addEvent(eventName);
    	}
    });

    private eventExists = ((eventName: string): boolean => {return this.eventListeners.includes(eventName);});
    private addEvent = ((eventName: string) => {this.eventListeners.push(eventName);});
}
