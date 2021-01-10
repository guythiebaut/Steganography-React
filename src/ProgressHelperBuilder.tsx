/* eslint-disable no-mixed-spaces-and-tabs */

import { IProgressHelperBuilder } from'./IProgressHelperBuilder';

export class ProgressHelperBuilder implements IProgressHelperBuilder {
    logger: any;
    progressUpdate: any;
    progressEventName: string = 'ProgressHelper';
    messageEventName: string = 'ProgressHelperMessage';

    constructor() {
    }
    
    setLogger(logger: any) {
    	this.logger = logger;
    	return this;
    }

    setProgressUpdate(updateFunction: any) {
    	this.progressUpdate = updateFunction;
    	return this;
    }

    setProgressEventName(progressEventName: any) {
    	this.progressEventName = progressEventName;
    	return this;
    }

    setMessageEventName(messageEventName: any) {
    	this.messageEventName = messageEventName;
    	return this;
    }
   
    build() {
    	return this;
    }
}