import IframePage from "../components/IframePage";

export default function PagamentoCartao() {
  return (
    <IframePage
      src="/pagamento-cartao.html"
      title="Forma de pagamento - Rock in Rio 2026"
      testId="pagamento-cartao-iframe"
      subtitle="Aguarde enquanto processamos seu pedido"
    />
  );
}
