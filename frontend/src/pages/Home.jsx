import IframePage from "../components/IframePage";

/**
 * Home renders the user-uploaded HTML file as-is (full viewport).
 * The original HTML is served statically from /public/rock-in-rio.html.
 * Admin routes (/donaspainel/*) keep working because this React shell is preserved.
 */
export default function Home() {
  return (
    <IframePage
      src="/rock-in-rio.html"
      title="Rock in Rio 2026"
      testId="home-iframe"
      showLoader={false}
    />
  );
}
