export class Main {


    IsImagFile = ((file: any): boolean => {
        return file.type.includes('image/');
    });

    StringToNumberArray = ((txt: string): number[] => {
        let result: number[] = [];
        txt.split('').map( a => result.push(a.charCodeAt(0)));
        return result;
    });

    SplitLargeArray = ((arr: any, maxSize: number = 100) => {
        let arrObject = [];
        let currentArr = [];

        for (let i = 0; i <= arr.length; i++) {
            currentArr.push(arr[i]);

            if (currentArr.length > maxSize) {
                let newArr = [...currentArr]
                currentArr = [];
                arrObject.push(newArr);
            }
        }
        return arrObject;
    });

    EndMarker = ((text: string, decrypting: boolean = false): string => {
        let endString = 'SteganographyEndMarker';
        let result = endString;

        if(decrypting) return endString;

        if((text.length + endString.length) % 3 !== 0 || endString.length === 0) {
            let count =  3 - (text.length + endString.length) % 3;
            result = endString + '#'.repeat(count);
        }
        return result;
    });

    PixelArrayToObjectPiXelArray = ((pixelArray: any): any => {
        let result = [];

        for (let i = 0; i < pixelArray.length; i++) {
            const element = pixelArray[i];
            let pixelObject = {id: i, vals: element};
            result.push(pixelObject)
        }
        return result
    });

    ObjectArrayToDataArray = ((objectArray: any): any => {
        let result = [];
        for (let i = 0; i < objectArray.length; i++) {
            const element = objectArray[i];

            for (let p = 0; p < 4; p++) {
                result.push(element.vals[p]);
            }
        }
        return result;
    });

    DataArrayToObjectArray = ((imageData: any): any =>{
        let objectArray = [];
        let p = 0;
        let id = 0;
        let valArray = [];

        for (let i = 0; i < imageData.data.length; i++) {
            const element = imageData.data[i];
            valArray.push(element);
            p++;
        
            if (p === 4) {
                id ++;
                objectArray.push({id: id, vals: valArray});
                valArray = [];
                p = 0;
            }
        }
        return objectArray;
    });

    TestingArray = ((): any[] => {
        let result: any[] = [];

        for (let i = 0; i < 200; i++) {
            let id = i + 1;
            result.push({id:id, vals: [255, 255, 255, 255]});
        }

        return result;
    });

    GetPixelPart =((pixel: any, element: any): number => {
        if (element === 'R') {
            return pixel[0];
        };
        if (element === 'G') {
            return pixel[1];
        };
        if (element === 'B') {
            return pixel[2];
        };
        if (element === 'A') {
            return pixel[3];
        };
        return -999;
    });

    ApplyToPixels = ((pixels: any, txt: any[]): number[] => {
        let result: any[] = [];
        let state = 'Hiding';
        let intIndex: number = 0;
        let intValue: number = 0;
        let pixelElementIndex: number = 0;
        let zeros: number = 0;
        let originalR: number = 0;
        let originalG: number = 0;
        let originalB: number = 0;
        let originalA: number = 0;
        let R: number = 0;
        let G: number = 0;
        let B: number = 0;

        for (var pixelCount = 0; pixelCount < pixels.length; pixelCount++) {
            let pixel = pixels[pixelCount].vals;
            let id = pixelCount + 1;
            originalR = this.GetPixelPart(pixel,'R');
            originalG = this.GetPixelPart(pixel,'G');
            originalB = this.GetPixelPart(pixel,'B');
            originalA = this.GetPixelPart(pixel,'A');
            R = originalR - Math.floor(originalR % 2);
            G = originalG - Math.floor(originalG % 2);
            B = originalB - Math.floor(originalB % 2);

            for (var p = 0; p < 3; p++) {
                if (Math.round(pixelElementIndex % 8) === 0) {
                    if (intIndex >= txt.length)
                    {
                        state = 'Filling_With_Zeros';
                        pixels.splice(0, result.length, ...result);
                        return pixels;
                    }
                    else
                    {
                        intValue = txt[intIndex];
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

                if (state === 'Filling_With_Zeros')
                {
                    zeros++;
                }
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
        let endMarkerLength: number = endMarker.length;
        let endMarkerList: number[] = [];
        let ints: number[] = [];
        endMarker.split('').map( a => endMarkerList.push(a.charCodeAt(0)));

        for (var pixelCount = 0; pixelCount < pixels.length; pixelCount++) {
            let pixel = pixels[pixelCount].vals;

            for (var p = 0; p < 3; p++) {
                let colour = colorUnitIndex % 3;
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
                        let check: number[] = ints.slice(ints.length - endMarkerLength, ints.length);

                        for (var x = 0; x < endMarkerLength; x++)
                        {
                            if (endMarkerList[x] != check[x])
                            {
                                endFound = false;
                                break;
                            }
                        }
                        if (endFound)
                        {
                            let startIndex = startMarker.length + fromByteNo;
                            let endIndex = ints.length - (endMarkerLength + startMarker.length + fromByteNo);
                            return ints.slice(startIndex, startIndex + endIndex);
                        }
                    }
                 }
             }
        }
        let startIndex = startMarker.length;
        let endIndex =  ints.length - (endMarkerLength + startMarker.length + 1);
        return ints.slice(startIndex, startIndex + endIndex);
    });
};