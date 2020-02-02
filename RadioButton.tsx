import React, { Fragment, Component } from 'react';
import ReactDOM from 'react-dom'

import * as State from './State';


export class RadioButtonGroup {
    radioButtons: RadioButton[];
    name: string;
    divClassName: string;
    buttonClassName: string;
    onChangeHandler: any;

    constructor() {
        this.radioButtons = [];
        this.name = '';
        this.divClassName = '';
        this.buttonClassName = '';
        this.onChangeHandler = '';
    }

    AddButton = ((radioButton: RadioButton) => { 
        radioButton.name = this.name;
        radioButton.divClassName = this.divClassName;
        radioButton.buttonClassName = this.buttonClassName;
        radioButton.onChangeHandler = this.onChangeHandler;
        this.radioButtons.push(radioButton);
    });

    RenderGroup = ((parentId: string) =>{
        let parentDiv = document.getElementById(parentId);
        console.log('checking parent div',parentId);
        
        if (parentDiv){
            console.log('radio buttons: ',this.radioButtons.length);              
            for (let i = 0; i < this.radioButtons.length; i++) {
                console.log('rendering ',this.radioButtons[i])              
                var childDiv  = document.createElement('div');
                var id = `${this.radioButtons[i].name}${i}`;
                childDiv.id = id;
                //childDiv.className = 'left';
                //childDiv.className = 'col-md-6';
                parentDiv.appendChild(childDiv);
                var buttonFn = this.radioButtons[i].GetRadioButton();
                ReactDOM.render(buttonFn, document.getElementById(id));  
            }
        }
    });
}

export class RadioButton {
    value: string;
    checked: boolean;
    name: string;
    divClassName: string;
    buttonClassName: string;
    onChangeHandler: any;
    
    constructor() {
        this.name = '';
        this.value = '';
        this.divClassName = '';
        this.buttonClassName = '';
        this.checked = false;
        this.onChangeHandler = '';
    }

    //checked={State.state.imageManipulationOption === this.value}
    //checked={State.state.imageManipulationOption === `${this.value}`}
    //<input type='radio' checked={this.checked} name={this.name} value={this.value} className={this.buttonClassName} onChange={this.onChangeHandler}/>
    GetRadioButton = (() =>{
        return   <Fragment>
                    <div className={this.divClassName}>
                        <input type='radio' checked={this.checked} name={this.name} value={this.value} className={this.buttonClassName} onChange={this.onChangeHandler}/>
                        <label>
                        {this.value}
                        </label>
                    </div>
                </Fragment>;
    });
}