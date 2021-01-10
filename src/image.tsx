
export interface IImageHelper {
	ByteCapacityOfFile(file: any): Promise<number>;
	ImageFileDimensions(file: any): Promise<Dimensions>;
	ImageByteCapacityForDimensions(dimensions: Dimensions): number;
	DimensionsRequiredForCapacity(bytesCapacity: number): Dimensions;
	fractal(width: number, height: number, fileName: string, asCanvas: boolean): any;
	createImageForTesting(width: number, height: number, fileName: string, asCanvas: boolean): any;
}

class PixelObject {
	id: number;
	vals: any[];

	constructor(id: number, vals: any[]) {
		this.id = id;
		this.vals = vals;
	}	
}

export class Dimensions {
	width: number;
	height: number;
	file: any;

	constructor() {
		this.width = 0;
		this.height = 0;
		this.file = null;
	}

	HasZeroSize = (():boolean => { return this.width === 0  && this.height === 0});
}

export const IsImageFile = (file: any): boolean => file.type.includes('image/');

export const EndMarker = ((text: string, decrypting: boolean = false, bytesToAdd: number = 0): string => {
	const endString = 'SteganographyEndMarker';
	let result = endString;
	const messageLength = text.length + bytesToAdd;

	if(decrypting) return endString;

	if((messageLength + endString.length) % 3 !== 0 || endString.length === 0) {
		const count =  3 - (messageLength + endString.length) % 3;
		result = endString + '#'.repeat(count);
	}
	return result;
});

export const StringToNumberArray = ((txt: string): number[] => {
	const result: number[] = [];
	txt.split('').map( a => result.push(a.charCodeAt(0)));
	return result;
});

export class Main implements IImageHelper {

	//https://stackoverflow.com/questions/46399223/async-await-in-image-loading
	ImageFileDimensions = ((file: any) => {
		return new Promise<Dimensions>((resolve) => {
			const img = new Image();
			img.src = URL.createObjectURL(file);
			img.onload = () => {
				const dimensions = new Dimensions();
				dimensions.width = img.width;
				dimensions.height = img.height;
				resolve(dimensions);
			};
		});
	});

	ImageByteCapacityForDimensions = ((dimensions: Dimensions): number => {
		const totalPixels = dimensions.width * dimensions.height;
		const totalBits = totalPixels * 3;
		const totalBytes = Math.floor(totalBits / 8);
		return totalBytes;
	});

	ByteCapacityOfFile =  ((file: any): Promise<number> => {
		return new Promise<number>((resolve) => {
			const bytes = this.ImageFileDimensions(file).then((dimensions) => {
				return this.ImageByteCapacityForDimensions(dimensions);
			});
			resolve(bytes);
		});
	});

	DimensionsRequiredForCapacity = ((bytesCapacity: number): Dimensions => {
		const pixels = Math.floor((bytesCapacity * 8) / 3);
		const dim = Math.ceil(Math.sqrt(pixels));
		const result = new Dimensions();
		result.height = dim;
		result.width = dim;
		return result;
	});

	EnoughSpace = ((fileCapacity: number, text: string): boolean =>{
		const textBytes = text.length;
		const capacity = fileCapacity >= textBytes;
		return capacity;
	});

	SplitLargeArray = ((arr: any[], maxSize: number = 100) => {
		const resultArray = [];
		let workingArray = [];

		for (let i = 0; i <= arr.length; i++) {
			workingArray.push(arr[i]);

			if (workingArray.length > maxSize) {
				const newArr = [...workingArray];
				workingArray = [];
				resultArray.push(newArr);
			}
		}
		return resultArray;
	});

	PixelArrayToObjectPiXelArray = ((pixelArray: any): any => {
		const result = [];

		for (let i = 0; i < pixelArray.length; i++) {
			const element = pixelArray[i];
			const pix = new PixelObject(i, element);
			result.push(pix);
		}
		return result;
	});

	ObjectArrayToDataArray = ((objectArray: any): any => {
		const result = [];
		for (let i = 0; i < objectArray.length; i++) {
			const element = objectArray[i];

			for (let p = 0; p < 4; p++) {
				result.push(element.vals[p]);
			}
		}
		return result;
	});



