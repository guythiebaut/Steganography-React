/* eslint-disable no-debugger */
/* eslint-disable no-mixed-spaces-and-tabs */
import SimpleCrypto from 'simple-crypto-js';
import md5 from 'md5';
import * as Img from './image';
import { Dimensions, EndMarker, IImageHelper, IsImageFile, StringToNumberArray } from './image';
import { IMessagePackerBuilder } from './IMessagePackerBuilder';
import { IProgressHelper } from './IProgressHelper';

export enum DecryptionError {
    None,
    FileType,
    FileSet,
    FileCount,
    Encrypted,
    Secret,
}

export enum ContentType {
    Text,
	File,
	Unknown,
}

export class Result {
    success: boolean;
    error: DecryptionError;
	body: any;
	contentType: ContentType;
	fileType: string;
	fileName: string;

	constructor(success: boolean, body: any, contentType: ContentType, fileType: string, fileName: string, error: DecryptionError = DecryptionError.None) {
    	this.success = success;
		this.body = body;
		this.contentType = contentType;
		this.fileType = fileType;
		this.fileName = fileName;
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
		errorMessage = 'Data is encrypted and a password needs to be provided.';
		break; 
	}          
	case DecryptionError.Secret : { 
		errorMessage = 'Incorrect password provided for decryption.';
		break; 
	} 
	default: { 
		errorMessage = '';
		break; 
	} 
	} 

	return errorMessage;
});

// CharsToFill returns the maximum number of characters that can be used 
// from the start of a message given a file capacity.
// The following result is returned depending on whether the message can fit 
// or is too long for the capacity:
// message length > characters to fill -> characters to fill returned
// message length <= characters to fill -> message length returned
//
// Note - this function operats on the basis of characters from the message rather than bytes
// because the characters are converted to bytes when the message unit is generated
// thereby calculating the correct number of character from the message 
export const CharsToFill = ((capacity: number, message: string, contentType: ContentType, hash: string, fileNo: number, totalFiles: number, encrypted: boolean, logger: any, fileInfoCollection: any[]): any =>{
	let currentMessage = '';
	let lowRange = 1;
	let highRange = message.length;
	let possibleAttempts = highRange + lowRange -1;
	let currentAttempt = 0;
	let lastAttempt = 0;
	let found = false;
	let messageUnit: any = null; 

	// TODO
	// consider amending this so that we creat an array so that we don't
	// have to have silly conditions when unpacking and joining the messages
	
	while (!found) {
		possibleAttempts = highRange + lowRange - 1;
		currentAttempt = Math.ceil(possibleAttempts / 2);

		// it's possible to get stuck in an infinite loop where the currentAttempt
		// always stays a just message.length - 1
		if (currentAttempt === lastAttempt) break;
		
		lastAttempt = currentAttempt;
		currentMessage = message.substring(0, currentAttempt);
		messageUnit = new MessageUnit(currentMessage, contentType, '', capacity, hash, fileNo, totalFiles, encrypted, logger, fileInfoCollection);
		const bytesUsed = messageUnit.BytesRequired();

		found = bytesUsed === capacity || (currentAttempt === message.length && bytesUsed < capacity);
		if(bytesUsed > capacity) highRange = currentAttempt - 1;
   		if(bytesUsed < capacity) lowRange = currentAttempt + 1;
	}
	return messageUnit;
});

export const EncryptAES = ((secret: string, objectToEncrypt: object): string => {
	const simpleCrypto = new SimpleCrypto(secret);
	const result = simpleCrypto.encryptObject(objectToEncrypt);
	return result;
});

export const DecryptAES=((secret: string, encrypted: string) => {
	const simpleCrypto = new SimpleCrypto(secret);
	const result = simpleCrypto.decrypt(encrypted);
	return result;
});

export const HashMd5 = ((salt: number = 0): string => {
	return md5(new Date().toString() + salt);
});


export class FileInfoDto {
	fileName: string;
	fileType: string;
	startsAt: string;
	endsAt: string;

	constructor(fileName: string, fileType: string, startsAt: string, endsAt: string) {
		this.fileName = fileName;
		this.fileType = fileType;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
	}
}

export class FileDto {
    fileNo: string;
    totalFiles: string;
	encrypted: boolean;
	fileSet: string;
	contentType: string
	fileType: string
    fileName: string
	message: string;
	fileInfoDtoCollection: FileInfoDto[];

	constructor(message: string, fileSet: string, fileNo: number, totalFiles: number, contentType: ContentType, encrypted: boolean, fileInfoDtoCollection: FileInfoDto[] = [], filetype: string= '', fileName: string = '') {
    	const templateForNumbers = '0'.repeat(8);
    	this.message = message;
    	this.fileSet = fileSet;
    	this.fileNo = this.padNumber(fileNo, templateForNumbers);
    	this.totalFiles = this.padNumber(totalFiles, templateForNumbers);
    	this.contentType = ContentType[contentType];
    	this.fileType = filetype;
		this.fileName = fileName;
		this.fileInfoDtoCollection = fileInfoDtoCollection;
    	this.encrypted = encrypted;
	}

