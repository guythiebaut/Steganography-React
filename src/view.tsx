import  React, { useState } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import * as Image from './image'
import "./Steganography.css"
import { DecryptionErrorMessage, MessagePacker, MessageUnPacker } from './encryption';
import { Logger } from './logger'
import { EndMarker } from './image'

let image = new Image.Main();
let logInformation = true;
let logger = new Logger(logInformation);

const Encrypt = ((files: any[], resetFiles: any, text: string, secret: string, encryptingCallback: any, showEncryptAlert: any, setEncryptAlertMessage: any)  => {
    let messagePackage = new MessagePacker(files, text, secret, image, showEncryptAlert, setEncryptAlertMessage, encryptingCallback, logger);
    messagePackage.ProcessFiles();
    logger.log('messagePackage', messagePackage);
    resetFiles([]);
    ClearFiles('fileEncryptUpload');
});

const Decrypt = ((files: any, resetFiles: any, secret: string, resultCallback: any, showDecryptAlert: any, setDecryptAlertMessage: any) => {
    var endMarker = EndMarker('', true);
    let messagePackage = new MessageUnPacker(files, endMarker, secret, logger);
    resetFiles([]);
    messagePackage.processFiles()
    .then((result: any) => {
        logger.log('result', result);

        if (result.success) {
            showDecryptAlert(false);
            resultCallback(result.body);
            ClearFiles('fileDecryptUpload');
        } else {
            logger.log('result',result);
            setDecryptAlertMessage(DecryptionErrorMessage(result.error))
            showDecryptAlert(true);
        }
    });
});

const ClearFiles = ((id: string) =>{
    if (document){(document.getElementById(id) as HTMLInputElement).value = ''};
});

