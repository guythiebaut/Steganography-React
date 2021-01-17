
import  React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import { ContentType, DecryptionErrorMessage, MessageUnPacker } from './encryption';
import { Logger } from './logger';
import { EndMarker } from './image';
import { FileDrop } from './FileDrop';
import { EventListener } from './eventListener';
import { Dialog } from './Dialog';

export function DecryptView()  { 

	const logInformation = true;
	const logger = new Logger(logInformation);
	const unpackDropId = 'unpack-drop';
	const dropSetFileNamesEventName = `${unpackDropId}-set-files`;
	const eventListener = new EventListener();
	const showDialogEventName = 'decryptViewOpenDialog';
	const imageFileSuffixes = 	['BMP','GIF','JPG','JPEG','HEIF','INDD','PNG','PSD','TIFF','RAW','WEBP'];
	const hideClass = 'hide-me';

	const setExtractButtonDisabledState = ((disabled :boolean) =>{
		const extractButton = document.getElementById('extractButton');

		if (disabled) {
			extractButton!.setAttribute('disabled','');
			extractButton!.removeAttribute('enabled');
		} else {
			extractButton!.removeAttribute('disabled');
			extractButton!.setAttribute('enabled','');
		}				
	});

	const SetExtractButtonDisabled = (() => {
		setExtractButtonDisabledState(true);
	});

	const SetExtractButtonEnabled = (() => {
		setExtractButtonDisabledState(false);
	});

	const setSuccessAlertState = ((enabled :boolean) =>{
		const successAlert = document.getElementById('successAlert');

		if (enabled) {
			successAlert!.setAttribute('class','');
		} else {
			successAlert!.setAttribute('class', hideClass);
		}				
	});

	const SetSuccessAlertDisabled = (() => {
		setSuccessAlertState(false);
	});

	const SetSuccessAlertEnabled = (() => {
		setSuccessAlertState(true);
	});

	const observer = new MutationObserver(() => {
		if (document.getElementById('extractButton')) {
			const noFilesSelected =  decryptFromFiles.length === 0 || (decryptFromFiles.length === 1  && typeof decryptFromFiles[0] === 'function');
			if (noFilesSelected) {
				SetExtractButtonDisabled();
			}
			else {
				SetExtractButtonEnabled();
			}
			observer.disconnect();
		}
	});

	observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

	const DispatchUnpackFileNamesEvent = ((files: string[]) => {
		const unpackFilesEvent = new CustomEvent(dropSetFileNamesEventName, {
			detail: {files}
		});
		dispatchEvent(unpackFilesEvent);
	});

	const filesToFileNames = ((files: any): string[] => {
		return files.map((x: any) => x.name);
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

	const SetUnpackFilesCallback = ((result: any) => {
		console.log(result.files);

		if (hasNonImagFiles(result.files)) {
			const eventObject = {title: 'Only image files can be used', text: `Only image files will contain embedded steganography data. Non-image files will not be used. Acceptable raster file types are - ${imageFileSuffixes.toString()}`};
			dispatchNotifyEvent(showDialogEventName,eventObject);
		}

		const sanitisedList = SanitizeFileList(result.files).filter((x: any) => {return  isImageFile(x.name);});
		const sanitizedDecryptFromFiles = SanitizeFileList(decryptFromFiles);
		setDecryptFromFiles([...sanitizedDecryptFromFiles,...sanitisedList]);
		DispatchUnpackFileNamesEvent(filesToFileNames([...sanitizedDecryptFromFiles,...sanitisedList]));
		SetExtractButtonEnabled();
	});

	const ClearUnpackFilesCallback = (() => {
		setDecryptFromFiles([]);
		DispatchUnpackFileNamesEvent([]);
		SetExtractButtonDisabled();
	});

	const dispatchNotifyEvent = ((eventSignature: string, eventObject: any) => {
		const notifyEvent = new CustomEvent(eventSignature, {
			detail: {eventObject}
		});
		dispatchEvent(notifyEvent);
	});

	const Decrypt = ((files: any, resetFiles: any, secret: string, resultCallback: any) => {
		
		const UnpackingFiles = (generating: boolean) => {
			const spinner = document.getElementById('extractingSpinner');
			spinner!.setAttribute('class', generating ? 'spinner' : hideClass);
			setExtractFilesMessage(generating ? 'Extracting from file(s)' : 'Extract from file(s)');
		};

		UnpackingFiles(true);
		const endMarker = EndMarker('', true);
		const messagePackage = new MessageUnPacker(files, endMarker, secret, logger);
		resetFiles([]);
		messagePackage.processFiles()
			.then((result: any) => {
				logger.log('result', result);
				UnpackingFiles(false);
				DispatchUnpackFileNamesEvent([]);
					
				if (result.success) {
					logger.log('result.contentType',result.contentType);
					const resultTextBoc = document.getElementById('textResultBox');
					if(result.contentType === ContentType.Text) {
						resultTextBoc!.setAttribute('class','card card-margin');						
						resultCallback(result.body);
					} else {
						resultTextBoc!.setAttribute('class', hideClass);						
						SetSuccessAlertEnabled();
					}
				} else {
					logger.log('result',result);
					const eventObject = {title: 'Warning', text: DecryptionErrorMessage(result.error)};
					dispatchNotifyEvent(showDialogEventName,eventObject);
				}
			});
	});

	const[useSecretForDecryption, setUseSecretForDecryption] = useState(false);
	const[decryptionSecret, setDecryptionSecret] = useState('Decryption password...');
	const[textDecrypted, setTextDecrypted] = useState('Extracted text will appear here...');
	const [decryptFromFiles, setDecryptFromFiles] = useState([FileList]);
	const [extractFilesMessage, setExtractFilesMessage] = useState('Extract from file(s)');
	const [show, setShow] = useState(true);

	return(

		<Tab eventKey="decrypt" title="Extract from file(s)" tabClassName='tab-header'>
			<div className='wide'>
				<Container className='p-3 p3-padding'>
					<div className='bottom-grey-line'>
						<div className='infoLine'>
						(1) Are the files encrypted?
						</div>
						<InputGroup className="mb-3" >
							<InputGroup.Prepend>
								<InputGroup.Text id="enc-secret">Use decryption password</InputGroup.Text>
							</InputGroup.Prepend>
							<InputGroup.Prepend>
								<InputGroup.Checkbox onChange={(e) => {setUseSecretForDecryption(e.target.checked);}}/>
							</InputGroup.Prepend>                                
							<FormControl
								type="password"
								placeholder={decryptionSecret}
								aria-label="Enter your decryption password here..."
								aria-describedby="dec-secret"
								onChange={(e: any) => {setDecryptionSecret(e.target.value);}}
								readOnly={!useSecretForDecryption}
							/>
						</InputGroup>        
					</div>
					<div className='infoLine'>
						(2) Selct files to extract from
					</div>
					<Container>
						<Row className="show-grid">
							<div className='col-12'>
								<FileDrop identifiedBy={unpackDropId} eventListener={eventListener} showProgressBar={false} uploadCallback={SetUnpackFilesCallback} clearFilesCallBack={ClearUnpackFilesCallback} setFileNamesEventName={dropSetFileNamesEventName} setProgressBarEventName='decryptProgressBarEventName'></FileDrop>
							</div>
						</Row>
						<div className='button-spinner'>
							<Button id='extractButton' variant="primary" size="lg" onClick={() => Decrypt(decryptFromFiles, setDecryptFromFiles, useSecretForDecryption ? decryptionSecret : '', setTextDecrypted)} >    
								<span id='extractingSpinner' className = {hideClass}>
									<Spinner
										as="span"
										animation="border"
										size="sm"
										role="status"
										aria-hidden="true"
									/>
								</span>
								{extractFilesMessage}
							</Button>
						</div>
						<div id="successAlert" className={hideClass}>
							<Alert  show={show} variant="success">
								<Alert.Heading>Download successful</Alert.Heading>
								<p>
          							Files from within the container file(s) have been unpacked 
									and downloaded to your download directory.
								</p>
								<hr />
								<div className="d-flex justify-content-end">
									<Button onClick={() => setShow(false)} variant="outline-success">
            							Close
									</Button>
								</div>
							</Alert>
						</div>
					</Container>
					<br/>
					<div id="textResultBox" className={hideClass}>
						<div className="card-body">
							<h5 className="card-title">Extraction result</h5>
							<textarea className='textBox-decrypted'readOnly value={textDecrypted} />
						</div>
					</div> 
				</Container>
			</div> 
			<Dialog identifiedBy='' eventListener={eventListener} initialTitleText='Hello world' initialDialogText='This is some text' openEventName={showDialogEventName} ></Dialog>
		</Tab>
	);
}