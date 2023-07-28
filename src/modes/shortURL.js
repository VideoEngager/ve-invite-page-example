import { shortURLPublic } from 'videoengager-js-sdk';

export async function shortUrlMode (that) {
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
    const tenantID = that.tenantData.tennantId;
    const serverUrl = that.serverUrl;
    const iframeUrlData = await getIframeUrlFromShortCodeOrPin({ [type]: value }, tenantID, serverUrl);
    if (iframeUrlData.iframeUrl) {
      that.createIframe(iframeUrlData.iframeUrl);
    } else {
      const error = new Error('Cannot get iframe url from API');
      error.invalidUrl = iframeUrlData.invalidUrl;
      throw error;
    }
  } catch (error) {
    console.error(error);
    that.handleInvalidShortCodeOrPin(error.invalidUrl || false);
  }
  //   manual: 'manual'
}
function processUrlFromShortUrlDB (url = '', serverUrl) {
  try {
    const urlObj = new URL(url);
    return urlObj.href.replace(urlObj.origin, serverUrl);
  } catch (error) {

  }
  if (url.startsWith('/')) {
    return serverUrl + url;
  } else {
    return serverUrl + '/' + url;
  }
}
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
    error: true,
    invalidUrl: false
  };
  if (code) {
    const response = await shortURLPublic.getShortURLByCode({
      tenantID,
      code
    }).catch((error) => {
      console.error(error);
      data.error = true;
      data.invalidUrl = error.response?.data?.invalidUrl || false;
    });
    if (response?.data?.active) {
      data.iframeUrl = processUrlFromShortUrlDB(response.data.url, serverUrl);
      data.error = false;
    } else {
      data.error = true;
    }
    data.invalidUrl = response?.data?.invalidUrl || false;
  } else if (pin) {
    const response = await shortURLPublic.getShortURLByPin({
      tenantID,
      pin
    }).catch((error) => {
      console.error(error);
      data.error = true;
      data.invalidUrl = error.response?.data?.invalidUrl || false;
    });
    if (response?.data?.shortUrl) {
      data.iframeUrl = processUrlFromShortUrlDB(response.data.shortUrl, serverUrl);
      data.error = false;
    }
    data.invalidUrl = response?.data?.invalidUrl || false;

    // Handle PIN case here
  }

  return data;
}
