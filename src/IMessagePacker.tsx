import { ContentType } from './encryption';

export interface IMessagePacker {
    logger: any;
    setDimensionsRequired: any;
    setPackedMessage: any;
    containerFiles: any;
    byteFiles: any;
    contentType: ContentType;
    message: string;
    secret: string;
    imageHelper: any;
    showEncryptAlert: any;
    setEncryptAlertMessage: any;
    encryptingCallback: any;
  }