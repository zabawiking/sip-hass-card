import {
  LitElement,
  html
} from "lit";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";

import { customElement } from "lit/decorators.js";
import { SipDoorbellJsStyles } from "./styles";
import { SipDoorbellJsConfig } from "./config";
import { Phone, PhoneStatus, SipStatus } from "./phone";

@customElement('sipjs-doorbell-client-card')
class SipJsDoorbellClientCard extends LitElement {
    sipPhone: Phone | null;
    config: SipDoorbellJsConfig = new SipDoorbellJsConfig();
    hass: any;
    renderRoot: any;
    
    phoneStatus: PhoneStatus = { sipStatus: SipStatus.Disconnected, statusMessage: "Disconnected" };
    phoneIcon: string = "";
    progress: string = "";

    constructor() {
      super();
      this.sipPhone = null;
    }

    static get properties() {
      return {
          hass: {},
          config: {}
      };
    }

    static get styles() {
      return SipDoorbellJsStyles.clientStyles;
    }

    render() {
        if (!this.checkPerson()) {
          return html `
            <div slot="heading" class="heading">
              This card will be visible only for '${this.hass.states[this.config.person?.person].attributes.friendly_name}'
            </div>`;
        }

        const style = {
          "--tile-color": "var(--state-binary_sensor-on-color, var(--state-binary_sensor-active-color, var(--state-active-color)));"
        };
        
        const active = this.phoneStatus.sipStatus != SipStatus.Disconnected;
        return html`
            <ha-card style=${styleMap(style)} class=${classMap({ active })}>
              <div class="background" aria-labelledby="info">
                <ha-ripple .disabled=true></ha-ripple>
              </div>
              <div class="container">
                <div class="content">
                  <audio id="toneAudio" style="display:none" loop controls></audio>
                  <div class="icon-container">
                    <ha-tile-icon>
                      <ha-state-icon
                        .icon=${this.phoneIcon}
                        .hass=${this.hass}
                      ></ha-state-icon>
                    </ha-tile-icon>                       
                  </div>
                  <ha-tile-info
                    id="info"
                    .primary="${this.phoneStatus.statusMessage} (ext: ${this.config.person.ext})"
                    .secondary=${this.progress}
                  ></ha-tile-info>
                </div>
              </div>
            </ha-card>
            `;
    }

    private checkPerson() : boolean {
      let userIdToBeConnected = this.hass.states[this.config.person?.person].attributes.user_id;    
      return (this.hass.user.id == userIdToBeConnected);
    }

    firstUpdated() {
      console.log('UUUUUUUUUUUUUUUUUUUUU', this.hass.user) 
      console.log('HHHHHHHHHHHHHHHHHHHHH', this.hass.states);
      console.log('GGGGGGGGGGGGGGGGGGGGG', this.hass);

      if (this.checkPerson()) {
        this.connect();
      }
    }

    setConfig(config: SipDoorbellJsConfig): void {
        if (!config.server) {
            throw new Error("You need to define a server!");
        }
        if (!config.port) {
            throw new Error("You need to define a port!");
        }
        if (config.prefix == undefined) {
          throw new Error("You need to define a prefix!");
        }
        if (!config.person?.person) {
            throw new Error("You need to define person who will be connected as recipient");
        }
        if (!config.person?.ext) {
          throw new Error("You need to define extension of person who will be connected as recipient");
        }
        this.config = config;
    }

    getCardSize() {
        return 1;
    }

