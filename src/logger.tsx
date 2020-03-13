
export class Logger {
    private logStatus: boolean;
    
    constructor(log: boolean) {
        this.logStatus = log;
    }

    setLoggingOn = (() => {
        this.logStatus = true;
    })
    
    setLoggingOff = (() => {
        this.logStatus = false;
    })

    log = ((label: string, message: any) => {
        if (this.logStatus) {
            console.log(label, message);
        }
    })

}
