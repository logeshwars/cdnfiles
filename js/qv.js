var isFlutterInAppWebViewReady = false;
window.addEventListener("flutterInAppWebViewPlatformReady", function (event) {
  console.log("setting flutterInAppWebViewPlatformReady to true");
  isFlutterInAppWebViewReady = true;
});
console.log("platform", getPlatform());

async function waitForWebviewToBeReady() {
  let platform = getPlatform();
  console.log("platform", platform);
  if (platform == "flutter") {
    console.log("waitForFlutterInAppWebViewPlatformReady called");
    return new Promise((resolve) => {
      const checkCondition = () => {
        if (isFlutterInAppWebViewReady) {
          console.log("Webview is ready");
          resolve(true);
        } else {
          setTimeout(checkCondition, 100); // Check again after 100 milliseconds
        }
      };

      checkCondition();
    });
  } else {
    return true;
  }
}

// setTimeout(() => {
//     console.log("dispatching custom event");
//     var event = new CustomEvent("flutterInAppWebViewPlatformReady");
//     var result = window.dispatchEvent(event);
//     console.log("result is ",result);
// }, 5000);

function getPlatform() {
  var platform;
  if (typeof window.flutter_inappwebview != "undefined") {
    platform = "flutter";
  } else if (typeof window.ReactNativeWebView != "undefined") {
    platform = "react_native";
  } else if (typeof window.webkit != "undefined") {
    platform = "ios_native";
  } else if (typeof AndroidInterface.messageHandlers != "undefined") {
    platform = "android_native";
  } else {
    platform = "other";
  }
  return platform;
}

function callHandler(handlerName, params) {
  let platform = getPlatform();
  console.log(platform);
  if (platform == "flutter") {
    window.flutter_inappwebview.callHandler(handlerName, params);
  } else if (platform == "ios_native") {
    window.webkit.messageHandlers[handlerName].postMessage(params);
  } else if (platform == "android_native") {
    AndroidInterface.messageHandlers(handlerName, params);
  } else if (platform == "react_native") {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ name: handlerName, params: params })
    );
  } else {
    console.log("unsupported platform");
  }
}

//iOS doesn't support awaitable post message, so we use callbacks and resultHandlers to track the promises
var resultHandlers = {};

function iosCallback(handlerName, data) {
  console.log("iosCallback called", handlerName);
  console.log(JSON.stringify(data));
  resultHandlers[handlerName].resolve(data);
}

function asyncCallback(handlerName, data) {
  console.log("asyncCallback called", handlerName);
  console.log(JSON.stringify(data));
  resultHandlers[handlerName].resolve(data);
}

async function callHandlerWithResult(handlerName, params) {
  let platform = getPlatform();
  console.log(platform);
  if (platform == "flutter") {
    let result = await window.flutter_inappwebview.callHandler(
      handlerName,
      params
    );
    console.log(JSON.stringify(result));
    return result;
  } else if (platform == "ios_native") {
    return new Promise((resolve, reject) => {
      resultHandlers[handlerName] = { resolve, reject };
      window.webkit.messageHandlers[handlerName].postMessage(params);
    });
  } else if (platform == "android_native") {
    if (typeof AndroidInterface.messageHandlersAsync != "undefined") {
      return new Promise((resolve, reject) => {
        resultHandlers[handlerName] = { resolve, reject };
        AndroidInterface.messageHandlersAsync(
          handlerName,
          JSON.stringify(params)
        );
      });
    } else {
      //For backward compatability
      //@deprecated
      let result = await AndroidInterface.messageHandlersWithResult(
        handlerName,
        JSON.stringify(params)
      );
      return JSON.parse(result);
    }
  } else if (platform == "react_native") {
    return new Promise((resolve, reject) => {
      resultHandlers[handlerName] = { resolve, reject };
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ name: handlerName, params: params })
      );
    });
  } else {
    console.log("unsupported platform");
  }
}

/**
 * @returns {object} returns the fcm token of device or empty if not available
 * @example
 * await getFcmToken()
 * result = {"pushToken":"crp0P9SbSxC0TSXXE92QMa:APA91bFKGYEepvvBtoKDWkcusZE7OvWQ4GUbaJT9T8bt7kNtHeIvDv9B1KDE2g5ThK1OLK8fEnaPE6MiFumDTCSLB5HHwglm3dGcMcj6bUbclEaOD-8DTfXBQlkgypK-b_Fe617EXewc","device":{"model":"OnePlus KB2001","isPhysicalDevice":true,"osVersion":"33","id":"5b497423-0279-4f7f-b2f6-bf665ddbcfc5","platform":"Android"}}
 */
