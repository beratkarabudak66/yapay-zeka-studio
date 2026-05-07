import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import PresentationTool from "./pages/PresentationTool";
import LogoGenerator from "./pages/LogoGenerator";
import VoiceTool from "./pages/VoiceTool";
import VideoTool from "./pages/VideoTool";
import VideoTest from "./pages/VideoTest";
import CodingAssistant from "./pages/CodingAssistant";
import UserHistory from "./pages/UserHistory";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/presentation" component={PresentationTool} />
        <Route path="/logo" component={LogoGenerator} />
        <Route path="/voice" component={VoiceTool} />
        <Route path="/video" component={VideoTool} />
        <Route path="/video-test" component={VideoTest} />
        <Route path="/coding" component={CodingAssistant} />
        <Route path="/history" component={UserHistory} />
        <Route path="/admin/feedbacks" component={AdminDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
