import  React  from 'react';
import { EventListener, IEventListener } from './eventListener';
declare let rectangle: any; // from gemoetry.js

//https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/
//https://www.w3schools.com/react/react_components.asp

export function ProgressBar(ListenFor: string, listener: IEventListener) {

	const canvasId = 'ProgressBarCanvas';
	let contextCanvas;
	const barColour = 'blue';
	const eventListener = listener;

	const observer = new MutationObserver(() => {
		if (document.getElementById(canvasId)) {
			SetPercentage(25);
			observer.disconnect();
		}
	});

	observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
	
	eventListener.addEventListener(ListenFor, function(e: any) {
		//return;
		SetPercentage(e.detail.percent);
	});

	const SetPercentage = ((percentage: number) => {  
		const progressCanvas = (document.getElementById(canvasId) as HTMLCanvasElement);
		progressCanvas.height = 40;
		contextCanvas = progressCanvas.getContext('2d');
        
		//rectangle(name, startX, startY, width, height, fillStyle, strokeStyle, strokeWidth, afterSaveFuncs)
		const barWidth = (progressCanvas!.width / 100) * percentage;
		const background = new rectangle('barBackground', 0, 0, progressCanvas.width, progressCanvas.height, 'white', 'white', 2, ()=>{});
		const bar = new rectangle('bar', 0, 0, barWidth, progressCanvas.height, barColour, barColour, 2, ()=>{});
		background.draw(contextCanvas);
		bar.draw(contextCanvas);
		//requestAnimationFrame(SetPercentage);
	});

	return (
		<div>
			<canvas id={canvasId}></canvas>
		</div>
	);
}