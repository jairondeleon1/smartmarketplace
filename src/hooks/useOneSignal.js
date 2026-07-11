import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Initializes the OneSignal Web Push SDK with the App ID fetched from backend,
 * links the current user (if logged in), and shows a slidedown opt-in prompt.
 */
export function useOneSignal(user) {
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const response = await base44.functions.invoke('getOneSignalConfig');
        if (cancelled) return;
        const appId = response.data?.appId;
        if (!appId) { console.warn('[OneSignal] No appId returned from backend'); return; }
        console.log('[OneSignal] Got appId, queuing init via OneSignalDeferred');

        // Always use OneSignalDeferred — the official v16 pattern.
        // The page SDK is a lightweight loader; window.OneSignal is a proxy,
        // not the real SDK instance. The deferred callback receives the actual
        // SDK instance once the full SDK has loaded. Late pushes still run
        // because the SDK redefines .push() to execute immediately after load.
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal) {
          console.log('[OneSignal] Deferred callback fired, SDK instance ready');
          if (OneSignal.__smartmenuInit) return;
          OneSignal.__smartmenuInit = true;

          try {
            await OneSignal.init({
              appId,
              notifyButton: { enable: false },
              promptOptions: {
                slidedown: {
                  prompts: [
                    {
                      type: 'push',
                      autoPrompt: false,
                      text: {
                        actionMessage: 'Get notified about new menu items and updates from your marketplace!',
                        acceptButton: 'Allow',
                        cancelButton: 'No Thanks',
                      },
                    },
                  ],
                },
              },
            });
            console.log('[OneSignal] Init successful');

            // Link logged-in user to their OneSignal subscription
            if (user?.id) {
              try { await OneSignal.login(user.id); } catch (_e) { /* ignore */ }
            }

            // Show opt-in prompt after a short delay (OneSignal respects prior choices)
            setTimeout(() => {
              try {
                console.log('[OneSignal] Calling showSlidedownPrompt()');
                OneSignal.showSlidedownPrompt();
              } catch (_e) { console.warn('[OneSignal] showSlidedownPrompt failed:', _e?.message || _e); }
            }, 5000);
          } catch (initErr) {
            console.error('[OneSignal] Init failed:', initErr?.message || initErr);
          }
        });
      } catch (e) {
        console.warn('OneSignal init skipped:', e?.message || e);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [user?.id]);
}