export function View() {

    const[textToEncrypt, setTextToEncrypt] = useState('Paste your text to be encrypted here...');
    const[useSecretForEncryption, setUseSecretForEncryption] = useState(false);
    const[useSecretForDecryption, setUseSecretForDecryption] = useState(false);
    const[encryptionSecret, setEncryptionSecret] = useState('Encryption secret...');
    const[decryptionSecret, setDecryptionSecret] = useState('Decryption secret...');
    const[textDecrypted, setTextDecrypted] = useState('Decrypted text will appear here...');
    const[textEncrypted, setTextEncrypted] = useState('Encryption process updates will appear here...');
    const [showEncryptAlert, setEncryptAlert] = useState(false);
    const [showDecryptAlert, setDecryptAlert] = useState(false);
    const [encryptAlertMessage, setEncryptAlertMessage] = useState('');
    const [decryptAlertMessage, setDecryptAlertMessage] = useState('');
    const [filesSelected, setfilesSelected] = useState([FileList]);

    return (
        <div className="App">
            <Container className="p-3 p3-padding">
                <Tabs defaultActiveKey="instructions" transition={false} id="noanim-tab-example">
                    <Tab eventKey="instructions" title="Instructions" tabClassName='tab-header'>
                        <div className="card card-margin card-intro">
                            <div className="card-header">Welcome to the Teboweb Steganography page</div>
                            <div className="card-body">
                                <p className="card-text">
                                    From here you can encrypt and decrypt text messages within images.<br/>
                                    <br/>
                                    Click on the <b>Encrypt</b> tab above to encrypt text to an image file.<br/>
                                    To encrypt text enter ASCII compliant text into the <i>"Paste your text to be encrypted here..."</i> text box.<br/>
                                    Then click on the <i>"Choose file"</i> button and select an image file<br/>
                                    Your file with the text within it will then be downloaded and should be available fronm the bottom of the browser.<br/>
                                    If you want a more secure encryption then tick the box to the right of <i>Use encryption secret</i> and enter a secret/password 
                                    into the text box, to the right, before selecting your file.<br/>
                                    <br/>
                                    Click on the <b>Decrypt</b> tab above to extract text from an image file that has text encrypted into it.<br/>
                                    To extract text from an image file, that has had text encrypted into it, click on the <i>"Choose file"</i> button 
                                    and select the image file containing the text.<br/>
                                    The text will be extracted and displayed in the <i>Decryption result</i> box.<br/>
                                    If the file has been encrypted with a secret/password you will need to provide the correct secret/password by ticking 
                                    the box to the right of <i>Use decryption secret</i> and entering the correct secret/password 
                                    into the text box, to the right, before selecting your file.<br/>
                                </p>
                            </div>
                            <Accordion defaultActiveKey="1">
                                <Card>
                                    <Card.Header>
                                        <Accordion.Toggle as={Card.Header} variant="link" eventKey="0">
                                            Click here to show further information below
                                        </Accordion.Toggle>
                                    </Card.Header>
                                    <Accordion.Collapse eventKey="0">
                                        <Card.Body>
                                            <u>Supplemental information</u><br></br>
                                            All of the processing takes place locally in your browser.<br></br>
                                            The text you encrypt is not processed online or in 'the cloud.'<br></br>
                                            This ensures that the encryption you apply is completely private to you.<br></br>
                                            <Card.Link href="https://github.com/guythiebaut/Steganography-React">You can access the source code from GitHub - click here</Card.Link>
                                        </Card.Body>
                                    </Accordion.Collapse>
                                </Card>                
                            </Accordion>
                        </div> 
                      </Tab> 
                    {/* <Tab eventKey="profile" title="Encrypt" tabClassName='tab-header'> */} 
                    <Tab eventKey="encrypt" title="Encrypt" tabClassName='tab-header'>                        
                        <Container className="p-3 p3-padding">
                            <Modal.Dialog>
                                <h2 id='message'/>
                                <textarea className='textBox'value={textToEncrypt} onChange={(e) => {setTextToEncrypt(e.target.value)}   } />
                                <div className='col-12'>
                                    <input type="file" multiple id="fileEncryptUpload" onChange={(e) => setfilesSelected([...filesSelected,...e.target.files as any])}/>
                                                <Button variant="light" onClick={() => {
                                                                                        setfilesSelected([]);
                                                                                        ClearFiles('fileEncryptUpload');
                                                                                    }}>Clear files </Button>
                                </div>
                                <div className='col-12'>
                                <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use encryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForEncryption(e.target.checked)}} />
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={encryptionSecret}
                                    aria-describedby="enc-secret"
                                    onChange={(e: any) => {setEncryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForEncryption}
                                />
                            </InputGroup>                                    
                            </div>
                            <Button variant="primary" size="lg" onClick={() => Encrypt(filesSelected, setfilesSelected, textToEncrypt, useSecretForEncryption ? encryptionSecret : '', setTextEncrypted, setEncryptAlert, setEncryptAlertMessage)}>Encrypt to files </Button>
                            </Modal.Dialog>
                        </Container>            
                        <Modal.Dialog className='modalDialog-top'>
                            <Alert className={showEncryptAlert ? '' : 'alert-hide'}  id='EncryptAlert' variant="danger" onClose={() => setEncryptAlert(false)}  dismissible>
                                <Alert.Heading>Error!</Alert.Heading>
                                <p className='alert-text'>  
                                    {encryptAlertMessage}
                                </p>
                            </Alert>                        
                            {/* <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use encryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForEncryption(e.target.checked)}} />
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={encryptionSecret}
                                    aria-label="Enter your encryption secret here..."
                                    aria-describedby="enc-secret"
                                    onChange={(e: any) => {setEncryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForEncryption}
                                />
                            </InputGroup>                             */}
                        </Modal.Dialog>      
                    </Tab>
                    <Tab eventKey="decrypt" title="Decrypt" tabClassName='tab-header'>
                        <Modal.Dialog>
                            <Alert className={showDecryptAlert ? '' : 'alert-hide'}  id='DecryptAlert' variant="danger" onClose={() => setDecryptAlert(false)}  dismissible>
                            <Alert.Heading>Error!</Alert.Heading>
                                <p className='alert-text'>  
                                    {decryptAlertMessage}
                                </p>
                            </Alert>                        
                            <InputGroup className="mb-3" >
                                <InputGroup.Prepend>
                                    <InputGroup.Text id="enc-secret">Use decryption secret</InputGroup.Text>
                                </InputGroup.Prepend>
                                <InputGroup.Prepend>
                                    <InputGroup.Checkbox onChange={(e) => {setUseSecretForDecryption(e.target.checked)}}/>
                                </InputGroup.Prepend>                                
                                <FormControl
                                    placeholder={decryptionSecret}
                                    aria-label="Enter your decryption secret here..."
                                    aria-describedby="dec-secret"
                                    onChange={(e: any) => {setDecryptionSecret(e.target.value)}}
                                    readOnly={!useSecretForDecryption}
                                />
                            </InputGroup>                                            
                            <Modal.Body>
                                <Container>
                                    <div>
                                        <Row className="show-grid">
                                            <div className='col-12'>
                                                <input type="file" multiple id="fileDecryptUpload" onChange={(e) => setfilesSelected([...filesSelected,...e.target.files as any])}/>
                                                <Button variant="light" onClick={() => {
                                                                                    setfilesSelected([]);
                                                                                    ClearFiles('fileDecryptUpload');
                                                                                   }}>Clear files </Button>                                                
                                                {/* <input type="file" id="fileDecryptUpload" onChange={(e) => Decrypt(e, useSecretForDecryption ? decryptionSecret : '', setTextDecrypted, setDecryptAlert, setDecryptAlertMessage)}/> */}
                                            </div>
                                        </Row>
                                        <Button variant="primary" size="lg" onClick={() => Decrypt(filesSelected, setfilesSelected, useSecretForDecryption ? decryptionSecret : '', setTextDecrypted, setDecryptAlert, setDecryptAlertMessage)}>Decrypt from files </Button>
                                    </div>
                                        <div className="card card-margin">
                                            <div className="card-body">
                                                <h5 className="card-title">Decryption result</h5>
                                                <p className="card-text">{textDecrypted}</p>
                                            </div>
                                        </div>     
                                </Container>
                            </Modal.Body>
                        </Modal.Dialog>
                    </Tab>
                </Tabs>
            </Container>
        </div>
    );
};