import type { CalendarioContext } from '../domain/feriados';
import {
  feriadosEstaduaisEstaticos,
  feriadosMunicipaisEstaticos,
  feriadosNacionaisEstaticos,
} from './dadosEstaticos';

export function montarCalendario(estadoSigla: string, municipioId: number): CalendarioContext {
  return {
    feriadosNacionais: feriadosNacionaisEstaticos(),
    feriadosEstaduais: feriadosEstaduaisEstaticos(estadoSigla),
    feriadosMunicipais: feriadosMunicipaisEstaticos(municipioId),
  };
}
