import  React from 'react';
import {IEventListener} from './eventListener';



interface IProps {
    identifiedBy: string;
	selectedEventName: string;
	defaultButton: number;
    buttonLabels: string[];
    buttonIds: number[];
	eventListener: IEventListener;
  }
  
  interface IPropsState {
    selectedButton: number;
  }

export class RadioButtonGroup extends React.Component<IProps, IPropsState> {

	constructor(props: any) {
		super(props);
		this.state = {
            selectedButton: this.props.defaultButton
		};
        
    render() {

    }        

}
