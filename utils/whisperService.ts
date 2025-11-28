import { MutableRefObject } from 'react';
import { Platform } from 'react-native';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';

export type RecognitionPayload = { type: 'result'; text: string } | { type: 'error'; message: string } | { type: 'stopped' } | { type: 'unsupported' };

export const PERSIAN_LANGUAGE = 'fa-IR';

export const speechRecognitionHtml = `
  <!DOCTYPE html>
  <html>
    <body>
      <script>
        (() => {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            window.ReactNativeWebView?.postMessage('__UNSUPPORTED__');
            return;
          }

          const recognition = new SpeechRecognition();
          recognition.lang = '${PERSIAN_LANGUAGE}';
          recognition.interimResults = false;
          recognition.continuous = false;

          recognition.onresult = (event) => {
            const text = event.results?.[0]?.[0]?.transcript || '';
            window.ReactNativeWebView.postMessage(text);
            recognition.stop();
          };

          recognition.onerror = (e) => {
            const error = e?.error || 'unknown_error';
            window.ReactNativeWebView.postMessage('__ERROR__:' + error);
          };

          recognition.onspeechend = () => {
            recognition.stop();
          };

          recognition.onend = () => window.ReactNativeWebView.postMessage('__STOPPED__');

          window.startListening = () => {
            try {
              recognition.start();
            } catch (err) {
              const message = err?.message || 'start_failed';
              window.ReactNativeWebView.postMessage('__ERROR__:' + message);
            }
          };

          window.stopListening = () => recognition.stop();
        })();
      </script>
    </body>
  </html>
`;

const getBrowserRecognizer = () => {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  return SpeechRecognition;
};

type BrowserRecognizerHandlers = {
  onResult: (text: string) => void;
  onStop?: () => void;
  onError?: (message: string) => void;
};

export const createBrowserRecognizer = (handlers: BrowserRecognizerHandlers) => {
  const SpeechRecognition = getBrowserRecognizer();
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = PERSIAN_LANGUAGE;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const text = event?.results?.[0]?.[0]?.transcript || '';
    handlers.onResult(text);
  };

  recognition.onerror = (event: any) => {
    const message = event?.error || 'خطا در تشخیص صدا';
    handlers.onError?.(message);
  };

  recognition.onend = () => {
    handlers.onStop?.();
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    dispose: () => {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
    },
  };
};

export const startNativeListening = (webViewRef: MutableRefObject<WebView | null>) => {
  webViewRef.current?.injectJavaScript('window.startListening && window.startListening(); true;');
};

export const stopNativeListening = (webViewRef: MutableRefObject<WebView | null>) => {
  webViewRef.current?.injectJavaScript('window.stopListening && window.stopListening(); true;');
};

export const parseNativeMessage = (event: WebViewMessageEvent): RecognitionPayload => {
  const data = String(event.nativeEvent.data);

  if (data === '__STOPPED__') return { type: 'stopped' };
  if (data === '__UNSUPPORTED__') return { type: 'unsupported' };
  if (data.startsWith('__ERROR__')) {
    const [, message = 'خطا در تشخیص صدا'] = data.split(':');
    return { type: 'error', message };
  }

  return { type: 'result', text: data.trim() };
};

export const whisperService = {
  language: PERSIAN_LANGUAGE,
  speechRecognitionHtml,
  createBrowserRecognizer,
  startNativeListening,
  stopNativeListening,
  parseNativeMessage,
  isBrowserSupported: () => Platform.OS === 'web' && Boolean(getBrowserRecognizer()),
};
