// import 'core-js/stable';
// import 'regenerator-runtime/runtime';
import { initializeSmartVideoClient, settingsPublic, smartVideoInstance } from 'videoengager-js-sdk';
import { checkIfUrlIsCorrect, endOfCallsBehavoirs, getURLHref, invalidOrExpiredBehavoirs, modes } from './utils';

export default class VideoEngagerWidget extends window.HTMLElement {
  static get attributesDescription () {
    return {
      've-server-url': 'The URL of the VideoEngager server (Required)',
      've-tenant': 'The tenant ID (Required)',
      've-widget-mode': 'The detection mode of videoCall, default (short-url) available options:' + Object.keys(modes).join(', '),
      've-auto-start': 'Disable auto start, to start manually use method of element: element.startVideoEngagerCall()',
      've-on-invalid-behavior': 'The behavior when the URL is invalid, default (redirect) available options:' + Object.keys(invalidOrExpiredBehavoirs).join(', '),
      've-on-end-behavior': 'The behavior when the call is ended, default (redirect) available options:' + Object.keys(endOfCallsBehavoirs).join(', '),
      've-on-invalid-text-element': 'The text to show when the URL is invalid or expired (only when ve-on-invalid-behavior="show-text-element")',
      've-on-end-text-element': 'The text to show when the call is ended (only when ve-on-end-behavior="show-text-element")',
      've-on-invalid-redirect-url': 'The URL to redirect to when the URL is invalid or expired (only when ve-on-invalid-behavior="redirect")',
      've-on-end-redirect-url': 'The URL to redirect to when the call is ended (only when ve-on-end-behavior="redirect")',
      've-loading-text-element': 'The text to show when the data is being loaded from the server (default: Loading...)'
    };
  }

  constructor () {
    super();
    /**
     * iframe element
     * @type {HTMLIFrameElement}
     */
    this.iframe = null;
    /**
         * @type {((Awaited<ReturnType<typeof settingsPublic.getPublicSettingsByTennantId>>)['data'])||null}
         */
    this.tenantData = null;
    this.listener = null;
  }

  startIframeListener () {
    if (this.listener) {
      window.removeEventListener('message', this.listener);
    }
    this.listener = this.iframeListener.bind(this);
    window.addEventListener('message', this.listener);
  }

  iframeListener (event) {
    if (event.data === 'popupClosed' && this.iframe) {
      try {
        if (typeof this.onVideoCallFinished === 'function') {
          this.onVideoCallFinished();
        }
      } catch (error) {
        console.error(error);
      }
      this.handleEndOfCall();
    }
  }

  async getTennentData () {
    const tenantID = this.getAttribute('ve-tenant');
    if (!tenantID) {
      throw new Error('Invalid tenant: ' + tenantID);
    }
    try {
      const response = await settingsPublic.getPublicSettingsByTennantId({ tenantID });
      this.tenantData = response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Invalid tenant Response From API: ' + tenantID);
    }
  }

  connectedCallback () {
    const disableAutoStart = this.getAttribute('ve-auto-start');

    if (disableAutoStart !== 'true') {
      this.startVideoEngagerCall();
    }
  }

  get isReadyToUseVEAPI () {
    if (!smartVideoInstance.initialized) {
      return false;
    }
    if (!this.tenantData) {
      return false;
    }

    return true;
  }

  async startVideoEngagerCall () {
    if (this.iframe) {
      console.error('VideoEngager is already running');
      return false;
    }
    const serverUrl = checkIfUrlIsCorrect(this.getAttribute('ve-server-url'));

    if (!serverUrl) {
      console.error('Invalid server url');
      return false;
    }
    initializeSmartVideoClient({ basePath: serverUrl });

    this.innerHTML = `<div style="text-align: center; margin-top: 20px;">${this.getAttribute('ve-loading-text-element') || 'Loading...'}</div>`;

    if (!this.tenantData) {
      await this.getTennentData();
    }

    const mode = this.getAttribute('ve-widget-mode') || 'short-url';
    if (typeof modes[mode] === 'function') {
      modes[mode](this);
    } else {
      this.innerHTML = '<div style="text-align: center; margin-top: 20px;">Invalid detection mode. Please use one of the following: ' + Object.keys(modes).join(', ') + '</div>';
      console.error('Invalid detection mode. Please use one of the following: ', Object.keys(modes).join(', '));
    }
  }

