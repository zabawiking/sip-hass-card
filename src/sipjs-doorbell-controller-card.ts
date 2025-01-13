import {
  LitElement,
  css,
  html,
  unsafeCSS
} from "lit";
import { customElement } from "lit/decorators.js";
import "./audioVisualizer";
import { AudioVisualizer } from "./audioVisualizer";
import { SipDoorbellJsStyles } from "./styles";
import { SipDoorbellJsConfig } from "./config";
import { Phone, PhoneStatus, SipStatus } from "./phone";

@customElement('sipjs-doorbell-controller-card')
class SipJsDoorbellControllerCard extends LitElement {
    sipPhone: Phone | null;
    config: SipDoorbellJsConfig = new SipDoorbellJsConfig();
    hass: any;
    renderRoot: any;
    audioVisualizer: any;

    phoneStatus: PhoneStatus = { sipStatus: SipStatus.Disconnected, statusMessage: "Disconnected" };
    progress = "00:00";

    constructor() {
      super();
      this.sipPhone = null;
    }

    static get properties() {
        return {
            hass: {},
            config: {},
            currentCamera: {}
        };
    }

    static get styles() {
        return SipDoorbellJsStyles.styles;
    }

    // allow-exoplayer
    render() {
        if (!this.checkPerson()) {
          return html `
            <div slot="heading" class="heading">
              This card will be visible only for '${this.hass.states[this.config.person?.person].attributes.friendly_name}'
            </div>`;
        }

        return html`
            <audio id="remoteAudio" style="display:none"></audio>
                <style>
                    ha-icon-button {
                        --mdc-icon-button-size: ${this.config.button_size ? unsafeCSS(this.config.button_size) : css`48`}px;
                        --mdc-icon-size: ${this.config.button_size ? unsafeCSS(this.config.button_size - 25) : css`23`}px;
                    }

                </style>
                <div slot="heading" class="heading">
                    <ha-header-bar>
                        <span slot="title" id="name" class="header-text">${this.phoneStatus.statusMessage}</span>
                        <span slot="actionItems" id="time" class="header-text">${this.progress}</span>
                    </ha-header-bar>
                </div>
                <div class="content" style="flex-flow: row;"> 
                    ${this.config.doorbell_camera !== undefined ? html`
                        <ha-camera-stream
                            allow-exoplayer
                            muted
                            .hass=${this.hass}
                            .stateObj=${this.hass.states[this.config.doorbell_camera]}
                        ></ha-camera-stream>
                    ` : html`<audio id="remoteAudio" style="display:none"></audio>`}
                    <div class="box">
                        <div class="row">
                            ${this.phoneStatus.sipStatus != SipStatus.Disconnected ?
                              html `<ha-icon-button
                                  class="accept-btn"
                                  .label=${"Accept Call"}
                                  @click="${this._answer}"
                                  ><ha-icon icon="hass:phone"></ha-icon>
                              </ha-icon-button>`: html `<ha-icon-button></ha-icon-button>`
                            }
                        </div>
                        <div class="row">
                            ${this.phoneStatus.sipStatus == SipStatus.OnCall ?
                                html `<ha-icon-button
                                    .label=${"Mute audio"}
                                    @click="${this._toggleMuteAudio}"
                                    ><ha-icon id="muteaudio-icon" icon="hass:microphone"></ha-icon>
                                </ha-icon-button>`: html `<ha-icon-button></ha-icon-button>`
                            }
                        </div>
                        <div class="row">
                            ${this.config.buttons ?
                                this.config.buttons.map((button: { entity: any; name: any; icon: any; }) => {
                                    return html `
                                        <ha-icon-button
                                            @click="${() => this._button(button.entity)}"
                                            .label="${button.name}"
                                            ><ha-icon icon="${button.icon}"></ha-icon>
                                        </ha-icon-button>
                                    `;
                                }) : ""
                            }
                        </div>
                        <div class="row">
                            ${this.phoneStatus.sipStatus == SipStatus.OnCall || this.phoneStatus.sipStatus == SipStatus.IncomingCall ?
                              html `<ha-icon-button
                                  class="hangup-btn"
                                  .label=${"Decline Call"}
                                  @click="${this._hangup}"
                              ><ha-icon icon="hass:phone-hangup"></ha-icon>
                              </ha-icon-button>` : html `<ha-icon-button></<ha-icon-button>`
                            }
                        </div>
                    </div>
                </div>
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
        super.requestUpdate();
      });

      this.sipPhone?.onMedia.subscribe(async stream => {
        let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
        if (stream == null) {
          await remoteAudio.pause();
          remoteAudio.srcObject = null;
        }
        else if (remoteAudio.srcObject != stream) {
          remoteAudio.srcObject = stream;
          try {
            await remoteAudio.play();
          }
          catch (err) {
            console.log('Error starting audio playback: ' + err);
          }
        }
      })

      this.sipPhone?.onProgress.subscribe(progress => {
        this.progress = progress;
        super.requestUpdate();
      });

      this.sipPhone?.connect();
    }

    async _answer() {
      if (this.sipPhone?.status.sipStatus == SipStatus.Idle) {
        await this.sipPhone?.Call();
      } else {
        await this.sipPhone?.Answer();
      }
    }

    async _hangup() {
      await this.sipPhone?.Terminate();
    }

    async _toggleMuteAudio() {
      if (this.sipPhone?.isMuted) {
          this.sipPhone?.Mute(false);
          this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone";
      }
      else {
          this.sipPhone?.Mute(true);
          this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone-off";
      }
    }

    async _button(entity: string) {
      const domain = entity.split(".")[0];
      let service;
      console.log(domain);

      switch(domain) {
          case "script":
              service = "turn_on";
              break;
          case "button":
              service = "press";
              break;
          case "scene":
              service = "turn_on";
              break;
          case "light":
              service = "toggle";
              break;
          case "switch":
              service = "toggle";
              break;
          case "cover":
                service = "toggle";
                break;                
          case "input_boolean":
              service = "toggle";
              break;
          default:
              console.log("No supported service");
              return;
      }
      console.log(service);

      await this.hass.callService(domain, service, {
          entity_id: entity
      });
    }


    /*async _call(extension: string | null) {
        //this.ring(this.config.ringtones.ringbacktone);
        this.callStatus = "Calling...";
        let sipCallOptions = {
          mediaConstraints: { audio: true, video: false },
          rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
        }; 
        if (this.sipPhone) {
            this.sipPhone.call("sip:" + extension + "@" + this.config.server, sipCallOptions);
        }
    }

    async _answer() {
      if (this.sipPhoneSession != null) {
        console.log(this.sipPhoneSession); 
        try {
          this.sipPhoneSession?.answer();
        }
        catch {}
      }
      else {
        try {
          this._call(this.config.doorbell_ext);
        }
        catch {}
      }
    }

    

   

    async _sendDTMF(signal: any) {
        this.sipPhoneSession?.sendDTMF(signal);
    }

    

    endCall() {
        if (this.config.doorbell_camera == undefined && this.audioVisualizer !== undefined) {
            this.audioVisualizer.stop();
            this.renderRoot.querySelector('#audioVisualizer').innerHTML = '';
            this.audioVisualizer = undefined;
        }
        this.callStatus = "Idle";
        clearInterval(this.intervalId);
        this.timerElement = "00:00";
        this.sipPhoneSession = null;
    }

    async connect() {
        this.timerElement = "00:00";
        this.requestUpdate();

        

        if (this.hass.services['sip-doorbell'] == undefined) {
          // let addr = `wss://${this.config.server}:${this.config.port}${this.config.prefix}/ws`;
          // console.log(`Connecting to ${addr}`);
          // var socket = new WebSocketInterface(addr);

          // var configuration = {
          //     sockets : [ socket ],
          //     uri     : "sip:" + this.config.person.ext + "@" + this.config.server,
          //     authorization_user: this.config.person.ext,
          //     password: this.config.secret,
          //     register: true
          // };

          // this.hass.services['sip-doorbell'] = new UA(configuration);
          // this.hass.services['sip-doorbell'].start();
          console.log(`You need to add add 'sipjs-doorbell-client-card' card to register phone`);
        } else {
          console.log(`Connected from 'sipjs-doorbell-client-card'`);
        }

