import SimpleCrypto from "simple-crypto-js";
import md5 from "md5";
//import { Dimensions } from './image'
import * as Img from './image'
import * as Controller from './controller'
import { unregister } from "./serviceWorker";

export enum DecryptionError {
    None,
    FileType,
    FileSet,
    FileCount,
    Encrypted,
    Secret,
}

export class Result {
    success: boolean;
    error: DecryptionError;
    body: any;

    constructor(success: boolean, body: any, error: DecryptionError = DecryptionError.None) {
        this.success = success;
        this.body = body;
        this.error = error;
    }

}

export const DecryptionErrorMessage = ((error: DecryptionError): string =>{
    let errorMessage = '';

    switch(error) { 
        case DecryptionError.FileSet : { 
           errorMessage = 'Files supplied do not all come from the same encryption set.';
           break; 
        } 
        case DecryptionError.FileType : { 
            errorMessage = 'Files must be image files e.g. jpg, bmp, png etc.';
            break; 
         } 
         case DecryptionError.FileCount : { 
            errorMessage = 'Wrong number of files supplied.';
            break; 
         } 
         case DecryptionError.Encrypted : { 
            errorMessage = 'Data is encrypted and a secret needs to be provided.';
            break; 
         }          
         case DecryptionError.Secret : { 
            errorMessage = 'Incorrect secret provided for decryption.';
            break; 
         } 
        default: { 
            errorMessage = '';
           break; 
        } 
     } 

     return errorMessage;
});

export const EncryptObject = ((secret: string, objectToEncrypt: object): string => {
    let simpleCrypto = new SimpleCrypto(secret);
    let result = simpleCrypto.encryptObject(objectToEncrypt);
    return result;
});


export const DecryptAES=((secret: string, encrypted: string) => {
    let simpleCrypto = new SimpleCrypto(secret);
    let result = simpleCrypto.decrypt(encrypted);
    return result;
});

export class FileObject {
    fileNo: number;
    totalFiles: number;
    encrypted: boolean;
    fileSet: string;
    message: string;

    constructor(message: string, fileSet: string, fileNo: number, totalFiles: number, encrypted: boolean) {
        this.message = message;
        this.fileSet = fileSet;
        this.fileNo = fileNo;
        this.totalFiles = totalFiles;
        this.encrypted = encrypted;
    }
}    

export class MessageUnit {
    fileNo: number;
    totalFiles: number;
    file: string;
    message: string;
    fileSet: string;
    encrypted: boolean;

    constructor(message: string, file: string, fileSet: string, fileNo: number, totalFiles: number, encrypted: boolean) {
        this.message = message;
        this.file = file;
        this.fileSet = fileSet;
        this.fileNo = fileNo;
        this.totalFiles = totalFiles;
        this.encrypted = encrypted;
    }

    ForImage = (() => {
        let packedStr = JSON.stringify(new FileObject(this.message, this.fileSet, this.fileNo, this.totalFiles, this.encrypted));
        console.log('packedStr',packedStr);
        var image = new Img.Main();
        let endMarker = image.EndMarker(packedStr);
        let toEncrypt  = packedStr + endMarker;
        let textIntArray = image.StringToNumberArray(toEncrypt);
        return textIntArray;
    });
}

export class MessagePacker {
    files: any[];
    message: string;
    secret: string;

    messageUnits: MessageUnit[] = [];
   
    constructor(files: any[], message: string, secret: string) {
        this.files = files;
        this.message = message;
        this.secret = secret;
        this.splitMessage();
    }   
    
    GetFilesToProcess = (() => {
        let filesToProcess =  this.files.filter((x) => {return (x as File).type});
        return filesToProcess;
    });

    GetMessageUnits = (() => {
        return this.messageUnits;
    });

    GetFileObject = ((fileName: string) =>{
        let file =  this.files.filter((x) => {return x.name === fileName});
        return file[0];
    });
    
    splitMessage = (() => {
        let filesToProcess =  this.GetFilesToProcess();
        let fileCount = filesToProcess.length;
        let messageLength = this.message.length / fileCount;
        let lastMessagePosition = 0;
        let hash = md5(new Date().toString());

        for (let i = 0; i < fileCount; i++) {
            const file = filesToProcess[i];
            let readToPosition = lastMessagePosition + messageLength + 1;
            let fileMessage: {} = this.messageConvert(this.message.substring(lastMessagePosition, readToPosition));
            fileMessage = {fileMessage};
            let encrypted = this.secret.length !== 0;

            if (encrypted) { 
                fileMessage = EncryptObject(this.secret, fileMessage);
            }
            
            let messageFile = new MessageUnit(JSON.stringify(fileMessage), file, hash, i + 1, fileCount, encrypted);
            this.messageUnits.push(messageFile);
            lastMessagePosition = readToPosition;
        }
    });

