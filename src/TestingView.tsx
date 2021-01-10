import  React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Tab from 'react-bootstrap/Tab';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import * as Image from './image';
import * as FileProcessor from './fileProcessor';
import { Logger } from './logger';
import * as encryption from './encryption';
import { MessagePackerBuilder } from './MessagePackerBuilder';
// https://www.npmjs.com/package/react-bootstrap-range-slider
// @ts-ignore
import RangeSlider from 'react-bootstrap-range-slider';
import 'bootstrap/dist/css/bootstrap.css'; 
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import { FileDrop } from './FileDrop';
import { Animation } from './Animation';
import { EventListener } from './eventListener';

export function TestingView()  { 

	const[dimensionsForFile, setDimensionsForFile] = useState('Dimensions required for file are:');

	const imageHelper = new Image.Main();
	const fileProcessor = new FileProcessor.Main();
	const logInformation = true;
	const logger = new Logger(logInformation);
	const eventListener = new EventListener();

	const CreateTestFile = ((width: string, height: string) => {
		//createImageForTesting(parseInt(width),parseInt(height),'');
		imageHelper.fractal(parseInt(width),parseInt(height),'');
	});

	const CreateMandelbrotFile = ((maxIters: string, magnification: string, panx: string, pany: string) => {
		imageHelper.mandlebrot(parseInt(maxIters), parseInt(magnification), parseFloat(panx), parseFloat(pany));
	});
	
	const TestEncryptFile = ((file: any) =>{
		fileProcessor.FileToByteArray(file);
	});
    
	const TestFileDimensionsRequired = ((file: any, dimensionsForFile: any, setDimensionsForFile: any) =>{
		fileProcessor.DimensionsRequiredForFile(file, dimensionsForFile, setDimensionsForFile, BytesToDimensions);
	});

	const TestMultipleFilesPackage = (async (files: any) =>{
		const AfterProcess = ((result: any) => {
			logger.log('result',result);
		});

		MultiFilePackage(files, AfterProcess);
	});

	const MultiFilePackage = (async(files: any, wrapUp: any) =>{
		return new Promise((resolve) => {

			const builder: MessagePackerBuilder = new MessagePackerBuilder()
				.setLogger(logger)
				.setSetDimensionsRequired(function (){})
				.setSetPackedMessage(function (){})
				.SetByteFiles(files)
				.SetContentType(encryption.ContentType.File)
				.SetMessage('')
				.SetSecret('')
				.SetImageHelper(imageHelper)
				.SetShowEncryptAlert(function(){})
				.SetSetEncryptAlertMessage(function(){})
				.SetEncryptingCallback(function(){})
				.build();
	
			const messagePackage = new encryption.MessagePacker(builder);
			const filesToProcess =  files.filter((x: any) => {return (x as File).type;});
			const collection: encryption.FileInfoDto[] = [];
			let lastEnd = -1;
			let byteArray: any[] = [];
			let filesProcessed = 0;
	
			const ArrayConcat = ((mainArray: any[], appendingArray: any[]) => {
				appendingArray.forEach(element => {
					mainArray.push(element);
				});

				return mainArray;
			});

			filesToProcess.forEach((file: any) => {
				const fileType = file.type;
				const fileName = file.name;
				const reader = new FileReader();
				
				reader.onload = (async (event: any) => {		   
					const array = messagePackage.ByteArrayToArray(event.target.result);
					byteArray =	ArrayConcat(byteArray, array);
					const start = lastEnd + 1;
					const end = byteArray.length;
					lastEnd = end;
					const fileInfoDto: encryption.FileInfoDto = new encryption.FileInfoDto( fileName, fileType, String(start), String(end));
					collection.push(fileInfoDto);
					filesProcessed++;

					if (filesProcessed === filesToProcess.length){
						// TODO due to the asynchronouss nature of onload
						// this is where to run any code after we have processsed all files
						wrapUp({collection, byteArray});
					}
				});
	
				reader.readAsArrayBuffer(file); 
			});

			resolve();
		});


	});

	const BytesToDimensions = ((bytes: number[]):number =>{
		const logger = new Logger(false);
		const hash = encryption.HashMd5();
		const inMessage = JSON.stringify(bytes);
		const fileUnit = new encryption.FileUnit(inMessage, encryption.ContentType.File, '', 0, hash, 1, 1, false, logger);
		const bytesRequired = fileUnit.BytesRequired();
		logger.setLoggingOn();
		logger.log('bytes',bytes);
		logger.log('bytesRequired',bytesRequired);
		// let a = serialize(bytes);
		// logger.log('serialize(bytes)',a);
		const dims = imageHelper.DimensionsRequiredForCapacity(bytesRequired);
		return dims.height;
	});



	const CreateTestFileBytes = ((byteCapacity: string) => {
		const result = imageHelper.DimensionsRequiredForCapacity(parseInt(byteCapacity));
		logger.log('DimensionsRequiredForCapacity',result);
	});
    
	const ClearFiles = ((id: string) =>{
		if (document){(document.getElementById(id) as HTMLInputElement).value = '';}
	});

	const FileDropCallback = ((files: any)=>{
		console.log('setting test files');
		console.log('files selected:', files);
	});

	const [filesSelected, setfilesSelected] = useState([FileList]);
	const[imageWidth, setimageWidth] = useState('200');
	const[imageHeight, setimageHeight] = useState('200');

	const[mandelbrotWidth, setMandelbrotWidth] = useState('200');
	const[mandelbrotHeight, setMandelbrotHeight] = useState('200');

	const[maxIterations, setMaxIterations] = useState('100');
	const[magnificationFactor, setMagnificationFactor] = useState('150');
	const[panX, setPanX] = useState('1.75');
	const[panY, setPanY] = useState('1.25');


	const maxMaxIterations = 2000;
	const maxMagnificationFactor = 20000;
	const maxPanX = 3;
	const maxPanY = 3;

	const[byteCapacity, setbyteCapacity] = useState('12');

	return(
		<Tab eventKey="testing" title="Testing" tabClassName='tab-header'>
			<Modal.Dialog>
				<InputGroup className="mb-3" >
					<InputGroup.Prepend>
						<InputGroup.Text id="enc-secret">Image width and height</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						placeholder={imageWidth}
						aria-label="Width of image in pixels..."
						aria-describedby="dec-width"
						onChange={(e: any) => {setimageWidth(e.target.value);}}
					/>
					<FormControl
						placeholder={imageHeight}
						aria-label="height of image in pixels..."
						aria-describedby="dec-height"
						onChange={(e: any) => {setimageHeight(e.target.value);}}
					/>
				</InputGroup>                                            
				<Button variant="primary" size="lg" onClick={() => CreateTestFile(imageWidth, imageHeight)}>Create test file </Button>
				<br/>
				<InputGroup className="mb-3" >
					<InputGroup.Prepend>
						<InputGroup.Text id="enc-secret">Image width and height</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						placeholder={mandelbrotWidth}
						aria-label="Width of image in pixels..."
						aria-describedby="dec-width"
						onChange={(e: any) => {setMandelbrotWidth(e.target.value);}}
					/>
					<FormControl
						placeholder={mandelbrotHeight}
						aria-label="height of image in pixels..."
						aria-describedby="dec-height"
						onChange={(e: any) => {setMandelbrotHeight(e.target.value);}}
					/>
				</InputGroup>    
				<InputGroup className="mb-3" >
					<InputGroup.Prepend>
						<InputGroup.Text id="enc-secret">Max iters., Magnification, PanX, PanY</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						placeholder={maxIterations}
						aria-label="Width of image in pixels..."
						aria-describedby="dec-width"
						onChange={(e: any) => {setMaxIterations(e.target.value);}}
					/>
					<FormControl
						placeholder={magnificationFactor}
						aria-label="height of image in pixels..."
						aria-describedby="dec-height"
						onChange={(e: any) => {setMagnificationFactor(e.target.value);}}
					/>
					<FormControl
						placeholder={panX}
						aria-label="Width of image in pixels..."
						aria-describedby="dec-width"
						onChange={(e: any) => {setPanX(e.target.value);}}
					/>
					<FormControl
						placeholder={panY}
						aria-label="height of image in pixels..."
						aria-describedby="dec-height"
						onChange={(e: any) => {setPanY(e.target.value);}}
					/>
				</InputGroup>  								
				<RangeSlider value={maxIterations}	max = {maxMaxIterations} onChange={(e: any) => {
					setMaxIterations(e.target.value);
					CreateMandelbrotFile(maxIterations,magnificationFactor,panX,panY);}} />
				<br/>
				<RangeSlider value={magnificationFactor}	max = {maxMagnificationFactor} onChange={(e: any) => {
					setMagnificationFactor(e.target.value); 
					CreateMandelbrotFile(maxIterations,magnificationFactor,panX,panY);}} />
				<br/>
				<RangeSlider value={panX}	max = {maxPanX} step = "0.01" onChange={(e: any) => {
					setPanX(e.target.value); 
					CreateMandelbrotFile(maxIterations,magnificationFactor,panX,panY);}} />
				<br/>
				<RangeSlider value={panY} max = {maxPanY} step = "0.01" onChange={(e: any) => {
					setPanY(e.target.value); 
					CreateMandelbrotFile(maxIterations,magnificationFactor,panX,panY);}} />										

				<div className="mandelbrot-canvas-div">
					<canvas id="mandelbrotCanvas" className="mandelbrot-canvas"></canvas>
				</div>  

				<Button variant="primary" size="lg" onClick={() => CreateMandelbrotFile(maxIterations,magnificationFactor,panX,panY)}>Generate Mandelbrot image</Button>
				<br/>
				<InputGroup className="mb-3" >
					<InputGroup.Prepend>
						<InputGroup.Text id="enc-secret">Image file with byte capacity of</InputGroup.Text>
					</InputGroup.Prepend>
					<FormControl
						placeholder={byteCapacity}
						aria-label="byte capacity..."
						aria-describedby="dec-capacity"
						onChange={(e: any) => {setbyteCapacity(e.target.value);}}
					/>
				</InputGroup>                                  
				<Button variant="primary" size="lg" onClick={() => CreateTestFileBytes(byteCapacity)}>Create test file </Button>
				<br/>
				<input type="file" multiple id="fileUpload" onChange={(e) => setfilesSelected([...filesSelected,...e.target.files as any])}/>
				<Button variant="light" onClick={() => {
					setfilesSelected([]);
					ClearFiles('fileUpload');
				}}>Clear files </Button>
				<Button variant="primary" size="lg" onClick={() => TestEncryptFile(filesSelected)}>File to byte array</Button>
				<br/>
				<Button variant="primary" size="lg" onClick={() => TestFileDimensionsRequired(filesSelected, dimensionsForFile, setDimensionsForFile)}>Dimensions required for file</Button>
				{dimensionsForFile}
				<br/>
				<Button variant="primary" size="lg" onClick={() => TestMultipleFilesPackage(filesSelected)}>Multiple file package</Button>
				<Modal.Body>
					<Container>
					</Container>
				</Modal.Body>
			</Modal.Dialog>
			<FileDrop identifiedBy={'testing-drop-id'} eventListener={eventListener} showProgressBar={false} uploadCallback={FileDropCallback} clearFilesCallBack={()=>{}} setFileNamesEventName='testing-drop-id-set-files' setProgressBarEventName='progressBarTestEvent'></FileDrop>
			<div>
				<Animation contextRef={'hello'} angle={0}></Animation>
			</div>
		</Tab>     
	);
}