	DataArrayToObjectArray = ((imageData: any): any =>{
		const objectArray = [];
		let p = 0;
		let id = 0;
		let valArray = [];

		for (let i = 0; i < imageData.data.length; i++) {
			const element = imageData.data[i];
			valArray.push(element);
			p++;
		
			if (p === 4) {
				id ++;
				const pix = new PixelObject(id, valArray);
				objectArray.push(pix);
				valArray = [];
				p = 0;
			}
		}
		return objectArray;
	});

	TestingArray = ((): any[] => {
		const result: any[] = [];

		for (let i = 0; i < 200; i++) {
			const id = i + 1;
			result.push({id:id, vals: [255, 255, 255, 255]});
		}

		return result;
	});

	GetPixelPart =((pixel: any, element: any): number => {
		if (element === 'R') {
			return pixel[0];
		}
		if (element === 'G') {
			return pixel[1];
		}
		if (element === 'B') {
			return pixel[2];
		}
		if (element === 'A') {
			return pixel[3];
		}
		return -999;
	});

	ReplaceElementsAtStart = ((originalArray: any[], insertingArray: any[]): any[] =>{
		const initialArray: any = originalArray.slice(insertingArray.length + 1, originalArray.length);
		const newArray = insertingArray.concat(initialArray);
		return newArray;
	});

	ApplyToPixels = ((pixels: any, intArray: number[]): number[] => {
		const result: any[] = [];
		const state = 'Hiding';
		let intIndex: number = 0;
		let intValue: number = 0;
		let pixelElementIndex: number = 0;
		let originalR: number = 0;
		let originalG: number = 0;
		let originalB: number = 0;
		let originalA: number = 0;
		let R: number = 0;
		let G: number = 0;
		let B: number = 0;

		for (let pixelCount = 0; pixelCount < pixels.length; pixelCount++) {
			const pixel = pixels[pixelCount].vals;
			const id = pixelCount + 1;
			originalR = this.GetPixelPart(pixel,'R');
			originalG = this.GetPixelPart(pixel,'G');
			originalB = this.GetPixelPart(pixel,'B');
			originalA = this.GetPixelPart(pixel,'A');
			R = originalR - Math.floor(originalR % 2);
			G = originalG - Math.floor(originalG % 2);
			B = originalB - Math.floor(originalB % 2);

			for (let p = 0; p < 3; p++) {
				if (Math.round(pixelElementIndex % 8) === 0) {
					if (intIndex >= intArray.length)
					{
						pixels = this.ReplaceElementsAtStart(pixels, result);
						// old way was to use splice with a spread operator
						// which runs out of memory 
						//pixels.splice(0, result.length, ...result);
						return pixels;
					}
					else
					{
						intValue = intArray[intIndex];
						intIndex++;
					}
				}

				switch (Math.round(pixelElementIndex % 3))
				{
				case 0:
				{
					if (state === 'Hiding')
					{
						R += intValue % 2;
						intValue = Math.floor(intValue / 2);
					}
					break;
				}
				case 1:
				{
					if (state === 'Hiding')
					{
						G += intValue % 2;
						intValue = Math.floor(intValue / 2);	
					}
					break;
				}
				case 2:
				{
					if (state === 'Hiding')
					{
						B += intValue % 2;
						intValue = Math.floor(intValue / 2);
					}

					result.push({id: id, vals: [Math.round(R), Math.round(G), Math.round(B), originalA]});
					break;
				}
				}
				pixelElementIndex++;
			}
		}
		return result;
	});

	reverseBits = ((n: number): number => {
		let result: number = 0;

		for (let i = 0; i < 8; i++) {
			result = result * 2 + n % 2;
			n = Math.floor(n/2);			
		}
		return result;
	});

	PixelValue = ((intValue: number, pixel: any): number => {
		return intValue * 2 + pixel % 2;
	});

	PixelIntToChar = ((pixelInt: number): string => {
		if (pixelInt === 0) return 'R';
		if (pixelInt === 1) return 'G';
		if (pixelInt === 2) return 'B';
		if (pixelInt === 3) return 'A';
		return '';
	});

