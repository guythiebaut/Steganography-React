import  React, { useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Tab from 'react-bootstrap/Tab';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import { instructions, supplementalInformation } from './textValues';

export function InstructionsView()  { 
	return(
		<Tab eventKey="instructions" title="Instructions" tabClassName='tab-header'>
			<div className="card card-margin card-intro wide">
				<div className="card-header">Instructions on how to embed text messages or files into images and how to extract them</div>
				<div className="card-body">
					<div className="card-text">
						{instructions()}
					</div>
				</div>
				<Accordion defaultActiveKey="1">
					<Card>
						<Card.Header>
							<Accordion.Toggle as={Card.Header} variant="link" eventKey="0" >
                        Click here to show further information below
							</Accordion.Toggle>
						</Card.Header>
						<Accordion.Collapse eventKey="0">
							<Card.Body>
								{supplementalInformation()}
								<Card.Link href="https://github.com/guythiebaut/Steganography-React">You can access the source code from GitHub - click here</Card.Link>
							</Card.Body>
						</Accordion.Collapse>
					</Card>                
				</Accordion>
			</div> 
		</Tab> 
	);}
