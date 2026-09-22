export const money = (cents:number) => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(cents/100)
export const ticketNumber = (n:number) => `#${String(n).padStart(4,'0')}`
export const publicName = (name:string) => name.split(/\s+/).map((part,i)=>i===0?part:`${part[0]}.`).join(' ')
