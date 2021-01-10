import  React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
// https://www.npmjs.com/package/react-bootstrap-range-slider
// @ts-ignore
import RangeSlider from 'react-bootstrap-range-slider';
import 'bootstrap/dist/css/bootstrap.css'; 
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

interface IProps {
  }
  
  interface IPropsState {
	containerDimWidth: number;
	containerDimHeight: number;
	filePrefix: string;
  }


const minContainerDims = 300;
const maxContainerDims = 4000;
export let dimensionsWidth = 2000;
export let dimensionsHeight = 2000;
const initialFileNamePrefix = 'Fractal';
export let fileNamePrefix = initialFileNamePrefix;

export class ContainerImageDimensions extends React.Component<IProps, IPropsState> {

	initialContainerDims = dimensionsWidth;

	constructor(props: any) {
		super(props);
		this.state = {
			containerDimWidth: dimensionsWidth,
			containerDimHeight: dimensionsHeight,
			filePrefix: initialFileNamePrefix,
		};

	}
	

	ValidateDimension = ((value: string): number =>{ 
		if (isNaN(parseInt(value))) return minContainerDims;
		if (parseInt(value) < minContainerDims) return minContainerDims;
		if (parseInt(value) > maxContainerDims) return maxContainerDims;
		return parseInt(value);
	});
	
	ValidateFileName = ((fileName: string): string =>{ 
		if (fileName.trim() === '') { 
			return initialFileNamePrefix;
		} else {
			return fileName.trim();
		}
	});
	

	setContainerDimWidth = ((val: number) =>{
		this.setState(() => {
			return {containerDimWidth: val};
		});
	});
	
	setContainerDimHeight = ((val: number) =>{
		this.setState(() => {
			return {containerDimHeight: val};
		});
	});

	setFilePrefix = ((val: string) =>{
		this.setState(() => {
			return {filePrefix: val};
		});
	});

	render() {
		return (
			<Container >
				<Row>
					<InputGroup className='mb-3 width-height' >
						<InputGroup.Prepend>
							<InputGroup.Text id='enc-secret'>Width</InputGroup.Text>
						</InputGroup.Prepend>
						<FormControl
							placeholder={String(minContainerDims)}
							value={this.state.containerDimWidth} 
							onChange={(e: any) => {this.setContainerDimWidth(e.target.value);}}
							onBlur={(e: any) => {this.setContainerDimWidth(this.ValidateDimension(e.target.value));}}
							aria-label='Width of image in pixels...'
							aria-describedby='dec-width'
						/>
						<InputGroup.Prepend>
							<InputGroup.Text id='enc-secret'>Height</InputGroup.Text>
						</InputGroup.Prepend>															
						<FormControl
							placeholder={String(minContainerDims)}
							value={this.state.containerDimHeight}
							onChange={(e: any) => {this.setContainerDimHeight(e.target.value);}}
							onBlur={(e: any) => {this.setContainerDimHeight(this.ValidateDimension(e.target.value));}}
							aria-label='height of image in pixels...'
							aria-describedby='dec-height'
						/>
						<InputGroup.Prepend>
							<InputGroup.Text id='enc-secret'>Filename prefix</InputGroup.Text>
						</InputGroup.Prepend>															
						<FormControl
							placeholder={initialFileNamePrefix}
							value={this.state.filePrefix}
							onChange={(e: any) => {this.setFilePrefix(e.target.value);}}
							onBlur={(e: any) => {this.setFilePrefix(this.ValidateFileName(e.target.value));
								fileNamePrefix = this.ValidateFileName(e.target.value);}}
							aria-label='file name prefix'
							aria-describedby='dec-height'
						/>					
					</InputGroup>          
				</Row>
				<Row>
					<div className='slider-h-container'>
						<div><RangeSlider min = {minContainerDims} max = {maxContainerDims} value = {this.state.containerDimWidth} step = {10} tooltip = 'off' 
							onChange={(e: any) => {this.setContainerDimWidth(e.target.value); 
								dimensionsWidth = parseInt(e.target.value);}}/></div>
						<div className='slider-height'><RangeSlider min = {minContainerDims} max = {maxContainerDims} value = {this.state.containerDimHeight} step = {10} tooltip = 'off'
							onChange={(e: any) => {this.setContainerDimHeight(e.target.value);
								dimensionsHeight = parseInt(e.target.value);}}/></div>
					</div>
				</Row>
			</Container >
		);
	}
}