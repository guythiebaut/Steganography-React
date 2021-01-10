/* eslint-disable no-mixed-spaces-and-tabs */
import  React from 'react';
import { EventListener, IEventListener } from './eventListener';


interface IProps {
    startPercent: number;
	percentEvent: string;
	eventListener: IEventListener;
  }
  
  interface IPropsState {
    currentPercent: number;
  }
  
export class ProgressPercentage extends React.Component<IProps, IPropsState> {
	
	constructor(props: any) {
		super(props);
		this.state = {currentPercent: this.props.startPercent};
		this.forceUpdateHandler = this.forceUpdateHandler.bind(this);

		const setPercent = ((val: number) =>{
			this.setState(() => {
				return {currentPercent: val};
			}, () => this.forceUpdateHandler());
		});



		this.props.eventListener.addEventListener(this.props.percentEvent, function(e: any) {
			setPercent(e.detail.percent);
		});

	}
    
	forceUpdateHandler(){
		this.forceUpdate();
	}

	render() {
   		return(
			<div>
				{this.state.currentPercent}
			</div>
   		);
	}
}

