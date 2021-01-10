/* eslint-disable no-mixed-spaces-and-tabs */

//https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/

import  React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import {IEventListener} from './eventListener';

interface IProps {
    identifiedBy: string;
	openEventName: string;
	initialDialogText: string;
	initialTitleText: string;
	eventListener: IEventListener;
  }
  
  interface IPropsState {
	dialogText: string;
	title: string;
	open: boolean;
  }

export class Dialog extends React.Component<IProps, IPropsState> {
	
	constructor(props: any) {
		super(props);
		this.state = {
			dialogText: this.props.initialDialogText,
			title: this.props.initialTitleText,
			open: false,
		};
		
		const setDialogText = ((val: string) =>{
			this.setState(() => {
				return {dialogText: val};
			});
		});

		const setTitleText = ((val: string) =>{
			this.setState(() => {
				return {title: val};
			});
		});

		const setOpen = ((val: boolean) =>{
			this.setState(() => {
				return {open: val};
			});
		});

		this.props.eventListener.addEventListener(this.props.openEventName, function(e: any) {
			setTitleText(e.detail.eventObject.title);
			setDialogText(e.detail.eventObject.text);
			setOpen(true);
		});
	}

	render() {
		const handleClose = () => this.setState({open: false});

   		return(
			<div id={this.props.identifiedBy}>
			      <Modal show={this.state.open} onHide={handleClose} centered >
					<Modal.Header closeButton >
						<Modal.Title>{this.state.title}</Modal.Title>
					</Modal.Header>
					<Modal.Body>{this.state.dialogText}</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={()=>{handleClose();}}>
            Close
						</Button>
					</Modal.Footer>
				</Modal>
			</div>
   		);
	}
}

