import  React from 'react';
import {IEventListener} from './eventListener';

interface IProps {
    identifiedBy: string;
    radioButtons: any[];
    onChanged: any;
    title?: string;
  }
  
  interface IPropsState {
    radioButtonData: any[];
  }

export class RadioButtonGroup extends React.Component<IProps, IPropsState> {

	constructor(props: any) {
		super(props);
		this.state = {radioButtonData: this.props.radioButtons};
  }

  LabelClicked = ((e:any): void =>{
    this.RadioButtonIdxSelected(e.target.htmlFor);
  });

  RadioButtonClicked = ((e:any): void =>{
    this.RadioButtonIdxSelected(e.target.value);
  });

    RadioButtonIdxSelected = ((selectedIdx:any) =>{
      this.props.onChanged(selectedIdx);
      const radioButtons: any[] = [];

      this.state.radioButtonData.forEach((radioButton, idx) => {
        if (idx == selectedIdx) {
          radioButtons.push({label: radioButton.label, checked: true});
        } else {
          radioButtons.push({label: radioButton.label, checked: false});
        }
      });

			this.setState(() => {
			 	return {radioButtonData: radioButtons};
			});
    })

    render() {
      return (
      <div>
        {this.props.title ? this.props.title : ''}
        <ul className='radio-buttons'>
          { this.state.radioButtonData.map((radioButton, idx) => {
              return <div key={idx.toString()}> 
                <input
                  key={idx.toString()}
                  type='radio'
                  name={this.props.identifiedBy}
                  value={idx.toString()}
                  checked={radioButton.checked}
                  onChange={()=>{}}
                  onClick={this.RadioButtonClicked}
              />
              {' '}
              <label htmlFor={idx.toString()} onClick={this.LabelClicked}>{radioButton.label}</label><br/>
              </div>
            })
          }
        </ul>
      </div>
      );
    }        
}
 