    messageConvert = ((message: string): string => {
        var image = new Img.Main();
        let messageData =  image.StringToNumberArray(message);
        let result = JSON.stringify({messageData});
        return result
    });
};


export class MessageUnPacker {
    files: any[];
    endMarker: string;
    secret: string;
    callback: any;

    messageUnits: MessageUnit[] = [];
    extractionResult:Result = new Result(true, '');
   
    constructor(files: any[], endMarker: string, secret: string) {
        this.files = files;
        this.endMarker = endMarker;
        this.secret = secret;

        // this.processFiles()
        // .then((result) => {
        //     console.log('Result of decryption:', result);
        // });
    }   
  

    methodThatReturnsAPromise = ((id: any) => {
        return new Promise((resolve, reject) => {
            resolve(id);
        });
      });

    //https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
    MessageFromFiles = ( (messageUnits: MessageUnit[]) => {
        let message =  messageUnits.sort((a, b) => {return a.fileNo - b.fileNo}).map(a => a.message).reduce((a: string, b: string) => a + b);
        return message;
    });

    AllFilesProcessed = ((messageUnits: MessageUnit[], filesImported: number): boolean => {
        let filesExpected = messageUnits[0].totalFiles;
        return  filesImported == filesExpected && messageUnits.length ===  filesExpected;
    });

    FileSetValidated = ((fileSet: string, messageUnits: MessageUnit[]):boolean => {
        let uniqueFileSets = messageUnits.map(a => a.fileSet).filter((x, i, a) => a.indexOf(x) == i);

        if (uniqueFileSets.length === 0) {
            return true;
        } else {
            return uniqueFileSets.length === 1 && uniqueFileSets[0] === fileSet;
        }
    });

