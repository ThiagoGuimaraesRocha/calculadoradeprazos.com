import type { CalendarioContext, FeriadoRecorrente, RecessoForense } from './types';

export type RecessoForenseConfig = RecessoForense;

export type { CalendarioContext };

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function matchesRecorrente(date: Date, feriado: FeriadoRecorrente): boolean {
  return date.getMonth() + 1 === feriado.mes && date.getDate() === feriado.dia;
}

function isFeriadoNoContexto(date: Date, context: CalendarioContext): string | null {
  const iso = toIsoDate(date);

  for (const f of context.feriadosNacionais.datas) {
    if (f.data === iso) return f.nome;
  }
  for (const f of context.feriadosEstaduais.datas) {
    if (f.data === iso) return f.nome;
  }
  for (const f of context.feriadosMunicipais.datas) {
    if (f.data === iso) return f.nome;
  }

  const recorrentes = [
    ...context.feriadosNacionais.recorrentes,
    ...context.feriadosEstaduais.recorrentes,
    ...context.feriadosMunicipais.recorrentes,
  ];
  for (const f of recorrentes) {
    if (matchesRecorrente(date, f)) return f.nome;
  }

  return null;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isDiaUtil(date: Date, context: CalendarioContext): boolean {
  if (isWeekend(date)) return false;
  return isFeriadoNoContexto(date, context) === null;
}

export function isRecessoForense(date: Date, recesso: RecessoForenseConfig | null): boolean {
  if (!recesso) return false;
  const mes = date.getMonth() + 1;
  const dia = date.getDate();

  if (mes === recesso.inicioMes && dia >= recesso.inicioDia) return true;
  if (mes === recesso.fimMes && dia <= recesso.fimDia) return true;
  return false;
}

export function primeiroDiaUtilApos(publicacao: Date, context: CalendarioContext): Date {
  const cursor = new Date(publicacao);
  cursor.setDate(cursor.getDate() + 1);

  while (!isDiaUtil(cursor, context)) {
    cursor.setDate(cursor.getDate() + 1);
  }

  return cursor;
}

export function formatarDiaLongo(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export { parseIsoDate, toIsoDate };
