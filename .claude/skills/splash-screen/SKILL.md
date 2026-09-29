---
name: splash-screen
description: Design and implement an app's splash / launch screen for iOS, Android, Expo, React Native or Flutter - brand assets, sizes, dark mode, animated handoff to the first screen, and store-compliant launch behavior. Use when the user asks for a splash screen, launch screen, app loading screen, or startup animation.
---

# Splash Screen

A splash screen should show the brand for the shortest time the app needs to load, then hand off smoothly to the first real screen. It is not a place for ads, long animations or loading tricks.

## 1. Pin down the brief
- Platform(s) and stack: native iOS (SwiftUI/UIKit), native Android (Compose/Views), Expo, bare React Native, Flutter.
- Brand assets: logo (SVG or 1024px PNG with transparent background), brand color, dark-mode color.
- Static only, or a short animated handoff (max ~600 ms after the app is ready).

## 2. Design rules
- One centered mark on a solid background. No text that needs to be localized, no taglines, no version numbers.
- Logo safe area: keep the mark inside the central ~2/3 of the icon box (Android 12+ crops to a circle: 240dp box, mark inside 160dp).
- Provide light and dark backgrounds; test contrast of the mark on both.
- The splash must match the first frame of the app (same background color) so the handoff has no flash.
- Never add an artificial delay. Hide the splash as soon as fonts, auth state and the first screen's data are ready.

## 3. Implement per stack

**Expo**
- `expo-splash-screen` config plugin in `app.json` / `app.config.ts`: `image`, `imageWidth`, `backgroundColor`, `dark.backgroundColor`, `dark.image`.
- In the root layout: `SplashScreen.preventAutoHideAsync()` at module load; call `SplashScreen.hideAsync()` once fonts/data are ready (optionally `SplashScreen.setOptions({ fade: true, duration: 400 })`).
- Rebuild the native app (`npx expo prebuild` / EAS build) - splash changes don't apply over OTA updates.

**Bare React Native**
- Use `react-native-bootsplash`: `npx react-native-bootsplash generate logo.svg --background=<hex> --logo-width=160 --platforms=android,ios` then `BootSplash.hide({ fade: true })` when ready.

**Flutter**
- `flutter_native_splash` in `pubspec.yaml`: `color`, `image`, `color_dark`, `image_dark`, `android_12:` block; run `dart run flutter_native_splash:create`.
- Keep it on screen with `FlutterNativeSplash.preserve(...)` and `FlutterNativeSplash.remove()` when init finishes.

**Native iOS**
- Use a Launch Screen storyboard or the `UILaunchScreen` Info.plist dictionary (`UIColorName`, `UIImageName`). Launch screens are static - no animation or logic.
- For an animated handoff, show a SwiftUI view that starts identical to the launch screen, then animate the logo out.

**Native Android**
- `androidx.core:core-splashscreen`: theme `Theme.SplashScreen` with `windowSplashScreenBackground`, `windowSplashScreenAnimatedIcon`, `postSplashScreenTheme`; call `installSplashScreen()` before `super.onCreate`, and `setKeepOnScreenCondition { !viewModel.isReady }`.
- Android 12+ always shows the system splash; don't add a second custom splash activity after it.

## 4. Assets checklist
- Logo SVG + 1024x1024 PNG (transparent), background hex for light and dark.
- Android 12 icon: 288x288dp canvas, mark within 192dp circle (or 240/160 with icon background).
- Generate with the stack's tool rather than hand-sizing every density.

## 5. Verify
- Cold start on a real device or emulator in light and dark mode, iOS and Android.
- No white flash between splash and first screen; no stretched or cropped logo.
- Measure time to first screen; the splash should never add time on its own.
- Record a short screen capture of the handoff for review.