    private padNumber = ((num: number, template:string) => {
    	const result = template + num;
    	return result.substr(result.length-template.length);
    })
}    

// fileNo - this current file number
// totalFiles - the total number of files in this fileSet
// message - the actual messsage to store
// fileSet - the group this data belongs to
// encrypted is the message encrypted
// file - the file
// fileCapacity - currently only used for sorting MessageUnits by capacity
// arrayForImage - an array of numbers encoding hte bytes of the message
// logger - a logger that can be passe in to aid debugging
export class MessageUnit {
    fileNo: number;//consider for encryption
    totalFiles: number;//consider for encryption
    message: string;//consider for encryption
    fileSet: string;//consider for encryption
    encrypted: boolean;
	containerFile: string;
	fileInfoDtoCollection: FileInfoDto[];
	contentType: ContentType;
    fileCapacity: number;
    intArray: number[];
    logger: any;
    
    constructor(message: string, contentType: ContentType, containerFile: string, fileCapacity: number, fileSet: string, fileNo: number, totalFiles: number, encrypted: boolean, log: any, fileInfoDtoCollection: FileInfoDto[] = []) {
    	this.message = message;
    	this.containerFile = containerFile;
    	this.fileInfoDtoCollection = fileInfoDtoCollection;
    	this.contentType = contentType;
    	this.fileCapacity = fileCapacity;
    	this.fileSet = fileSet;
    	this.fileNo = fileNo;
    	this.totalFiles = totalFiles;
    	this.encrypted = encrypted;
    	this.logger = log;
    	this.intArray = this.IntArrayForImage();
    }

	RefreshIntArray = (() =>{
		this.intArray = this.IntArrayForImage();
	});

    private IntArrayForImage = ((): number[] => { 
		
    	// TODO if the content type is a file then the message will be a byte array
    	// this byte array can be appended once the DTO has been converted to an int array
    	// although the end marker will need figuring out.

    	const packedStr = JSON.stringify(new FileDto(this.message, this.fileSet, this.fileNo, this.totalFiles, this.contentType, this.encrypted, this.fileInfoDtoCollection));
    	//this.logger.log('packedStr',packedStr);
    	const endMarker = EndMarker(packedStr);
    	const toEncrypt  = packedStr + endMarker;
    	const textIntArray = StringToNumberArray(toEncrypt);
    	return textIntArray;
    });

