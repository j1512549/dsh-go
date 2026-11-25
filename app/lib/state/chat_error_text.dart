import 'package:dsh_client/dsh_client.dart';
import 'package:flutter/foundation.dart';

import '../l10n/l10n.dart';
import 'engine_error_text.dart';

/// 「[action]：原因」, or just [action] when the reason means nothing to a
/// person. The raw error only goes to the log.
String chatErrorText(Object error, {required String action}) {
  debugPrint('$action: $error');
  final reason = switch (error) {
    DshRemoteException(:final code) => switch (code) {
      // Diagnostic build: show the engine's own rejection reason, which the
      // plain text intentionally hides.
      'session/agent-busy' => _withEngineDetail(appL10n.stateChatAgentBusy, error),
      'session/writer-held' => appL10n.stateChatWriterHeld,
      'session/model-unavailable' || 'session/provider-models-unavailable' => appL10n.stateChatModelUnavailable,
      'session/attachment-invalid' => appL10n.stateChatAttachmentInvalid,
      'session/fork-unavailable' => appL10n.stateChatForkUnavailable,
      'FRAME_TOO_LARGE' => appL10n.stateChatImagesTooLarge,
      'WORKSPACE_UPLOAD_UNSUPPORTED' => appL10n.stateRemoteUploadUnsupported,
      'WORKSPACE_UPLOAD_TOO_LARGE' => appL10n.stateRemoteUploadTooLarge,
      'UPLOAD_INVALID_NAME' => appL10n.stateRemoteUploadNameInvalid,
      'UPLOAD_WORKSPACE_UNAVAILABLE' => appL10n.stateRemoteUploadWorkspaceUnavailable,
      'UPLOAD_WORKSPACE_CHANGED' => appL10n.stateRemoteUploadWorkspaceChanged,
      'UPLOAD_LIMIT' => appL10n.stateRemoteUploadLimit,
      _ => engineErrorReason(error),
    },
    // Uploads and exports go over HTTP: any other status means no engine.
    DshHttpException() => engineErrorReason(error) ?? appL10n.commonEngineUnreachable,
    _ => engineErrorReason(error),
  };
  return reason == null ? action : appL10n.stateActionReason(action, reason);
}

/// Diagnostic build only: append the engine's `reason` detail so a rejection
/// such as `session/agent-busy` says why instead of just "busy".
String _withEngineDetail(String text, Object error) {
  if (error is! DshRemoteException) return text;
  final raw = error.details['reason'];
  if (raw == null) return text;
  final detail = raw.toString().replaceAll(RegExp(r'\s+'), ' ').trim();
  if (detail.isEmpty) return text;
  final clipped = detail.length > 220 ? '${detail.substring(0, 220)}…' : detail;
  return '$text（engine: $clipped）';
}
