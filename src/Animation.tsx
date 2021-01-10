import  React  from 'react';


interface IProps {
    contextRef: any;
    angle: any;
  }
  
  interface IPropsState {
    contextRef: any;
    angle: any;
  }
  

export class Animation extends React.Component<IProps, IPropsState>  {
	constructor(props: any) {
		super(props);
		this.state = { angle: 0, contextRef: '' };
		this.updateAnimationState = this.updateAnimationState.bind(this);
	}
    
    rAF: any = null;
    
    componentDidMount() {
    	this.rAF = requestAnimationFrame(this.updateAnimationState);
    }
    
    updateAnimationState() {
    	this.setState((prevState: any) => ({ angle: prevState.angle + 1 }));
    	this.rAF = requestAnimationFrame(this.updateAnimationState);
    }
    
    componentWillUnmount() {
    	cancelAnimationFrame(this.rAF);
    }
    
    render() {
    	return <Canvas angle={this.state.angle} contextRef={''} />;
    }
}
  
class Canvas extends React.Component<IProps, IPropsState>  {
	constructor(props: any) {
		super(props);
		this.saveContext = this.saveContext.bind(this);
	}
    
    ctx: any = null;

    saveContext(ctx: any) {
    	this.ctx = ctx;
    }
    
    componentDidUpdate() {
    	const {angle} = this.props;
    	const width = this.ctx.canvas.width;
    	const height = this.ctx.canvas.height;
    	this.ctx.save();
    	this.ctx.beginPath();
    	this.ctx.clearRect(0, 0, width, height);
    	this.ctx.translate(width/2, height/2 );
    	this.ctx.rotate(angle * Math.PI / 180);
    	this.ctx.fillStyle = '#4397AC';
    	this.ctx.fillRect(-width/4, -height/4, width/2, height/2);
    	this.ctx.restore();
    }
    
    render() {
    	return <PureCanvas contextRef={this.saveContext} angle={''}></PureCanvas>;
    }
}
  
class PureCanvas extends React.Component<IProps, IPropsState>  {
	shouldComponentUpdate() { return false; }
    
	render() {
		return (
			<canvas width="300" height="300" 
				ref={node => node ? this.props.contextRef(node.getContext('2d')) : null}
			/>
		);
	}
}
  