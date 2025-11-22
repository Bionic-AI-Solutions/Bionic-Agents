import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AgentsDashboard from "./pages/AgentsDashboard";
import AgentConfig from "./pages/AgentConfig";
import AgentDeploy from "./pages/AgentDeploy";
import AgentTest from "./pages/AgentTest";
import AgentDeploymentStatus from "./pages/AgentDeploymentStatus";
import Settings from "./pages/Settings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={AgentsDashboard} />
      <Route path="/agents/:id" component={AgentConfig} />
      <Route path="/agents/:id/deploy" component={AgentDeploy} />
      <Route path="/agents/:id/test" component={AgentTest} />
      <Route path="/agents/:id/status" component={AgentDeploymentStatus} />
      <Route path="/settings" component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
