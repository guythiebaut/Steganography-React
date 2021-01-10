/* eslint-disable no-mixed-spaces-and-tabs */

//https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/

import  React from 'react';
import './filedrop.css';

interface IProps {
    identifiedBy: any;
    uploadCallback: any;
    clearFilesCallBack: any;
  }
  
  interface IPropsState {
	fileDropCount: any;
  }
  
export class FileDropNew extends React.Component<IProps, IPropsState> {

	filesSelectedMessageBase = '(Files selected:';
	setCountEventName = `${this.props.identifiedBy}-set-count`;
	
	constructor(props: any) {
		super(props);
		this.state = {fileDropCount: `${this.filesSelectedMessageBase} 0)`};

		const setFileDropCount = ((val: string) =>{
			this.setState(() => {
				return {fileDropCount: val};
			});
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
			}
		});
			
		window.self.addEventListener(this.setCountEventName, function(e: any) {
			SetFileCountMessage(e.detail.count);
		});

	}

	componentDidMount() {
		const dropArea: any = document.getElementById(this.props.identifiedBy);

		const handleFiles = ((e: any) => {
			const pack = { files: e };
			this.props.uploadCallback(pack);
		});			

		const handleDrop = ((e: any) => {
			const files = e.dataTransfer.files;
			handleFiles(files);
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
	}		

	render() {
   		return(
   			<div id={this.props.identifiedBy} className="file-drop" >
   				<p>Drag and drop files(s)...</p>
   				<input type="file" className='file-drop-fileElem' id={`${this.props.identifiedBy}-elem-id`} multiple onChange={ (e: any) => this.props.uploadCallback({ files: e.target.files })}/>
   				<label className="button" htmlFor={`${this.props.identifiedBy}-elem-id`} >or click here to select file(s)</label>
   				<div id={`${this.props.identifiedBy}-count-parent-id`}>
   					<label  id={`${this.props.identifiedBy}-count-id`}>{this.state.fileDropCount}</label>
   				</div>
   				<button className='file-drop-clear' onClick={()=>this.props.clearFilesCallBack()}>Clear files</button>
   			</div>
   		);
	}
}

