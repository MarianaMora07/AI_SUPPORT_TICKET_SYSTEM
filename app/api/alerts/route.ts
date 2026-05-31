import { jsonOk, jsonError } from '@/src/lib/api-response';
import { getSessionProfile, canAccessAgent } from '@/src/lib/auth';
import { computeAgentAlerts, computeUserAlerts } from '@/src/services/alertService';

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) return jsonError('No autorizado', 401);

  if (canAccessAgent(profile.role)) {
    const alerts = await computeAgentAlerts();
    return jsonOk({
      role: profile.role,
      alerts,
      summary: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        warning: alerts.filter((a) => a.severity === 'warning').length,
        info: alerts.filter((a) => a.severity === 'info').length,
      },
    });
  }

  const alerts = await computeUserAlerts(profile.id);
  return jsonOk({
    role: profile.role,
    alerts,
    summary: {
      critical: 0,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    },
  });
}
