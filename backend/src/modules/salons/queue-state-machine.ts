import { BadRequestException } from '@nestjs/common';

export type QueueStatus =
  | 'waiting'
  | 'called'
  | 'in_service'
  | 'completed'
  | 'skipped'
  | 'cancelled'
  | 'no_show';

export interface StateTransitionRule {
  from: QueueStatus;
  allowedTo: QueueStatus[];
}

export const VALID_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  waiting: ['called', 'in_service', 'skipped', 'cancelled', 'completed'],
  called: ['in_service', 'skipped', 'cancelled', 'no_show', 'waiting'],
  in_service: ['completed', 'cancelled'],
  skipped: ['waiting', 'called', 'cancelled', 'in_service'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  no_show: ['waiting', 'cancelled', 'in_service'], // Can be restored if customer arrives
};

export function validateQueueTransition(currentStatus: string, nextStatus: string): void {
  const normalizedCurrent = (currentStatus || 'waiting').toLowerCase() as QueueStatus;
  const normalizedNext = (nextStatus || '').toLowerCase() as QueueStatus;

  if (normalizedCurrent === normalizedNext) {
    return; // No-op
  }

  const allowed = VALID_TRANSITIONS[normalizedCurrent];
  if (!allowed || !allowed.includes(normalizedNext)) {
    throw new BadRequestException(
      `Invalid queue status transition from '${normalizedCurrent.toUpperCase()}' to '${normalizedNext.toUpperCase()}'. Allowed transitions: ${
        allowed && allowed.length > 0
          ? allowed.map((s) => s.toUpperCase()).join(', ')
          : 'None (Terminal state)'
      }`,
    );
  }
}
