import SimpleCrypto from "simple-crypto-js";
import md5 from "md5";
import * as Img from './image'
import { EndMarker, IImage, IsImageFile, StringToNumberArray } from './image'

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

export const CharsToFill = ((capacity: number, message: string, hash: string, encrypted: boolean, logger: any): number =>{
    let start = 0;
    let charCount = 1;
    let currentMessage = '';

    while (charCount <= message.length) {
        currentMessage = message.substring(start, charCount);
        let messageUnit = new MessageUnit(currentMessage, '', capacity, hash, 1, 1, encrypted, logger);
        let charsUsed = messageUnit.BytesRequired();

        if (charsUsed > capacity) {
            return charCount - start - 1;
        }

        charCount ++;
    }

    return charCount - start - 1;
})

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

export const HashMd5 = ((salt: number = 0): string => {
    return md5(new Date().toString() + salt);
})

export class FileDto {
    fileNo: string;
    totalFiles: string;
    encrypted: boolean;
    fileSet: string;
    message: string;

    constructor(message: string, fileSet: string, fileNo: number, totalFiles: number, encrypted: boolean) {
        let templateForNumbers = '0'.repeat(8);
        this.message = message;
        this.fileSet = fileSet;
        this.fileNo = this.padNumber(fileNo, templateForNumbers);
        this.totalFiles = this.padNumber(totalFiles, templateForNumbers);
        this.encrypted = encrypted;
    }

    private padNumber = ((num: number, template:string) => {
            let result = template + num;
            return result.substr(result.length-template.length);
    })
}    

export class MessageUnit {
    fileNo: number;//consider for encryption
    totalFiles: number;//consider for encryption
    message: string;//consider for encryption
    fileSet: string;//consider for encryption
    encrypted: boolean;
    file: string;
    fileCapacity: number;
    arrayForImage: number[];
    logger: any;
    
    constructor(message: string, file: string, fileCapacity: number, fileSet: string, fileNo: number, totalFiles: number, encrypted: boolean, log: any) {
        this.message = message;
        this.file = file;
        this.fileCapacity = fileCapacity;
        this.fileSet = fileSet;
        this.fileNo = fileNo;
        this.totalFiles = totalFiles;
        this.encrypted = encrypted;
        this.logger = log;
        this.arrayForImage = this.forImage();
    }

    private forImage = ((): number[] => {  
        let packedStr = JSON.stringify(new FileDto(this.message, this.fileSet, this.fileNo, this.totalFiles, this.encrypted));
        this.logger.log('packedStr',packedStr);
        let endMarker = EndMarker(packedStr);
        let toEncrypt  = packedStr + endMarker;
        let textIntArray = StringToNumberArray(toEncrypt);
        return textIntArray;
    });

    BytesRequired = ((): number => {
        return this.arrayForImage.length;
    });
}

class FileInformation {
    file: any;
    width: number;
    height: number
    bytesAvailable: number 

    constructor(file:any, width: number, height:number, bytesAvailable: number) 
    {
        this.file = file;
        this.width = width;
        this.height = height;
        this.bytesAvailable = bytesAvailable;
    }
}

export class MessagePacker {
    fileInformation: FileInformation[] = [];
    messageUnits: MessageUnit[] = [];
   
    constructor(private files: any[], private message: string, private secret: string, private image :IImage, private showEncryptAlert: any, private setEncryptAlertMessage: any, private encryptingCallback: any, private logger: any) {
        if (secret !== '') {
            this.message = this.encryptMessage(message);            
        }
    }   
    
