import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, OutgoingEvent, IceCandidateEvent, RTCSession } from "jssip/lib/RTCSession";
import { Observable, Subject, interval } from "rxjs";

export enum SipStatus {
  Disconnected,
  Idle,
  Registered,
  IncomingCall,
  OutgoingCall,
  Calling,
  OnCall
};

export class PhoneStatus {
  sipStatus: SipStatus = SipStatus.Disconnected;
  statusMessage: string = "Disconnected";
}

export class Phone {
  sipPhone: UA | undefined;
  sipPhoneSession: RTCSession | null;
  sipCallOptions = {
    mediaConstraints: { audio: true, video: false },
    rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
  }; 

  status: PhoneStatus;
  statusSubject: Subject<PhoneStatus> = new Subject<PhoneStatus>();
  onStatus: Observable<PhoneStatus>;

  ringSubject: Subject<boolean> = new Subject<boolean>();
  onRing: Observable<boolean>;

  progressSubject: Subject<string> = new Subject<string>();
  onProgress: Observable<string>;
  progress: string = "00:00";
  intervalId: any;

  mediaSubject: Subject<MediaStream | null> = new Subject<MediaStream | null>();
  onMedia: Observable<MediaStream | null>;

  constructor(
    public server: string, 
    public port: string,
    public prefix: string,
    public ext: string,
    public secret: string,
    public doorbell_ext: string,
    public auto_answer = false) 
  {
    this.status = {sipStatus: SipStatus.Disconnected, statusMessage: "Disconnected"};

    this.onStatus = this.statusSubject.asObservable();
    this.onRing = this.ringSubject.asObservable();
    this.onProgress = this.progressSubject.asObservable();
    this.onMedia = this.mediaSubject.asObservable();

    this.sipPhoneSession = null;
  }

  get isMuted(): boolean {
    return this.sipPhoneSession?.isMuted().audio ?? false;
  }

  private endCall() {
    this.status = {sipStatus: SipStatus.Idle, statusMessage: "Idle"};
    this.statusSubject.next(this.status);
    this.ringSubject.next(false);
    this.mediaSubject.next(null);

    clearInterval(this.intervalId);
    this.progress = "00:00";
    this.progressSubject.next(this.progress);    
    this.sipPhoneSession = null;
  }

