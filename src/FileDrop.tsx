/* eslint-disable no-mixed-spaces-and-tabs */

//https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/

import  React from 'react';
import './filedrop.css';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import md5 from 'md5';
import { EventListener, IEventListener } from './eventListener';

interface IProps {
    identifiedBy: string;
    uploadCallback: any;
	clearFilesCallBack: any;
	setFileNamesEventName: string;
	setProgressBarEventName: string;
	showProgressBar:boolean;
	eventListener: IEventListener;
  }
  
  interface IPropsState {
	fileDropCount: string;
	fileNames: string;
	progressGreen: number;
	progressRed: number;
	fileHashes: string[];
	progressBarMessage: string;
  }

export class FileDrop extends React.Component<IProps, IPropsState> {

	HashMd5 = ((toHash: string): string => {
		return md5(toHash);
	});

	HashFiles = ((files: any) => {
		const hashedArray: string[] = [];

		for (let i = 0; i < files.length; i++) {
			hashedArray.push(this.HashMd5(files[i].name + String(files[i].size) + String(files[i].lastModified)));
		}
		this.setState(() => {
			return {fileHashes: [...this.state.fileHashes,...hashedArray]};
		});
	});

	RemoveAlreadyLoadedFiles = ((files: any) =>{
		const newFileCollection = [];
		for (let i = 0; i < files.length; i++) {
			const hashedFile = this.HashMd5(files[i].name + String(files[i].size) + String(files[i].lastModified));
			let found = false;
			for (let j = 0; j < this.state.fileHashes.length; j++) {
				if(this.state.fileHashes[j] === hashedFile) { found = true; }
			}

			if (!found) { newFileCollection.push(files[i]); }
		}

		return newFileCollection;
	});

	AddFiles = ((files: any) => {
		const sanitisedFiles = this.RemoveAlreadyLoadedFiles(files);
		this.HashFiles(sanitisedFiles);
		const pack = { files: sanitisedFiles};
		this.props.uploadCallback(pack);
	});
	
	filesSelectedMessageBase = '(Files selected:';
	
	constructor(props: any) {
		super(props);
		this.state = {
			fileDropCount: `${this.filesSelectedMessageBase} 0)`,
			fileNames: '',
			progressGreen: 100,
			progressRed: 0,
			fileHashes: [],
			progressBarMessage: 'Sufficient space present for data',
		};

		const setFileDropCount = ((val: string) =>{
			this.setState(() => {
				return {fileDropCount: val};
			});
		});

		const setFileNames = ((val: string) =>{
			this.setState(() => {
				return {fileNames: val};
			});
		});

		const setProgressGreen = ((val: number) =>{
			if (val >= 100 || val < 0) { 
				this.setState({progressGreen: 100, progressRed: 0,progressBarMessage: 'Sufficient space present for data'});
			 } else {
				const red = 100 - val;
				this.setState({progressGreen: val, progressRed: red, progressBarMessage: 'More space required for data'});
			 }

		});

		const SetFileCountMessage = ((count: number) => {
			const countMessage: any = `${this.filesSelectedMessageBase} ${count})`;
			setFileDropCount(countMessage);

			// this clears the file upload control of files
			if (count === 0) {
				const fileElementId = (document.getElementById(`${this.props.identifiedBy}-elem-id`) as HTMLInputElement);
				if (fileElementId !== null && fileElementId.value !== null) {
					fileElementId!.value = '';
				}
				this.setState(() => {
					return {fileHashes: []};
				});
			}
		});

		const SetFiles = ((files: string[]) => {
			if (files.length === 0) {
				SetFileCountMessage(0);
				setFileNames('');
				seClearButtonDisabledState(true);
			} else {
				let fileText = '';
				files.forEach(file => {
					fileText +=  `${file}\n`;
				});
				SetFileCountMessage(files.length);
				setFileNames(fileText);
				seClearButtonDisabledState(false);
			}
		});

		this.props.eventListener.addEventListener(this.props.setFileNamesEventName, function(e: any) {
			SetFiles(e.detail.files);
		});

		this.props.eventListener.addEventListener(this.props.setProgressBarEventName, function(e: any) {
			setProgressGreen(e.detail.eventObject.percent);	
		});

		const seClearButtonDisabledState = ((disabled :boolean) =>{
			const clearButton = document.getElementById(`${this.props.identifiedBy}-clear-id`);
			if(!clearButton) return;

			if (disabled) {
				clearButton!.setAttribute('disabled','');
				clearButton!.removeAttribute('enabled');
			} else {
				clearButton!.removeAttribute('disabled');
				clearButton!.setAttribute('enabled','');
			}				
		});

	}

	componentDidMount() {
		const dropArea: any = document.getElementById(this.props.identifiedBy);

		const handleDrop = ((e: any) => {
			const files = e.dataTransfer.files;
			this.AddFiles(files);
		});

   		dropArea.addEventListener('drop', handleDrop, false);

   		const preventDefaults = ((e: any) => {
	   		e.preventDefault();
   			e.stopPropagation();
   		});

   		const highlight = (() => {
   		dropArea.classList.add('highlight');
   		});
          
   		const unhighlight = (() => {
   		dropArea.classList.remove('highlight');
   		});

   		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			dropArea.addEventListener(eventName, preventDefaults, false);
	   	});
	 
	   	['dragenter', 'dragover'].forEach(eventName => {
			dropArea.addEventListener(eventName, highlight, false);
	   	});
	  
   		['dragleave', 'drop'].forEach(eventName => {
			dropArea.addEventListener(eventName, unhighlight, false);
		});
		   
		const clearButton = document.getElementById(`${this.props.identifiedBy}-clear-id`);
		clearButton!.setAttribute('disabled','');
		clearButton!.removeAttribute('enabled');
	}		

	render() {
   		return(
			<div id={this.props.identifiedBy} className="file-drop" >
				<Container>
					<Row >
						<Col md={6}> 
							<p><br/><br/>Drag and drop files(s)</p>
							<input type="file" className='file-drop-fileElem' id={`${this.props.identifiedBy}-elem-id`} multiple onChange={ (e: any) =>  this.AddFiles(e.target.files) }/>
							<label className="button" htmlFor={`${this.props.identifiedBy}-elem-id`} >or click here to select file(s)</label>
						</Col>
						<Col md={4}>
							<div id={`${this.props.identifiedBy}-count-parent-id`}>
								<label  id={`${this.props.identifiedBy}-count-id`}>{this.state.fileDropCount}</label>
							</div>
							<textarea className='file-drop-file-list' value={this.state.fileNames} wrap='off' onChange={() => {}}></textarea>
						</Col>
						<Col md={2}>
							<button id={`${this.props.identifiedBy}-clear-id`} className='file-drop-clear' onClick={() => this.props.clearFilesCallBack()} >Clear files</button>
						</Col>
					</Row>
					<Row>
						<Col>
							<div className= {this.props.showProgressBar === true ? 'container-progress-bar' : 'hide-me'}>
								<div>
									{this.state.progressBarMessage}
								</div>
								<div id='TestRender'></div>
								<ProgressBar>
									<ProgressBar variant="success" now={this.state.progressGreen} key={1}/>
									<ProgressBar variant="danger" now={this.state.progressRed} key={3} />
								</ProgressBar>					
							</div>
						</Col>
					</Row>
				</Container>
			</div>
   		);
	}
}