  createIframe (src) {
    // Create the iframe element

    if (this.errorElement && this.contains(this.errorElement)) {
      this.removeChild(this.errorElement);
    }
    if (this.iframe && this.contains(this.iframe)) {
      this.removeChild(this.iframe);
    }
    this.innerHTML = '';
    const iframe = document.createElement('iframe');
    if (this.style.length > 0) {
      iframe.style = this.style;
    } else {
      iframe.style.background = 'white';
      iframe.style.width = '100%';
      iframe.style.height = '0px';
      iframe.style.overflow = 'hidden';
      iframe.style.transition = 'all 0.5s ease-in-out';
      iframe.style.transitionDuration = '0.5s';
      iframe.style.opacity = '0';
      iframe.style.border = 'none';
      iframe.style.height = '100%';
    }

    iframe.allow = 'microphone; camera; display-capture; geolocation;';
    iframe.src = src;
    const that = this;
    iframe.onload = () => {
      if (that.style.length === 0) {
        iframe.style.opacity = '1';
      }
      that.startIframeListener();
      if (typeof that.onVideoPageLoaded === 'function') {
        that.onVideoPageLoaded();
      }
    };
    iframe.onerror = () => {
      console.error('iframe.onerror');
      const text = that.getAttribute('ve-invalid-url-text') || 'This Video Call is invalid or expired';
      that.innerHTML = text;
    };

    this.iframe = iframe;
    this.appendChild(this.iframe);
  }

  handleInvalidShortCodeOrPin (invalidUrl) {
    const behaviourFromAttr = this.getAttribute('ve-on-invalid-behavior') || '';
    let currentBehavior = invalidOrExpiredBehavoirs.redirect;
    if (invalidOrExpiredBehavoirs[behaviourFromAttr]) {
      currentBehavior = invalidOrExpiredBehavoirs[behaviourFromAttr];
    }
    const overRideUrl = this.getAttribute('ve-on-invalid-redirect-url');
    let redirectUrl = false;
    if (overRideUrl) {
      redirectUrl = overRideUrl;
    }
    if (!redirectUrl) {
      redirectUrl = getURLHref(invalidUrl);
    }
    if (!redirectUrl) {
      redirectUrl = getURLHref(this.tenantData?.branding?.invalidUrl);
    }
    if (!redirectUrl) {
      console.error('Invalid Redirect URL is not valid or not provided');
      currentBehavior = invalidOrExpiredBehavoirs.hide;
    }
    const text = this.getAttribute('ve-on-invalid-text-element') || 'This Video Call is invalid or expired';
    switch (currentBehavior) {
      case invalidOrExpiredBehavoirs.redirect:
        window.location.href = redirectUrl;
        break;
      case invalidOrExpiredBehavoirs['show-text-element']:
        this.innerHTML = text;
        this.iframe = null;
        break;
      case invalidOrExpiredBehavoirs.hide:
        this.innerHTML = '';
        this.iframe = null;
        break;
      default:
        break;
    }
  }

  handleEndOfCall () {
    const behaviourFromAttr = this.getAttribute('ve-on-end-behavior') || '';
    let currentBehavior = endOfCallsBehavoirs.redirect;
    if (endOfCallsBehavoirs[behaviourFromAttr]) {
      currentBehavior = endOfCallsBehavoirs[behaviourFromAttr];
    }
    let redirectUrl = false;
    const overRideUrl = this.getAttribute('ve-on-end-redirect-url');
    if (overRideUrl) {
      redirectUrl = overRideUrl;
    }
    if (!redirectUrl) {
      redirectUrl = getURLHref(this.tenantData?.branding?.redirectUrl);
    }
    if (!redirectUrl) {
      console.error('Redirect URL is not valid or not provided');
      currentBehavior = endOfCallsBehavoirs.hide;
    }
    const text = this.getAttribute('ve-on-end-text-element') || 'This Video Call is ended';
    switch (currentBehavior) {
      case endOfCallsBehavoirs.redirect:
        break;
      case endOfCallsBehavoirs['show-text-element']:
        this.innerHTML = text;
        this.iframe = null;
        break;
      case endOfCallsBehavoirs.hide:
        this.innerHTML = '';
        this.iframe = null;
        break;
      case endOfCallsBehavoirs['do-nothing']:
        break;
      default:
        break;
    }
  }
}
function startVideoEngagerVisitorElement () {
  if (typeof window.customElements !== 'undefined') {
    window.customElements.define('videoengager-widget', VideoEngagerWidget);
  } else {
    console.error('Custom Elements are not supported in this browser');
  }
}

if (typeof window !== 'undefined') {
  window.VideoEngagerWidget = VideoEngagerWidget;
  startVideoEngagerVisitorElement();
}