  connect() {
    if (this.sipPhone?.isRegistered()) {
      this.statusSubject.next(this.status);
      this.progressSubject.next(this.progress);
      return;
    }

    let addr = `wss://${this.server}:${this.port}${this.prefix}/ws`;
    console.log(`Connecting to ${addr}`);
    var socket = new WebSocketInterface(addr);

    var configuration = {
        sockets : [ socket ],
        uri     : "sip:" + this.ext + "@" + this.server,
        authorization_user: this.ext,
        password: this.secret,
        register: true
    };

    this.sipPhone = new UA(configuration);
    this.sipPhone.start();

    this.sipPhone?.on("registered", _ => {
      console.log('SIP Doorbell', 'Registered with SIP Server');
      this.status = {sipStatus: SipStatus.Idle, statusMessage: "Idle"};
      this.statusSubject.next(this.status);
      this.progressSubject.next(this.progress);
    });
    this.sipPhone?.on("unregistered", _ => {
        console.log('SIP Doorbell', 'Unregistered with SIP Server');
        this.status = {sipStatus: SipStatus.Disconnected, statusMessage: "Disconnected"};
        this.statusSubject.next(this.status);
        this.progressSubject.next(this.progress);
    });
    this.sipPhone?.on("registrationFailed", _ => {
        console.log('SIP Doorbell', 'Failed Registeration with SIP Server');
        this.status = {sipStatus: SipStatus.Disconnected, statusMessage: "Disconnected"};
        this.statusSubject.next(this.status);
        this.progressSubject.next(this.progress);
    });
    this.sipPhone?.on("newRTCSession", (event: RTCSessionEvent) => {
        if (this.sipPhoneSession !== null ) {
            event.session.terminate();
            return;
        }

        console.log('SIP Doorbell', 'Call: newRTCSession: Originator: ' + event.originator);

        this.sipPhoneSession = event.session;

        this.sipPhoneSession.on('getusermediafailed', function(DOMError) {
            console.log('SIP Doorbell', 'getUserMedia() failed: ' + DOMError);
        });

        this.sipPhoneSession.on('peerconnection:createofferfailed', function(DOMError) {
            console.log('SIP Doorbell', 'createOffer() failed: ' + DOMError);
        });

        this.sipPhoneSession.on('peerconnection:createanswerfailed', function (DOMError) {
            console.log('SIP Doorbell', 'createAnswer() failed: ' + DOMError);
        });

        this.sipPhoneSession.on('peerconnection:setlocaldescriptionfailed', function (DOMError) {
            console.log('SIP Doorbell', 'setLocalDescription() failed: ' + DOMError);
        });

        this.sipPhoneSession.on('peerconnection:setremotedescriptionfailed', function (DOMError) {
            console.log('SIP Doorbell', 'setRemoteDescription() failed: ' + DOMError);
        });

        this.sipPhoneSession.on("confirmed", (event: IncomingEvent | OutgoingEvent) => {
            console.log('SIP Doorbell', 'Call confirmed. Originator: ' + event.originator);
        });

        this.sipPhoneSession.on("failed", (event: EndEvent) =>{
            console.log('SIP Doorbell', 'Call failed. Originator: ' + event.originator);
            this.endCall();
        });

        this.sipPhoneSession.on("ended", (event: EndEvent) => {
            console.log('SIP Doorbell', 'Call ended. Originator: ' + event.originator);
            this.endCall();
        });

        this.sipPhoneSession.on("accepted", (event: IncomingEvent | OutgoingEvent) => {
            console.log('SIP Doorbell', 'Call accepted. Originator: ' + event.originator);
            this.ringSubject.next(false);
            this.status = {sipStatus: SipStatus.OnCall, statusMessage: "On Call"};
            this.statusSubject.next(this.status);

            var time = new Date();
            this.intervalId = window.setInterval(() => {
                var delta = Math.abs(new Date().getTime() - time.getTime()) / 1000;
                var minutes = Math.floor(delta / 60) % 60;
                delta -= minutes * 60;
                var seconds = delta % 60;
                this.progress = (minutes + ":" + Math.round(seconds)).split(':').map(e => `0${e}`.slice(-2)).join(':');
                this.progressSubject.next(this.progress);
            }, 1000);
        });

        let handleRemoteTrackEvent = async (event: RTCTrackEvent): Promise<void> => {
            console.log('SIP Doorbell', 'Call: peerconnection: mediatrack event: kind: ' + event.track.kind);

            let stream: MediaStream | null = null;
            if (event.streams) {
                console.log('SIP Doorbell', `Call: peerconnection: mediatrack event: number of associated streams: ${event.streams.length} - using first stream`);
                stream = event.streams[0];
            }
            else {
                console.log('SIP Doorbell', 'Call: peerconnection: mediatrack event: no associated stream. Creating stream...');
                if (!stream) {
                    stream = new MediaStream();
                }
                stream.addTrack(event.track);
            }
            
            if (event.track.kind === 'audio') {
              this.mediaSubject.next(stream);
            }
        }

        if (this.sipPhoneSession.direction === 'incoming') {

            this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                console.log('SIP Doorbell', 'Call: peerconnection(incoming)');
                event.peerconnection.addEventListener("track", handleRemoteTrackEvent);
            });

            if (this.auto_answer) {
              this.sipPhoneSession.answer(this.sipCallOptions);
              return;
            }

            this.status = {sipStatus: SipStatus.IncomingCall, statusMessage: "Incoming Call"};
            this.statusSubject.next(this.status);
            this.ringSubject.next(true);
        }
        else if (this.sipPhoneSession.direction === 'outgoing') {
            //Note: peerconnection seems to never fire for outgoing calls
            this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                console.log('SIP Doorbell', 'Call: peerconnection(outgoing)');
            });

            this.status = {sipStatus: SipStatus.OutgoingCall, statusMessage: "Outgoing Call"};
            this.statusSubject.next(this.status);
            this.sipPhoneSession.connection.addEventListener("track", handleRemoteTrackEvent);
        }
        else {
            console.log('SIP Doorbell', 'Call: direction was neither incoming or outgoing!');
        }
    });
  }

  async Terminate() {
    if (this.sipPhoneSession == null)
      return;

    this.sipPhoneSession?.terminate()
  }

  async Call() {
    this.status = {sipStatus: SipStatus.Calling, statusMessage: "Calling"};
    this.statusSubject.next(this.status);
    this.sipPhone?.call(`sip:${this.doorbell_ext}@${this.server}`, this.sipCallOptions);
    this.ringSubject.next(true);
  }

  async Answer() {
    if (this.sipPhoneSession == null)
      return;

    this.sipPhoneSession?.answer(this.sipCallOptions);
  }

  Mute(mute: boolean) {
    if (mute)
      this.sipPhoneSession?.mute({ video: false, audio: true });  
    else
      this.sipPhoneSession?.unmute({ video: false, audio: true });  
  }
}