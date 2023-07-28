import { modes } from './modes';

export function checkServerUrl (url) {
  if (!url) {
    return false;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (error) {
    console.error(error);
    return false;
  }
}
export function getURLHref (url) {
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch (error) {
    console.error(error);
    return '';
  }
}
export const endOfCallsBehavoirs = {
  'show-text-element': 'show-text-element',
  redirect: 'redirect',
  hide: 'hide',
  'do-nothing': 'do-nothing'
};
export const invalidOrExpiredBehavoirs = {
  'show-text-element': 'show-text-element',
  redirect: 'redirect',
  hide: 'hide'
};
export const attributesDescritions = {
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
