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

    for (const term of ["Member", "Associate", "Fleet Partner", "Join", "Drive", "Build", "Use"]) {
      expect(`${home}\n${opportunity}`).toContain(term);
    }
    expect(navigation).toContain('label: "Associate Path"');
    expect(navigation).toContain('label: "Fleet Partners"');
  });

  it("shows the Tesla Model 3 hero and every vehicle in the supplied current inventory", () => {
    const home = source("client/src/pages/Home.tsx");

    expect(home).toContain("dreamcarz-tesla-model-3-hero");
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
    expect(home).toContain("Contact to confirm rental or sale");
    expect(home).toContain("Availability");
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
    for (const unsupportedVehicle of ["Porsche", "Lamborghini", "Ferrari", "Range Rover", "Mercedes", "Audi", "Honda Civic", "Toyota Camry", "Nissan Altima", "Hyundai Tucson", "Kia Sportage", "Ford Escape", "Rivian", "Cadillac Escalade", "McLaren"]) {
      expect(inventoryContent).not.toContain(unsupportedVehicle);
    }
    const reservations = source("client/src/pages/dashboard/Reservations.tsx");
    expect(reservations).toContain("confirmedVehicleNames.has(reservation.vehicleName)");
    expect(reservations).not.toContain("estimatedWeeklyFee}/week");
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
});