    processFiles = (() => {
        return new Promise((resolve) => {
        let filesToProcess = this.GetFilesToProcess();
        let image = new Img.Main();
        let invalidImageFiles =  filesToProcess.filter((a: any) => {return !image.IsImagFile(a)});
        let endMarker = this.endMarker;
        let messageUnits = this.messageUnits;
        let fnToObjectArray:any = this.CanvasToObjectArray;
        let fnMessageFromFiles = this.MessageFromFiles;
        let fnFileSetValidated = this.FileSetValidated;
        let fnAllFilesProcessed = this.AllFilesProcessed;
        let extractionResult = this.extractionResult;
        let fnDecryptAES = DecryptAES;
        let secret = this.secret;
        let extractedMessage = '';

        if (invalidImageFiles.length > 0){
            return;
        }

        //populate message units with files
        for (let i = 0; i < filesToProcess.length; i++) {
            
            if (!extractionResult.success) { 
                break;
            }
            //unpack bytes from image file
            //let dimensions = image.ImageFileDimensions(filesToProcess[i]) as unknown as Dimensions;
            let decryptedTextInitial = '';
            let file = filesToProcess[i];
            image.ImageFileDimensions(file)
            .then((dimensions: any) => {
                // if (!extractionResult.success) {
                //     return;
                // };

                const reader = new FileReader();
                reader.readAsDataURL(file);
                
                reader.onload = ((event: any) => {
                    const img = new Image();
                    img.src = event.target.result;

                    img.onload = async function(this, callBack: any) {

                        if (!extractionResult.success) { 
                            return;
                        }

                        let divs = document.querySelectorAll('canvas');
                        Array.from(divs).forEach((div) => div.remove())
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id','NewCanvas'+i);
                        canvas.width = dimensions.width;
                        canvas.height = dimensions.height;
                        const ctx: any = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
                        //fnDecryptingCalllback('Extracting pixels...');
                        let objectArray = fnToObjectArray(canvas, dimensions.width, dimensions.height);
                        //fnDecryptingCalllback('Extracting encrypted text...');
                        let result = image.ExtractFromPixels(objectArray, '', endMarker, 0);
                        decryptedTextInitial = result.map(a => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                        console.log('decryptedTextInitial',decryptedTextInitial);
                        let decryptedTextInitialObj = JSON.parse(decryptedTextInitial);
                        console.log('decryptedTextInitialObj.encrypted',decryptedTextInitialObj.encrypted);

                        if (decryptedTextInitialObj.encrypted && !secret) {
                            console.log('decryptedTextInitialObj', decryptedTextInitialObj);
                            extractionResult.success = false;
                            extractionResult.error = DecryptionError.Encrypted;
                            resolve(extractionResult);  
                            return;
                        }

                         try {
                            if (decryptedTextInitialObj.encrypted) {
                                //console.log('decrypting secret:', secret);
                                //console.log('decryptedTextInitialObj', decryptedTextInitialObj);
                                let toDecrypt = decryptedTextInitialObj.message.substring(1, decryptedTextInitialObj.message.length - 1) 
                                //console.log('decry', decry);
                                let decrypted = DecryptAES(secret, toDecrypt).toString();
                                
                                if (decrypted.indexOf('fileMessage') < 0) {
                                    throw DecryptionErrorMessage(DecryptionError.Secret);
                                }
                                //console.log('decrypted',decrypted);

                                decryptedTextInitialObj.message = decrypted;
                            }
                             } catch (error) {
                                extractionResult.success = false;
                                extractionResult.error = DecryptionError.Secret;
                                resolve(extractionResult); 
                                return;
                           }

                        console.log('decryptedTextInitialObj', decryptedTextInitialObj);
                        let parsedMessage = JSON.parse(decryptedTextInitialObj.message);
                        //console.log('parsedMessage',parsedMessage);
                        let parsedFileMessage = JSON.parse(parsedMessage.fileMessage);
                        //console.log('parsedFileMessage',parsedFileMessage);

                        if (!fnFileSetValidated(decryptedTextInitialObj.fileSet, messageUnits)) {
                            extractionResult.success = false;
                            extractionResult.error = DecryptionError.FileSet;
                            resolve(extractionResult);  
                        }
                        
                        let decryptedText = parsedFileMessage.messageData.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                        //console.log('decryptedText',decryptedText);
                        let unit = new MessageUnit(decryptedText, file, decryptedTextInitialObj.fileSet, decryptedTextInitialObj.fileNo, decryptedTextInitialObj.totalFiles, decryptedTextInitialObj.encrypted);    
                        //let unitObj = JSON.parse(textToParse);
                        //console.log('unitObj', unitObj);
                        messageUnits.push(unit);
                        //combinedMessage += unit.message;
                        //console.log('combinedMessage', combinedMessage);                        
                        //let currMessage = messageUnits.sort((a, b) => {return a.fileNo - b.fileNo}).map(a => a.message).reduce((a: string, b: string) => a + b);
                        //console.log('currMessage', currMessage);
                        //let message = fnFileProcessed(messageUnits);
                        //let message = fnFileProcessed(messageUnits)

                        if (fnAllFilesProcessed(messageUnits, filesToProcess.length)) {
                            let message = fnMessageFromFiles(messageUnits)
                            extractionResult.success = true;
                            extractionResult.body += message;
                            resolve(extractionResult);  
                        };


                    };
                });
            });
        }

        // console.log('messageUnits', messageUnits);
        // let combinedMessage = messageUnits.map(a => a.message);
        //console.log('combinedMessage', combinedMessage);
        // .reduce((a: string, b: string) => a + b);
        // console.log('combinedMessage', combinedMessage);
        //check that all the files have the same fileset hash

        //resolve(extractionResult);
        // extractionResult.success = true;
        //resolve(extractionResult);  
    });
    });

    CanvasToObjectArray = ((canvas: any, width: number, height: number) => {
        var imageData = this.ImageDataFromCanvas(canvas, width, height);
        var image = new Img.Main();
        let result = image.DataArrayToObjectArray(imageData)
        return result;
    });

    ImageDataFromCanvas = ((canvas: any, width: number, height: number): any => {
        const ctx: any = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, width, height);
        return imageData;
    });
        
    GetFilesToProcess = (() => {
        console.log('this.files', this.files);
        let filesToProcess =  this.files.filter((x: any) => {return (x as File).type});
        return filesToProcess;
    });

    GetMessageUnits = (() => {
        return this.messageUnits;
    });

    GetFileObject = ((fileName: string) =>{
        let file =  this.files.filter((x) => {return x.name === fileName});
        return file[0];
    });
  
    messageConvert = ((message: string): string => {
        var image = new Img.Main();
        let messageData =  image.StringToNumberArray(message);
        let result = JSON.stringify({messageData});
        return result
    });
};