    BytesRequired = ((): number => {
    	return this.intArray.length;
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

const decompressByteArray = ((compressedArray: any[]): number[] => {
	const multiplierChar = 'R';
	const byteArray: number[] = [];

	compressedArray.forEach(element => {
		const multiplierStart = String(element).indexOf(multiplierChar) + 1;

		if (multiplierStart !== 0) {
			const multiplier = parseInt(element.substring(multiplierStart, element.length));
			const multiplicand = parseInt(element.substring(0, multiplierStart));
			for (let i = 0; i < multiplier; i++) byteArray.push(multiplicand);
		} else {
			byteArray.push(element);
		}
	});

	return byteArray;
});

export class MessagePacker implements IMessagePackerBuilder {
    filesInformation: FileInformation[] = [];
	messageUnits: MessageUnit[] = [];
	setDimensionsRequired: any;
	setPackedMessage: any;
	containerFiles: any[] = [];
	byteFiles: any[] = [];
	contentType: ContentType = ContentType.Unknown;
	message: string = '';
	secret: string = '';
	imageHelper :any;
	showEncryptAlert: any;
	setEncryptAlertMessage: any;
	encryptingCallback: any;
	logger: any;

	constructor(pack: IMessagePackerBuilder) {
		this.setDimensionsRequired = pack.setDimensionsRequired;
		this.setPackedMessage = pack.setPackedMessage;
		this.containerFiles = pack.containerFiles;
		this.byteFiles = pack.byteFiles;
		this.contentType = pack.contentType;
		this.message = pack.message;
		this.secret = pack.secret;
		this.imageHelper = pack.imageHelper;
		this.showEncryptAlert = pack.showEncryptAlert;
		this.setEncryptAlertMessage = pack.setEncryptAlertMessage;
		this.encryptingCallback = pack.encryptingCallback;
		this.logger = pack.logger;

		this.logger.log('contentType',this.contentType);

    	if (this.contentType === ContentType.Text) {
    		if (this.secret !== '') {
    			this.logger.log('encrypting unencrypted text message','');
    			this.message = this.encryptMessage(this.message);            
    		}
    	}
	}   

   fileToOutputFile = (async(wrapUp: any)=>{
   	return new Promise((resolve) => {
   		const filesToProcess =  this.byteFiles.filter((x: any) => {return (x as File).type;});
   		// this.fileType = filesToProcess[0].type;
   		// this.fileName = filesToProcess[0].name;
   		const reader = new FileReader();
		
   		reader.onload = ((event: any) => {		   
   			const fnSetMessage = ((message: string) => {this.message = message;});
   			const array = this.ByteArrayToArray(event.target.result);
   			let csvString = array.join();
   			if (this.secret !== '') {
   				csvString = EncryptAES(this.secret, csvString);
   			}

   			fnSetMessage(csvString);
   			const encrypted = this.secret.length !== 0;
   			const messageForUnit = JSON.stringify(this.convertToIntArray(this.message));
   			const messageUnit = new MessageUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, encrypted, this.logger);
   			this.messageUnits.push(messageUnit);
   			this.messageUnitToFractalFile(messageUnit, 'fractal.jpg', wrapUp);
   		});
		   
   		reader.readAsArrayBuffer(filesToProcess[0]); 		   
   		resolve();
   	});
   });

	// compressArray - compressed an array by marking repeating elements with a notation of xRn
	// so if we have 100 values of 255 one after the other these are compressed into
	// an element 255R100
	compressIntArray = ((byteArray: any)=>{
		const multiplierChar = 'R';
		let lastElement = null;
		let countOfLast = 0;
		const compressedArray: any[] = [];

		for (let i = 0; i < byteArray.length; i++) {
			const element = byteArray[i];
			
			if (element === lastElement || i === 0) {
				countOfLast ++;
			} else {
				if (countOfLast > 1) {
					compressedArray.push(`${lastElement}${multiplierChar}${countOfLast}`);
				} else {
					compressedArray.push(lastElement);
				}
				countOfLast = 1;
			}
		
			lastElement = element;
		}

		if (countOfLast > 1) {
			compressedArray.push(`${lastElement}R${countOfLast}`);
		} else {
			compressedArray.push(lastElement);
		}
		
		return compressedArray;
	});

	arraysAreEqual = ((array1: any[], array2: any[]): boolean => {
		if (array1.length !== array2.length) {
			return false;
		}
		for (let i = 0; i < array1.length; i++) {
			if (array1[i] !== array2[i]) return false;
		}

		return true;
	});

	InitialiseFileInfoDto = ((filesToProcess: any[]): FileInfoDto[] => {
		const collection: FileInfoDto[] = [];
		
		filesToProcess.forEach(element => {
			const fileInfoDto = new FileInfoDto(element.name, element.type , '0', '0');
			collection.push(fileInfoDto);
		});

		return collection;
	});
	
	FilesToFileInfoDto = ((filesToProcess: any[], ) => {
		const collection: FileInfoDto[] = [];

		filesToProcess.forEach(element => {
			const fileInfoDto = new FileInfoDto(element.name, element.type , '0', '0');
			collection.push(fileInfoDto);
		});
	});

	ArrayConcat = ((mainArray: any[], appendingArray: any[]) => {
		appendingArray.forEach(element => {
			mainArray.push(element);
		});

		return mainArray;
	});

   fileToOutputFiles = (async(dimensions: Dimensions, imageHelper: IImageHelper, wrapUp: any, progressHelper: IProgressHelper, fileNamePrefix: string)=>{
   	return new Promise((resolve) => {

   		const filesToProcess =  this.byteFiles.filter((x: any) => {return (x as File).type;});
   		const collection: FileInfoDto[] = [];
   		let lastEnd = -1;
   		let byteArrayForAllFiles: any[] = [];
   		let filesProcessedCount = 0;   

	   filesToProcess.forEach((file: any) => {		   

   			const bytesPerFile = imageHelper.ImageByteCapacityForDimensions(dimensions);
   			let fileType = file.type;
   			let fileName = file.name;   
   			const reader = new FileReader();
   			const encrypted = this.secret.length !== 0;
				
   			reader.onload = (async (event: any) => {		   
   				const fnSetMessage = ((message: string) => {this.message = message;});
   				const byteArrayForThisFile = this.ByteArrayToArray(event.target.result);
   				byteArrayForAllFiles =	this.ArrayConcat(byteArrayForAllFiles, byteArrayForThisFile);
   				const start = lastEnd + 1;
   				const end = byteArrayForAllFiles.length;
   				let startForDto = String(start);
   				let endForDto = String(end);
   				lastEnd = end;
				   

   				if (encrypted) {
   					fileName = EncryptAES(this.secret, fileName);   
   					fileType = EncryptAES(this.secret, fileType);   
   					startForDto = EncryptAES(this.secret, startForDto as Object);   
   					endForDto = EncryptAES(this.secret, endForDto as Object);   
   				}
   				
   				const fileInfoDto: FileInfoDto = new FileInfoDto(fileName, fileType, startForDto, endForDto);
   				collection.push(fileInfoDto);
   				filesProcessedCount++;
				
   				if (filesProcessedCount === filesToProcess.length) {
   					const compressedArray: any = this.compressIntArray(byteArrayForAllFiles);
   					let csvString = compressedArray.join();
   					if (this.secret !== '') {
   						csvString = EncryptAES(this.secret, csvString);
   					}
   					fnSetMessage(csvString);
   					let message = JSON.stringify(this.convertToIntArray(this.message));
   					const hash = HashMd5();
					
   					const origMessageLength = message.length;
   					progressHelper.AddSubscriber('fileToOutputFiles');
   					progressHelper.SetSubscriberTotal('fileToOutputFiles', origMessageLength);
   					progressHelper.SetSubscriberCount('fileToOutputFiles', 0);

   					// let's keep reducing the size of the message
    				// until we have fully processed it  
   					while (message.length > 0) {
   						// we are only going to add the populated fileInfoCollection to one message unit
   						const fileInfoCollection = this.messageUnits.length === 0 ? collection : [];
   						const messageUnit =  CharsToFill(bytesPerFile, message, ContentType.File,  hash, 1, 1, encrypted, this.logger, fileInfoCollection);
   						this.messageUnits.push(messageUnit);
   						message = message.slice(messageUnit.message.length);
   						const progress = origMessageLength - message.length;
   						progressHelper.SetSubscriberCount('fileToOutputFiles', progress);   
   					}	
		
   					for (let i = 0; i < this.messageUnits.length; i++) {
   						const messageUnit = this.messageUnits[i];
   						messageUnit.fileNo = i + 1;
   						messageUnit.totalFiles = this.messageUnits.length;
   						messageUnit.RefreshIntArray();
   						this.messageUnitToFractalFile(messageUnit, `${fileNamePrefix}${i}.jpg`, wrapUp);				
   					}
   					wrapUp();
   				}
   			});

   			reader.readAsArrayBuffer(file); 
   		});		   
   		resolve();
   	});
   });

	fileToMessageForUnit = (async()=>{
    	return new Promise((resolve) => {
			const filesToProcess =  this.byteFiles.filter((x: any) => {return (x as File).type;});
			// this.fileType = filesToProcess[0].type;
			// this.fileName = filesToProcess[0].name;
			const reader = new FileReader();

			reader.onload = ((event: any) => {
				const fnByteArrayToArray = this.ByteArrayToArray;
				const fnSetMessage = ((message: string) => {this.message = message;});
				const array = fnByteArrayToArray(event.target.result);
				const compressedArray: any = this.compressIntArray(array);
				let csvString = compressedArray.join();
				if (this.secret !== '') {
					csvString = EncryptAES(this.secret, csvString);
				}

				fnSetMessage(csvString);
				const encrypted = this.secret.length !== 0;
				const messageForUnit = JSON.stringify(this.convertToIntArray(this.message));
				const messageUnit = new MessageUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, encrypted, this.logger);
				const dimensions = this.imageHelper.DimensionsRequiredForCapacity(messageUnit.BytesRequired());
				this.setDimensionsRequired(dimensions);
				this.messageUnits.push(messageUnit);
				this.setPackedMessage(this);
			});
		
			reader.readAsArrayBuffer(filesToProcess[0]); 
			resolve();
		});
	});
	
	GetMessage = (()=> {this.logger.log('message is now...', this.message);});

    messageUnitToFractalFile = ((messageUnit: MessageUnit, fileName: string, wrapUp: any) => {
    	return new Promise((resolve) => {
    		const dimensions = this.imageHelper.DimensionsRequiredForCapacity(messageUnit.BytesRequired());
    		const fractal: HTMLCanvasElement = this.imageHelper.fractal(dimensions.width, dimensions.height, 'testfile.jpg', true);
    		this.processCanvas(fractal, messageUnit.intArray, this.encryptingCallback, fileName, wrapUp);
    		resolve();
    	});
    });

    ByteArrayToArray(byteArray: any): any {
    	return new Uint8Array(byteArray);
    }

    ProcessFiles = ((wrapUp: any) => {
    	return new Promise((resolve) => {
    	if (this.contentType === ContentType.Text) {
    		// TODO
    	}

    	if (this.contentType === ContentType.File) {
    		// TODO
    			this.logger.log('message from file in ProcessFiles', this.message);
    			//resolve();
    		return;
    	}

    	this.logger.log('this.files', this.containerFiles);
    	const noFilesSelected: boolean = typeof this.containerFiles[1] === 'undefined' && typeof this.containerFiles[0] === 'function';

    	if (noFilesSelected) {
    		const encrypted = this.secret.length !== 0;
    		const compressedArray = this.compressIntArray((this.convertToIntArray(this.message)));
    		const messageForUnit = JSON.stringify(compressedArray);
   			const messageUnit = new MessageUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, encrypted, this.logger);
   			this.messageUnitToFractalFile(messageUnit, 'fractal.jpg', wrapUp);
    	} else {
    		this.populateFileInformation(this.containerFiles, this.imageHelper)
    			.then(()=> {
    				//need to split message based on file information 
    				//also need to report if not enough space 

    				this.splitMessage();
    				this.logger.log('MessagePacker', this);

    				const invalidFiles =  this.GetFilesToProcess(this.containerFiles).filter((a) => {return !IsImageFile(a);});
    				this.logger.log('invalidFiles', invalidFiles);

    				if (invalidFiles.length > 0) {
    					this.setEncryptAlertMessage('Only image files can be used - bmp, jpg, png etc. xxx');
    						this.showEncryptAlert(true);
    						wrapUp();
    					return;
    				}
    				else {
    					this.showEncryptAlert(false);
    				}

    				const messageUnits = this.GetMessageUnits();

    				for (let i = 0; i < messageUnits.length; i++) {
    					const file = messageUnits[i].containerFile;
    					const intArray = messageUnits[i].intArray;
    						this.logger.log('textForImage',intArray);
    					// TODO populateFileInformation should have populated the file dimensions
    					//so we probably don't need to calculate it again
    					this.imageHelper.ImageFileDimensions(file)
    						.then((dimensions: any) => {
    							//let capacity = this.image.ImageFileByteCapacity(dimensions);
    							//!!!! code for file being too small
    							this.processFile(file, dimensions.width, dimensions.height, intArray, this.encryptingCallback);
    							this.encryptingCallback('Downloading complete.');
    						});
    				}

    			});
    		}
    	});
    })

