//http://jsfiddle.net/r4TMq/11/
//http://www.html5canvastutorials.com/tutorials/html5-canvas-rectangles/

//polygons
//http://scienceprimer.com/drawing-regular-polygons-javascript-canvas


    
var d = new Date();
today = d.getDate() + "-" + (d.getMonth()+1) + "-" + d.getFullYear();
var graphicsContext;
	
//object = [];

Function.prototype.inheritsFrom = function( parentClassOrObject ){ 
	if ( parentClassOrObject.constructor == Function ) 
	{ 
		//Normal Inheritance 
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	} 
	else 
	{ 
		//Pure Virtual Inheritance 
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	} 
	return this;
} 
//###############shape v
function shape(name, startX, startY, fillStyle, strokeStyle, strokeWidth){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "shape";
}

shape.prototype.show = function(){
alert(this.name);
}

shape.prototype.upperBoundary = function(){}
shape.prototype.lowerBoundary = function(){}
shape.prototype.leftBoundary = function(){}
shape.prototype.rightBoundary = function(){}
shape.prototype.centreX = function(){}
shape.prototype.centreY = function(){}
shape.prototype.getWidth = function(){}
shape.prototype.getHeight = function(){}
shape.prototype.draw = function(){}
shape.prototype.moveTo = function(){}
shape.prototype.calculate = function(){}
//###############shape ^

//###############circle v
function circle(name, startX, startY, radius, fillStyle, strokeStyle, strokeWidth){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.radius = radius;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "circle";
}
circle.inheritsFrom(shape);

circle.prototype.upperBoundary = function(){return this.startY - this.radius;}	
circle.prototype.lowerBoundary = function(){return this.startY + this.radius;}	
circle.prototype.leftBoundary = function(){return this.startX - this.radius;}		
circle.prototype.rightBoundary = function(){return this.startX + this.radius;}	
circle.prototype.centreX = function(){return this.startX;}	
circle.prototype.centreY = function(){return this.startY;}		
circle.prototype.getWidth = function(){return this.rightBoundary() - this.leftBoundary();}
circle.prototype.getHeight = function(){return this.lowerBoundary() - this.upperBoundary();}	

circle.prototype.draw = function(context){
	context.beginPath();
	context.arc(this.centreX(), this.centreY(), this.radius, 0, 2*Math.PI, false);
	context.closePath();
	if (typeof this.fillStyle !== 'undefined'){
		context.fillStyle = this.fillStyle;	
		context.fill();
	}
	if (typeof this.strokeStyle !== 'undefined') {
		context.strokeStyle = this.strokeStyle;	
	}
	context.lineWidth = this.strokeWidth;
	context.stroke();  
}
//###############circle ^

//###############rectangle v
function rectangle(name, startX, startY, width, height, fillStyle, strokeStyle, strokeWidth, afterSaveFuncs){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.width = width;
	this.height = height;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "rectangle";
	this.diaganol = diaganol(width, height);
	this.afterSaveFuncs = afterSaveFuncs;
	
	var p = new polygon(this.name, 
	this.fillStyle, 
	this.strokeStyle, 
	this.strokeWidth,
	this.afterSaveFuncs);
			
	p.addLine(this.startX, this.startY, this.startX + this.width, this.startY);
	p.addLine(this.startX + this.width, this.startY, this.startX + this.width, this.startY + height);
	p.addLine(this.startX + this.width, this.startY + height, this.startX, this.startY + height);
	return p;		
}
//###############rectangle ^	

//###############diaganol v

function diaganol(width, height){
	return Math.sqrt(Math.pow(width,2) + Math.pow(height,2));
}

//###############diaganol ^	

//###############rotationAngle v

	function rotationDegrees(angle){
	return (angle * Math.PI / 180);
}
	
//###############rotationAngle ^

//###############triangle v
function triangle(name, startX, startY, width, fillStyle, strokeStyle, strokeWidth){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.width = width;
	this.height = 0;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "triangle";

	var p = new  polygon(this.name, 
	this.fillStyle, 
	this.strokeStyle, 
	this.strokeWidth);
			
	p.addLine(this.startX, this.startY, this.startX + this.width, this.startY);
	p.addLine(this.startX + this.width, this.startY, this.startX + (this.width / 2), this.startY  - (Math.sqrt(3) / 2 * this.width));
	return p;
}
//###############triangle ^			

