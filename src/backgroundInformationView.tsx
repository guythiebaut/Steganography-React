import  React, { useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Tab from 'react-bootstrap/Tab';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import { instructions, supplementalInformation, backgroundInformationText } from './textValues';

export function BackgroundInformationView()  { 
	return(
		<Tab eventKey="backgroundInformation" title="Background Information" tabClassName='tab-header'>
			<div className="card card-margin card-intro wide">
				<div className="card-header">Online steganography - background information on TeboSteg</div>
				<div className="card-body">
					<div className="card-text">
						{backgroundInformationText()}
					</div>
				</div>
			</div> 
		</Tab> 
	);}