    private populateFileInformation = ((files: any[], imageHelper: IImageHelper) => {
    	return new Promise(async (resolve) => {
    		const filesToProcess =  this.GetFilesToProcess(files);
    		const fileCount = filesToProcess.length;
            
    		for (let i = 0; i < fileCount; i++) {
    			let capacity = 0;
    			const file = filesToProcess[i];
    			await imageHelper.ImageFileDimensions(file)
    				.then((dimensions: Img.Dimensions) => {
    					capacity = imageHelper.ImageByteCapacityForDimensions(dimensions);
    					const fileInfo = new FileInformation(file, dimensions.width, dimensions.height, capacity);
    					this.filesInformation.push(fileInfo);
    				});
    		}
    		resolve();
    	});
    })

    messageUnitsBySize = ((ascending: boolean = true): MessageUnit[] =>{
    	if (ascending) {
    		return this.messageUnits.sort((a, b) => {return a.fileCapacity - b.fileCapacity;});
    	} else {
    		return this.messageUnits.sort((a, b) => {return b.fileCapacity - a.fileCapacity;});
    	}
    })

    messageUnitsByFileNo = (() =>{
    	return this.messageUnits.sort((a, b) => {return a.fileNo - b.fileNo;});
    })

    private encryptMessage = ((msg: string): string => {
    	const intArrayString: {} = JSON.stringify(this.convertToIntArray(msg));
    	const encrypted = EncryptAES(this.secret, intArrayString);
    	return encrypted;
    });

