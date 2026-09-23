import test from 'node:test';import assert from 'node:assert/strict';
import {eligibleTickets,applyWinner,calculateTotal} from '../lib/domain/rules.ts';
import {normalizeDocument,normalizeWhatsapp} from '../lib/identity.ts';
test('solo sale el ticket ganador; los demás del mismo participante continúan',()=>{const before=[{id:'a',participantId:'juan',status:'ACTIVE'},{id:'b',participantId:'juan',status:'ACTIVE'},{id:'c',participantId:'ana',status:'ACTIVE'}];const after=applyWinner(before,'a');assert.deepEqual(eligibleTickets(after).map(t=>t.id),['b','c']);});
test('calcula el total',()=>assert.equal(calculateTotal(5,2000),10000));
test('normaliza el DNI para reunir compras repetidas',()=>assert.equal(normalizeDocument(' 12.345-678 '),'12345678'));
test('normaliza un celular peruano para WhatsApp',()=>assert.equal(normalizeWhatsapp('999 888 777'),'51999888777'));