//###############line ^	
function line(context,name, startX, startY, endX, endY, strokeStyle, strokeWidth, distinct, mv){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.endX = endX;
	this.endY = endY;		
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.distinct = distinct;
	this.mv = mv;
	this.type = "line";
	this.context = context;
}

line.inheritsFrom(shape);

line.prototype.upperBoundary = function(){return this.startY;}	
line.prototype.lowerBoundary = function(){return this.endY;}	
line.prototype.leftBoundary = function(){return this.startX;}		
line.prototype.rightBoundary = function(){return this.endX;}	
line.prototype.centreX = function(){return this.startX + ((this.endX - this.startX) / 2);}	
line.prototype.centreY = function(){return this.startY + ((this.endY - this.startY) / 2);}		
line.prototype.getWidth = function(){return this.rightBoundary() - this.leftBoundary();}
line.prototype.getHeight = function(){return this.lowerBoundary() - this.upperBoundary();}	

line.prototype.moveTo = function(x, y){
	this.endX = (x - this.startX) + this.endX;
	this.endY = (y - this.startY) + this.endY;
	this.startX = x;
	this.startY = y;
}

line.prototype.draw = function(){	
	if(this.distinct == 1){
		this.context.save();
		this.context.beginPath();
		this.context.strokeStyle = this.strokeStyle;
		this.context.lineWidth = this.strokeWidth;
	}
	if(this.mv == 1)context.moveTo(this.startX, this.startY);
	this.context.lineTo(this.endX, this.endY);
	if(this.distinct == 1){
		this.context.stroke();
		this.context.closePath();
		this.context.restore();
	}
}

//###############line ^	

//###############polygon v	

function polygon(name, fillStyle, strokeStyle, strokeWidth, afterSaveFuncs){
	this.name = name;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "polygon";
	this.lines=[];
	this.upBoundary = 0;
	this.lwBoundary = 0;
	this.lBoundary = 0;
	this.rBoundary = 0;
	this.cenX = 0;
	this.cenY = 0;		
	this.startX = 0;
	this.startY = 0;
	this.endX = 0;
	this.endY = 0;	
	this.afterSaveFuncs = afterSaveFuncs; 
}

polygon.inheritsFrom(shape);

polygon.prototype.upperBoundary = function(){return this.upBoundary;}	
polygon.prototype.lowerBoundary = function(){return this.lwBoundary;}	
polygon.prototype.leftBoundary = function(){return this.lBoundary;}		
polygon.prototype.rightBoundary = function(){return this.rBoundary;}	
polygon.prototype.centreX = function(){return this.cenX;}	
polygon.prototype.centreY = function(){return this.cenY;}		
polygon.prototype.getWidth = function(){return this.rBoundary - this.lBoundary;}
polygon.prototype.getHeight = function(){return this.lwBoundary - this.upBoundary;}	

polygon.prototype.calculate= function(){
	xMin = Number.MAX_SAFE_INTEGER;
	xMax = 0;
	yMin = Number.MAX_SAFE_INTEGER;
	yMax = 0;
	
	this.lines.forEach(function(line) {
			if(line.startX < xMin){xMin = line.startX;}
			if(line.startY < yMin){yMin = line.startY;}
			if(line.endX < xMin){xMin = line.endX;}
			if(line.endY < yMin){yMin = line.endY;}
			if(line.startX > xMax){xMax = line.startX;}
			if(line.startY > yMax){yMax = line.startY;}
			if(line.endX > xMax){xMax = line.endX;}
			if(line.endY > yMax){yMax = line.endY;}
	});

	this.upBoundary = yMin;
	this.lwBoundary = yMax;
	this.lBoundary = xMin;
	this.rBoundary = xMax;
	this.cenX = xMin + ((xMax - xMin) / 2);
	this.cenY = yMin + ((yMax - yMin) / 2);
	this.startX = xMin;
	this.startY = yMin;
	this.endX = xMax;
	this.endY = yMax;
}

polygon.prototype.moveTo = function(x, y, centre){
	
	if(centre == 0) {
		addX = x - this.startX;  
		addY = y - this.startY;
	}
	else
	{
		addX = x - this.startX - (this.cenX - this.startX);  
		addY = y - this.startY - (this.cenY - this.startY);
	}
	
	this.lines.forEach(function(line){
		line.startX = line.startX + addX;
		line.endX = line.endX + addX;
		line.startY = line.startY + addY;
		line.endY = line.endY + addY;
	});

	this.calculate();
}