    GetFilesToProcess = ((files: any[]) => {
    	const filesToProcess =  files.filter((x) => {return (x as File).type;});
    	return filesToProcess;
    });

    GetMessageUnits = (() => {
    	return this.messageUnits;
    });

    GetFileObject = ((fileName: string) =>{
    	const file =  this.containerFiles.filter((x) => {return x.name === fileName;});
    	return file[0];
    });

    private splitMessage = (() => {
    	this.logger.log('this.fileInformation',this.filesInformation);
    	const fileCount = this.filesInformation.length;
    	this.logger.log('this.fileInformation.length',this.filesInformation.length);

    	// TODO message length should be calculated iteratively based on the capacity
    	// essentially what we are looking to do is to keep trying to fill the file
    	// any extra files can just contain empty text - this would be encoded in an object
    	// so when unpacking hte files a file with empty text would not affect the decryption

    	//see unit tests
    	//try increasing by one character at a time until message fits.

    	const messageArrayStringified = JSON.stringify(this.convertToIntArray(this.message));
    	const messageLength = messageArrayStringified.length / fileCount;
    	let lastMessagePosition = 0;
    	const hash = HashMd5();
    	

    	for (let i = 0; i < fileCount; i++) {
    		const fileInfo = this.filesInformation[i];
    		this.logger.log('this.fileInformation[i]',this.filesInformation[i]);
    		const readToPosition = lastMessagePosition + messageLength + 1;

    		// we initially transform the message to a number array
    		// so that when we then transform this again into a number array later
    		// we can code with character encoding that is split across bytes 
    		// where special characters may span more than one byte
    		let fileMessage = '';
			
    		if(i < fileCount -1) {
    			fileMessage = messageArrayStringified.substring(lastMessagePosition, readToPosition);
    		} else {
    			fileMessage = messageArrayStringified.substring(lastMessagePosition, messageArrayStringified.length);
    		}

    		this.logger.log('fileMessage',fileMessage);
    		const encrypted = this.secret.length !== 0;
    		const messageFile = new MessageUnit(fileMessage, this.contentType, fileInfo.file,  fileInfo.bytesAvailable, hash, i + 1, fileCount, encrypted, this.logger);
    		this.messageUnits.push(messageFile);
    		lastMessagePosition = readToPosition;
    	}
    });

