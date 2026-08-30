import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("DreamCarz ecosystem process content", () => {
  it("presents the approved Member, Associate, and Fleet Partner pathways publicly", () => {
    const home = source("client/src/pages/Home.tsx");
    const opportunity = source("client/src/pages/Opportunity.tsx");
    const navigation = source("client/src/components/Navigation.tsx");

    for (const term of ["Member", "Associate", "Fleet Partner"]) {
      expect(`${home}\n${opportunity}`).toContain(term);
    }
    expect(home).toContain("Rent a vehicle");
    expect(home).toContain("Buy a vehicle");
    expect(home).toContain("Explore pricing");
    expect(navigation).toContain('label: "Associate Path"');
    expect(navigation).toContain('label: "Fleet Partners"');
  });

  it("shows the Tesla Model 3 hero and every vehicle in the supplied current inventory", () => {
    const home = source("client/src/pages/Home.tsx");

    expect(home).toContain("files.manuscdn.com");
    expect(home).toContain("gyIfJAbATfYnyeYI");
    for (const vehicle of [
      ["2024", "Chevrolet", "Malibu"],
      ["2022", "Chevrolet", "Traverse"],
      ["2024", "Ford", "Fusion"],
      ["2020", "Chevrolet", "Traverse"],
      ["2019", "Chevrolet", "Malibu"],
      ["2015", "Ford", "Taurus"],
      ["2020", "Chevrolet", "Equinox"],
    ]) {
      const [year, make, model] = vehicle;
      expect(home).toContain(`year: "${year}"`);
      expect(home).toContain(`make: "${make}"`);
      expect(home).toContain(`model: "${model}"`);
    }
    expect(home).toContain('color: "Gray"');
    expect(home).toContain('color: "Black"');
    expect(home).toContain('color: "White"');
    expect(home).toContain("Rent or buy");
    expect(home).toContain('aria-label="Find your vehicle path"');
  });

  it("keeps public, detail, FAQ, and concierge inventory content limited to the confirmed vehicles", () => {
    const inventoryContent = [
      source("client/src/pages/Fleet.tsx"),
      source("client/src/pages/VehicleDetail.tsx"),
      source("client/src/pages/dashboard/MyVehicles.tsx"),
      source("client/src/pages/dashboard/Reservations.tsx"),
      source("client/src/pages/FAQ.tsx"),
      source("client/src/components/AIConcierge.tsx"),
    ].join("\n");

    for (const vehicle of [
      "2024 Chevrolet Malibu",
      "2022 Chevrolet Traverse",
      "2024 Ford Fusion",
      "2020 Chevrolet Traverse",
      "2019 Chevrolet Malibu",
      "2015 Ford Taurus",
      "2020 Chevrolet Equinox",
    ]) {
      expect(inventoryContent).toContain(vehicle);
    }
    for (const unsupportedVehicle of ["Porsche", "Lamborghini", "Ferrari", "Range Rover", "Audi", "Honda Civic", "Hyundai Tucson", "Kia Sportage", "Ford Escape", "Rivian", "Cadillac Escalade", "McLaren"]) {
      expect(inventoryContent).not.toContain(unsupportedVehicle);
    }
    expect(inventoryContent).toContain('availability: "coming-soon"');
    expect(inventoryContent).toContain("Coming Soon · reserve your vehicle");
    expect(inventoryContent).toContain("Reserve your vehicle");
    const reservations = source("client/src/pages/dashboard/Reservations.tsx");
    expect(reservations).toContain("confirmedVehicleNames.has(reservation.vehicleName)");
    expect(reservations).not.toContain("estimatedWeeklyFee}/week");
  });

  it("renders a corresponding confirmed vehicle image on public and member inventory cards", () => {
    const home = source("client/src/pages/Home.tsx");
    const fleet = source("client/src/pages/Fleet.tsx");
    const detail = source("client/src/pages/VehicleDetail.tsx");
    const memberVehicles = source("client/src/pages/dashboard/MyVehicles.tsx");
    for (const inventorySurface of [home, fleet, detail, memberVehicles]) {
      expect(inventorySurface).toContain("files.manuscdn.com");
      expect(inventorySurface).not.toContain("/manus-storage/dreamcarz-");
    }
    expect(home).toContain("gyIfJAbATfYnyeYI");
    expect(fleet).toContain("bg-transparent");
    expect(memberVehicles).toContain("bg-transparent");
  });

  it("keeps direct full-screen, rental, and purchase paths available for confirmed vehicles", () => {
    const fleet = source("client/src/pages/Fleet.tsx");
    const detail = source("client/src/pages/VehicleDetail.tsx");
    const memberVehicles = source("client/src/pages/dashboard/MyVehicles.tsx");
    const vehicleDialog = source("client/src/components/VehicleExperienceDialog.tsx");

    expect(fleet).toContain("Rent this vehicle");
    expect(fleet).toContain("Buy this vehicle");
    expect(detail).toContain("Rent this vehicle");
    expect(detail).toContain("Buy this vehicle");
    expect(memberVehicles).toContain("View full vehicle · Rent or buy");
    expect(vehicleDialog).toContain("Submit rental request");
    expect(vehicleDialog).toContain("Submit purchase inquiry");
    expect(vehicleDialog).toContain("vehicleInquiries.create");
  });

  it("keeps member value and dream-journey messaging free of fixed conversion and outcome projections", () => {
    const membership = source("client/src/pages/dashboard/MembershipPage.tsx");
    const journey = source("client/src/pages/dashboard/DreamJourney.tsx");
    const shell = source("client/src/components/DashboardShell.tsx");
    const content = `${membership}\n${journey}\n${shell}`;

    expect(content).toContain("Eligibility, release, redemption");
    expect(content).not.toContain("1.2x multiplier");
    expect(content).not.toContain("Credit Free threshold");
    expect(content).not.toContain("DCP Accumulation Projection");
    expect(content).not.toContain("$2,850 Value");
  });

  it("uses vehicle-access packages instead of unsupported membership pricing and links them to confirmed inventory", () => {
    const membership = source("client/src/pages/dashboard/MembershipPage.tsx");
    const fleet = source("client/src/pages/Fleet.tsx");

    for (const packageLabel of ["Entry vehicle access", "Mid-Range vehicle access", "Elite vehicle access"]) {
      expect(membership).toContain(packageLabel);
    }
    expect(membership).toContain('href: "/fleet?access=entry"');
    expect(membership).toContain('href: "/fleet?access=mid-range"');
    expect(membership).toContain('href: "/fleet?access=elite"');
    expect(membership).not.toContain("$39.95");
    expect(membership).not.toContain("$69.95");
    expect(membership).not.toContain("$99.95");
    expect(membership).not.toContain("$149.95");
    expect(fleet).toContain('new URLSearchParams(window.location.search).get("access")');
    expect(fleet).toContain('access: "entry"');
    expect(fleet).toContain('access: "mid-range"');
    expect(fleet).toContain('access: "elite"');
  });

  it("keeps the concierge free of static account, payment, response-time, and payout claims", () => {
    const concierge = source("client/src/components/AIConcierge.tsx");

    expect(concierge).toContain("trpc.concierge.guide.useMutation");
    expect(concierge).toContain("Private live-record guidance");
    expect(concierge).toContain("Guidance only. Staff review controls availability");
    expect(concierge).not.toContain("renewing Jun 28, 2026");
    expect(concierge).not.toContain("$99.95/month");
    expect(concierge).not.toContain("within 2 hours");
    expect(concierge).not.toContain("dangerouslySetInnerHTML");
  });

  it("labels the in-app business area as the Associate Path and preserves compliant guidance", () => {
    const shell = source("client/src/components/DashboardShell.tsx");
    const associateHub = source("client/src/pages/dashboard/DriveNetwork.tsx");

    expect(shell).toContain('label: "Associate Path"');
    expect(associateHub).toContain("Build customers. Create progress.");
    expect(associateHub).toContain("Build verified customer relationships");
    expect(associateHub).toContain("does not make income, rank, or outcome guarantees");
  });

  it("gives My Account a member-process summary and a distinct Fleet Partner entry point", () => {
    const dashboard = source("client/src/pages/Dashboard.tsx");

    expect(dashboard).toContain("Join → Drive → Build → Use");
    expect(dashboard).toContain("Fleet Partner Path");
    expect(dashboard).toContain("Final vehicle, membership, activity, compensation, fleet, and program terms");
  });

  it("gives homepage actions concrete destinations and resets scroll on every route change", () => {
    const home = source("client/src/pages/Home.tsx");
    const app = source("client/src/App.tsx");

    for (const destination of [
      'href="/fleet?intent=rent"',
      'href="/fleet?intent=buy"',
      'href="/pricing"',
      'href="/contact"',
      'navigate("/fleet?intent=rent")',
      'navigate("/fleet?intent=buy")',
      'navigate("/pricing")',
      'navigate(isAuthenticated ? "/dashboard" : "/login")',
      '`/vehicle?id=${vehicle.id}`',
    ]) {
      expect(home).toContain(destination);
    }

    expect(app).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" })');
    expect(app).toContain("function ScrollToTop()");
  });
});
