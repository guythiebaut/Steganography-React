//https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
import  React, { useState } from 'react';
import './filedrop.css';

export function FileDrop(uniqueName: string, uploadCallback: any, clearFilesCallBack: any)  {

	const filesSelectedMessageBase = '(Files selected:';
	const tempElemId = 'tempfileElementId';
	const tempCountId = 'tempfileCountId';
	const tempCountParentId = 'tempfileCountParentId';
	const idenftifiedBy: string = uniqueName;
	const fileElemId = `${idenftifiedBy}-elem-id`;
	const fileCountId = `${idenftifiedBy}-count-id`;
	const fileCountParentId = `${idenftifiedBy}-count-parent-id`;
	const setCountEventName = `${idenftifiedBy}-set-count`;

	const observer = new MutationObserver(() => {
		if (document.getElementById(idenftifiedBy)) {
			initialiseFileDrop();
			observer.disconnect();
		}
	});

	observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

	const initialiseFileDrop = (() => {

		window.self.addEventListener(setCountEventName, function(e: any) {
			SetFileCountMessage(e.detail.count);
		});

		const fileElementId = document.getElementById(tempElemId);
		fileElementId?.setAttribute('id',fileElemId);
		const fileCntId = document.getElementById(tempCountId);
		fileCntId?.setAttribute('id',fileCountId);
		const fileCntParentId  = document.getElementById(tempCountParentId);
		fileCntParentId?.setAttribute('id',fileCountParentId);

	    const dropArea: any = document?.getElementById(idenftifiedBy);

		const handleDrop = ((e: any) => {
        	const files = e.dataTransfer.files;
        	handleFiles(files);
		});

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
            dropArea?.addEventListener(eventName, preventDefaults, false);
		});
         
		['dragenter', 'dragover'].forEach(eventName => {
            dropArea?.addEventListener(eventName, highlight, false);
		});
          
		['dragleave', 'drop'].forEach(eventName => {
            dropArea?.addEventListener(eventName, unhighlight, false);
		});
                    
        dropArea?.addEventListener('drop', handleDrop, false);
	});

	const SetFileCountMessage = ((count: number) => {
		const countMessage: any = `${filesSelectedMessageBase} ${count})`;
		setFileDropCount(countMessage);

		if (count === 0) {
			const fileElementId = (document.getElementById(fileElemId) as HTMLInputElement);
			
			if (fileElementId !== null && fileElementId.value !== null) {
				fileElementId!.value = '';
			}
		}
	});
	
	const handleFiles = ((e: any) => {
		const pack = { files: e };
		uploadCallback(pack);
	});

	const clearFiles = (() =>{
		clearFilesCallBack();
	});

	const[fileDropCount, setFileDropCount] = useState(`${filesSelectedMessageBase} 0`);

	return (
		<div id={idenftifiedBy} className="file-drop" >
			<p>Drag and drop files(s)...</p>
			<input type="file" className='file-drop-fileElem' id={tempElemId} multiple onChange={ (e: any) => handleFiles(e.target.files)}/>
			<label className="button" htmlFor={fileElemId}>or click here to select file(s)</label>
			<div id={tempCountParentId}>
				<label  id={tempCountId}>{fileDropCount}</label>
			</div>
			<button className='file-drop-clear' onClick={()=>clearFiles()}>Clear files</button>
		</div>
	);
}