    async connect() {
        this.requestUpdate();

        console.log("PHONE", this.hass.services['sip-doorbell']);

        if (this.hass.services['sip-doorbell'] == undefined) {
          let phone = new Phone(this.config.server, this.config.port, this.config.prefix, this.config.person.ext, this.config.secret, this.config.doorbell_ext, this.config.auto_answer);
          this.hass.services['sip-doorbell'] = phone;
        } else {
          console.log(`Already connected from other card`);
        }

        this.sipPhone = this.hass.services['sip-doorbell'];

        this.sipPhone?.onStatus.subscribe(s => {
          this.phoneStatus = s;
          switch (s.sipStatus) {
            case SipStatus.Disconnected: this.phoneIcon = "mdi:phone-off"; break;
            case SipStatus.Idle: this.phoneIcon = "mdi:phone-check"; break;
            case SipStatus.Registered: this.phoneIcon = "mdi:phone-check"; break;
            case SipStatus.IncomingCall: this.phoneIcon = "mdi:phone-incoming"; break;
            case SipStatus.OutgoingCall: this.phoneIcon = "mdi:phone-outgoing"; break;
            case SipStatus.Calling: this.phoneIcon = "mdi:phone-ring"; break;
            case SipStatus.OnCall: this.phoneIcon = "mdi:phone-in-talk"; break;
          }
          super.requestUpdate();
        });

        this.sipPhone?.onRing.subscribe(ring => {
          console.log('RING', ring);
          // try {
          //   var toneAudio = this.renderRoot.querySelector('#toneAudio');
          //   if (ring) {
          //       toneAudio.src = this.config.ringtones.ringtone;
          //       toneAudio.currentTime = 0;
          //       toneAudio.play();
          //   } else {
          //       toneAudio.pause();
          //   }
          // }
          // catch {  
          //   toneAudio?.pause();      
          // }
        })

        this.sipPhone?.onProgress.subscribe(progress => {
          this.progress = progress;
          super.requestUpdate();
        });

        this.sipPhone?.connect();

    //     if (this.sipPhone?.isRegistered() ?? false) {
    //       this.connected = true;
    //       this.callStatus = "Idle";
    //     }
        
    //     this.sipPhone?.on("registered", () => {
    //         console.log('SIP-Card Registered with SIP Server');
    //         this.connected = true;
    //         this.callStatus = "Idle";
    //         super.requestUpdate();
    //     });
    //     this.sipPhone?.on("unregistered", () => {
    //         console.log('SIP-Card Unregistered with SIP Server');
    //         this.connected = false;
    //         this.callStatus = "Disconnected";
    //         super.requestUpdate();
    //     });
    //     this.sipPhone?.on("registrationFailed", () => {
    //         console.log('SIP-Card Failed Registeration with SIP Server');
    //         this.connected = false;
    //         this.callStatus = "Disconnected";
    //         super.requestUpdate();
    //     });
    //     this.sipPhone?.on("newRTCSession", (event: RTCSessionEvent) => {
    //         if (this.sipPhoneSession !== null ) {
    //             event.session.terminate();
    //             return;
    //         }

    //         console.log('Call: newRTCSession: Originator: ' + event.originator);

    //         this.sipPhoneSession = event.session;

    //         this.sipPhoneSession.on('getusermediafailed', function(DOMError) {
    //             console.log('getUserMedia() failed: ' + DOMError);
    //         });

    //         this.sipPhoneSession.on('peerconnection:createofferfailed', function(DOMError) {
    //             console.log('createOffer() failed: ' + DOMError);
    //         });

    //         this.sipPhoneSession.on('peerconnection:createanswerfailed', function (DOMError) {
    //             console.log('createAnswer() failed: ' + DOMError);
    //         });

    //         this.sipPhoneSession.on('peerconnection:setlocaldescriptionfailed', function (DOMError) {
    //             console.log('setLocalDescription() failed: ' + DOMError);
    //         });

    //         this.sipPhoneSession.on('peerconnection:setremotedescriptionfailed', function (DOMError) {
    //             console.log('setRemoteDescription() failed: ' + DOMError);
    //         });

    //         this.sipPhoneSession.on("confirmed", (event: IncomingEvent | OutgoingEvent) => {
    //             console.log('Call confirmed. Originator: ' + event.originator);
    //             this.callStatus = "Call confirmed";
    //         });

    //         this.sipPhoneSession.on("failed", (event: EndEvent) =>{
    //             console.log('Call failed. Originator: ' + event.originator);
    //             this.callStatus = "Call failed";
    //         });

    //         this.sipPhoneSession.on("ended", (event: EndEvent) => {
    //             console.log('Call ended. Originator: ' + event.originator);
    //             this.callStatus = "Call ended";
    //         });

    //         this.sipPhoneSession.on("accepted", (event: IncomingEvent | OutgoingEvent) => {
    //             console.log('Call accepted. Originator: ' + event.originator);
    //             this.ring(this.config.ringtones.pause);
    //             if (this.sipPhoneSession?.remote_identity && this.sipPhoneSession?.remote_identity?.display_name) {
    //               this.callStatus = this.sipPhoneSession?.remote_identity.display_name;
    //             } else {
    //               this.callStatus = "On Call";
    //             }
    //         });

    //         // let handleRemoteTrackEvent = async (event: RTCTrackEvent): Promise<void> => {
    //         //     console.log('Call: peerconnection: mediatrack event: kind: ' + event.track.kind);

    //         //     let stream: MediaStream | null = null;
    //         //     if (event.streams) {
    //         //         console.log('Call: peerconnection: mediatrack event: number of associated streams: ' + event.streams.length + ' - using first stream');
    //         //         stream = event.streams[0];
    //         //     }
    //         //     else {
    //         //         console.log('Call: peerconnection: mediatrack event: no associated stream. Creating stream...');
    //         //         if (!stream) {
    //         //             stream = new MediaStream();
    //         //         }
    //         //         stream.addTrack(event.track);
    //         //     }

    //         //     let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
    //         //     if (event.track.kind === 'audio' && remoteAudio.srcObject != stream) {
    //         //         remoteAudio.srcObject = stream;
    //         //         try {
    //         //             await remoteAudio.play();
    //         //         }
    //         //         catch (err) {
    //         //             console.log('Error starting audio playback: ' + err);
    //         //         }
    //         //     }
    //         // }

    //         // Typescript types for enums seem to be broken for JsSIP.
    //         // See: https://github.com/versatica/JsSIP/issues/750
    //         if (this.sipPhoneSession.direction === 'incoming') {
    //             var extension = this.sipPhoneSession.remote_identity.uri.user;

    //             // this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
    //             //     console.log('Call: peerconnection(incoming)');
    //             //     event.peerconnection.addEventListener("track", handleRemoteTrackEvent);
    //             // });

    //             // if (this.config.auto_answer) {
    //             //     let sipCallOptions = {
    //             //       mediaConstraints: { audio: true, video: false },
    //             //       rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    //             //     }; 
    //             //     this.sipPhoneSession.answer(sipCallOptions);
    //             //     return;
    //             // }

    //             this.ring(this.config.ringtones.ringtone);

    //             if (this.sipPhoneSession.remote_identity) {
    //               this.callStatus = "Incoming Call From " + this.sipPhoneSession.remote_identity.display_name;
    //             } else {
    //               this.callStatus = "Incoming Call";
    //             }
    //         }
    //         else if (this.sipPhoneSession.direction === 'outgoing') {
    //             //Note: peerconnection seems to never fire for outgoing calls
    //             this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
    //                 console.log('Call: peerconnection(outgoing)');
    //             });

    //             if (this.sipPhoneSession.remote_identity) {
    //               this.callStatus = "Outgoing Call From " + this.sipPhoneSession.remote_identity.display_name;
    //             } else {
    //               this.callStatus = "Outgoing Call";
    //             }

    //             //this.sipPhoneSession.connection.addEventListener("track", handleRemoteTrackEvent);
    //         }
    //         else {
    //             console.log('Call: direction was neither incoming or outgoing!');
    //         }
    //     });
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "sipjs-doorbell-client-card",
    name: "SIP Doorbell Client Card",
    preview: false,
    description: "A SIP doorbell client card"
});

