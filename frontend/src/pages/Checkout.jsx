import IframePage from "../components/IframePage";

export default function Checkout() {
  return (
    <IframePage
      src="/checkout.html"
      title="Checkout Rock in Rio 2026"
      testId="checkout-iframe"
    />
  );
}
