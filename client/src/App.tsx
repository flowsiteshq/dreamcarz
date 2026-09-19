import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const Concierge = lazy(() => import("./pages/Concierge"));
const Membership = lazy(() => import("./pages/Membership"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Fleet = lazy(() => import("./pages/Fleet"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HostProgram = lazy(() => import("./pages/HostProgram"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Agent = lazy(() => import("./pages/Agent"));
const Login = lazy(() => import("./pages/Login"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const MyVehicles = lazy(() => import("./pages/dashboard/MyVehicles"));
const Reservations = lazy(() => import("./pages/dashboard/Reservations"));
const MembershipPage = lazy(() => import("./pages/dashboard/MembershipPage"));
const Payments = lazy(() => import("./pages/dashboard/Payments"));
const Rewards = lazy(() => import("./pages/dashboard/Rewards"));
const LocationsPage = lazy(() => import("./pages/dashboard/LocationsPage"));
const Support = lazy(() => import("./pages/dashboard/Support"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const ReportIssue = lazy(() => import("./pages/dashboard/ReportIssue"));
const FAQ = lazy(() => import("./pages/FAQ"));
const VehicleDetail = lazy(() => import("./pages/VehicleDetail"));
const DreamJourney = lazy(() => import("./pages/dashboard/DreamJourney"));
const Opportunity = lazy(() => import("./pages/Opportunity"));
const DriveNetwork = lazy(() => import("./pages/dashboard/DriveNetwork"));
const RentalOnboarding = lazy(() => import("./pages/dashboard/RentalOnboarding"));
const AdminOperations = lazy(() => import("@/pages/dashboard/AdminOperations"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const TransactionOnboarding = lazy(() => import("./pages/dashboard/TransactionOnboarding"));
const DreamCarzId = lazy(() => import("./pages/dashboard/DreamCarzId"));
const IncidentCenter = lazy(() => import("./pages/dashboard/IncidentCenter"));
const FleetPartnerPortal = lazy(() => import("./pages/dashboard/FleetPartnerPortal"));
const AssociatePortal = lazy(() => import("./pages/dashboard/AssociatePortal"));
const Associates = lazy(() => import("./pages/Associates"));
const CommandCenter = lazy(() => import("./pages/dashboard/CommandCenter"));
const NotificationsCenter = lazy(() => import("./pages/dashboard/NotificationsCenter"));
const OpportunityZoomFlyer = lazy(() => import("./pages/OpportunityZoomFlyer"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const AssociateEnroll = lazy(() => import("./pages/AssociateEnroll"));

function RouteLoadingFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f1e9] px-6 text-center text-black" role="status" aria-live="polite">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#d9c28e] bg-white text-sm font-extrabold tracking-[-0.08em] text-[#a98331]">DC</span>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a98331]">DreamCarz</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-[-0.05em]">Loading your next step.</p>
      </div>
    </div>
  );
}

function ConciergeRoute() {
  return <Suspense fallback={<RouteLoadingFallback />}><Concierge /></Suspense>;
}

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
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/concierge" component={ConciergeRoute} />
        <Route path="/membership" component={Membership} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/calculator" component={Calculator} />
        <Route path="/host" component={HostProgram} />
        <Route path="/fleet-partners" component={HostProgram} />
        <Route path="/fleet-partner" component={HostProgram} />
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
        <Route path="/dashboard/incidents" component={IncidentCenter} />
        <Route path="/dashboard/fleet-partner" component={FleetPartnerPortal} />
        <Route path="/dashboard/associate" component={AssociatePortal} />
        <Route path="/associates" component={Associates} />
        <Route path="/associate-enroll" component={AssociateEnroll} />
        <Route path="/opportunity" component={Opportunity} />
        <Route path="/opportunity-zoom" component={OpportunityZoomFlyer} />
        <Route path="/get-started" component={GetStarted} />
        <Route path="/dashboard/drive-network" component={DriveNetwork} />
        <Route path="/dashboard/rental-setup" component={RentalOnboarding} />
        <Route path="/dashboard/transactions" component={TransactionOnboarding} />
        <Route path="/dashboard/notifications" component={NotificationsCenter} />
        <Route path="/dashboard/dreamcarz-id" component={DreamCarzId} />
        <Route path="/dashboard/operations" component={AdminOperations} />
        <Route path="/dashboard/admin" component={AdminOperations} />
        <Route path="/dashboard/admin-operations" component={AdminOperations} />
        <Route path="/admin" component={AdminPortal} />
        <Route path="/dashboard/command-center" component={CommandCenter} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