    processCanvas = ((canvas: HTMLCanvasElement, intArray: number[], encryptingCalllback: any, fileName: string, wrapUp: any) => {
    	return new Promise((resolve) => {
    		const image = new Img.Main();
    		const fnToObjectArray: any = CanvasToObjectArray;
    		const fnObjectArrayToDataArray = image.ObjectArrayToDataArray;
    		const fnDownloadFile = DownloadFile;
    		const fnUpdateImageData = UpdateImageData;
    		const fnEncryptingCalllback = encryptingCalllback;
    		const logger = this.logger;
    		fnEncryptingCalllback('Processing canvas...');
    		//get the context from the canvas
    		const ctx: any = canvas.getContext('2d');
    		fnEncryptingCalllback('Extracting pixels...');
    		const objectArray = fnToObjectArray(canvas, canvas.width, canvas.height);
    		//amend canvas object array to include message
    		fnEncryptingCalllback('Applying encryption (1)...');
    		logger.log('textIntArray',intArray);
    		const amendedObjectArray = image.ApplyToPixels(objectArray, intArray);
    		//apply amended pixels to image in canvas
    		fnEncryptingCalllback('Applying encryption (2)...');
    		const amendedDataArray = fnObjectArrayToDataArray(amendedObjectArray);
    		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    		fnEncryptingCalllback('Applying encryption (3)...');
    		fnUpdateImageData(imageData.data, amendedDataArray);
    		ctx.putImageData(imageData, 0, 0);
    		//download the file
    		fnEncryptingCalllback('Downloading file...');
    		fnDownloadFile(canvas, fileName);
    		fnEncryptingCalllback('Downloading complete.');
    		wrapUp();
    	});
    })

    processFile = ((file: any, width: number, height: number, intArray: number[], encryptingCalllback: any) => {
    	return new Promise((resolve) => {
    		const reader = new FileReader();
    		const image = new Img.Main();
    		const fnToObjectArray: any = CanvasToObjectArray;
    		const fnObjectArrayToDataArray = image.ObjectArrayToDataArray;
    		const fnDownloadFile = DownloadFile;
    		const fnUpdateImageData = UpdateImageData;
    		const fnEncryptingCalllback = encryptingCalllback;
    		const logger = this.logger;
    		fnEncryptingCalllback('Reading file...');
    		reader.readAsDataURL(file);

    		reader.onload = ((event: any) => {
    			const img = new Image();
    			img.src = event.target.result;
    			fnEncryptingCalllback('Loading image...');
               
    			img.onload = function(this) {
    				//prepare the canvas
    				const divs = document.querySelectorAll('canvas');
    				Array.from(divs).forEach((div) => div.remove());
    				const canvas = document.createElement('canvas');
    				canvas.setAttribute('id','NewCanvas');
    				canvas.width = width;
    				canvas.height = height;
    				//get the context from the canvas
    				const ctx: any = canvas.getContext('2d');
    				ctx.drawImage(img, 0, 0, width, height);
    				//convert canvas to object array
    				fnEncryptingCalllback('Extracting pixels...');
    				const objectArray = fnToObjectArray(canvas, width, height);
    				//amend canvas object array to include message
    				fnEncryptingCalllback('Applying encryption (1)...');
    				logger.log('textIntArray',intArray);
    				const amendedObjectArray = image.ApplyToPixels(objectArray, intArray);
    				//apply amended pixels to image in canvas
    				fnEncryptingCalllback('Applying encryption (2)...');
    				const amendedDataArray = fnObjectArrayToDataArray(amendedObjectArray);
    				const imageData = ctx.getImageData(0, 0, width, height);
    				fnEncryptingCalllback('Applying encryption (3)...');
    				fnUpdateImageData(imageData.data, amendedDataArray);
    				ctx.putImageData(imageData, 0, 0);
    				//download the file
    				fnEncryptingCalllback('Downloading file...');
    				fnDownloadFile(canvas,'TestingFile.jpg');
    				fnEncryptingCalllback('Downloading complete.');
    			};
    			reader.onerror = error => logger.log(error);
    		});     
    	});
    })

