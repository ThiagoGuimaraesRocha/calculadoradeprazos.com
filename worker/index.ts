import { executarCalculoPrazo, isHandlerErro } from '../src/server/handlerCalculoPrazo';
import type { CalculoPrazoApiPayload } from '../src/services/dadosLocalidade';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/calculo-prazo') {
      if (request.method !== 'POST') {
        return Response.json({ erro: 'Use POST.' }, { status: 405 });
      }

      let body: CalculoPrazoApiPayload;
      try {
        body = (await request.json()) as CalculoPrazoApiPayload;
      } catch {
        return Response.json({ erro: 'JSON inválido.' }, { status: 400 });
      }

      const resultado = executarCalculoPrazo(body);
      if (isHandlerErro(resultado)) {
        return Response.json({ erro: resultado.mensagem }, { status: resultado.status });
      }

      return Response.json(resultado);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler;