    ProcessFiles = (() => {
        this.populateFileInformation(this.files, this.image)
        .then(()=> {
            //need to split message based on file information 
            //also need to report if not enough space 
            this.splitMessage();
            this.logger.log('MessagePacker', this);

            let invalidFiles =  this.GetFilesToProcess(this.files).filter((a) => {return !IsImageFile(a)});
            this.logger.log('invalidFiles', invalidFiles);

            if (invalidFiles.length > 0) {
                this.setEncryptAlertMessage('Only image files can be used - bmp, jpg, png etc. xxx');
                this.showEncryptAlert(true);
                return;
            }
            else {
                this.showEncryptAlert(false);
            }

            let messageUnits = this.GetMessageUnits();

            for (let i = 0; i < messageUnits.length; i++) {
                let file = messageUnits[i].file;
                let textForImage = messageUnits[i].arrayForImage;
                this.logger.log('textForImage',textForImage);
                this.image.ImageFileDimensions(file)
                .then((dimensions: any) => {
                    //let capacity = this.image.ImageFileByteCapacity(dimensions);
                    //!!!! code for file being too small
                    this.processFile(file, dimensions.width, dimensions.height, textForImage, this.encryptingCallback)
                    this.encryptingCallback(`Downloading complete.`);
                });
            };

        });
    })

    private populateFileInformation = ((files: any[], image: IImage) => {
        return new Promise(async (resolve) => {
            let filesToProcess =  this.GetFilesToProcess(files);
            let fileCount = filesToProcess.length;
            let capacity = 0;
            
            for (let i = 0; i < fileCount; i++) {
                const file = filesToProcess[i];
                await image.ImageFileDimensions(file)
                .then((dimensions: Img.Dimensions) => {
                    capacity = image.ImageFileByteCapacity(dimensions)
                    let fileInfo = new FileInformation(file, dimensions.width, dimensions.height, capacity);
                    this.fileInformation.push(fileInfo);
                });
            }
            resolve();
        });
    })

    private encryptMessage= ((msg: string): string =>{
        let intArrayString: {} = this.messageConvert(msg);
        //intArrayString = {intArrayString};
        let encrypted = EncryptObject(this.secret, intArrayString);
        return encrypted;
    });

    GetFilesToProcess = ((files: any[]) => {
        let filesToProcess =  files.filter((x) => {return (x as File).type});
        return filesToProcess;
    });

    GetMessageUnits = (() => {
        return this.messageUnits;
    });

    GetFileObject = ((fileName: string) =>{
        let file =  this.files.filter((x) => {return x.name === fileName});
        return file[0];
    });

    private splitMessage = (() => {
        //let filesToProcess =  this.GetFilesToProcess(this.files);
        //let fileCount = filesToProcess.length;
        this.logger.log('this.fileInformation',this.fileInformation);
        let fileCount = this.fileInformation.length;
        this.logger.log('this.fileInformation.length',this.fileInformation.length);
        let messageLength = this.message.length / fileCount;
        let lastMessagePosition = 0;
        let hash = HashMd5();

        for (let i = 0; i < fileCount; i++) {
            //const file = filesToProcess[i];
            const fileInfo = this.fileInformation[i];
            this.logger.log('this.fileInformation[i]',this.fileInformation[i]);
            let readToPosition = lastMessagePosition + messageLength + 1;
            let fileMessage = this.messageConvert(this.message.substring(lastMessagePosition, readToPosition));
            this.logger.log('fileMessage',fileMessage);
            //fileMessage = {fileMessage};
            let encrypted = this.secret.length !== 0;
             
            let messageFile = new MessageUnit(fileMessage, fileInfo.file,  fileInfo.bytesAvailable, hash, i + 1, fileCount, encrypted, this.logger);
            this.messageUnits.push(messageFile);
            lastMessagePosition = readToPosition;
        }
    });

    private CheckBytesAvailable = (() => {
        let totalBytesAvailable = this.fileInformation.reduce((a, b) => {return a + b.bytesAvailable},0);
        // if (totalBytesAvailable < ) {

        // }
    })

