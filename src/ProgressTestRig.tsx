/* eslint-disable no-mixed-spaces-and-tabs */
export class ProgressTestRig {
    
	constructor(private eventSignature: string) {}

    NotifyAfterPause = ((secondsToPause: number, percentToDisplay: number) => {
    	return new Promise(resolve => {
    		const pause = secondsToPause * 1000;
    		const today = new Date();
    		const time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();        

    		setTimeout(() => {
    			console.log('waiting for two seconds', time);
    			this.dispatchNotifyEvent(percentToDisplay);
    			resolve();
    		}, pause);
    	});
    });

    private dispatchNotifyEvent = ((percent: number) => {
    	const notifyEvent = new CustomEvent(this.eventSignature, {
    		detail: {percent: percent}
    	});
    	dispatchEvent(notifyEvent);
    });
}