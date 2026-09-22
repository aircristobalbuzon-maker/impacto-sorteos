export type Ticket={id:string;participantId:string;status:'ACTIVE'|'WINNER'|'VOID'}
export function eligibleTickets(tickets:Ticket[]){return tickets.filter(t=>t.status==='ACTIVE')}
export function applyWinner(tickets:Ticket[],winnerId:string){return tickets.map(t=>t.id===winnerId?{...t,status:'WINNER' as const}:t)}
export function calculateTotal(quantity:number,unitPriceCents:number){if(!Number.isInteger(quantity)||quantity<1)throw new Error('INVALID_QUANTITY');return quantity*unitPriceCents}