    processFile = ((file: any, width: number, height: number, textIntArray: any[], encryptingCalllback: any) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            var image = new Img.Main();
            var fnToObjectArray: any = CanvasToObjectArray;
            var fnObjectArrayToDataArray = image.ObjectArrayToDataArray;
            var fnDownloadFile = DownloadFile;
            var fnUpdateImageData = UpdateImageData;
            let fnEncryptingCalllback = encryptingCalllback;
            let logger = this.logger;
            fnEncryptingCalllback('Reading file...')
            reader.readAsDataURL(file);

            reader.onload = ((event: any) => {
                const img = new Image();
                img.src = event.target.result;
                fnEncryptingCalllback('Loading image...')
               
                img.onload = function(this) {
                        //prepare the canvas
                        let divs = document.querySelectorAll('canvas');
                        Array.from(divs).forEach((div) => div.remove())
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id','NewCanvas');
                        canvas.width = width;
                        canvas.height = height;
                        //get th econtext from the canvas
                        const ctx: any = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        //convert canvas to object array
                        fnEncryptingCalllback('Extracting pixels...')
                        let objectArray = fnToObjectArray(canvas, width, height);
                        //amend canvas object array to include message
                        fnEncryptingCalllback('Applying encryption (1)...')
                        logger.log('textIntArray',textIntArray);
                        let amendedObjectArray = image.ApplyToPixels(objectArray, textIntArray);
                        //apply amended pixels to image in canvas
                        fnEncryptingCalllback('Applying encryption (2)...')
                        let amendedDataArray = fnObjectArrayToDataArray(amendedObjectArray);
                        var imageData = ctx.getImageData(0, 0, width, height);
                        fnEncryptingCalllback('Applying encryption (3)...')
                        fnUpdateImageData(imageData.data, amendedDataArray);
                        ctx.putImageData(imageData, 0, 0);
                        //download the file
                        fnEncryptingCalllback('Downloading file...')
                        fnDownloadFile(canvas,'TestingFile.png');
                        fnEncryptingCalllback('Downloading complete.')
                    };
                    reader.onerror = error => logger.log(error);
            });     
        });
    })

    messageConvert = ((message: string): string => {
        let messageData =  StringToNumberArray(message);
        let result = JSON.stringify(messageData);
        return result
    });

    bytesRequired = ((): number => {
        let totalBytes = this.messageUnits.reduce(
            (total:number, messageUnit) => {return total + messageUnit.BytesRequired()},0);
        return totalBytes;
    });
};

export class MessageUnPacker {
    files: any[];
    endMarker: string;
    secret: string;
    callback: any;
    logger: any;

    messageUnits: MessageUnit[] = [];
    extractionResult:Result = new Result(true, '');
   
    constructor(files: any[], endMarker: string, secret: string, log: any) {
        this.files = files;
        this.endMarker = endMarker;
        this.secret = secret;
        this.logger = log;
    }   
  
    methodThatReturnsAPromise = ((id: any) => {
        return new Promise((resolve, reject) => {
            resolve(id);
        });
      });

    //https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/
    MessageFromFiles = ( (messageUnits: MessageUnit[], secret: string): Result => {
        let message = messageUnits.sort((a, b) => {return a.fileNo - b.fileNo}).reduce((a, b) => {return a + b.message},'');
        let result =  new Result(true, '');

        if (secret === ''){
            this.logger.log('message',message);
            result.body = message;
            return result;
        } else {
            try {
                let messageDecrypted = DecryptAES(secret, message).toString();
                let messageDecryptedObj = JSON.parse(messageDecrypted);
                let messageResult = messageDecryptedObj.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                this.logger.log('messageResult',messageResult);
                result.body = messageResult;
                return result;
            } catch (error) {
                result.success = false;
                result.error = DecryptionError.Secret;
                return result;
            }            
        }
    });

    AllFilesProcessed = ((messageUnits: MessageUnit[], filesImported: number): boolean => {
        let filesExpected = messageUnits[0].totalFiles;
        return  filesImported === filesExpected && messageUnits.length ===  filesExpected;
    });

