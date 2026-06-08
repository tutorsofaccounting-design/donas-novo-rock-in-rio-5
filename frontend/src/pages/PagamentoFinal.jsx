import IframePage from "../components/IframePage";

export default function PagamentoFinal() {
  return (
    <IframePage
      src="/pagamento-final.html"
      title="Confirmação do pedido - Rock in Rio 2026"
      testId="pagamento-final-iframe"
      subtitle="Carregando o resumo do seu pedido"
    />
  );
}
