import {
  css,
} from "lit";

export class SipDoorbellJsStyles {
  static get styles() {
        return css `
            .wrapper {
                padding: 8px;
                padding-top: 0px;
                padding-bottom: 2px;
            }
            .flex {
                flex: 1;
                margin-top: 6px;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 0;
            }
            .info, .info > * {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .info {
                flex: 1 1 30%;
                cursor: pointer;
                margin-left: 16px;
                margin-right: 8px;
            }
            ha-card {
                cursor: pointer;
            }
            .good {
                color: var(--label-badge-green);
            }
            .warning {
                color: var(--label-badge-yellow);
            }
            .critical {
                color: var(--label-badge-red);
            }
            .icon {
                padding: 0px 18px 0px 8px;
              }
            #phone .content {
                color: white;
            }
            video {
                display: block;
                min-height: 20em;
                height: 100%;
                width: 100%;
            }
            .box {
                /* start paper-font-common-nowrap style */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                /* end paper-font-common-nowrap style */
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(
                  --card-background-color
                );
                padding: 4px 8px;
                font-size: 16px;
                line-height: 40px;
                color: var(--ha-picture-card-text-color, white);
                display: flex;
                justify-content: space-between;
                flex-direction: column;
                /*margin-top: -70px;*/
                min-height: 62px;
            }
            .box .title {
                font-weight: 500;
                margin-left: 8px;
            }
            .row {
                display: flex;
                flex-direction: column;
            }
            .container {
                transition: filter 0.2s linear 0s;
                width: 80vw;
            }
            .box, ha-icon {
                display: flex;
                align-items: center;
            }
            .accept-btn {
                color: var(--label-badge-green);
            }
            .hangup-btn {
                color: var(--label-badge-red);
            }
            #time, .title {
                margin-right: 8px;
                display: flex;
                align-items: center;
            }
            ha-camera-stream {
                height: auto;
                width: 100%;
                display: block;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
            }

            .mdc-dialog__surface {
                position: relative;
                display: flex;
                flex-direction: column;
                flex-grow: 0;
                flex-shrink: 0;
                box-sizing: border-box;
                max-width: 100%;
                max-height: 100%;
                pointer-events: auto;
                overflow-y: auto;
            }

            .mdc-dialog__container {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                box-sizing: border-box;
                height: 100%;
                transform: scale(0.8);
                opacity: 0;
                pointer-events: none;
            }

            ha-dialog[data-domain="camera"] {
                --dialog-content-padding: 0;
            }

            ha-dialog[data-domain="camera"] .content, ha-dialog[data-domain="camera"] ha-header-bar {
                width: auto;
            }

            ha-dialog {
                --dialog-surface-position: static;
                --mdc-dialog-max-width: 90vw !important;
                --mdc-dialog-min-width: 400px;
                --mdc-dialog-heading-ink-color: var(--primary-text-color);
                --mdc-dialog-content-ink-color: var(--primary-text-color);
                --justify-action-buttons: space-between;
            }

            #audioVisualizer {
                min-height: 20em;
                height: 100%;
                white-space: nowrap;
                align-items: center;
                display: flex;
                justify-content: center;
            }

            #audioVisualizer div {
                display: inline-block;
                width: 3px;
                height: 100px;
                margin: 0 7px;
                background: currentColor;
                transform: scaleY( .5 );
                opacity: .25;
            }
            ha-header-bar {
                --mdc-theme-on-primary: var(--primary-text-color);
                --mdc-theme-primary: var(--mdc-theme-surface);
                flex-shrink: 0;
                display: block;
            }
            .content {
                outline: none;
                align-self: stretch;
                flex-grow: 1;
                display: flex;
                flex-flow: column;
                background-color: var(--secondary-background-color);
            }
            @media all and (max-width: 450px), all and (max-height: 500px) {
                ha-header-bar {
                    --mdc-theme-primary: var(--app-header-background-color);
                    --mdc-theme-on-primary: var(--app-header-text-color, white);
                    border-bottom: none;
                }
            }

            :host([large]) ha-dialog[data-domain="camera"] .content,
            :host([large]) ha-header-bar {
                width: 90vw;
            }
            @media (max-width: 450px), (max-height: 500px) {
                ha-dialog {
                    --mdc-dialog-min-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                    --mdc-dialog-max-width: calc( 100vw - env(safe-area-inset-right) - env(safe-area-inset-left) );
                    --mdc-dialog-min-height: 94%;
                    --mdc-dialog-max-height: 94%;
                    --vertial-align-dialog: flex-end;
                    --ha-dialog-border-radius: 0px;
                }
            }

            .header-text {
                -webkit-font-smoothing: antialiased;
                font-family: var(--mdc-typography-headline6-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));
                font-size: var(--mdc-typography-headline6-font-size, 1.25rem);
                line-height: var(--mdc-typography-headline6-line-height, 2rem);
                font-weight: var(--mdc-typography-headline6-font-weight, 500);
                letter-spacing: var(--mdc-typography-headline6-letter-spacing, 0.0125em);
                text-decoration: var(--mdc-typography-headline6-text-decoration, inherit);
                text-transform: var(--mdc-typography-headline6-text-transform, inherit);
                padding-left: 20px;
                padding-right: 0px;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
                z-index: 1;
            }
            
            .heading {
                position: absolute;
                left: 0;
                right: 0;
                padding: 5px;
                background-color: var(
                  --ha-picture-card-background-color,
                  rgba(0, 0, 0, 0.3)
                );
            }
        `;
    }