    FileSetValidated = ((fileSet: string, messageUnits: MessageUnit[]):boolean => {
        let uniqueFileSets = messageUnits.map(a => a.fileSet).filter((x, i, a) => a.indexOf(x) === i);

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
        let invalidImageFiles =  filesToProcess.filter((a: any) => {return !IsImageFile(a)});
        let endMarker = this.endMarker;
        let messageUnits = this.messageUnits;
        let fnToObjectArray:any = CanvasToObjectArray;
        let fnMessageFromFiles = this.MessageFromFiles;
        let fnFileSetValidated = this.FileSetValidated;
        let fnAllFilesProcessed = this.AllFilesProcessed;
        let extractionResult = this.extractionResult;
        let secret = this.secret;
        let logger = this.logger;

        if (invalidImageFiles.length > 0){
            extractionResult.success = false;
            extractionResult.error = DecryptionError.FileType;
            resolve(extractionResult); 
            return;
        }

        //populate message units with files
        for (let i = 0; i < filesToProcess.length; i++) {
            
            if (!extractionResult.success) { 
                break;
            }
            //unpack bytes from image file
            let decryptedTextInitial = '';
            let file = filesToProcess[i];
            image.ImageFileDimensions(file)
            .then((dimensions: any) => {
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
                        let objectArray = fnToObjectArray(canvas, dimensions.width, dimensions.height);
                        //logger.log('objectArray',objectArray);
                        logger.log('endMarker',endMarker);
                        let result = image.ExtractFromPixels(objectArray, '', endMarker, 0);
                        //let result = image.ExtractFromPixels(objectArray, '', '', 0);
                        decryptedTextInitial = result.map(a => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                        logger.log('decryptedTextInitial',decryptedTextInitial);
                        let decryptedTextInitialObj = JSON.parse(decryptedTextInitial);
                        logger.log('decryptedTextInitialObj.encrypted',decryptedTextInitialObj.encrypted);

                        if (decryptedTextInitialObj.encrypted && !secret) {
                            logger.log('decryptedTextInitialObj', decryptedTextInitialObj);
                            extractionResult.success = false;
                            extractionResult.error = DecryptionError.Encrypted;
                            resolve(extractionResult);  
                            return;
                        }

                        logger.log('decryptedTextInitialObj', decryptedTextInitialObj);
                        //let parsedMessage = JSON.parse(decryptedTextInitialObj.message);
                        let charNumArray = JSON.parse(decryptedTextInitialObj.message);
                        //logger.log('parsedMessage',parsedMessage);
                        //let parsedFileMessage = JSON.parse(parsedMessage.fileMessage);
                        //let parsedFileMessage = JSON.parse(parsedMessage);
                        logger.log('charNumArray',charNumArray);

                        if (!fnFileSetValidated(decryptedTextInitialObj.fileSet, messageUnits)) {
                            extractionResult.success = false;
                            extractionResult.error = DecryptionError.FileSet;
                            resolve(extractionResult);  
                        }
                        
                        let decryptedText = charNumArray.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                        logger.log('decryptedText',decryptedText);
                        let unit = new MessageUnit(decryptedText, file, 0, decryptedTextInitialObj.fileSet, parseInt(decryptedTextInitialObj.fileNo), parseInt(decryptedTextInitialObj.totalFiles), decryptedTextInitialObj.encrypted, logger);    
                        logger.log('unit', unit);
                        messageUnits.push(unit);

                        if (fnAllFilesProcessed(messageUnits, filesToProcess.length)) {
                            extractionResult = fnMessageFromFiles(messageUnits, secret);
                            resolve(extractionResult);  
                        };
                    };
                });
            });
        }
    });
    });


    GetFilesToProcess = (() => {
        this.logger.log('this.files', this.files);
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
  
    // messageConvert = ((message: string): string => {
    //     var image = new Img.Main();
    //     let messageData =  image.StringToNumberArray(message);
    //     let result = JSON.stringify({messageData});
    //     return result
    // });
};

const CanvasToObjectArray = ((canvas: any, width: number, height: number) => {
    var imageData = ImageDataFromCanvas(canvas, width, height);
    var image = new Img.Main();
    let result = image.DataArrayToObjectArray(imageData)
    return result;
});

const ImageDataFromCanvas = ((canvas: any, width: number, height: number): any => {
    const ctx: any = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    return imageData;
});
   
const UpdateImageData = ((imagedata: any, delta: any) => {
    for (let i = 0; i < imagedata.length; i++) {
        const amendedVal = delta[i];
        imagedata[i] = amendedVal;
    }        
});

const DownloadFile = ((canvas: any, fileName?: string) => {

    //for big files
    //https://stackoverflow.com/a/37151835
    //https://stackoverflow.com/questions/37135417/download-canvas-as-png-in-fabric-js-giving-network-error

    var link = document.createElement('a');

    link.download = fileName? fileName : 'filename.png';
    link.href = canvas.toDataURL() ;
    link.click();
});