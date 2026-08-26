import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Membership from "./pages/Membership";
import Fleet from "./pages/Fleet";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import HostProgram from "./pages/HostProgram";
import HowItWorks from "./pages/HowItWorks";
import Agent from "./pages/Agent";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CookiePolicy from "./pages/CookiePolicy";
import MyVehicles from "./pages/dashboard/MyVehicles";
import Reservations from "./pages/dashboard/Reservations";
import MembershipPage from "./pages/dashboard/MembershipPage";
import Payments from "./pages/dashboard/Payments";
import Rewards from "./pages/dashboard/Rewards";
import LocationsPage from "./pages/dashboard/LocationsPage";
import Support from "./pages/dashboard/Support";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ReportIssue from "./pages/dashboard/ReportIssue";
import FAQ from "./pages/FAQ";
import VehicleDetail from "./pages/VehicleDetail";
import DreamJourney from "./pages/dashboard/DreamJourney";
import Opportunity from "./pages/Opportunity";
import DriveNetwork from "./pages/dashboard/DriveNetwork";
import RentalOnboarding from "./pages/dashboard/RentalOnboarding";
import AdminOperations from "./pages/dashboard/AdminOperations";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/membership" component={Membership} />
      <Route path="/fleet" component={Fleet} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/host" component={HostProgram} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/agent" component={Agent} />
      <Route path="/login" component={Login} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/faq" component={FAQ} />
      <Route path="/vehicle" component={VehicleDetail} />
      <Route path="/dashboard/dream-journey" component={DreamJourney} />
      <Route path="/dashboard/vehicles" component={MyVehicles} />
      <Route path="/dashboard/reservations" component={Reservations} />
      <Route path="/dashboard/membership" component={MembershipPage} />
      <Route path="/dashboard/payments" component={Payments} />
      <Route path="/dashboard/rewards" component={Rewards} />
      <Route path="/dashboard/locations" component={LocationsPage} />
      <Route path="/dashboard/support" component={Support} />
      <Route path="/dashboard/settings" component={SettingsPage} />
      <Route path="/dashboard/report" component={ReportIssue} />
      <Route path="/opportunity" component={Opportunity} />
      <Route path="/dashboard/drive-network" component={DriveNetwork} />
      <Route path="/dashboard/rental-setup" component={RentalOnboarding} />
      <Route path="/dashboard/operations" component={AdminOperations} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
