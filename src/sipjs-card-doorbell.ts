import { UA, WebSocketInterface } from "jssip/lib/JsSIP";
import { RTCSessionEvent } from "jssip/lib/UA";
import { EndEvent, PeerConnectionEvent, IncomingEvent, OutgoingEvent, IceCandidateEvent, RTCSession } from "jssip/lib/RTCSession";

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

@customElement('sipjs-card-doorbell')
class SipJsCardDoorBell extends LitElement {
    sipPhone: UA | undefined;
    sipPhoneSession: RTCSession | null;
    sipCallOptions: any;
    config: SipDoorbellJsConfig = new SipDoorbellJsConfig();
    hass: any;
    timerElement: string = "00:00";
    renderRoot: any;
    intervalId!: number;
    error: any = null;
    audioVisualizer: any;
    callStatus: string = "Unknown";
    connected: boolean = false;

    constructor() {
        super();
        this.sipPhoneSession = null;
    }

    static get properties() {
        return {
            hass: {},
            config: {},
            popup: {
                type: Boolean
            },
            timerElement: {},
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
            <audio id="toneAudio" style="display:none" loop controls></audio>
            <audio id="remoteAudio" style="display:none"></audio>
                <style>
                    ha-icon-button {
                        --mdc-icon-button-size: ${this.config.button_size ? unsafeCSS(this.config.button_size) : css`48`}px;
                        --mdc-icon-size: ${this.config.button_size ? unsafeCSS(this.config.button_size - 25) : css`23`}px;
                    }
                </style>
                <div slot="heading" class="heading">
                    <ha-header-bar>
                        <span slot="title" id="name" class="header-text">${this.callStatus}</span>
                        <span slot="actionItems" id="time" class="header-text">${this.timerElement}</span>
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
                            ${this.connected ?
                              html `<ha-icon-button
                                  class="accept-btn"
                                  .label=${"Accept Call"}
                                  @click="${this._answer}"
                                  ><ha-icon icon="hass:phone"></ha-icon>
                              </ha-icon-button>`: html `<ha-icon-button></ha-icon-button>`
                            }
                        </div>
                        <div class="row">
                            ${this.sipPhoneSession != null ?
                                html `<ha-icon-button
                                    .label=${"Mute audio"}
                                    @click="${this._toggleMuteAudio}"
                                    ><ha-icon id="muteaudio-icon" icon="hass:microphone"></ha-icon>
                                </ha-icon-button>`: html `<ha-icon-button></ha-icon-button>`
                            }
                        </div>
                        <div class="row">
                            ${this.config.dtmfs ?
                                this.config.dtmfs.map((dtmf: { signal: any; name: any; icon: any; }) => {
                                    return html `
                                        <ha-icon-button
                                            @click="${() => this._sendDTMF(dtmf.signal)}"
                                            .label="${dtmf.name}"
                                            ><ha-icon icon="${dtmf.icon}"></ha-icon>
                                        </ha-icon-button>
                                    `;
                                }) : ""
                            }
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
                            ${this.sipPhoneSession != null ?
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
      console.log('UUUUUUUUUUUUUUUUUUUUU', this.sipPhone);
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

    private ring(tone: string) {
      try {
        var toneAudio = this.renderRoot.querySelector('#toneAudio');
        if (tone) {
            toneAudio.src = tone;
            toneAudio.currentTime = 0;
            toneAudio.play();
        } else {
            toneAudio.pause();
        }
      }
      catch {        
      }
    }

    async _call(extension: string | null) {
        this.ring(this.config.ringtones.ringbacktone);
        this.callStatus = "Calling...";
        if (this.sipPhone) {
            this.sipPhone.call("sip:" + extension + "@" + this.config.server, this.sipCallOptions);
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

    async _hangup() {
        this.sipPhoneSession?.terminate();
    }

    async _toggleMuteAudio() {
        if (this.sipPhoneSession?.isMuted().audio) {
            this.sipPhoneSession?.unmute({ video: false, audio: true });
            this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone";
        }
        else {
            this.sipPhoneSession?.mute({ video: false, audio: true });
            this.renderRoot.querySelector('#muteaudio-icon').icon = "hass:microphone-off";
        }
    }

    async _sendDTMF(signal: any) {
        this.sipPhoneSession?.sendDTMF(signal);
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

    endCall() {
        if (this.config.doorbell_camera == undefined && this.audioVisualizer !== undefined) {
            this.audioVisualizer.stop();
            this.renderRoot.querySelector('#audioVisualizer').innerHTML = '';
            this.audioVisualizer = undefined;
        }
        this.ring(this.config.ringtones.pause);
        this.callStatus = "Idle";
        clearInterval(this.intervalId);
        this.timerElement = "00:00";
        this.sipPhoneSession = null;
    }

    async connect() {
        this.timerElement = "00:00";
        this.requestUpdate();

        let addr = `wss://${this.config.server}:${this.config.port}${this.config.prefix}/ws`;
        console.log(`Connecting to ${addr}`);
        var socket = new WebSocketInterface(addr);

        var configuration = {
            sockets : [ socket ],
            uri     : "sip:" + this.config.person.ext + "@" + this.config.server,
            authorization_user: this.config.person.ext,
            password: this.config.secret,
            register: true
        };

        // if (this.hass.services['sip-doorbell'] == undefined) {
        //   this.hass.services['sip-doorbell'] = new UA(configuration);
        // }

        this.sipPhone = new UA(configuration);

        this.sipCallOptions = {
            mediaConstraints: { audio: true, video: false },
            rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
            pcConfig: this.config.iceConfig // we just use the config that directly comes from the YAML config in the YAML card config.
            /* EXAMPLE config
            {
                iceCandidatePoolSize: 0,   //  prefetched ICE candidate pool. The default value is 0 (meaning no candidate prefetching will occur).
                iceTransportPolicy: 'all', // 'relay' is also allowed, i.e. only candidates from TURN-servers
                iceServers: [
                    {
                        // Google STUN servers
                        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
                        //credentialType: 'password',
                        //username: 'myusername',
                        //credential: 'mypassword'
                    }
                ],
                rtcpMuxPolicy: 'require' // RTP and RTCP will be muxed
            }
            */
        };

        console.log('ICE config: ' + JSON.stringify(this.sipCallOptions.pcConfig, null, 2));

        this.sipPhone?.start();

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
                this.ring(this.config.ringtones.pause);
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

            var iceCandidateTimeout: NodeJS.Timeout | null = null;
            var iceTimeout = 5;
            if (this.config.iceTimeout !== null && this.config.iceTimeout !== undefined)
            {
                iceTimeout = this.config.iceTimeout;
            }

            console.log('ICE gathering timeout: ' + iceTimeout + " seconds");

            this.sipPhoneSession.on("icecandidate", (event: IceCandidateEvent) => {
                console.log('ICE: candidate: ' + event.candidate.candidate);

                if (iceCandidateTimeout != null) {
                    clearTimeout(iceCandidateTimeout);
                }

                iceCandidateTimeout = setTimeout(() => {
                    console.log('ICE: stop candidate gathering due to application timeout.');
                    event.ready();
                }, iceTimeout * 1000);
            });

            let handleIceGatheringStateChangeEvent = (event: any): void => {
                let connection = event.target;

                console.log('ICE: gathering state changed: ' + connection.iceGatheringState);

                if (connection.iceGatheringState === 'complete') {
                    console.log('ICE: candidate gathering complete. Cancelling ICE application timeout timer...');
                    if (iceCandidateTimeout != null) {
                        clearTimeout(iceCandidateTimeout);
                    }
                }
            };

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
                    event.peerconnection.addEventListener("icegatheringstatechange", handleIceGatheringStateChangeEvent);
                });

                if (this.config.auto_answer) {
                    this.sipPhoneSession.answer(this.sipCallOptions);
                    return;
                }

                this.ring(this.config.ringtones.ringtone);

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
                this.sipPhoneSession.connection.addEventListener("icegatheringstatechange", handleIceGatheringStateChangeEvent);
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
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: "sipjs-card-doorbell",
    name: "SIP Card Doorbell",
    preview: false,
    description: "A SIP doorbell card, made by Jordy Kuhne, modified by JZ."
});
