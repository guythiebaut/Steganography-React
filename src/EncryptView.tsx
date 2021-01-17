import  React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Row from 'react-bootstrap/Row';
import Tabs from 'react-bootstrap/Tabs';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Tab from 'react-bootstrap/Tab';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { ContentType, MessagePacker } from './encryption';
import { MessagePackerBuilder } from './MessagePackerBuilder';
import * as Image from './image';
import { Logger } from './logger';
import { FileDrop } from './FileDrop';
import { ProgressPercentage } from './ProgressPercentage';
import { ProgressTestRig } from './ProgressTestRig';
import { EventListener } from './eventListener';

import { ContainerImageDimensions, dimensionsWidth, dimensionsHeight, fileNamePrefix } from './containerImageDimensions';
import { ProgressHelperBuilder } from './ProgressHelperBuilder';
import { ProgressHelper } from './ProgressHelper';
import { TestComponent } from './TestComponent';
import { Dialog } from './Dialog';

export function EncryptView()  {

	const imageHelper = new Image.Main();
	const logInformation = true;
	const logger = new Logger(logInformation);
	const showDialogEventName = 'encryptViewOpenDialog';
	const defaultTextBoxDialog = 'Paste, or type, your text to be inserted here...';
	const imageFileSuffixes = 	['BMP','GIF','JPG','JPEG','HEIF','INDD','PNG','PSD','TIFF','RAW','WEBP'];
	const eventListener = new EventListener();
	const hideClass = 'hide-me';

	const setGenerateButtonDisabledState = ((disabled :boolean) =>{
		const generateButton = document.getElementById('generateButton');

		return;

		if (disabled) {
			generateButton!.setAttribute('disabled','');
			generateButton!.removeAttribute('enabled');
		} else {
			generateButton!.removeAttribute('disabled');
			generateButton!.setAttribute('enabled','');
		}				
	});

	const SetGenerateButtonDisabled = (() => {
		setGenerateButtonDisabledState(true);
	});

	const SetGenerateButtonEnabled = (() => {
		setGenerateButtonDisabledState(false);
	});

	const observer = new MutationObserver(() => {
		if (document.getElementById('generateButton')) {
			SetGenerateButtonDisabled();
			observer.disconnect();
		}
	});

	observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

	const DispatchProgressEvent1 = ((percentage: number) => {
		const progressEvent = new CustomEvent('PercentEvent', {
			detail: {percent: percentage}
		});
		dispatchEvent(progressEvent);
	});

	const DispatchProgressEvent2 = ((percentage: number) => {
		const progressEvent = new CustomEvent('ProgressBar', {
			detail: {percent: percentage}
		});
		dispatchEvent(progressEvent);
	});

	const DispatchPackageFileCountEvent = ((files: string[]) => {
		const packageFilesEvent = new CustomEvent(packageDropSetFileNamesEventName, {
			detail: {files}
		});
		dispatchEvent(packageFilesEvent);
	});

	const DispatchContainerFileCountEvent = ((files: string[]) => {
		const containerFilesEvent = new CustomEvent(containerDropSetFileNamesEventName, {
			detail: {files}
		});
		dispatchEvent(containerFilesEvent);
	});

	const filesToFileNames = ((files: any): string[] => {
		return files.map((x: any) => x.name);
	});	

	const ByteFilesCallback = ((result:any) => {
		console.log('setting byte files');
		const sanitisedList = SanitizeFileList(result.files);
		const sanitizedByteFiles = SanitizeFileList(byteFiles);
		setByteFiles([...sanitizedByteFiles,...sanitisedList]);
		DispatchPackageFileCountEvent(filesToFileNames([...sanitizedByteFiles,...sanitisedList]));
		SetGenerateButtonEnabled();
	});

	const ClearByteFilesCallback = (() => {
		setByteFiles([]);
		DispatchPackageFileCountEvent([]);
		SetGenerateButtonDisabled();
	});

	const isImageFile = ((filename: string)=>{
		const suffix = filenameSuffix(filename)?.toLowerCase();
		return imageFileSuffixes.map( a => a.toLowerCase()).filter((x: any) => {return x === suffix;}).length > 0;
	});

	const hasNonImagFiles = ((files: any) => {
		const result =  files.filter((x: any) => {return !isImageFile(x.name);});
		return result.length > 0;
	});
	
	const filenameSuffix = ((filename: string) => {
		return filename.split('.').pop();
	});
	
	const SanitizeFileList = ((fileList: any) => {
		const sanitisedList = fileList.filter((x: any) => {return (x as File).name.toLowerCase() !== 'filelist';});
		return sanitisedList;
	});

	const SetContainerFilesCallback = ((result: any) => {
		console.log('setting container files');

		if (hasNonImagFiles(result.files)) {
			const eventObject = {title: 'Only image files can be used', text: `Only image files can be used for the container files. Non-image files will not be used. Acceptable raster file types are - ${imageFileSuffixes.toString()}`};
			dispatchNotifyEvent(showDialogEventName,eventObject);
		}

		const sanitisedList = SanitizeFileList(result.files).filter((x: any) => {return isImageFile(x.name);});
		const sanitizedContainerFiles = SanitizeFileList(containerFiles);
		setContainerFiles([...sanitizedContainerFiles,...sanitisedList]);
		DispatchContainerFileCountEvent(filesToFileNames([...sanitizedContainerFiles,...sanitisedList]));
	});

	const ClearContainerFilesChosenCallback = (() => {
		setContainerFiles([]);
		DispatchContainerFileCountEvent([]);
	});

	const CanGenerateFiles = ((): boolean =>	{return (!NoByteFilesSelected(byteFiles));});

	const SetDimensionsMessage = ((dimensions: Image.Dimensions)=>{
		setDimensionsRequired(dimensions);
		setDimensionsRequiredMessage(`width ${dimensions.width} x height ${dimensions.height}`);
	});

	const Packed = (async(data: any)=>{
		setPackedMessage(data);
	});

	const NoByteFilesSelected = ((byteFiles: any[]): boolean => {return typeof byteFiles[1] === 'undefined' && typeof byteFiles[0] === 'function';});

	const waitFor = (async (fn: any)=>{
		await fn;
	});

	const dispatchNotifyEvent = ((eventSignature: string, eventObject: any) => {
		const notifyEvent = new CustomEvent(eventSignature, {
			detail: {eventObject}
		});
		dispatchEvent(notifyEvent);
	});

	
	//TODO check what is going on here
	//I think that this actually tests where the bytes from one file will fit into the container files
	//so we need to do this for more than one file and then use the results to 
	//feed into the container files to be used instead of fractals
	const GenerateToContainerFiles = ((secret: string, encryptingCallback: any) => {

		const contentType = ContentType.File;

		const progressBuilder = new ProgressHelperBuilder()
			.setLogger(logger)
			.setProgressUpdate(setProgress)
			.setMessageEventName('ProgressHelperMessage')
			.build();	

		const progressHelper = new ProgressHelper(progressBuilder);	

		const packerBuilder: MessagePackerBuilder = new MessagePackerBuilder()
			.setLogger(logger)
			.setContainerFiles(containerFiles)
			.setDimensionsLimit(new Image.Dimensions())
			.setSetDimensionsRequired(setDimensionsRequired)
			.setSetPackedMessage(setPackedMessage)
			.SetByteFiles(byteFiles)
			.SetContentType(contentType)
			.SetMessage('')
			.SetSecret(secret)
			.SetImageHelper(imageHelper)
			.SetShowEncryptAlert(showEncryptAlert)
			.SetSetEncryptAlertMessage(setEncryptAlertMessage)
			.SetEncryptingCallback(encryptingCallback)
			.setProgressHelper(progressHelper)
			.setEventListener(eventListener)
			.build();

		const messagePacker = new MessagePacker(packerBuilder);

		eventListener.addEventListener('RenderParentEvent', function(e: any) {
			setProgressMessage('test');
		});
		
		console.log('containerFiles',containerFiles);
		const filesToProcess =  byteFiles.filter((x: any) => {return (x as File).type;});
		messagePacker.filesToProcess = filesToProcess;
		messagePacker.TestDimensions(filesToProcess[0], 'GetByteAndFileInfo', 0, filesToProcess.length, containerDropSetPercentEventName, showDialogEventName, ()=>{});
	});

	const packageDropId = 'byteFile-drop';
	const containerDropId = 'containerFile-drop';
	const packageDropSetFileNamesEventName = `${packageDropId}-set-files`;
	const packageDropSetPercentEventName = `${packageDropId}-set-progress`;
	const containerDropSetFileNamesEventName = `${containerDropId}-set-files`;
	const containerDropSetPercentEventName = `${containerDropId}-set-progress`;

	const Encrypt = (async (setPackedMessage: any, containerFiles: any[], resetFiles: any, text: string, secret: string, encryptingCallback: any, showEncryptAlert: any, setEncryptAlertMessage: any)  => {

		if (SanitizeFileList(containerFiles).length !== 0) {
			GenerateToContainerFiles(secret, ()=>{});
			return;
		}

		const GeneratingFiles = (generating: boolean) => {
			const spinner = document.getElementById('loadingSpinner');
			spinner!.setAttribute('class', generating ? 'spinner' : hideClass);
			setGenerateFilesMessage(generating ? 'Generating file(s)' : 'Generate file(s)');
		};
		
		const wrapUp = (() => {
			DispatchPackageFileCountEvent([]);
			DispatchContainerFileCountEvent([]);
			GeneratingFiles(false);
		});

		const progressBuilder = new ProgressHelperBuilder()
			.setLogger(logger)
			.setProgressUpdate(setProgress)
			.setMessageEventName('ProgressHelperMessage')
			.build();	

		const progressHelper = new ProgressHelper(progressBuilder);			

		if (textOrFile === 'fileAsSource') {
			logger.log('processing file *************************','');

			if(CanGenerateFiles()) {

				const contentType = ContentType.File;
	
				const dims = new Image.Dimensions();
				dims.width = dimensionsWidth;
				dims.height = dimensionsHeight;

				const packerBuilder: MessagePackerBuilder = new MessagePackerBuilder()
					.setLogger(logger)
					.setContainerFiles(containerFiles)
					.setDimensionsLimit(dims)
					.setSetDimensionsRequired(setDimensionsRequired)
					.setSetPackedMessage(setPackedMessage)
					.SetByteFiles(byteFiles)
					.SetContentType(contentType)
					.SetMessage('')
					.SetSecret(secret)
					.SetImageHelper(imageHelper)
					.SetShowEncryptAlert(showEncryptAlert)
					.SetSetEncryptAlertMessage(setEncryptAlertMessage)
					.SetEncryptingCallback(encryptingCallback)
					.setProgressHelper(progressHelper)
					.setEventListener(eventListener)
					.build();

				GeneratingFiles(true);
				const messagePackage = new MessagePacker(packerBuilder);


				logger.setLoggingOff();

				eventListener.addEventListener('ProgressHelper', function(e: any) {
					console.log('currentPercentage', e.detail.currentPercentage);
				});

				eventListener.addEventListener('ProgressHelperMessage', function(e: any) {
					setProgressMessage(e.detail.message);
				});
				

				const filesToProcess =  byteFiles.filter((x: any) => {return (x as File).type;});
				messagePackage.filesToProcess = filesToProcess;

				messagePackage.CreateFiles(filesToProcess[0], 'GetByteAndFileInfo', 0, filesToProcess.length, wrapUp);

			} else {
				const eventObject = {title: 'No files selected', text: 'Please either select one or more files, or select the text tab and enter some text'};
				dispatchNotifyEvent(showDialogEventName,eventObject);
			}
		} else {


			if (textToEncrypt.trim() === defaultTextBoxDialog || textToEncrypt.trim() === '') {
				const eventObject = {title: 'No text entered or files selected', text: 'Please either select one or more files, or select the text tab and enter some text'};
				dispatchNotifyEvent(showDialogEventName,eventObject);
				return;
			}

			const builder: MessagePackerBuilder = new MessagePackerBuilder()
				.setLogger(logger)
				.setContainerFiles(containerFiles)
				.setSetDimensionsRequired(setDimensionsRequired)
				.setSetPackedMessage(setPackedMessage)
				.SetByteFiles(byteFiles)
				.SetContentType(ContentType.Text)
				.SetMessage(textToEncrypt)
				.SetSecret(secret)
				.SetImageHelper(imageHelper)
				.SetShowEncryptAlert(showEncryptAlert)
				.SetSetEncryptAlertMessage(setEncryptAlertMessage)
				.SetEncryptingCallback(encryptingCallback)
				.setProgressHelper(progressHelper)
				.setEventListener(eventListener)
				.build();

			GeneratingFiles(true);
			const messagePackage = new MessagePacker(builder);
			messagePackage.ProcessFiles(wrapUp);
			logger.log('messagePackage', messagePackage);
		}		

		resetFiles([]);
	});
	
	const[packedMessage, setPackedMessage] = useState(null);
	const[textToEncrypt, setTextToEncrypt] = useState(defaultTextBoxDialog);
	const[useSecretForEncryption, setUseSecretForEncryption] = useState(false);
	const[encryptionSecret, setEncryptionSecret] = useState('Encryption password...');
	const[textEncrypted, setTextEncrypted] = useState('Encryption process updates will appear here...');
	const [showEncryptAlert, setEncryptAlert] = useState(false);
	const [encryptAlertMessage, setEncryptAlertMessage] = useState('');
	const [containerFiles, setContainerFiles] = useState([FileList]);
	const [byteFiles, setByteFiles] = useState([FileList]);
	const [textOrFile, settextOrFile] = useState('textAsSource');
	const [dimensionsRequired, setDimensionsRequired] = useState(new Image.Dimensions());
	const [dimensionsRequiredMessage, setDimensionsRequiredMessage] = useState('');
	const [generateFilesMessage, setGenerateFilesMessage] = useState('Generate file(s)');
	const [progress, setProgress] = useState(0);
	const [progressMessage, setProgressMessage] = useState('');

	return(
		<Tab eventKey="encrypt" title="Generate file(s)" tabClassName='tab-header'>
			<div className='wide'>
				<Container className='p-3 p3-padding'>
					<div className='bottom-grey-line'>
						<div className='infoLine'>
						(1) Encrypt data for extra protection?
						</div>
						<InputGroup className="mb-3" >
							<InputGroup.Prepend>
								<InputGroup.Text id="enc-secret">Use encryption password</InputGroup.Text>
							</InputGroup.Prepend>
							<InputGroup.Prepend>
								<InputGroup.Checkbox onChange={(e) => {setUseSecretForEncryption(e.target.checked);}} />
							</InputGroup.Prepend>
							<FormControl
								type="password"
								placeholder={encryptionSecret}
								aria-describedby="enc-secret"
								onChange={(e: any) => {setEncryptionSecret(e.target.value);}}
								readOnly={!useSecretForEncryption}
							/>
						</InputGroup>		
					</div>
					<div className='infoLine'>
                    	(2) Insert text or choose one or more files instead
					</div>					
					<Tabs defaultActiveKey="textAsSource" transition={false} id="source-tabs" onSelect={((e: string)=>{settextOrFile(e);})} >
						<Tab eventKey="textAsSource" title="Text" tabClassName='tab-header' >
							<div className=' bottom-grey-line'>
								<textarea  className={'textBox-encrypt'} value={textToEncrypt}  onChange={(e) => {setTextToEncrypt(e.target.value);}} />
							</div>
						</Tab>
						<Tab eventKey="fileAsSource" title="File" tabClassName='tab-header'>
							<div className=' bottom-grey-line'>
								<div className='col-12'>
									<Container >
										<Row>
											<FileDrop identifiedBy={packageDropId} eventListener={eventListener} showProgressBar={false} uploadCallback={ByteFilesCallback} clearFilesCallBack={ClearByteFilesCallback} setFileNamesEventName={packageDropSetFileNamesEventName} setProgressBarEventName={packageDropSetPercentEventName}></FileDrop>
											{/* <ProgressPercentage startPercent={0} eventListener={eventListener} percentEvent="PercentEvent"></ProgressPercentage> */}
										</Row>
									</Container>
								</div>	
							</div>
						</Tab>										
					</Tabs>
					<div className='col-12'>
						<div className='infoLine'>
						(3) Select the maximum dimensions of image files to autogenerate,<br/>
						or select image files to insert into.
						</div>
						<Tabs defaultActiveKey="containerDims" transition={false} id="container-tabs"  className = 'file-container-tabs'>
							<Tab eventKey="containerDims" title="Auto-generate container file options" tabClassName='tab-header'>
								<ContainerImageDimensions></ContainerImageDimensions>
							</Tab>
							<Tab  eventKey="containerFiles" title="Select container files" tabClassName='tab-header'>
								<FileDrop identifiedBy={containerDropId} eventListener={eventListener} showProgressBar={true} uploadCallback={SetContainerFilesCallback} clearFilesCallBack={ClearContainerFilesChosenCallback} setFileNamesEventName={containerDropSetFileNamesEventName} setProgressBarEventName={containerDropSetPercentEventName}></FileDrop>
							</Tab>
						</Tabs>	
					</div>
					<div className='button-spinner'>
						<Button id='generateButton' variant="primary" size="lg" onClick={() => Encrypt(setPackedMessage, containerFiles, setContainerFiles, textToEncrypt, useSecretForEncryption ? encryptionSecret : '', setTextEncrypted, setEncryptAlert, setEncryptAlertMessage)}>    
							<span id='loadingSpinner' className = {hideClass}>
								<Spinner
									as="span"
									animation="border"
									size="sm"
									role="status"
									aria-hidden="true"
								/>
							</span>
							{generateFilesMessage}
						</Button>
					</div>
					<br/>
				</Container>
			</div>
			<Modal.Dialog className='modalDialog-top'>
				<Alert className={showEncryptAlert ? '' : hideClass}  id='EncryptAlert' variant="danger" onClose={() => setEncryptAlert(false)}  dismissible>
					<Alert.Heading>Error!</Alert.Heading>
					<p className='alert-text'>
						{encryptAlertMessage}
					</p>
				</Alert>
			</Modal.Dialog>
			<Dialog identifiedBy='' eventListener={eventListener} initialTitleText='Hello world' initialDialogText='This is some text' openEventName={showDialogEventName} ></Dialog>
		</Tab>
	);}