polygon.prototype.addLine = function(startX, startY, endX, endY){
	var line = {startX:startX, startY:startY, endX:endX, endY:endY};
	this.lines.push(line);
	
	this.calculate();
}
		
polygon.prototype.draw = function(context){
	context.save();
	functionArrayRun(this.afterSaveFuncs);
	context.beginPath();
	context.moveTo(this.lines[0].startX, this.lines[0].startY);
	
	this.lines.forEach(function(ln){
		new line(context,"l", ln.startX, ln.startY, ln.endX, ln.endY, "", "", 0, 0).draw();
	});

	context.closePath();
	context.strokeStyle = this.strokeStyle;
	context.lineWidth = this.strokeWidth;
	context.stroke();		
	if (typeof this.fillStyle != 'undefined'){
		context.fillStyle = this.fillStyle;	
		context.fill();
	}		
	context.restore();	
}
		
//###############polygon ^	

//###############polygonRegular v	

function polygonRegular(name, fillStyle, strokeStyle, strokeWidth, numberOfSides, sideSize, xCenter, yCenter, afterSaveFuncs){
	this.name = name;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;
	this.strokeWidth = strokeWidth;
	this.type = "polygon";
	this.lines=[];
	this.upBoundary = 0;
	this.lwBoundary = 0;
	this.lBoundary = 0;
	this.rBoundary = 0;
	this.cenX = 0;
	this.cenY = 0;		
	this.startX = 0;
	this.startY = 0;
	this.endX = 0;
	this.endY = 0;	
	this.afterSaveFuncs = afterSaveFuncs;
	
	lastX = xCenter + sideSize * Math.cos(2 * Math.PI / numberOfSides);
	lastY = yCenter + sideSize * Math.sin(2 * Math.PI / numberOfSides);
	thisX = 0;
	thisY = 0;
		
	for (var i = 2; i <= numberOfSides;i += 1){
			thisX = xCenter + sideSize * Math.cos(i * 2 * Math.PI / (numberOfSides ));
		thisY = yCenter + sideSize * Math.sin(i * 2 * Math.PI / (numberOfSides ));
		var line = {startX:lastX, startY:lastY, endX:thisX, endY:thisY};
		this.lines.push(line);
		lastX = thisX;
		lastY = thisY;
	}

	//this.calculate();		
}

polygonRegular.inheritsFrom(shape);

polygonRegular.prototype.upperBoundary = function(){return this.upBoundary;}	
polygonRegular.prototype.lowerBoundary = function(){return this.lwBoundary;}	
polygonRegular.prototype.leftBoundary = function(){return this.lBoundary;}		
polygonRegular.prototype.rightBoundary = function(){return this.rBoundary;}	
polygonRegular.prototype.centreX = function(){return this.cenX;}	
polygonRegular.prototype.centreY = function(){return this.cenY;}		
polygonRegular.prototype.getWidth = function(){return this.rBoundary - this.lBoundary;}
polygonRegular.prototype.getHeight = function(){return this.lwBoundary - this.upBoundary;}	

polygonRegular.prototype.calculate= function(){
	xMin = Number.MAX_SAFE_INTEGER;
	xMax = 0;
	yMin = Number.MAX_SAFE_INTEGER;
	yMax = 0;
	
	this.lines.forEach(function(line){
		if(line.startX < xMin){xMin = line.startX;}
		if(line.startY < yMin){yMin = line.startY;}
		if(line.endX < xMin){xMin = line.endX;}
		if(line.endY < yMin){yMin = line.endY;}
		if(line.startX > xMax){xMax = line.startX;}
		if(line.startY > yMax){yMax = line.startY;}
		if(line.endX > xMax){xMax = line.endX;}
		if(line.endY > yMax){yMax = line.endY;}
	});

	this.upBoundary = yMin;
	this.lwBoundary = yMax;
	this.lBoundary = xMin;
	this.rBoundary = xMax;
	this.cenX = xMin + ((xMax - xMin) / 2);
	this.cenY = yMin + ((yMax - yMin) / 2);
	this.startX = xMin;
	this.startY = yMin;
	this.endX = xMax;
	this.endY = yMax;
}

polygonRegular.prototype.moveTo = function(x, y){
	addX = x - this.startX;  
	addY = y - this.startY;
	
	this.lines.forEach(function(line){
		line.startX = line.startX + addX;
		line.endX = line.endX + addX;
		line.startY = line.startY + addY;
		line.endY = line.endY + addY;
	});

	this.calculate();
}
			