async function getFcmToken() {
  console.log("getFcmToken called");
  let isReady = await waitForWebviewToBeReady();
  if (isReady) {
    let result = await callHandlerWithResult("getFcmToken");
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

async function success() {
  console.log("success called");
  let isReady = await waitForWebviewToBeReady();
  if (isReady) {
    callHandler("success");
  } else {
    throw new Error("Webview not ready");
  }
}

async function failure(message) {
  console.log("failure called");
  let isReady = await waitForWebviewToBeReady();
  if (isReady) {
    callHandler("failure", { message: message });
  } else {
    throw new Error("Webview not ready");
  }
}

/*
returns
{
    "registered": bool,
    "credentialIds": [credentials_ids],
}
*/
async function checkBiometric() {
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("checkBiometric");
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

//Public key as base64 string
/* 
returns
{
    "success": bool,
    "message": string error message if any,
}
*/
async function registerBiometric(publicKey, credentialId) {
  console.log("registerBiometric");
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("registerBiometric", {
      publicKey: publicKey,
      credentialId: credentialId,
    });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

//challenge as base64
/* 
returns
{
    "success": bool,
    "message": string error message if any,
    "encryptedChallenge": string base64 encoded encrypted challenge,
    "credentialId": string
}
*/
async function verifyBiometric(challenge) {
  console.log("verifyBiometric");
  let isReady = await waitForWebviewToBeReady();
  if (isReady) {
    let result = await callHandlerWithResult("verifyBiometric", {
      challenge: challenge,
    });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

/*
returns
{
    "success": bool,
    "message": string error message if any,
    "msisdn": string phone number,
    "regTransactionId": string,
    "authTransactionId": string,
}
*/
async function registerAshield(
  mid,
  regNum,
  regTransactionId,
  regSignature,
  authTransactionId,
  authSignature
) {
  console.log("registerAshield");
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("registerAshield", {
      mid: mid,
      regNum: regNum,
      regTransactionId: regTransactionId,
      regSignature: regSignature,
      authTransactionId: authTransactionId,
      authSignature: authSignature,
    });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

/*
returns
{
    "success": bool,
    "message": string error message if any,
    "msisdn": string phone number,
    "authTransactionId": string,
}
*/
async function authenticateAshield(mid, authTransactionId, authSignature) {
  console.log("authenticateAshield");
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("authenticateAshield", {
      mid: mid,
      authTransactionId: authTransactionId,
      authSignature: authSignature,
    });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

/*
returns
{
  "success": bool,
  "message": string error message if any,
  "data": {
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiQjgxODI0N2EiLCJvcmlnaW4iOiJhbmRyb2lkOmFway1rZXktaGFzaDpYM3VXbHl6T2JKc0xlRGo4WWxULTUyYld1TS1kdS0yQTQwcThVSWVLZ1dBIiwiYW5kcm9pZFBhY2thZ2VOYW1lIjoiY29tLmV4YW1wbGUucWxpa2F1dGgifQ",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUKzydSrzddaADTDFFr8EQ0fpZ4DHr2nHK93vE4HwwhRBdAAAAAOqbjWZNAR0hPOS2tIy1ddQAEGEc352LYUzH9jhJ1_kiuQ2lAQIDJiABIVggifvtE7W_55I79-4TWOM_AMHqu9foUJL6KXj2IW12n3MiWCBlEW9I_laPbD6JwZkcsAcGF7Vh7GWQK6VIZdQ0asl1XQ",
      "transports": [
        "internal",
        "hybrid"
      ]
    },
    "authenticatorAttachment": "platform",
    "clientExtensionResults": {
      "credProps": {
        "rk": true
      }
    },
    "id": "YRzfnYthTMf2OEnX-SK5DQ",
    "rawId": "YRzfnYthTMf2OEnX-SK5DQ",
    "type": "public-key"
  }
}
*/
async function registerFido(params) {
  console.log("registerFido");
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("registerFido", {
      params: params,
    });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}

/*
{
  "success": bool,
  "message": string error message if any,
  "data": {
    "id": "KEDetxZcUfinhVi6Za5nZQ",
    "type": "public-key",
    "rawId": "KEDetxZcUfinhVi6Za5nZQ",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiVDF4Q3NueE0yRE5MMktkSzVDTGE2Zk1oRDdPQnFobzZzeXpJbmtfbi1VbyIsIm9yaWdpbiI6ImFuZHJvaWQ6YXBrLWtleS1oYXNoOk1MTHpEdll4UTRFS1R3QzZVNlpWVnJGUXRIOEdjVi0xZDQ0NEZLOUh2YUkiLCJhbmRyb2lkUGFja2FnZU5hbWUiOiJjb20uZ29vZ2xlLmNyZWRlbnRpYWxtYW5hZ2VyLnNhbXBsZSJ9",
      "authenticatorData": "j5r_fLFhV-qdmGEwiukwD5E_5ama9g0hzXgN8thcFGQdAAAAAA",
      "signature": "MEUCIQCO1Cm4SA2xiG5FdKDHCJorueiS04wCsqHhiRDbbgITYAIgMKMFirgC2SSFmxrh7z9PzUqr0bK1HZ6Zn8vZVhETnyQ",
      "userHandle": "2HzoHm_hY0CjuEESY9tY6-3SdjmNHOoNqaPDcZGzsr0"
    }
  }
}
*/
async function signFido(params) {
  console.log("signFido");
  let isReady = await waitForWebviewToBeReady();

  if (isReady) {
    let result = await callHandlerWithResult("signFido", { params: params });
    return result;
  } else {
    throw new Error("Webview not ready");
  }
}
