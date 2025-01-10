# sip-hass-card
**A SIP doorbell client inside home assistant!**
Forked and modified from https://github.com/TECH7Fox/sip-hass-card. Thanks Jordy!

With this card you can make and receive calls from doorbell

**Asterisk add-on**
This card works with the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on), which is very easy to set up, with just some clicks!

## Requirements
For this to work you will need the following:
 * A sip/pbx server. (I use the [Asterisk add-on](https://github.com/TECH7Fox/Asterisk-add-on))
 * Extension for every device. (The add-on auto-generates extensions for every person in HA)
 * HACS on your HA. (Home assistant)

Go to https://tech7fox.github.io/sip-hass-docs/docs/card/guides/freepbx to see how to setup FreePBX for this card.

## Installation
Download using **HACS**
 1. Go to HACS
 2. Click on `Frontend`
 3. Click on the 3 points in the upper right corner and click on `Custom repositories`
 4. Paste https://github.com/zabawiking/sip-hass-card into `Add custom repository URL` and by category choose Lovelace
 5. Click on add and check if the repository is there.
 6. You should now see SIP.js Client. Click `INSTALL`

## Usage
Click on add card and scroll down to and choose `Custom: SIP Card Doorbell`.
The entire card is configurable from the editor.

### Set Ringtones
set your ringtones to play when calling/being called.
`/local` is your `www` folder in config. Example: `/local/ringtone.mp3` = `/config/www/ringtone.mp3`.

### Auto Call
You can put `?call=<number>` behind the URL to auto call that number when the card loads. Useful for notifications.

### Card Configuration

Example:

```
type: custom:sipjs-card-doorbell
server: 192.168.10.1 //!!need to have valid SSL certificate!!
port: "8089"
prefix: ""
secret: secret
ringtones:
  ringtone: /local/normal_ringtone.mp3
button_size: "84"
auto_answer: false
person:
  person: person.tablet
  ext: "102"
doorbell_ext: "8001"
doorbell_camera: camera.dahua_bramka_main
buttons:
  - entity: switch.entrance_gate
    icon: mdi:door
  - entity: cover.gate
    icon: mdi:gate
iceConfig: # Remove if you don't want to use ICE
  iceCandidatePoolSize: 0
  iceTransportPolicy: all
  iceServers:
    - urls:
        - stun:stun.l.google.com:19302
        - stun:stun1.l.google.com:19302
  rtcpMuxPolicy: require
```

## Wiki
You can find more information on the [SIP-HASS Docs](https://tech7fox.github.io/sip-hass-docs/).

## Troubleshooting
Most problems is because your PBX server is not configured correct, or your certificate is not accepted.
To accept the certificate for Asterisk/FreePBX go to `https://<host>:8089/ws` and click continue.
To see how to configure FreePBX go to the [FreePBX guide](https://tech7fox.github.io/sip-hass-docs/docs/card/guides/freepbx).

Android companion app 2022.2 required for speaker + audio permissions.

## Development
For development on Windows, easiest way is to use the devcontainer and run `npm run build` in the terminal. Then copy the `sipjs-card-doorbell.js` file to your `www` folder.
