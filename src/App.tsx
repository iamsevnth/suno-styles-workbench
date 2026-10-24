import { useCallback, useState } from "react";
import Dialog, { CLOSED_DIALOG, DialogState, ShowDialog } from "./components/Dialog.tsx";
import SiteFooter from "./components/layout/SiteFooter.tsx";
import SiteHeader from "./components/layout/SiteHeader.tsx";
import LyricsStudio from "./components/LyricsStudio.tsx";
import SkillsStudio from "./components/skills/SkillsStudio.tsx";
import StudioDeck from "./components/studio/StudioDeck.tsx";
import StylesWorkbench from "./components/styles/StylesWorkbench.tsx";
import { useHashRoute } from "./hooks/useHashRoute.ts";
import { copyToClipboard } from "./lib/browser/clipboard.ts";
import GuidePage from "./pages/guide/GuidePage.tsx";
import HomePage from "./pages/HomePage.tsx";
import { isStudioRoute, RouteId, StudioRouteId } from "./routes.ts";

function StudioTool({ route, showDialog }: { route: StudioRouteId; showDialog: ShowDialog }) {
  if (route === "styles") return <StylesWorkbench showDialog={showDialog} />;
  if (route === "lyrics") return <LyricsStudio onShowDialog={showDialog} copyToClipboard={copyToClipboard} />;
  return <SkillsStudio showDialog={showDialog} />;
}

function Page({ route, showDialog }: { route: RouteId; showDialog: ShowDialog }) {
  if (isStudioRoute(route)) {
    return (
      <StudioDeck route={route}>
        <StudioTool route={route} showDialog={showDialog} />
      </StudioDeck>
    );
  }
  return route === "guide" ? <GuidePage /> : <HomePage />;
}

export default function App() {
  const route = useHashRoute();
  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);
  const showDialog = useCallback<ShowDialog>((kind, title, body) => setDialog({ open: true, kind, title, body }), []);
  const closeDialog = useCallback(() => setDialog(CLOSED_DIALOG), []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col font-sans">
      <SiteHeader route={route} />
      <Page route={route} showDialog={showDialog} />
      <SiteFooter />
      <Dialog state={dialog} onClose={closeDialog} />
    </div>
  );
}
