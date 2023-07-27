# VideoEngager Widget

## Introduction

VideoEngager Widget is a custom web component designed to integrate VideoEngager's visitor video call functionality into your web applications. This component streamlines the process of enabling video interactions between visitors and representatives on your site by providing a straightforward and customizable widget, enhancing your user experience and interaction.

## Installation

To install and set up the VideoEngager Widget in your web application, follow the steps below:

1. Include the main JavaScript file in your HTML head:

```html
<script src="https://cdn.jsdelivr.net/gh/VideoEngager/ve-invite-page-example/dist/main.js"></script>
```

2. Insert the custom element in your HTML:

```html
<videoengager-widget
    ve-server-url="https://videoengager-server.com"
    ve-tenant="tenant1"
></videoengager-widget>
```

## Usage

Use the `videoengager-widget` tag in your HTML file where you want to place the widget. Set the `ve-server-url` and `ve-tenant` attributes as required. You may customize the widget further by using the optional attributes available. Here's an example using all available attributes:

```html
<videoengager-widget
    ve-server-url="https://videoengager-server.com"
    ve-tenant="tenant1"
></videoengager-widget>
```

## Available Attributes

Below is a list of all the attributes supported by the VideoEngager Widget, along with a brief description, their available options, and whether they're required:

- **`ve-server-url`** (Required): The URL of the VideoEngager server.
- **`ve-tenant`** (Required): The tenant ID.
- **`ve-widget-mode`**: The detection mode of videoCall. Default: `short-url`.
- **`ve-auto-start`**: Disable auto-start. To start manually, use the method of the element: `element.startVideoEngagerCall()`.
- **`ve-on-invalid-behavior`**: The behavior when the URL is invalid. Default: `redirect`. Options: `show-text-element`, `redirect`, `hide`.
- **`ve-on-end-behavior`**: The behavior when the call is ended. Default: `redirect`. Options: `show-text-element`, `redirect`, `hide`, `do-nothing`.
- **`ve-on-invalid-text-element`**: The text to show when the URL is invalid or expired (only when `ve-on-invalid-behavior` = `show-text-element`).
- **`ve-on-end-text-element`**: The text to show when the call is ended (only when `ve-on-end-behavior` = `show-text-element`).
- **`ve-on-invalid-redirect-url`**: The URL to redirect to when the URL is invalid or expired (only when `ve-on-invalid-behavior` = `redirect`).
- **`ve-on-end-redirect-url`**: The URL to redirect to when the call is ended (only when `ve-on-end-behavior` = `redirect`).
- **`ve-loading-text-element`**: The text to show when the iframe is loading.

## Event Listening

Developers can listen to events from the custom element to trigger other functionalities. Here are examples of event handlers for the `onVideoPageLoaded` and `onVideoCallFinished` events:

```javascript
document.querySelector('videoengager-widget').onVideoPageLoaded = function(e) {
  console.log('VideoEngager page has been loaded.');
};

document.querySelector('videoengager-widget').onVideoCallFinished =  function(e) {
  console.log('VideoEngager call has ended.');
}
```

## Support

If you encounter any issues or require further assistance, feel free to raise an issue in our [GitHub issues](https://github.com/your-github/videoengager-widget/issues) section. Alternatively, you can reach out to our support team at support@videoengager.com.

We strive to provide clear, concise, and comprehensive documentation to assist you in the integration process. However, if you feel any aspect is unclear or missing, please let us know. Your feedback is important in improving our documentation and overall service.
