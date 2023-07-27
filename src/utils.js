import { shortURLPublic } from 'videoengager-js-sdk';
export function checkValue (value = '') {
  if (!value) {
    return false;
  }
  let val = value.trim();
  // strip the value from any query params or other stuff
  if (val.includes('/')) {
    val = val.split('/')[0];
  }
  if (val.includes('?')) {
    val = val.split('?')[0];
  }
  if (val.includes('&')) {
    val = val.split('&')[0];
  }
  if (val.includes('=')) {
    val = val.split('=')[0];
  }
  if (val.includes('#')) {
    val = val.split('#')[0];
  }
  if (!val) {
    return false;
  }
  return val;
}

export function checkIfPathIncludesCodeOrPin (fullPath) {
  try {
    let value = null;
    if (fullPath.includes('/ve/')) {
      value = checkValue(fullPath.split('/ve/')[1]);
      if (!value) {
        throw new Error('Invalid Code value');
      }
      return {
        type: 'code',
        value: value
      };
    } else if (fullPath.includes('/pin/')) {
      value = checkValue(fullPath.split('/pin/')[1]);
      if (!value) {
        throw new Error('Invalid Pin value');
      }
      return {
        type: 'pin',
        value: value
      };
    }
    console.error('Invalid path: ', fullPath, 'Please use /ve/ or /pin/');
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export async function getIframeUrlFromShortCodeOrPin ({ code, pin }, tenantID, serverUrl = 'https://videoengager.com') {
  const data = {
    iframeUrl: null,
    error: true
  };
  if (code) {
    const response = await shortURLPublic.getShortURLByCode({
      tenantID,
      code
    }).catch((error) => {
      console.log(error);
      data.error = true;
    });
    if (response?.data?.active) {
      data.iframeUrl = `${serverUrl}/${response.data.url}`;
    } else {
      data.error = true;
    }
  } else if (pin) {
    const response = await shortURLPublic.getShortURLByPin({
      tenantID,
      pin
    }).catch((error) => {
      console.log(error);
      data.error = true;
    });
    if (response?.data?.shortUrl) {
      data.iframeUrl = `${serverUrl}/${response.data.shortUrl}`;
    }
    // Handle PIN case here
  }

  return data;
}
export const modes = {
  /**
     * @param {import('./index').default} that
     */
  'short-url': async function shortUrl (that) {
    try {
      const fullPath = window.location.href;
      const isReady = that.isReadyToUseVEAPI;
      if (!isReady) {
        console.log('isReady', isReady);
        console.error('VideoEngager API is not ready yet');
        return false;
      }
      const data = checkIfPathIncludesCodeOrPin(fullPath);
      if (!data) {
        console.error('Invalid path');
        throw new Error('(ERROR: Invalid path)');
      }
      const { type, value } = data;
      const tenantID = that.getAttribute('ve-tenant');
      const serverUrl = that.getAttribute('ve-server-url');
      const iframeUrlData = await getIframeUrlFromShortCodeOrPin({ [type]: value }, tenantID, serverUrl);
      if (iframeUrlData.iframeUrl) {
        that.createIframe(iframeUrlData.iframeUrl);
      } else {
        throw new Error('Cannot get iframe url from API');
      }
    } catch (error) {
      console.error(error);
      that.handleInvalidShortCodeOrPin(error.response?.data?.invalidUrl || false);
    }
    //   manual: 'manual'
  }
  /**
  * TODO: Implement mode for transferID,
  * where the transferID is used to retrieve the iframe url from the interaction API
  */
};
export function checkIfUrlIsCorrect (url) {
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