  static get clientStyles() {
      return css`
        :host {
          --tile-color: var(--state-inactive-color);
          -webkit-tap-highlight-color: transparent;
        }
        ha-card:has(.background:focus-visible) {
          --shadow-default: var(--ha-card-box-shadow, 0 0 0 0 transparent);
          --shadow-focus: 0 0 0 1px var(--tile-color);
          border-color: var(--tile-color);
          box-shadow: var(--shadow-default), var(--shadow-focus);
        }
        ha-card {
          --ha-ripple-color: var(--tile-color);
          --ha-ripple-hover-opacity: 0.04;
          --ha-ripple-pressed-opacity: 0.12;
          height: 100%;
          transition:
            box-shadow 180ms ease-in-out,
            border-color 180ms ease-in-out;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        ha-card.active {
          --tile-color: var(--state-icon-color);
        }
        [role="button"] {
          cursor: pointer;
        }
        [role="button"]:focus {
          outline: none;
        }
        .background {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          border-radius: var(--ha-card-border-radius, 12px);
          margin: calc(-1 * var(--ha-card-border-width, 1px));
          overflow: hidden;
        }
        .container {
          margin: calc(-1 * var(--ha-card-border-width, 1px));
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .content {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 10px;
          flex: 1;
          box-sizing: border-box;
          pointer-events: none;
        }
        .vertical {
          flex-direction: column;
          text-align: center;
          justify-content: center;
        }
        .vertical .icon-container {
          margin-bottom: 10px;
          margin-right: 0;
          margin-inline-start: initial;
          margin-inline-end: initial;
        }
        .vertical ha-tile-info {
          width: 100%;
          flex: none;
        }
        .icon-container {
          position: relative;
          flex: none;
          margin-right: 10px;
          margin-inline-start: initial;
          margin-inline-end: 10px;
          direction: var(--direction);
          transition: transform 180ms ease-in-out;
        }
        .icon-container ha-tile-icon,
        .icon-container ha-tile-image {
          --tile-icon-color: var(--tile-color);
          user-select: none;
          -ms-user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
        }
        .icon-container ha-tile-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          inset-inline-end: -3px;
          inset-inline-start: initial;
        }
        .icon-container[role="button"] {
          pointer-events: auto;
        }
        .icon-container[role="button"]:focus-visible,
        .icon-container[role="button"]:active {
          transform: scale(1.2);
        }
        ha-tile-info {
          position: relative;
          min-width: 0;
          transition: background-color 180ms ease-in-out;
          box-sizing: border-box;
        }
        hui-card-features {
          --feature-color: var(--tile-color);
        }

        ha-tile-icon[data-domain="alarm_control_panel"][data-state="pending"],
        ha-tile-icon[data-domain="alarm_control_panel"][data-state="arming"],
        ha-tile-icon[data-domain="alarm_control_panel"][data-state="triggered"],
        ha-tile-icon[data-domain="lock"][data-state="jammed"] {
          animation: pulse 1s infinite;
        }

        ha-tile-badge.not-found {
          --tile-badge-background-color: var(--red-color);
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `;
  }
}