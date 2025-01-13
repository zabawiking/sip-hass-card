export class SipDoorbellJsConfig {
  server: any; 
  port: any; 
  prefix = "";
  secret = "";

  button_size = 48;
  buttons: any = [];
  
  auto_answer = false;

  doorbell_ext = "";
  doorbell_camera = undefined;

  person = {
    person: "",
    ext: ""
  }

  ringtones = {
    ringtone: ""
  }
}