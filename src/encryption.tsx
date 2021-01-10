/* eslint-disable no-debugger */
/* eslint-disable no-mixed-spaces-and-tabs */
import SimpleCrypto from 'simple-crypto-js';
import md5 from 'md5';
import * as Img from './image';
import { Dimensions, EndMarker, IImageHelper, IsImageFile, StringToNumberArray } from './image';
import { IMessagePackerBuilder } from './IMessagePackerBuilder';
import { IProgressHelper } from './IProgressHelper';
import { EventListener, IEventListener } from './eventListener';

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
// Note - this function operates on the basis of characters from the message rather than bytes
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
	let fileUnit: any = null; 

	//debugger;
	while (!found) {
		possibleAttempts = highRange + lowRange - 1;
		currentAttempt = Math.ceil(possibleAttempts / 2);

		// it's possible to get stuck in an infinite loop where the currentAttempt
		// always stays at message.length - 1
		if (currentAttempt === lastAttempt) break;
		
		lastAttempt = currentAttempt;
		currentMessage = message.substring(0, currentAttempt);
		fileUnit = new FileUnit(currentMessage, contentType, '', capacity, hash, fileNo, totalFiles, encrypted, logger, fileInfoCollection);
		const bytesUsed = fileUnit.BytesRequired();

		found = bytesUsed === capacity || (currentAttempt === message.length && bytesUsed < capacity);
		if(bytesUsed > capacity) highRange = currentAttempt - 1;
   		if(bytesUsed < capacity) lowRange = currentAttempt + 1;
	}
	return fileUnit;
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
// fileCapacity - currently only used for sorting FileUnits by capacity
// arrayForImage - an array of numbers encoding hte bytes of the message
// logger - a logger that can be passe in to aid debugging
export class FileUnit {
    fileNo: number;//consider for encryption
    totalFiles: number;//consider for encryption
    message: string;//consider for encryption
    fileSet: string;//consider for encryption
    encrypted: boolean;
	containerFile: any;
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
    	const packedStr = JSON.stringify(new FileDto(this.message, this.fileSet, this.fileNo, this.totalFiles, this.contentType, this.encrypted, this.fileInfoDtoCollection));
    	const endMarker = EndMarker(packedStr);
    	const toEncrypt  = packedStr + endMarker;
    	const textIntArray = StringToNumberArray(toEncrypt);
    	return textIntArray;
    });

    BytesRequired = ((): number => {return this.intArray.length;});
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
	fileUnits: FileUnit[] = [];
	setDimensionsRequired: any;
	setPackedMessage: any;
	containerFiles: any[] = [];
	dimensionsLimit: Dimensions;
	byteFiles: any[] = [];
	contentType: ContentType = ContentType.Unknown;
	message: string = '';
	secret: string = '';
	usedBytesPercEventName: string = '';
	showDialogEventName: string = '';
	imageHelper :any;
	showEncryptAlert: any;
	setEncryptAlertMessage: any;
	encryptingCallback: any;
	logger: any;
	progressHelper: IProgressHelper;
	eventListener: IEventListener;
	

	packerId: string = '';
	filesProcesed: any[] =[];
	fileProcessedData: any = [];
	totalBytes: any[] = [];
	fileInfoArray: FileInfoDto[] = [];
	filesToProcess: any = [];
	wrapUpCallbackFunction: any;




	constructor(pack: IMessagePackerBuilder) {
		this.packerId = HashMd5();
		this.setDimensionsRequired = pack.setDimensionsRequired;
		this.setPackedMessage = pack.setPackedMessage;
		this.containerFiles = pack.containerFiles;
		this.dimensionsLimit = pack.dimensionsLimit;
		this.byteFiles = pack.byteFiles;
		this.contentType = pack.contentType;
		this.message = pack.message;
		this.secret = pack.secret;
		this.imageHelper = pack.imageHelper;
		this.showEncryptAlert = pack.showEncryptAlert;
		this.setEncryptAlertMessage = pack.setEncryptAlertMessage;
		this.encryptingCallback = pack.encryptingCallback;
		this.logger = pack.logger;
		this.progressHelper = pack.progressHelper;
		this.eventListener = pack.eventListener;


		this.logger.log('contentType',this.contentType);
		
    	if (this.contentType === ContentType.Text) {
    		if (this.secret !== '') {
    			this.logger.log('encrypting unencrypted text message','');
    			this.message = this.encryptMessage(this.message);            
    		}
		}
		
		this.setUpListeners();
	}   


	setUpListeners = (() => {

		this.eventListener.addEventListener('TestForThisClass', (e: any) => {
			console.log('TestForThisClass event heard from messagepacker');
			console.log(e.detail);
		});	

		this.eventListener.addEventListener('GetTotalBytesAndFileInfo' + this.packerId, function(e: any) {
			console.log('GetTotalBytesAndFileInfo', e.detail);
		});	

		this.getByteAndFileInfoListener();

		this.progressHelper.AddSubscriber('GetByteAndFileInfo');
		this.progressHelper.AddSubscriber('processBytesAndFileInfo');
		this.progressHelper.AddSubscriber('createFileUnits');
		this.progressHelper.AddSubscriber('createFractals');

		this.progressHelper.SetSubscriberTotal('GetByteAndFileInfo', 1);
		this.progressHelper.SetSubscriberTotal('processBytesAndFileInfo', 1);
		this.progressHelper.SetSubscriberTotal('createFileUnits', 1);
		this.progressHelper.SetSubscriberTotal('createFractals', 1);
	});


	CanFitBytesIntoContainers = (async() => {
		// let's first get the bytes 

		const dims: any = [];

		this.containerFiles.forEach(async (file: any) => {	
			this.imageHelper.ImageFileDimensions(file).then((dim: any) =>{
				console.log('dim',dim);
				dims.push(dim);
			});
		});
		
		console.log('dims',dims);
		console.log('dims[0]',dims[0]);
		console.log('dims[1]',dims[1]);
	});

	getByteAndFileInfoListener = (() =>{
		this.eventListener.addEventListener('GetByteAndFileInfo' + this.packerId, (e: any) => {
			
			const eventData = e.detail.eventObject;

			console.log('GetByteAndFileInfo', eventData);
			const totalFiles = eventData.totalFiles;

			if (this.filesProcesed.length === 0) {
				this.progressHelper.SetSubscriberTotal('GetByteAndFileInfo', totalFiles);
				this.progressHelper.SetSubscriberTotal('processBytesAndFileInfo', totalFiles);
				this.progressHelper.SetSubscriberTotal('createFileUnits', 1);
				this.progressHelper.SetSubscriberTotal('createFractals', 1);
			}

			this.filesProcesed.push(eventData.fileNo);
			console.log('filesProcesed', this.filesProcesed);
			this.fileProcessedData.push(eventData);
			this.progressHelper.SetSubscriberCount('GetByteAndFileInfo', this.filesProcesed.length);
			
			setTimeout(() => { this.progressHelper.SendMessage('Getting byte and file info...'); }, 1);

			// let's process the next package file
			// not assuming that we get the events back in sequential order of files sent to GetByteAndFileInfo
			// as onload is asynchronous
			if (this.filesProcesed.length < this.filesToProcess.length) {
				let found = false;
				this.filesToProcess.forEach((file: any, index: number) => {
					if (!found && this.filesProcesed.indexOf(index) === -1) {
						this.GetByteAndFileInfo(this.filesToProcess[index], 'GetByteAndFileInfo', index, totalFiles, eventData.createFiles, null);
						found = true;
					}
				});
			} else {
				console.log('All files initial processing complete');
				console.log('fileProcessedData', this.fileProcessedData);

				setTimeout(() => { this.progressHelper.SendMessage('Processing byte and file info...'); }, 1);
				
				setTimeout(() => { this.processBytesAndFileInfo(); }, 1);
				
				console.log('totalBytes length before compression', this.totalBytes.length);

				setTimeout(() => { this.progressHelper.SendMessage('Compressing bytes...'); }, 1);

				this.totalBytes = this.compressIntArray(this.totalBytes);
				console.log('totalBytes length after compression', this.totalBytes.length);
				
				setTimeout(() => { this.progressHelper.SendMessage('Creating message units...'); }, 1);

				const dimensions: Dimensions[] = [];
				let createFileUnitsResult: any = {};

				this.logger.log('eventData',eventData);

				if (!eventData.createFiles) {
					this.containerFiles.forEach(containerFile => {
						this.imageHelper.ImageFileDimensions(containerFile).then((dims: Dimensions)=>{
							//TODO HERE
							//debugger;
							dims.file = containerFile;
							dimensions.push(dims);
							//debugger;

							if(dimensions.length === this.containerFiles.length) {
								//TODO I think we want to pass through the filename here too
								//so that when we create the output files we know which file to output to
								createFileUnitsResult = this.createFileUnits(true, dimensions);
								//debugger;
								console.log('this.packerId',this.packerId);
								console.log('createFileUnitsResult', createFileUnitsResult);

								if (this.usedBytesPercEventName) {
									const percent = 100 - createFileUnitsResult.percentProcessed;

									setTimeout(async() => {
										await this.dispatchNotifyEvent(this.usedBytesPercEventName, {percent});										
									}, 0);									

									//debugger;
									if (percent === 100) {					
										setTimeout(() => { this.progressHelper.SendMessage('Creating fractals...'); }, 1);
										//TODO this is where we need to use the files provided
										//as the output files
										setTimeout(() => { this.createFractals(dims); }, 0);
									}

									this.dispatchNotifyEvent('RenderParentEvent', 'Parent rendered');										
								}
							}
						});
					});
				}

				if (eventData.createFiles) {
					//debugger;
					setTimeout(() => { 
						createFileUnitsResult = this.createFileUnits(false, eventData.createFiles ? null : dimensions);
					}, 0);

					console.log('this.fileUnits', this.fileUnits);
				}

				if (eventData.createFiles) {
					//debugger;
					setTimeout(() => { this.progressHelper.SendMessage('Creating fractals...'); }, 1);
					setTimeout(() => { this.createFractals(new Dimensions()); }, 0);
					console.log('this.fileUnits after create fractals', this.fileUnits);
				}

				this.wrapUpCallbackFunction();
			}
		});		
	});

	//TODO for supplied container files load file to canvas as per the link below
	//https://stackoverflow.com/a/6011402
	createFractals = ((dimensions: Dimensions) => {
		for (let i = 0; i < this.fileUnits.length; i++) {
			const fileUnit = this.fileUnits[i];
			fileUnit.fileNo = i + 1;
			fileUnit.totalFiles = this.fileUnits.length;
			fileUnit.RefreshIntArray();

			if (fileUnit.containerFile !== '') {
				this.FillContainerFile(fileUnit, dimensions);
			} else { 
				this.fileUnitToFractalFile(fileUnit, `TestFractal${i}.jpg`, ()=>{});
			}
		}
		this.progressHelper.SetSubscriberCount('createFractals', 1);
	});

	FillContainerFile = ((fileUnit: FileUnit, dimensions: Dimensions) =>{
		//debugger;
		const reader = new FileReader();

		reader.onload = ((event: any) => {
			const fnProcessCanvas = this.processCanvas;
			const img = new Image();
			img.src = event.target.result;
			
			img.onload = async function(this) {
				const hash = HashMd5();
				const canvasId = `containerCanvas${hash}`;
				const divs = document.querySelectorAll('containerCanvas');
				Array.from(divs).forEach((div) => div.remove());
				const canvas = document.createElement('canvas');
				canvas.setAttribute('id',canvasId);
				canvas.width = dimensions.width;
				canvas.height = dimensions.height;
				const ctx: any = canvas.getContext('2d');
				const fileName = fileUnit.containerFile.name;
				//debugger;
				ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
				fnProcessCanvas(canvas, fileUnit.intArray, () => {}, fileName, () => {});
				//resolve(canvas) -> or perfoms an action on this canvas
			};
			
		});

		reader.readAsDataURL(fileUnit.containerFile);			
	});


	createFileUnits = ((dimensionsSupplied: boolean, dimensions: Dimensions[] | null = null) => {
		const bytesPerFile: number[] = [];
		//debugger;
		if (dimensions === null ) {
			bytesPerFile[0] = this.imageHelper.ImageByteCapacityForDimensions(this.dimensionsLimit);
		} else {
			dimensions.forEach((dims: Dimensions) => {
				bytesPerFile.push(this.imageHelper.ImageByteCapacityForDimensions(dims));
			});
		}

		let csvString: any = this.totalBytes.join();
		if (this.isEncrypted()) { csvString = EncryptAES(this.secret, csvString); }
		this.message = csvString;
		let message = JSON.stringify(this.convertToIntArray(this.message));
		const hash = HashMd5();
		const startingMessageLength = message.length;
		this.logger.log('startingMessageLength',startingMessageLength);
		//debugger;

   		// let's keep reducing the size of the message
		// until we have fully processed it  
		let dimensionsCount = 0;
		let completed = false;

		while (!completed) {
			// we are only going to add the populated fileInfoCollection to one message unit
			const fileInfoCollection = this.fileUnits.length === 0 ? this.fileInfoArray : [];
			//debugger;
			//TODO we also want to be passing the container file nae through here 
			//so that we can store this in the fileUnit for later writing to the file.
			const fileUnit =  CharsToFill(bytesPerFile[dimensionsCount], message, ContentType.File,  hash, 1, 1, this.isEncrypted(), this.logger, fileInfoCollection);
			if (dimensions) {fileUnit.containerFile = dimensions[dimensionsCount].file;}
			this.fileUnits.push(fileUnit);
			message = message.slice(fileUnit.message.length);

			if(!dimensionsSupplied) {
				completed = message.length === 0;
			} else {
				completed =  message.length === 0 || dimensionsCount === bytesPerFile.length - 1;
				dimensionsCount++;
			}
		}	

		this.progressHelper.SetSubscriberCount('createFileUnits', 1);
		const len = message.length === 0 ? 1 : message.length;
		const percentProcessed = Math.round((len / startingMessageLength) * 100);

		if (percentProcessed > 0) {
			const eventObject = {title: 'Warning - not enough space', text: 'Not enough space in selected container files to hold data. Please select more, or larger, image files or clear files to auto-generate container files.'};
			this.dispatchNotifyEvent(this.showDialogEventName,eventObject);
		}

		return {startingMessageLength, len, percentProcessed};
	});

	isEncrypted = ((): boolean=> { return this.secret.length > 0; });

	processFileInfo = ((fileInfo: any): FileInfoDto => {
		if (!this.isEncrypted()) return fileInfo;
		
		const encryptedFileInfoDto = fileInfo;
		encryptedFileInfoDto.fileName = EncryptAES(this.secret, encryptedFileInfoDto.fileName);   
		encryptedFileInfoDto.fileType = EncryptAES(this.secret, encryptedFileInfoDto.fileType);   
		encryptedFileInfoDto.startsAt = EncryptAES(this.secret, encryptedFileInfoDto.startsAt);   
		encryptedFileInfoDto.endsAt = EncryptAES(this.secret, encryptedFileInfoDto.endsAt);   

		return encryptedFileInfoDto;
	});

	processBytesAndFileInfo = (() => {
		this.fileProcessedData.forEach((bytesAndInfo: any, index: number) => {
			this.progressHelper.SetSubscriberCount('processBytesAndFileInfo', index + 1);
	
			bytesAndInfo.fileInfoDto.startsAt = this.totalBytes.length;
			this.ArrayConcat(this.totalBytes, bytesAndInfo.byteArrayForThisFile);
			bytesAndInfo.fileInfoDto.endsAt = this.totalBytes.length - 1;

			bytesAndInfo.fileInfoDto = this.processFileInfo(bytesAndInfo.fileInfoDto);
			this.fileInfoArray.push(bytesAndInfo.fileInfoDto);
			console.log('bytesAndInfo after processing', bytesAndInfo);
		});
		console.log('totalBytes', this.totalBytes);
		console.log('fileProcessedData', this.fileProcessedData);
	});

   fileToOutputFile = (async(wrapUp: any)=>{
   	return new Promise((resolve) => {
   		const filesToProcess =  this.byteFiles.filter((x: any) => {return (x as File).type;});
   		const reader = new FileReader();
		
   		reader.onload = ((event: any) => {		   
   			const fnSetMessage = ((message: string) => {this.message = message;});
   			const array = this.ByteArrayToArray(event.target.result);
   			let csvString = array.join();
   			if (this.secret !== '') {
   				csvString = EncryptAES(this.secret, csvString);
   			}

   			fnSetMessage(csvString);
   			const messageForUnit = JSON.stringify(this.convertToIntArray(this.message));
   			const fileUnit = new FileUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, this.isEncrypted(), this.logger);
   			this.fileUnits.push(fileUnit);
   			this.fileUnitToFractalFile(fileUnit, 'fractal.jpg', wrapUp);
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
	
	ArrayConcat = ((mainArray: any[], appendingArray: any[]) => {
		appendingArray.forEach(element => {
			mainArray.push(element);
		});

		return mainArray;
	});

	private dispatchNotifyEvent = ((eventSignature: string, eventObject: any) => {
    	const notifyEvent = new CustomEvent(eventSignature, {
    		detail: {eventObject}
    	});
    	dispatchEvent(notifyEvent);
	});

	TestDimensions = ((file: any, fileProcessedEventSignature: string, fileNo: number, totalFiles: number, usedBytesPercEventName: string, showDialogEventName:string, wrapUp: any) => {
		console.log('this.packerId',this.packerId);
		console.log('TestDimensions file',file);
		this.usedBytesPercEventName = usedBytesPercEventName;
		this.showDialogEventName = showDialogEventName;
		this.GetByteAndFileInfo(file, fileProcessedEventSignature, fileNo, totalFiles, false, wrapUp);
	});

	CreateFiles = ((file: any, fileProcessedEventSignature: string, fileNo: number, totalFiles: number, wrapUp: any) => {
		this.GetByteAndFileInfo(file, fileProcessedEventSignature, fileNo, totalFiles, true, wrapUp);
	});

	GetByteAndFileInfo = ((file: any, fileProcessedEventSignature: string, fileNo: number, totalFiles: number, createFiles: boolean, wrapUp: any) => {
		if (wrapUp !== null && wrapUp !== undefined) {
			this.wrapUpCallbackFunction = wrapUp; 
		}

		const fileType = file.type;
		const fileName = file.name;   
		const reader = new FileReader();

		reader.onload = ((event: any) => {	
			const byteArrayForThisFile = this.ByteArrayToArray(event.target.result);
			const fileInfoDto: FileInfoDto = new FileInfoDto(fileName, fileType, '0', '0');
			this.dispatchNotifyEvent(fileProcessedEventSignature + this.packerId, {fileNo, totalFiles, fileInfoDto, byteArrayForThisFile, createFiles});
			this.dispatchNotifyEvent('TestForThisClass', {message:'Nothing to report...'});
		});
		reader.readAsArrayBuffer(file); 
	});

   fileToOutputFiles = (async(dimensions: Dimensions, imageHelper: IImageHelper, wrapUp: any, progressHelper: IProgressHelper, fileNamePrefix: string)=>{
   	return new Promise((resolve) => {

   		const filesToProcess =  this.byteFiles.filter((x: any) => {return (x as File).type;});
   		const collection: FileInfoDto[] = [];
   		let byteArrayForAllFiles: any[] = [];
   		let filesProcessedCount = 0;   

	   filesToProcess.forEach((file: any) => {		   

   			const bytesPerFile = imageHelper.ImageByteCapacityForDimensions(dimensions);
   			let fileType = file.type;
   			let fileName = file.name;   
   			const reader = new FileReader();
		
   			reader.onload = (async (event: any) => {		   
   				const fnSetMessage = ((message: string) => {this.message = message;});
   				const byteArrayForThisFile = this.ByteArrayToArray(event.target.result);
   				console.log('fileName',fileName);   
   				console.log('byteArrayForThisFile.length',byteArrayForThisFile.length);   
   				const start = byteArrayForAllFiles.length;   
   				byteArrayForAllFiles =	this.ArrayConcat(byteArrayForAllFiles, byteArrayForThisFile);
   				const end = byteArrayForAllFiles.length - 1;
   				let startForDto = String(start);
   				let endForDto = String(end);
				   
   				if (this.isEncrypted()) {
   					fileName = EncryptAES(this.secret, fileName);   
   					fileType = EncryptAES(this.secret, fileType);   
   					startForDto = EncryptAES(this.secret, startForDto as Object);   
   					endForDto = EncryptAES(this.secret, endForDto as Object);   
   				}
   				
   				const fileInfoDto: FileInfoDto = new FileInfoDto(fileName, fileType, startForDto, endForDto);
   				collection.push(fileInfoDto);
   				filesProcessedCount++;
				
   				if (filesProcessedCount === filesToProcess.length) {
   					console.log('collection',collection);
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
   						const fileInfoCollection = this.fileUnits.length === 0 ? collection : [];
						//debugger;   
						const fileUnit =  CharsToFill(bytesPerFile, message, ContentType.File,  hash, 1, 1, this.isEncrypted(), this.logger, fileInfoCollection);
   						this.fileUnits.push(fileUnit);
   						message = message.slice(fileUnit.message.length);
   						const progress = origMessageLength - message.length;
   						progressHelper.SetSubscriberCount('fileToOutputFiles', progress);   
   					}	
		
   					for (let i = 0; i < this.fileUnits.length; i++) {
   						const fileUnit = this.fileUnits[i];
   						fileUnit.fileNo = i + 1;
   						fileUnit.totalFiles = this.fileUnits.length;
   						fileUnit.RefreshIntArray();
   						this.fileUnitToFractalFile(fileUnit, `${fileNamePrefix}${i}.jpg`, wrapUp);				
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
				const messageForUnit = JSON.stringify(this.convertToIntArray(this.message));
				const fileUnit = new FileUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, this.isEncrypted(), this.logger);
				const dimensions = this.imageHelper.DimensionsRequiredForCapacity(fileUnit.BytesRequired());
				this.setDimensionsRequired(dimensions);
				this.fileUnits.push(fileUnit);
				this.setPackedMessage(this);
			});
		
			reader.readAsArrayBuffer(filesToProcess[0]); 
			resolve();
		});
	});
	
	GetMessage = (()=> {this.logger.log('message is now...', this.message);});

    fileUnitToFractalFile = ((fileUnit: FileUnit, fileName: string, wrapUp: any) => {
    	return new Promise((resolve) => {
    		const dimensions = this.imageHelper.DimensionsRequiredForCapacity(fileUnit.BytesRequired());
    		const canvas = this.imageHelper.fractal(dimensions.width, dimensions.height, fileName, true);
    		this.processCanvas(canvas, fileUnit.intArray, this.encryptingCallback, fileName, wrapUp);
    		resolve();
    	});
    });

    ByteArrayToArray(byteArray: any): any {
    	return new Uint8Array(byteArray);
    }

    ProcessFiles = ((wrapUp: any) => {
    	return new Promise((resolve) => {
    	if (this.contentType === ContentType.Text) {
    	}

    	if (this.contentType === ContentType.File) {
   			this.logger.log('message from file in ProcessFiles', this.message);
    		return;
    	}

    	this.logger.log('this.files', this.containerFiles);
    	const noFilesSelected: boolean = typeof this.containerFiles[1] === 'undefined' && typeof this.containerFiles[0] === 'function';

    	if (noFilesSelected) {
    		const compressedArray = this.compressIntArray((this.convertToIntArray(this.message)));
    		const messageForUnit = JSON.stringify(compressedArray);
   			const fileUnit = new FileUnit(messageForUnit, this.contentType, '', 0, HashMd5(), 1, 1, this.isEncrypted(), this.logger);
   			this.fileUnitToFractalFile(fileUnit, 'fractal.jpg', wrapUp);
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

    				const fileUnits = this.GetFileUnits();

    				for (let i = 0; i < fileUnits.length; i++) {
    					const file = fileUnits[i].containerFile;
    					const intArray = fileUnits[i].intArray;
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

    fileUnitsBySize = ((ascending: boolean = true): FileUnit[] =>{
    	if (ascending) {
    		return this.fileUnits.sort((a, b) => {return a.fileCapacity - b.fileCapacity;});
    	} else {
    		return this.fileUnits.sort((a, b) => {return b.fileCapacity - a.fileCapacity;});
    	}
    })

    fileUnitsByFileNo = (() =>{
    	return this.fileUnits.sort((a, b) => {return a.fileNo - b.fileNo;});
    })

    private encryptMessage = ((msg: string): string => {
    	const intArrayString: {} = JSON.stringify(this.convertToIntArray(msg));
    	const encryptedResult = EncryptAES(this.secret, intArrayString);
    	return encryptedResult;
    });

    GetFilesToProcess = ((files: any[]) => {
    	const filesToProcess =  files.filter((x) => {return (x as File).type;});
    	return filesToProcess;
    });

    GetFileUnits = (() => {
    	return this.fileUnits;
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
    		const messageFile = new FileUnit(fileMessage, this.contentType, fileInfo.file,  fileInfo.bytesAvailable, hash, i + 1, fileCount, this.isEncrypted(), this.logger);
    		this.fileUnits.push(messageFile);
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
    	const totalBytes = this.fileUnits.reduce(
    		(total:number, fileUnit) => {return total + fileUnit.BytesRequired();},0);
    	return totalBytes;
    });
}

export class MessageUnPacker {
    files: any[];
    endMarker: string;
    secret: string;
    callback: any;
    logger: any;

    fileUnits: FileUnit[] = [];
   
   
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
    MessageFromFiles = ( (fileUnits: FileUnit[], secret: string, contentType: ContentType, fileType: string, fileName: string, fileInfoCollection: any[]): Result => {
    	let message = fileUnits.sort((a, b) => {return a.fileNo - b.fileNo;}).reduce((a, b) => {return a + b.message;},'');
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
    				const fileArray = intArray.slice(parseInt(fileInfo.startsAt), parseInt(fileInfo.endsAt) + 1);
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
    					const fileArray = intArray.slice(startsAt, endsAt + 1);
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

    AllFilesProcessed = ((fileUnits: FileUnit[], filesImported: number): boolean => {
    	const filesExpected = fileUnits[0].totalFiles;
    	return  filesImported === filesExpected && fileUnits.length ===  filesExpected;
    });

    FileSetValidated = ((fileSet: string, fileUnits: FileUnit[]):boolean => {
    	const uniqueFileSets = fileUnits.map(a => a.fileSet).filter((x, i, a) => a.indexOf(x) === i);

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
    		const fileUnits = this.fileUnits;
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

    						img.onload = async function(this) {

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

    							if (!fnFileSetValidated(decryptedTextInitialObj.fileSet, fileUnits)) {
    								extractionResult.success = false;
    								extractionResult.error = DecryptionError.FileSet;
    								resolve(extractionResult);  
    								return;
    							}
						
   							 	const extractedMessageBody = decryptedTextInitialObj.message;
    							const unit = new FileUnit(extractedMessageBody, contentType, file, 0, decryptedTextInitialObj.fileSet, parseInt(decryptedTextInitialObj.fileNo), parseInt(decryptedTextInitialObj.totalFiles), decryptedTextInitialObj.encrypted, logger);    
    							logger.log('unit', unit);
    							fileUnits.push(unit);

    							if (fnAllFilesProcessed(fileUnits, filesToProcess.length)) {
       								extractionResult = fnMessageFromFiles(fileUnits, secret, contentType, fileType, fileName, fileInfoCollection);
    								resolve(extractionResult);  
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

    GetFileUnits = (() => {
    	return this.fileUnits;
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