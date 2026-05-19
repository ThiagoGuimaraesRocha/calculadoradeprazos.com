export type Estado = {
  id: number;
  nome: string;
  sigla: string;
};

export type Municipio = {
  id: number;
  nome: string;
  estados_id: number;
};

export type Tribunal = {
  id: number;
  nome: string;
};

export type Vara = {
  id: number;
  vara: string;
};

export type Materia = 'civel' | 'criminal' | 'trabalhista';
export type TipoProcesso = 'eletronico' | 'fisico';
export type TipoContagem = 'uteis' | 'corridos';

export type FeriadoRecorrente = {
  mes: number;
  dia: number;
  nome: string;
};

export type FeriadoPontual = {
  data: string;
  nome: string;
};

export type RecessoForense = {
  inicioMes: number;
  inicioDia: number;
  fimMes: number;
  fimDia: number;
};

export type ConjuntoFeriados = {
  recorrentes: FeriadoRecorrente[];
  datas: FeriadoPontual[];
};

export type CalendarioContext = {
  feriadosNacionais: ConjuntoFeriados;
  feriadosEstaduais: ConjuntoFeriados;
  feriadosMunicipais: ConjuntoFeriados;
};

export type CalculoPrazoInput = {
  dataPublicacao: string;
  prazoDias: number;
  contagem: TipoContagem;
  estadoSigla: string;
  municipioId: number;
  tribunalId: number;
  materia: Materia;
  processo: TipoProcesso;
  varaId?: number;
};

export type DiaPrazo = {
  indice: number;
  data: string;
  rotulo: string;
};

export type CalculoPrazoResult = {
  dataPublicacao: string;
  dataInicioContagem: string;
  dias: DiaPrazo[];
  avisos: string[];
};
