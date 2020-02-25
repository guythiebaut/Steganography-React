//import BrowserImageManipulation from 'browser-image-manipulation'
import * as Img from './image'


export class Main {

    EncryptIntoFile = ((file: any, width: number, height: number, textIntArray: any[], encryptingCalllback: any) => {
        const reader = new FileReader();
        var image = new Img.Main();
        var fnToObjectArray: any = this.CanvasToObjectArray;
        var fnObjectArrayToDataArray = image.ObjectArrayToDataArray;
        var fnDownloadFile = this.DownloadFile;
        var fnUpdateImageData = this.UpdateImageData;
        let fnEncryptingCalllback = encryptingCalllback;
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
                    console.log('objectArray',objectArray);
                    //amend canvas object array to include message
                    fnEncryptingCalllback('Applying encryption (1)...')
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
                reader.onerror = error => console.log(error);
        });        
    });

    DecryptFromFile =  ((file: any, width: number, height: number, endMarker: string, secret: string, decryptFn: any, decryptingCalllback: any, resultCallBack: any, showDecryptAlert: any, setDecryptAlertMessage: any) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            var image = new Img.Main();
            var fnToObjectArray:any = this.CanvasToObjectArray;
            let fnDecryptingCalllback = decryptingCalllback;
            let fnDecrypt = decryptFn;
            let fnResultCallback = resultCallBack;
            let decryptedTextInitial = '';
            let decryptedText = '';
            reader.readAsDataURL(file);
            fnDecryptingCalllback('Reading file...')

            reader.onload = ((event: any) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = function(this, callBack) {
                        let divs = document.querySelectorAll('canvas');
                        Array.from(divs).forEach((div) => div.remove())
                        const canvas = document.createElement('canvas');
                        canvas.setAttribute('id','NewCanvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx: any = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        fnDecryptingCalllback('Extracting pixels...');
                        let objectArray = fnToObjectArray(canvas, width, height);
                        fnDecryptingCalllback('Extracting encrypted text...');
                        let result = image.ExtractFromPixels(objectArray, '', endMarker, 0);
                        decryptedTextInitial = result.map(a => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                        console.log('decryptedTextInitial',decryptedTextInitial);
                        let decryptedTextInitialObj = JSON.parse(decryptedTextInitial);
                        let textToParse = decryptedTextInitialObj.text;

                        try {
                            if (secret.length !== 0 && decryptedTextInitialObj.encrypted) { textToParse = fnDecrypt(secret, textToParse)};
                            let textParsed = JSON.parse(textToParse);
                            decryptedTextInitialObj.text = textParsed;
                            decryptedText = decryptedTextInitialObj.text.textToEncrypt.map((a: number) => String.fromCodePoint(a)).reduce((a: string, b: string) => a + b);
                                
                        } catch (error) {
                            showDecryptAlert(true);
                            setDecryptAlertMessage('Error decrypting data. You may have supplied an incorrect secret or the file may have become corrupted.');
                        }
                        
                        fnResultCallback(decryptedText);
                        resolve(decryptedText);
                    };
                    reader.onerror = error => console.log(error);
            });    
            resolve(decryptedText);
        });
    });

    UpdateImageData = ((imagedata: any, delta: any) => {
        for (let i = 0; i < imagedata.length; i++) {
            const amendedVal = delta[i];
            imagedata[i] = amendedVal;
        }        
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
    
    DownloadFile = ((canvas: any, fileName?: string) => {

        //for big files
        //https://stackoverflow.com/a/37151835
        //https://stackoverflow.com/questions/37135417/download-canvas-as-png-in-fabric-js-giving-network-error

        var link = document.createElement('a');

        link.download = fileName? fileName : 'filename.png';
        link.href = canvas.toDataURL() ;
        link.click();
    });
}