    convertToIntArray = ((message: string): number[] => {
    	const messageData =  StringToNumberArray(message);
    	return messageData;
    });

    bytesRequired = ((): number => {
    	const totalBytes = this.messageUnits.reduce(
    		(total:number, messageUnit) => {return total + messageUnit.BytesRequired();},0);
    	return totalBytes;
    });
}

export class MessageUnPacker {
    files: any[];
    endMarker: string;
    secret: string;
    callback: any;
    logger: any;

    messageUnits: MessageUnit[] = [];
   
   
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
    MessageFromFiles = ( (messageUnits: MessageUnit[], secret: string, contentType: ContentType, fileType: string, fileName: string, fileInfoCollection: any[]): Result => {
    	let message = messageUnits.sort((a, b) => {return a.fileNo - b.fileNo;}).reduce((a, b) => {return a + b.message;},'');
    	const result =  new Result(true, '', contentType, fileType, fileName);
    	let charNumArray =  JSON.parse(message);

    	if (contentType === ContentType.Text) {
    		charNumArray = decompressByteArray(charNumArray);
    	}

   		message = charNumArray.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
    	const encrypted = secret !== '';

    	if (!encrypted) {
    		this.logger.log('message',message);
    		result.body = message;
    		this.logger.log('The content type is', ContentType[result.contentType]);
    		this.logger.log('The file type is', result.fileType);
    		this.logger.log('The file name is', result.fileName);
			
    		if (contentType === ContentType.File) {
    			const simpleArray: any[] = message.split(',');
    			const decompressedArray = decompressByteArray(simpleArray);
    			const intArray = new Uint8Array(decompressedArray);
				
    			fileInfoCollection.forEach(fileInfo => {
    				const fileName = fileInfo.fileName;
    				const fileType = fileInfo.fileType;
    				const fileArray = intArray.slice(fileInfo.startsAt === 0 ? 0 : fileInfo.startsAt -1, fileInfo.endsAt + 1);
    				const blob=new Blob([fileArray], {type: fileType});
    				const link=document.createElement('a');
    				link.href=window.URL.createObjectURL(blob);
    				link.download = fileName;
    				link.click();	
    			});
				
    			result.body = 'File successfully downloaded.';			
    		}
    		return result;
    	} else {
    		try {
    			const messageDecrypted: any = DecryptAES(secret, message);
				
    			if (contentType === ContentType.Text) {
    				const message = messageDecrypted.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
    				result.body = message;
    			}
  			
    			if (contentType === ContentType.File) {
    				const simpleArray: number[] = messageDecrypted.split(',');
    				const decompressedArray = decompressByteArray(simpleArray);
    				const intArray = new Uint8Array(decompressedArray);
					
    				this.logger.log('fileInfoCollection',fileInfoCollection);

    				fileInfoCollection.forEach(fileInfo => {
    					const fileName = String(DecryptAES(secret, fileInfo.fileName));
    					const fileType = String(DecryptAES(secret, fileInfo.fileType));
    					const startsAt = parseInt(String(DecryptAES(secret, fileInfo.startsAt)));
    					const endsAt = parseInt(String(DecryptAES(secret, fileInfo.endsAt)));
    					const fileArray = intArray.slice(startsAt === 0 ? 0 : startsAt -1, endsAt + 1);
    					const blob=new Blob([fileArray], {type: fileType});
    					const link=document.createElement('a');
    					link.href=window.URL.createObjectURL(blob);
    					link.download = fileName;
    					link.click();	
    				});

    				result.body = 'File successfully downloaded.';				
    			}				
    			return result;
    		} catch (error) {
    			result.success = false;
    			result.error = DecryptionError.Secret;
    			return result;
    		}            
    	}
    });

    AllFilesProcessed = ((messageUnits: MessageUnit[], filesImported: number): boolean => {
    	const filesExpected = messageUnits[0].totalFiles;
    	return  filesImported === filesExpected && messageUnits.length ===  filesExpected;
    });

    FileSetValidated = ((fileSet: string, messageUnits: MessageUnit[]):boolean => {
    	const uniqueFileSets = messageUnits.map(a => a.fileSet).filter((x, i, a) => a.indexOf(x) === i);

    	if (uniqueFileSets.length === 0) {
    		return true;
    	} else {
    		return uniqueFileSets.length === 1 && uniqueFileSets[0] === fileSet;
    	}
    });