	ExtractFromPixels = ((pixels: any, startMarker: string, endMarker: string, fromByteNo: number, bytesToRead: number =  Number.MAX_SAFE_INTEGER) => {
		let colorUnitIndex: number = 0;
		let intValue: number = 0;
		const endMarkerLength: number = endMarker.length;
		const endMarkerList: number[] = [];
		const ints: number[] = [];
		endMarker.split('').map( a => endMarkerList.push(a.charCodeAt(0)));
		//console.log('endMarker',endMarker);

		for (let pixelCount = 0; pixelCount < pixels.length; pixelCount++) {
			const pixel = pixels[pixelCount].vals;

			for (let p = 0; p < 3; p++) {
				const colour = colorUnitIndex % 3;
				if (colour in [0, 1, 2]){
					intValue = this.PixelValue(intValue, this.GetPixelPart(pixel, this.PixelIntToChar(colour)));
				}
				colorUnitIndex++;

				if (colorUnitIndex % 8 === 0)
				{
					intValue = this.reverseBits(intValue);
					ints.push(intValue);

					if (bytesToRead >= 0 && ints.length === bytesToRead + startMarker.length + 1) {
						return ints;
					}	

					if (endMarker !== '' && ints.length  > endMarkerLength)
					{
						let endFound = true;
						const check: number[] = ints.slice(ints.length - endMarkerLength, ints.length);

						for (let x = 0; x < endMarkerLength; x++)
						{
							if (endMarkerList[x] !== check[x])
							{
								endFound = false;
								break;
							}
						}
						if (endFound)
						{
							const startIndex = startMarker.length + fromByteNo;
							const endIndex = ints.length - (endMarkerLength + startMarker.length + fromByteNo);
							return ints.slice(startIndex, startIndex + endIndex);
						}
					}
				}
			}
		}
		const startIndex = startMarker.length;
		const endIndex =  ints.length - (endMarkerLength + startMarker.length + 1);
		return ints.slice(startIndex, startIndex + endIndex);
	});

	createImageForTesting = ((width: number, height: number, fileName: string, asCanvas = false) => {
	// http://www.cheminfo.org/Tutorial/8._Images/9.7_Create_a_PNG_image_in_javascript/index.html
	// https://medium.com/the-guardian-mobile-innovation-lab/generating-images-in-javascript-without-using-the-canvas-api-77f3f4355fad
		const divs = document.querySelectorAll('canvas');
		Array.from(divs).forEach((div) => div.remove());
		const canvas = document.createElement('canvas');
		canvas.setAttribute('id','NewCanvas');
		canvas.height = height;
		canvas.width = width;
		console.log('canvas', canvas);
		const context: any = canvas.getContext('2d');
		const imageData = context.createImageData(width, height);
		const data = imageData.data;
	
		for (let i = 0; i < height * width; i++) {
			data[i*4+0] = Math.random()*256 | 0; // Red
			data[i*4+1] = Math.random()*256 | 0; // Green
			data[i*4+2] = Math.random()*256 | 0; // Blue
			data[i*4+3] = 90; // alpha (transparency)
		}
	
		context.putImageData(imageData, 0, 0);
	
	
		if (asCanvas) {
			return canvas;
		} else {
			const link = document.createElement('a');
			link.download = fileName? fileName : 'filename.jpg';
			link.href = canvas.toDataURL('image/jpeg') ;
			link.click();
		}
	})


	

