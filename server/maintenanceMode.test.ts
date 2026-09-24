import { afterEach, describe, expect, it, vi } from "vitest";
import { MAINTENANCE_MODE_ENV, isMaintenanceExemptPath, maintenanceModeGate } from "./maintenanceMode";

const previousValue = process.env[MAINTENANCE_MODE_ENV];

afterEach(() => {
  if (previousValue === undefined) delete process.env[MAINTENANCE_MODE_ENV];
  else process.env[MAINTENANCE_MODE_ENV] = previousValue;
});

function createResponse() {
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(),
    type: vi.fn(),
    send: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.type.mockReturnValue(response);
  return response;
}

describe("maintenanceModeGate", () => {
  it("does not block requests when maintenance mode is disabled", () => {
    delete process.env[MAINTENANCE_MODE_ENV];
    const next = vi.fn();
    maintenanceModeGate()({ method: "GET", path: "/login", headers: { accept: "text/html" } } as never, createResponse() as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("renders the Coming Soon page and blocks login during maintenance", () => {
    process.env[MAINTENANCE_MODE_ENV] = "true";
    const response = createResponse();
    maintenanceModeGate()({ method: "GET", path: "/login", headers: { accept: "text/html" } } as never, response as never, vi.fn());

    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store, max-age=0, must-revalidate");
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "3600");
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.send).toHaveBeenCalledWith(expect.stringContaining("Coming Soon"));
  });

  it("keeps approved lead intake endpoints available during maintenance", () => {
    process.env[MAINTENANCE_MODE_ENV] = "true";
    const next = vi.fn();
    maintenanceModeGate()({ method: "POST", path: "/api/integrations/zapier/meta-leads", headers: {} } as never, createResponse() as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("recognizes only approved operational API exceptions", () => {
    expect(isMaintenanceExemptPath("/api/integrations/zapier/meta-leads")).toBe(true);
    expect(isMaintenanceExemptPath("/api/stripe/webhook")).toBe(true);
    expect(isMaintenanceExemptPath("/api/auth/google")).toBe(false);
    expect(isMaintenanceExemptPath("/admin")).toBe(false);
  });
});