    processFiles = (() => {
    	return new Promise((resolve) => {
    		const filesToProcess = this.GetFilesToProcess();
    		const image = new Img.Main();
    		const invalidImageFiles =  filesToProcess.filter((a: any) => {return !IsImageFile(a);});
    		const endMarker = this.endMarker;
    		const messageUnits = this.messageUnits;
    		const fnToObjectArray:any = CanvasToObjectArray;
    		const fnMessageFromFiles = this.MessageFromFiles;
    		const fnFileSetValidated = this.FileSetValidated;
    		const fnAllFilesProcessed = this.AllFilesProcessed;
    		const secret = this.secret;
    		const logger = this.logger;

    		if (invalidImageFiles.length > 0){
    			resolve(new Result(false, '', ContentType.Unknown, '', '')); 
    			return;
    		}

    		let fileInfoCollection: any[] = [];

    		//populate message units with files
    		for (let i = 0; i < filesToProcess.length; i++) {

    			let extractionResult: Result = new Result(true, '', ContentType.Unknown, '', '');
    			//unpack bytes from image file
    			let decryptedTextInitial = '';
    			const file = filesToProcess[i];

    			image.ImageFileDimensions(file)
    				.then((dimensions: any) => {
    					const reader = new FileReader();
    					reader.readAsDataURL(file);
                
    					reader.onload = ((event: any) => {
    						const img = new Image();
    						img.src = event.target.result;

    						img.onload = async function(this, callBack: any) {

    							const divs = document.querySelectorAll('canvas');
    							Array.from(divs).forEach((div) => div.remove());
    							const canvas = document.createElement('canvas');
    							canvas.setAttribute('id','NewCanvas'+i);
    							canvas.width = dimensions.width;
    							canvas.height = dimensions.height;
    							const ctx: any = canvas.getContext('2d');
    							ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
    							const objectArray = fnToObjectArray(canvas, dimensions.width, dimensions.height);
    							logger.log('endMarker',endMarker);
    							const result = image.ExtractFromPixels(objectArray, '', endMarker, 0);
    							decryptedTextInitial = result.map(a => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
    							//logger.log('decryptedTextInitial',decryptedTextInitial);
    							const decryptedTextInitialObj = JSON.parse(decryptedTextInitial);
    							logger.log('decryptedTextInitialObj.encrypted',decryptedTextInitialObj.encrypted);

    							if (decryptedTextInitialObj.encrypted && !secret) {
    								logger.log('decryptedTextInitialObj', decryptedTextInitialObj);
    								extractionResult.success = false;
    								extractionResult.error = DecryptionError.Encrypted;
    								resolve(extractionResult);  
    								return;
    							}

    							logger.log('decryptedTextInitialObj', decryptedTextInitialObj);
    							const contentType: ContentType = parseInt(ContentType[decryptedTextInitialObj.contentType]);
    							const fileType = decryptedTextInitialObj.fileType;
    							const fileName = decryptedTextInitialObj.fileName;
								
    							if (decryptedTextInitialObj.fileInfoDtoCollection.length !== 0) {
    								fileInfoCollection = decryptedTextInitialObj.fileInfoDtoCollection;
    							}

    							if (!fnFileSetValidated(decryptedTextInitialObj.fileSet, messageUnits)) {
    								extractionResult.success = false;
    								extractionResult.error = DecryptionError.FileSet;
    								resolve(extractionResult);  
    								return;
    							}
						
   							 	const extractedMessageBody = decryptedTextInitialObj.message;
    							//logger.log('decryptedText',extractedMessageBody);
    							const unit = new MessageUnit(extractedMessageBody, contentType, file, 0, decryptedTextInitialObj.fileSet, parseInt(decryptedTextInitialObj.fileNo), parseInt(decryptedTextInitialObj.totalFiles), decryptedTextInitialObj.encrypted, logger);    
    							logger.log('unit', unit);
    							messageUnits.push(unit);

    							if (fnAllFilesProcessed(messageUnits, filesToProcess.length)) {
       								extractionResult = fnMessageFromFiles(messageUnits, secret, contentType, fileType, fileName, fileInfoCollection);
    								resolve(extractionResult);  
    								return;
    							}
    						};
    					});
    				});
    		}
    	});
    });


    GetFilesToProcess = (() => {
    	this.logger.log('this.files', this.files);
    	const filesToProcess =  this.files.filter((x: any) => {return (x as File).type;});
    	return filesToProcess;
    });

    GetMessageUnits = (() => {
    	return this.messageUnits;
    });

    GetFileObject = ((fileName: string) =>{
    	const file =  this.files.filter((x) => {return x.name === fileName;});
    	return file[0];
    });
}

const CanvasToObjectArray = ((canvas: any, width: number, height: number) => {
	const imageData = ImageDataFromCanvas(canvas, width, height);
	const image = new Img.Main();
	const result = image.DataArrayToObjectArray(imageData);
	return result;
});

const ImageDataFromCanvas = ((canvas: any, width: number, height: number): any => {
	const ctx: any = canvas.getContext('2d');
	const imageData = ctx.getImageData(0, 0, width, height);
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

	const link = document.createElement('a');

	link.download = fileName? fileName : 'filename.jpg';
	link.href = canvas.toDataURL() ;
	link.click();
});