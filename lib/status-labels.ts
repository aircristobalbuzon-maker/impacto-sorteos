const raffleLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo · visible al público',
  PAUSED: 'Pausado',
  SALES_CLOSED: 'Ventas cerradas',
  DRAWING: 'Sorteo en curso',
  FINISHED: 'Finalizado',
}

const paymentLabels: Record<string, string> = {
  PENDING: 'Pendiente de validación',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

const ticketLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Participando',
  WINNER: 'Ganador',
  VOID: 'Anulado',
}

export function raffleStatusLabel(status: string) { return raffleLabels[status] ?? status }
export function paymentStatusLabel(status: string) { return paymentLabels[status] ?? status }
export function ticketStatusLabel(status: string) { return ticketLabels[status] ?? status }