        this.sipPhone = this.hass.services['sip-doorbell'];
        
        if (this.sipPhone?.isRegistered() ?? false) {
          this.connected = true;
          this.callStatus = "Idle";
        }

        this.sipPhone?.on("registered", () => {
            console.log('SIP-Card Registered with SIP Server');
            this.connected = true;
            this.callStatus = "Idle";
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'gray';
        });
        this.sipPhone?.on("unregistered", () => {
            console.log('SIP-Card Unregistered with SIP Server');
            this.connected = false;
            this.callStatus = "Disconnected";
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'var(--mdc-theme-primary, #03a9f4)';
        });
        this.sipPhone?.on("registrationFailed", () => {
            console.log('SIP-Card Failed Registeration with SIP Server');
            this.connected = false;
            this.callStatus = "Disconnected";
            super.requestUpdate();
            // this.renderRoot.querySelector('.extension').style.color = 'var(--mdc-theme-error, #db4437)';
        });
        this.sipPhone?.on("newRTCSession", (event: RTCSessionEvent) => {
            if (this.sipPhoneSession !== null ) {
                event.session.terminate();
                return;
            }

            console.log('Call: newRTCSession: Originator: ' + event.originator);

            this.sipPhoneSession = event.session;

            this.sipPhoneSession.on('getusermediafailed', function(DOMError) {
                console.log('getUserMedia() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:createofferfailed', function(DOMError) {
                console.log('createOffer() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:createanswerfailed', function (DOMError) {
                console.log('createAnswer() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:setlocaldescriptionfailed', function (DOMError) {
                console.log('setLocalDescription() failed: ' + DOMError);
            });

            this.sipPhoneSession.on('peerconnection:setremotedescriptionfailed', function (DOMError) {
                console.log('setRemoteDescription() failed: ' + DOMError);
            });

            this.sipPhoneSession.on("confirmed", (event: IncomingEvent | OutgoingEvent) => {
                console.log('Call confirmed. Originator: ' + event.originator);
            });

            this.sipPhoneSession.on("failed", (event: EndEvent) =>{
                console.log('Call failed. Originator: ' + event.originator);
                this.endCall();
            });

            this.sipPhoneSession.on("ended", (event: EndEvent) => {
                console.log('Call ended. Originator: ' + event.originator);
                this.endCall();
            });

            this.sipPhoneSession.on("accepted", (event: IncomingEvent | OutgoingEvent) => {
                console.log('Call accepted. Originator: ' + event.originator);
                if (this.config.doorbell_camera == undefined) {
                    let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
                    this.audioVisualizer = new AudioVisualizer(this.renderRoot, remoteAudio.srcObject, 16);
                }
                if (this.sipPhoneSession?.remote_identity && this.sipPhoneSession?.remote_identity?.display_name) {
                  this.callStatus = this.sipPhoneSession?.remote_identity.display_name;
                } else {
                  this.callStatus = "On Call";
                }
                var time = new Date();
                this.intervalId = window.setInterval(function(this: any): void {
                    var delta = Math.abs(new Date().getTime() - time.getTime()) / 1000;
                    var minutes = Math.floor(delta / 60) % 60;
                    delta -= minutes * 60;
                    var seconds = delta % 60;
                    this.timerElement = (minutes + ":" + Math.round(seconds)).split(':').map(e => `0${e}`.slice(-2)).join(':');
                }.bind(this), 1000);
            });

            let handleRemoteTrackEvent = async (event: RTCTrackEvent): Promise<void> => {
                console.log('Call: peerconnection: mediatrack event: kind: ' + event.track.kind);

                let stream: MediaStream | null = null;
                if (event.streams) {
                    console.log('Call: peerconnection: mediatrack event: number of associated streams: ' + event.streams.length + ' - using first stream');
                    stream = event.streams[0];
                }
                else {
                    console.log('Call: peerconnection: mediatrack event: no associated stream. Creating stream...');
                    if (!stream) {
                        stream = new MediaStream();
                    }
                    stream.addTrack(event.track);
                }

                let remoteAudio = this.renderRoot.querySelector("#remoteAudio");
                if (event.track.kind === 'audio' && remoteAudio.srcObject != stream) {
                    remoteAudio.srcObject = stream;
                    try {
                        await remoteAudio.play();
                    }
                    catch (err) {
                        console.log('Error starting audio playback: ' + err);
                    }
                }

                let remoteVideo = this.renderRoot.querySelector('#remoteVideo');
                if (event.track.kind === 'video' && remoteVideo.srcObject != stream) {
                    remoteVideo.srcObject = stream;
                    try {
                        await remoteVideo.play()
                    }
                    catch (err) {
                        console.log('Error starting video playback: ' + err);
                    }
                }
            }

            // Typescript types for enums seem to be broken for JsSIP.
            // See: https://github.com/versatica/JsSIP/issues/750
            if (this.sipPhoneSession.direction === 'incoming') {
                var extension = this.sipPhoneSession.remote_identity.uri.user;

                this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                    console.log('Call: peerconnection(incoming)');

                    event.peerconnection.addEventListener("track", handleRemoteTrackEvent);
                });

                if (this.config.auto_answer) {
                  let sipCallOptions = {
                    mediaConstraints: { audio: true, video: false },
                    rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
                  }; 
                  this.sipPhoneSession.answer(sipCallOptions);
                  return;
                }

                if (this.sipPhoneSession.remote_identity) {
                  this.callStatus = "Incoming Call From " + this.sipPhoneSession.remote_identity.display_name;
                } else {
                  this.callStatus = "Incoming Call";
                }
            }
            else if (this.sipPhoneSession.direction === 'outgoing') {
                //Note: peerconnection seems to never fire for outgoing calls
                this.sipPhoneSession.on("peerconnection", (event: PeerConnectionEvent) => {
                    console.log('Call: peerconnection(outgoing)');
                });

                if (this.sipPhoneSession.remote_identity) {
                  this.callStatus = "Outgoing Call From " + this.sipPhoneSession.remote_identity.display_name;
                } else {
                  this.callStatus = "Outgoing Call";
                }

                this.sipPhoneSession.connection.addEventListener("track", handleRemoteTrackEvent);
            }
            else {
                console.log('Call: direction was neither incoming or outgoing!');
            }
        });

        var urlParams = new URLSearchParams(window.location.search);
        const extension = urlParams.get('call');
        if (extension) {
            this._call(extension);
        }
    }*/
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "sipjs-doorbell-controller-card",
    name: "SIP Doorbell Controller Card",
    preview: false,
    description: "A SIP doorbell controller card"
});
