import { ContentType } from './encryption';
import { Dimensions } from './image';
import { IProgressHelper } from './IProgressHelper';
import { IProgressHelperBuilder } from './IProgressHelperBuilder';
import { IEventListener } from './eventListener';

export interface IMessagePackerBuilder {
    logger: any;
    setDimensionsRequired: any;
    setPackedMessage: any;
    containerFiles: any;
    dimensionsLimit: Dimensions;
    byteFiles: any;
    contentType: ContentType;
    message: string;
    secret: string;
    imageHelper: any;
    showEncryptAlert: any;
    setEncryptAlertMessage: any;
    encryptingCallback: any;
    progressHelper: IProgressHelper;
    eventListener: IEventListener;
  }