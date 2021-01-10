import  React  from 'react';

export class TestComponent extends React.Component {
    count: any = React.createRef();
    constructor(props: any) {
    	super(props);
    	//const count = React.createRef();
    }

    render() {
    	return(
    		<div ref={this.count}>
    		</div>
    	);
    }
}