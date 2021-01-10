// https://stackoverflow.com/questions/32556664/getting-byte-array-through-input-type-file/32556944

export interface IFileProcessor {
    FileToByteArray(file: any): any;
    ExportFileFromByteArray(byteAray: any, fileType: string, fileName: string):any;
    DimensionsRequiredForFile(file: any, dimensionsForFile: any, setDimensionsForFile: any, bytesToDimensions: any): any;
}

export class Main implements IFileProcessor {
    
	DimensionsRequiredForFile(file: any, dimensionsMessage: any, setDimensionsMessage: any, bytesToDimensions: any) {
		const filesToProcess =  file.filter((x: any) => {return (x as File).type;});
		console.log('file',file);
		console.log('filesToProcess',filesToProcess);
		const fileName = filesToProcess[0].name;
		const fileType = filesToProcess[0].type;
		const reader = new FileReader();
		reader.onload = this.processFileForDimensions(fileType, fileName, dimensionsMessage, setDimensionsMessage, bytesToDimensions);
		reader.readAsArrayBuffer(filesToProcess[0]); 
	}

	FileToByteArray(file: any) {
		const filesToProcess =  file.filter((x: any) => {return (x as File).type;});
		console.log('file',file);
		console.log('filesToProcess',filesToProcess);
		const fileName = filesToProcess[0].name;
		const fileType = filesToProcess[0].type;
		const reader = new FileReader();
		reader.onload = this.processFileForExport(fileType, fileName);
		reader.readAsArrayBuffer(filesToProcess[0]); 
	}

	//https://stackoverflow.com/a/49676679
	processFileForExport(fileType: string, fileName: string){
		const fnExportFileFromByteArray = this.ExportFileFromByteArray;
		const fnByteArrayToArray = this.ByteArrayToArray;

		return function(event: any) { 
			const byteArray = event.target.result;
			console.log('byteArray', byteArray);
			const array = fnByteArrayToArray(byteArray);
			console.log('array', array);
			fnExportFileFromByteArray(array, fileType, fileName);
		};
	}


	processFileForDimensions(fileType: string, fileName: string, dimensionsMessage: any, setDimensionsMessage: any, bytesToDimensions: any){
		const fnSetDimensionsMessage = this.SetDimensionsMessage;
		const fnByteArrayToArray = this.ByteArrayToArray;

		return function(event: any) { 
			const byteArray = event.target.result;
			console.log('byteArray', byteArray);
			const array = fnByteArrayToArray(byteArray);
			console.log('array', array);			
			fnSetDimensionsMessage(array, dimensionsMessage, setDimensionsMessage, bytesToDimensions);
		};
	}

	ByteArrayToArray(byteArray: any): any {
		return new Uint8Array(byteArray);
	}

	ExportFileFromByteArray(byteArray: any, fileType: string, fileName: string): any {
		const blob=new Blob([byteArray], {type: fileType});
		const link=document.createElement('a');
		link.href=window.URL.createObjectURL(blob);
		link.download = 'New_' + fileName;
		link.click();
	}
    
	SetDimensionsMessage(byteArray: any, dimensionsMessage: any, setDimensionsMessage: any, bytesToDimensions: any): any {
		console.log('here we are in SetDimensionsMessage');
		const dims = bytesToDimensions(byteArray);
		setDimensionsMessage(dimensionsMessage + ' ' + dims);
	}
}