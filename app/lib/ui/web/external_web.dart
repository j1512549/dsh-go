// The way out of the app: the local DSH Web page opens in the phone's own
// browser, signed in with the running engine's launch token.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/l10n.dart';
import '../../runtime/runtime_bridge.dart';
import '../../runtime/runtime_state.dart';
import 'local_web_screen.dart' show localWebUri;

/// Opens the local DSH Web page in the system browser instead of the app's
/// WebView: the engine's own address with its launch token, so the page comes
/// up signed in.
///
/// A stopped engine is not a reason to fall back to 网页模式: the native
/// interface starts it, and the browser opens once the page is served.
Future<void> openLocalWebExternally(BuildContext context, WidgetRef ref) async {
  final container = ProviderScope.containerOf(context, listen: false);
  final status = ref.read(localRuntimeProvider).status;
  final base = status.baseUrl;
  final token = status.token;

  if (status.phase == RuntimePhase.notInstalled) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.l10n.localEnvNotInstalled)));
    return;
  }
  if (status.isRunning && base != null && token != null) {
    await _launch(base, token);
    return;
  }

  unawaited(container.read(localRuntimeProvider.notifier).start());
  unawaited(_launchWhenRunning(container));
}

/// Waits out a cold start (2 s × 120) and opens the page once the engine
/// serves it; gives up quietly when the engine doesn't come up.
Future<void> _launchWhenRunning(ProviderContainer container) async {
  for (var i = 0; i < 120; i++) {
    await Future<void>.delayed(const Duration(seconds: 2));
    final status = container.read(localRuntimeProvider).status;
    final base = status.baseUrl;
    final token = status.token;
    if (status.isRunning && base != null && token != null) {
      await _launch(base, token);
      return;
    }
  }
}

Future<void> _launch(String base, String token) =>
    launchUrl(localWebUri(base, token), mode: LaunchMode.externalApplication);
