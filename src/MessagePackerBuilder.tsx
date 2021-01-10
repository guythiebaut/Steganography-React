/* eslint-disable no-mixed-spaces-and-tabs */
import { ContentType } from './encryption';
// eslint-disable-next-line no-unused-vars
import { IMessagePackerBuilder } from './IMessagePackerBuilder';
import { Dimensions } from './image';
import { IProgressHelper } from './IProgressHelper';
import { ProgressHelper } from './ProgressHelper';
import { IEventListener } from './eventListener';

// https://medium.com/better-programming/lets-look-at-the-builder-pattern-in-typescript-fb9cf202c04d
// https://medium.com/@itayelgazar/the-builder-pattern-in-node-js-typescript-4b81a70b2ea5
// https://medium.com/better-programming/the-builder-pattern-in-javascript-6f3d85c3ae4a
export class MessagePackerBuilder implements IMessagePackerBuilder{
    logger: any;
    setDimensionsRequired: any;
    setPackedMessage: any;
    containerFiles: any;
    dimensionsLimit: Dimensions = new Dimensions();
    byteFiles: any;
    contentType: ContentType = ContentType.Unknown;
    message: string = '';
    secret: string = '';
    imageHelper: any;
    showEncryptAlert: any;
    setEncryptAlertMessage: any;
    encryptingCallback: any;
    progressHelper!: IProgressHelper;
    eventListener!: IEventListener;

    constructor() {
    }

    setLogger(logger: any) {
    	this.logger = logger;
    	return this;
    }

    setEventListener = ((eventListener: IEventListener) => {
    	this.eventListener = eventListener;
    	return this;
    });

    setProgressHelper = ((progressHelper: IProgressHelper) => {
    	this.progressHelper = progressHelper;
    	return this;
    });

    setDimensionsLimit  = ((dimensionsLimit: Dimensions) => {
    	this.dimensionsLimit = dimensionsLimit;
    	return this;
    });

   setSetDimensionsRequired= ((setDimensionsRequired: any) => {
   	this.setDimensionsRequired = setDimensionsRequired;
   	return this;
   });

   setSetPackedMessage(setPackedMessage: any) {
   	this.setPackedMessage = setPackedMessage;
   	return this;
   }
   
   setContainerFiles(containerFiles: any) {
   	this.containerFiles = containerFiles;
   	return this;
   }

   SetByteFiles(byteFiles: any) {
   	this.byteFiles = byteFiles;
   	return this;
   }

   SetContentType(contentType: any) {
   	this.contentType = contentType;
   	return this;
   }

   SetMessage(message: any) {
   	this.message = message;
   	return this;
   }

   SetSecret(secret: any) {
   	this.secret = secret;
   	return this;
   }

   SetImageHelper(imageHelper: any) {
   	this.imageHelper = imageHelper;
   	return this;
   }

   SetShowEncryptAlert(showEncryptAlert: any) {
   	this.showEncryptAlert = showEncryptAlert;
   	return this;
   }

   SetSetEncryptAlertMessage(setEncryptAlertMessage: any) {
   	this.setEncryptAlertMessage = setEncryptAlertMessage;
   	return this;
   }

   SetEncryptingCallback(encryptingCallback: any) {
   	this.encryptingCallback = encryptingCallback;
   	return this;
   }

   build() {
    	return this;
   }
}


