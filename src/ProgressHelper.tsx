/* eslint-disable no-mixed-spaces-and-tabs */

import { IProgressHelperBuilder } from'./IProgressHelperBuilder';
import { IProgressHelper } from'./IProgressHelper';

class Subscriber {
    name: string;
    count: number = 0;
    total: number = 0;

    constructor(name: string) {
    	this.name = name;
    }
    
    SetCount(count: number) {
    	this.count = count;
    }
}

export class ProgressHelper implements IProgressHelper {
    logger: any;
    subscribers: Subscriber[];
	progressUpdate: any;
	progressEventName: string;
    messageEventName: string;

    constructor(progressBuilder: IProgressHelperBuilder) {
    	this.subscribers = [];
    	this.logger = progressBuilder.logger;
    	this.progressUpdate = progressBuilder.progressUpdate;
    	this.progressEventName = progressBuilder.progressEventName;
    	this.messageEventName = progressBuilder.messageEventName;
    }
    
    GetCurrentPercentage(): number {
    	const accumulated = this.subscribers.reduce((accumulator: number, subscriber) => {return accumulator + subscriber.count;}, 0);
    	const total = this.subscribers.reduce((accumulator: number, subscriber) => {return accumulator + subscriber.total;}, 0);
    	const percent = (accumulated / total) *100;
    	return percent;
    }

    AddSubscriber(name:string): boolean {
      	const matching = this.subscribers.filter((obj: Subscriber) => {
    		return obj.name === name;
    	});
        
    	if (matching.length > 0) return false;
    	const subscriber = new Subscriber(name);
    	this.subscribers.push(subscriber);
    	return true;
    }

    SetSubscriberCount = (async(name: string, count: number) => {
    	//debugger;
    	const subscriber = this.subscribers.find((obj: Subscriber) => {
    		return obj.name === name;
    	});

        subscriber!.count = count;
        const currentPercentage = this.GetCurrentPercentage();
			
        const progressEvent = new CustomEvent(this.progressEventName, {
        	detail: {
        		subscriber: subscriber!.name,
        		currentPercentage: currentPercentage
        	}
        });
        dispatchEvent(progressEvent);

        await this.progressUpdate(currentPercentage);
    });

    SetSubscriberTotal(name: string, total: number) {
    	//debugger;
    	const subscriber = this.subscribers.find((obj: Subscriber) => {
    		return obj.name === name;
    	});

    	subscriber!.total = total;
    }
	
    SendMessage(message: string) {
    	const messageEvent = new CustomEvent(this.messageEventName, {
        	detail: { message }
    	});
    	dispatchEvent(messageEvent);
    }
}