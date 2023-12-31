// import 'core-js/stable';
// import 'regenerator-runtime/runtime';
import { initializeSmartVideoClient, settingsPublic, smartVideoInstance } from 'videoengager-js-sdk';
import { attributesDescritions, checkServerUrl, endOfCallsBehavoirs, getURLHref, invalidOrExpiredBehavoirs } from './utils';
import { modes } from './modes';

export default class VideoEngagerWidget extends window.HTMLElement {
  static get attributesDescription () {
    return attributesDescritions;
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
    this.serverUrl = null;
  }

  get shadow () {
    if (!this._shadow) {
      this._shadow = this.attachShadow({ mode: 'closed' });
    }
    return this._shadow;
  }

  startIframeListener () {
    if (typeof this.listener === 'function') {
      if (window.addEventListener) {
        window.removeEventListener('message', this.listener);
      }
      if (window.attachEvent) {
        window.detachEvent('onmessage', this.listener);
      }
    }
    this.listener = this.iframeListener.bind(this);
    if (window.addEventListener) {
      window.addEventListener('message', this.listener, false);
    } else {
      window.attachEvent('onmessage', this.listener);
    }
  }

  stopIframeListener () {
    if (typeof this.listener === 'function') {
      if (window.addEventListener) {
        window.removeEventListener('message', this.listener);
      }
      if (window.attachEvent) {
        window.detachEvent('onmessage', this.listener);
      }
    }
    this.listener = null;
  }

  iframeListener (event) {
    if (!event?.data?.type) {
      return;
    }
    const type = event.data.type;
    console.log('iframeListener', type, event.data);
    if (type === 'popupClosed' && this.iframe) {
      try {
        if (typeof this.onVideoCallFinished === 'function') {
          this.onVideoCallFinished();
        }
      } catch (error) {
        console.error(error);
      }
      this.handleEndOfCall();
    }
    // if (type === 'callEnded')
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
    const serverUrl = checkServerUrl(this.getAttribute('ve-server-url'));

    if (!serverUrl) {
      console.error('Invalid server url');
      return false;
    }
    initializeSmartVideoClient({ basePath: serverUrl });
    this.serverUrl = serverUrl;
    this.shadow.innerHTML = `<div style="text-align: center; margin-top: 20px;">${this.getAttribute('ve-loading-text-element') || 'Loading...'}</div>`;

    if (!this.tenantData) {
      await this.getTennentData();
    }

    const mode = this.getAttribute('ve-widget-mode') || 'short-url';
    if (typeof modes[mode] === 'function') {
      modes[mode](this);
    } else {
      this.shadow.innerHTML = '<div style="text-align: center; margin-top: 20px;">Invalid detection mode. Please use one of the following: ' + Object.keys(modes).join(', ') + '</div>';
      console.error('Invalid detection mode. Please use one of the following: ', Object.keys(modes).join(', '));
    }
    return true;
  }

  createIframe (src) {
    // Create the iframe element

    if (this.errorElement && this.contains(this.errorElement)) {
      this.removeChild(this.errorElement);
    }
    if (this.iframe && this.contains(this.iframe)) {
      this.removeChild(this.iframe);
    }
    this.shadow.innerHTML = '';
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
    this.shadow.appendChild(this.iframe);
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
        this.destroyIframe();
        this.shadow.innerHTML = text;
        break;
      case invalidOrExpiredBehavoirs.hide:
        this.destroyIframe();
        this.shadow.innerHTML = '';

        break;
      default:
        break;
    }
  }

  destroyIframe () {
    if (this.iframe && this.contains(this.iframe)) {
      this.removeChild(this.iframe);
    }
    this.stopIframeListener();
    this.iframe = null;
  }

  handleEndOfCall () {
    console.log('handleEndOfCall');
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
        this.destroyIframe();
        window.location.href = redirectUrl;
        break;
      case endOfCallsBehavoirs['show-text-element']:
        this.destroyIframe();
        this.shadow.innerHTML = text;
        break;
      case endOfCallsBehavoirs.hide:
        this.destroyIframe();
        this.shadow.innerHTML = '';
        break;
      case endOfCallsBehavoirs['do-nothing']:
        break;
      default:
        console.error('Invalid end of call behavior');
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