polygonRegular.prototype.draw = function(context){
	context.save();
	functionArrayRun(this.afterSaveFuncs);
	context.beginPath();
	context.moveTo(this.lines[0].startX, this.lines[0].startY);

	this.lines.forEach(function(ln){
		new line(context,"l", ln.startX, ln.startY, ln.endX, ln.endY, "", "", 0, 0).draw();
	});

	context.closePath();
	context.restore();
	context.strokeStyle = this.strokeStyle;
	context.lineWidth = this.strokeWidth;
	context.stroke();		
	if (typeof this.fillStyle != 'undefined'){
		context.fillStyle = this.fillStyle;	
		context.fill();
	}		
}
		
//###############polygonRegular ^	

//###############compositeObject v		
function compositeObject(){
	this.objects=[];
}

compositeObject.prototype.addObject = function(object){
	this.objects.push(object);
}

// compositeObject.prototype.moveTo(x, y, primaryObjectName){
			
	
// }

compositeObject.prototype.draw = function(context){
	this.objects.forEach(function(object){
		object.draw(context)
	});
}
//###############compositeObject ^		

//###############text v
function text(name, startX, startY, text, font){
	this.name = name;
	this.startX = startX;
	this.startY = startY;
	this.text = text;
	this.font = font;
	this.type = "text";
}	
//###############text ^	

function positionrelativeTo(thisObject, x, y, targetObject){
	me = getShape(thisObject);
	target = getShape(targetObject);
	var p = {x: 0, y: 0};
}

function positionNextTo(thisObject, relative, targetObject){
	me = getShape(thisObject);
	target = getShape(targetObject);
	var p = {x: 0, y: 0};
	switch(relative){
		case "right":
			p.x = target.rightBoundary() + (me.startX - me.leftBoundary()); 
			p.y = target.centreY() - (me.centreY() - me.startY); 
			break;
		case "left":
			p.x = target.leftBoundary() + (me.startX - me.rightBoundary()); 
			p.y = target.centreY() - (me.centreY() - me.startY); 
			break;
		case "above":
			p.x = target.centreX() - (me.centreX() - me.startX); 
			p.y = target.upperBoundary() + (me.startY - me.lowerBoundary());
			break;
		case "below":
			p.x = target.centreX() - (me.centreX() - me.startX); 
			p.y = target.lowerBoundary() + (me.startY - me.upperBoundary());
			break;
		default:
			break;
	}
	return p;
}

function addObject(obj,objectCollection){
	objectCollection.push(obj);				
}

function addText(name, startX, startY, text, font){
	var p = {name: name, type: "text", startX: startX, startY: startY, text: text, font: font};
	return p;
}

function getShape(name,objectCollection){
	objectCollection.forEach(function(object){
		if(object.name == name){
			return object;
		}
	});
}

function textInside(name, text, font, insideObject){
	switch(getShape(insideObject).type){
		case "circle":
			addObject(addText(name, getShape(insideObject).leftBoundary() , getShape(insideObject).centreY(), text, font));
			return;
		case "rectangle":
			addObject(addText(name, getShape(insideObject).leftBoundary() , getShape(insideObject).lowerBoundary() , text, font));
			return;
		default:
			break;
	}
}

function write(context,startX, startY, text, font, colour) {
	context.beginPath();
	context.font = font;
	if (this.colour != 'undefined'){
	context.fillStyle = colour;}
	else
	{context.fillStyle = "black";}
	
	context.fill();
	context.fillText(text,startX,startY);
	context.closePath();
}		

function textSize(text, font, targetPx, maxHeight)	{
	width = 0;
	lastWidth = 0;
	fnt = "";
	
	for(var i=1; i<=1000; i++) {
		context.font =  i + "px " + font;	
		px = context.measureText(text).width;
		if(px > targetPx){
			break;
		}
		lastWidth = i;
	}
	
	return lastWidth + "px " + font;
}

function drawObjects(context){
	object.forEach(function(obj){
		switch(obj.type){
		case "text":
			write(context,obj.startX,obj.startY,obj.text,obj.font,undefined);
			break;										
		default:
			obj.draw(context);
		break;
		}
	});
};

function functionArrayRun(functionArray){
	if (this.functionArray == 'undefined'){return;}		
	
	if (functionArray.length == 0){return;}

	functionArray.forEach(function(func){
		eval(func);
		//var fn = new Function(func);			
		//if (typeof fn === "function") fn();
	});
}
