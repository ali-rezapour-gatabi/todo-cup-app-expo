import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { vazirmatnFamilies } from '@/constants/fonts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  createBrowserRecognizer,
  parseNativeMessage,
  speechRecognitionHtml,
  startNativeListening,
  stopNativeListening,
  whisperService,
  type RecognitionPayload,
} from '@/utils/whisperService';

type RecorderState = 'idle' | 'recording' | 'transcribing';

export const VoiceTab = () => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { showToast } = useToast();

  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<RecorderState>('idle');
  const [isSupported, setIsSupported] = useState<boolean>(Platform.OS !== 'web' ? true : whisperService.isBrowserSupported());
  const webViewRef = useRef<WebView | null>(null);
  const browserRecognizerRef = useRef<ReturnType<typeof createBrowserRecognizer> | null>(null);
  const levelAnim = useRef(new Animated.Value(0.25)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';
  const isStartDisabled = isRecording || isTranscribing || !isSupported;

  const animateLevel = useCallback(
    (value: number) => {
      Animated.timing(levelAnim, {
        toValue: Math.max(0.05, Math.min(1, value)),
        duration: 120,
        useNativeDriver: true,
      }).start();
    },
    [levelAnim]
  );

  const startPulse = useCallback(() => {
    if (pulseLoop.current) return;
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(levelAnim, { toValue: 0.9, duration: 380, useNativeDriver: true }),
        Animated.timing(levelAnim, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, [levelAnim]);

  const stopPulse = useCallback(() => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      pulseLoop.current = null;
    }
    animateLevel(0.15);
  }, [animateLevel]);

  const handleResult = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      setState('idle');
      stopPulse();

      if (!trimmed) return;

      setTranscript(trimmed);
      showToast({ type: 'success', title: 'متن آماده شد', message: 'متن از صدای شما استخراج شد.' });
    },
    [showToast, stopPulse]
  );

  const handleError = useCallback(
    (message: string) => {
      stopPulse();
      setState('idle');
      showToast({ type: 'error', title: 'خطا در تشخیص صدا', message });
    },
    [showToast, stopPulse]
  );

  const handleStop = useCallback(() => {
    stopPulse();
    setState('idle');
  }, [stopPulse]);

  const cleanupListening = useCallback(() => {
    if (Platform.OS === 'web') {
      browserRecognizerRef.current?.stop();
    } else {
      stopNativeListening(webViewRef);
    }
    stopPulse();
    setState('idle');
  }, [stopPulse]);

  useEffect(() => {
    return () => {
      browserRecognizerRef.current?.dispose?.();
      cleanupListening();
    };
  }, [cleanupListening]);

  const startRecording = useCallback(() => {
    if (isRecording || isTranscribing || !isSupported) return;

    if (Platform.OS === 'web') {
      if (!browserRecognizerRef.current) {
        const recognizer = createBrowserRecognizer({
          onResult: handleResult,
          onStop: handleStop,
          onError: handleError,
        });

        if (!recognizer) {
          setIsSupported(false);
          showToast({ type: 'error', title: 'عدم پشتیبانی', message: 'مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند.' });
          return;
        }
        browserRecognizerRef.current = recognizer;
      }

      try {
        browserRecognizerRef.current.start();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'شروع گوش دادن ممکن نشد.';
        handleError(message);
        return;
      }
    } else {
      startNativeListening(webViewRef);
    }

    setState('recording');
    startPulse();
  }, [handleError, handleResult, handleStop, isRecording, isSupported, isTranscribing, showToast, startPulse]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    if (Platform.OS === 'web') {
      browserRecognizerRef.current?.stop();
    } else {
      stopNativeListening(webViewRef);
    }

    setState('transcribing');
    stopPulse();
  }, [isRecording, stopPulse]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const payload: RecognitionPayload = parseNativeMessage(event);

      switch (payload.type) {
        case 'result':
          handleResult(payload.text);
          break;
        case 'error':
          handleError(payload.message);
          break;
        case 'unsupported':
          setIsSupported(false);
          handleError('این دستگاه از تبدیل گفتار به متن پشتیبانی نمی‌کند.');
          break;
        case 'stopped':
          handleStop();
          break;
      }
    },
    [handleError, handleResult, handleStop]
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <Button
          title="Start Recording"
          variant="secondary"
          icon={<Mic size={18} color={palette.text} />}
          disabled={isStartDisabled}
          onPress={startRecording}
          style={[styles.actionButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
        />
        <Button
          title={isTranscribing ? 'Transcribing...' : 'Stop Recording'}
          variant="destructive"
          icon={<Square size={18} color="#fff" />}
          disabled={!isRecording}
          onPress={stopRecording}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.textAreaHeader}>
        <ThemedText weight="bold" style={{ color: palette.text }}>
          متن استخراج شده
        </ThemedText>
        <ThemedText style={styles.secondaryText}>بعد از توقف ضبط، متن به صورت خودکار نمایش داده می‌شود.</ThemedText>
      </View>
      <TextInput
        multiline
        numberOfLines={5}
        value={transcript}
        onChangeText={setTranscript}
        placeholder="اینجا متن تبدیل شده از صدا نمایش داده می‌شود"
        placeholderTextColor={palette.icon}
        style={[styles.textArea, { borderColor: palette.border, color: palette.text }]}
      />

      {Platform.OS !== 'web' ? (
        <WebView
          ref={webViewRef}
          source={{ html: speechRecognitionHtml }}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          style={styles.hiddenWebView}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  waveform: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
  },
  waveBar: {
    width: 10,
    borderRadius: 10,
  },
  waveStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textAreaHeader: {
    gap: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'right',
    textAlignVertical: 'top',
    minHeight: 140,
    fontFamily: vazirmatnFamilies.regular,
  },
  secondaryText: {
    fontSize: 12,
    opacity: 0.7,
  },
  insertRow: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  insertButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
