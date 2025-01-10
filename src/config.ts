export class SipDoorbellJsConfig {
  server: any; 
  port: any; 
  prefix = "";
  secret = "";

  button_size = 48;
  dtmfs: any = [];
  buttons: any = [];
  
  auto_answer = false;

  iceConfig: any = {}
  iceTimeout = 5;

  doorbell_ext = "";
  doorbell_camera = undefined;

  person = {
    person: "",
    ext: ""
  }

  ringtones = {
    ringtone: "",
    ringbacktone: "",
    pause: ""
  }
}