	//https://progur.com/2017/02/create-mandelbrot-fractal-javascript.html
	mandlebrot = ((maxIters: number, magnification: number, panx: number, pany: number) => {

		const checkIfBelongsToMandelbrotSet = ((x: any, y: any) => {
			let realComponentOfResult = x;
			let imaginaryComponentOfResult = y;
			const maxIterations = maxIters;//100;
	
			for(let i = 0; i < 100; i++) {
				// Calculate the real and imaginary components of the result
				// separately
				const tempRealComponent = realComponentOfResult * realComponentOfResult - imaginaryComponentOfResult * imaginaryComponentOfResult + x;
				const tempImaginaryComponent = 2 * realComponentOfResult * imaginaryComponentOfResult + y;
				realComponentOfResult = tempRealComponent;
				imaginaryComponentOfResult = tempImaginaryComponent;
	
				// Return a number as a percentage
				if(realComponentOfResult * imaginaryComponentOfResult > 5) 
					return (i/maxIterations * 100);
			}
			
			// if (realComponentOfResult * imaginaryComponentOfResult < 5)
			// 	return true; // In the Mandelbrot set
			
			// return false; // Not in the set
			return 0;
		});

		const colour = (() => {
			const col  =  Math.floor(Math.random() * 4);
			switch (col)
			{
			case 0:
			{return 0;}//red		
			case 1:
			{return 60;}//yellow
			case 2:
			{return 39;}//orange
			case 3:
			{return 300;}//magenta
			}
		});

		const magnificationFactor = magnification;//150;
		const panX = panx;//1.75;
		const panY = pany;//1.25;

		//const divs = document.querySelectorAll('canvas');
		//Array.from(divs).forEach((div) => div.remove());
		//const canvas = document.createElement('canvas');
		//canvas.setAttribute('id','NewCanvasFractal');

		const canvas  = (document.getElementById('mandelbrotCanvas') as HTMLCanvasElement);

		//canvas.width = 400;
		//canvas.height = 400;
		const ctx: any = canvas.getContext('2d');
		ctx. fillStyle = 'white';
		ctx. fillRect(0, 0, canvas. width, canvas. height);
		ctx.fillStyle = 'black';

		for(let x=0; x < canvas.width; x++) {
			for(let y=0; y < canvas.height; y++) {
				const belongsToSet = checkIfBelongsToMandelbrotSet(
					x/magnificationFactor - panX, 
					y/magnificationFactor - panY);
				if(belongsToSet === 0) {
					ctx.fillStyle = '#000';
					ctx.fillRect(x,y, 1,1); // Draw a black pixel
				} else {
					// https://www.w3schools.com/colors/colors_hsl.asp
					ctx.fillStyle = 'hsl(' + colour() + ', 100%, ' + belongsToSet + '%)';
					ctx.fillRect(x,y, 1,1); // Draw a colorful pixel
				}
			} 
		}

		//const link = document.createElement('a');
		//link.download = fileName? fileName : 'mandelbrot.jpg';
		// link.download = 'mandelbrot.jpg';
		// link.href = canvas.toDataURL('image/jpeg') ;
		// link.click();
	});

	// adapted from
	// https://gist.github.com/yortuc/b065a0f08b09bf06f769e8a5100a885c
	fractal = ((width: number, height: number, fileName: string, asCanvas = false, wrapUp: any = undefined): any => {
		const xy = (x: number, y: number) =>  ({x:x, y:y});
		const divs = document.querySelectorAll('canvas');
		Array.from(divs).forEach((div) => div.remove());
		const canvas = document.createElement('canvas');
		canvas.setAttribute('id','NewCanvasFractal');
		canvas.height = height;// + 1;
		canvas.width = width;// + 1;
		const ctx: any = canvas.getContext('2d');
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.translate(0.5, 0.5);
	
		const drawLine= ((p0: any, p1: any) => {
			ctx.beginPath();
			ctx.moveTo(p0.x, p0.y);
			ctx.lineTo(p1.x, p1.y);
			ctx.strokeStyle = colour();
			ctx.lineWidth = 1;
			ctx.stroke();
		});
	
		const colour = (() => {
			const col  =  Math.floor(Math.random() * 4);
			switch (col)
			{
			case 0:
			{return 'red';}		
			case 1:
			{return 'yellow';}		
			case 2:
			{return 'orange';}											
			case 3:
			{return 'magenta';}															
			}
		});
	
		const drawTriangle = ((p0: any, p1: any, p2: any) => {
			drawLine(p0, p1);
			drawLine(p1, p2);
			drawLine(p2, p0);
		});
	
		const drawFract = ((p0: any, p1: any, p2: any, limit: any) => {
			if(limit > 0){
				const pA = {
						x: p0.x + (p1.x - p0.x)/2,
						y: p0.y - (p0.y - p1.y)/2
					},
					pB = {
						x: p1.x + (p2.x - p1.x)/2,
						y: p1.y - (p1.y - p2.y)/2
					},
					pC = {
						x: p0.x + (p2.x - p0.x)/2,
						y: p0.y
					};
	
				drawFract(p0, pA, pC, limit-1);
				drawFract(pA, p1, pB, limit-1);
				drawFract(pC, pB, p2, limit-1);
			}
			else{
				drawTriangle(p0,p1,p2);
			}
		});

		const limit = 8;
		drawFract(xy(0, height), xy(width / 2, 0), xy(width, height), limit);
	
		if (asCanvas) {
			return canvas;
		} else {
			const link = document.createElement('a');
			link.download = fileName? fileName : 'fractal.jpg';
			link.href = canvas.toDataURL('image/jpeg') ;
			link.click();
			if (wrapUp!== undefined) {
				wrapUp();
			}
		}
	});
	
}