import { Platform } from 'react-native';
import { adapty, AdaptyProfile, AdaptyProduct, AdaptyPaywall } from 'react-native-adapty';

const SDK_KEY = process.env.EXPO_PUBLIC_ADAPTY_SDK_KEY!;
const PAYWALL_ID = process.env.EXPO_PUBLIC_ADAPTY_PAYWALL_ID!;
const ACCESS_LEVEL = process.env.EXPO_PUBLIC_ADAPTY_ACCESS_LEVEL!;
const PLACEMENT_ID = process.env.EXPO_PUBLIC_ADAPTY_PLACEMENT_ID!;

class AdaptyService {
  private activated = false;

  private async activateOnce(): Promise<void> {
    if (this.activated || Platform.OS !== 'ios') return;

    try {
      await adapty.activate(SDK_KEY, {
        lockMethodsUntilReady: true,
        __ignoreActivationOnFastRefresh: __DEV__,
      });
      this.activated = true;
      console.log('[Adapty] SDK activated');
    } catch (error) {
      console.error('[Adapty] Activation error:', error);
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    try {
        await this.activateOnce();
      const profile: AdaptyProfile = await adapty.getProfile();

      if (!profile || !profile.accessLevels) {
        console.log('[Adapty] User has no subscription yet.');
        return false;
      }

      const isActive = profile.accessLevels[ACCESS_LEVEL]?.isActive ?? false;
      console.log('[Adapty] isSubscribed:', isActive);
      return isActive;
    } catch (error) {
      console.error('[Adapty] Failed to fetch profile:', error);
      return false;
    }
  }

  async getPaywall(): Promise<AdaptyPaywall | null> {
    await this.activateOnce();

    try {
      const locale = 'en';
      const paywall = await adapty.getPaywall(PLACEMENT_ID, locale);
      console.log(JSON.stringify(paywall));

      if (paywall) {
        await adapty.logShowPaywall(paywall);
        return paywall;
      }
      return null;
    } catch (error) {
      console.error('[Adapty] Failed to fetch paywall:', error);
      return null;
    }
  }

  async getPaywallProducts(paywall: AdaptyPaywall | null): Promise<AdaptyProduct[]> {
    if (Platform.OS !== 'ios' || !paywall) return [];

    try {
      const products: AdaptyProduct[] = await adapty.getPaywallProducts(paywall);
      return products;
    } catch (error) {
      console.error('[Adapty] Failed to fetch products:', error);
      return [];
    }
  }

  async purchaseProduct(product: AdaptyProduct): Promise<AdaptyProfile | null> {
    await this.activateOnce();

    try {
      const profile: AdaptyProfile = await adapty.makePurchase(product);

      if (profile && (profile as any).type === 'user_cancelled') {
        console.log('[Adapty] Purchase cancelled by user');
        throw new Error('Purchase cancelled by user');
      }

     if (!profile || !profile.accessLevels) {
       console.warn('[Adapty] Purchase completed but no valid profile returned — likely sandbox verification issue.');

       // TEMPORARY fallback for sandbox testing
       if (__DEV__ ) {
         console.warn('[Adapty] Ignoring verification failure in sandbox mode');
         return profile || ({} as AdaptyProfile);
       }

       throw new Error('Purchase verification failed');
     }


      console.log('[Adapty] Purchase successful:', profile);
      return profile;
    } catch (error: any) {
      console.error('[Adapty] Purchase error:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<void> {
    if (Platform.OS !== 'ios') return;

    await this.activateOnce();

    try {
      const profile: AdaptyProfile = await adapty.restorePurchases();
      console.log('[Adapty] Purchases restored:', profile);
    } catch (error: any) {
      console.error('[Adapty] Restore purchases error:', error);
      throw error;
    }
  }


}

export const adaptyService = new AdaptyService();
