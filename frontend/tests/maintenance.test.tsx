// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MaintenancePage from "../app/maintenance/page";

const newer = {
  name: "energy-backup-20260828T061017000000Z.tar.gz",
  created_at: "2026-08-28T06:10:17Z",
  size_bytes: 30_841_982,
  sha256: "4ae566a09021b08327c1fd70b460ba1695de3c3ea471baa3dbc6cdfa17a46e53",
  file_count: 12,
};
const older = {
  name: "energy-backup-20260828T061013000000Z.tar.gz",
  created_at: "2026-08-28T06:10:13Z",
  size_bytes: 30_841_992,
  sha256: "a7bf3ebb2f81cf65daffda903c7aea6f6bebc71774cf17934891d506a82802c7",
  file_count: 12,
};

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  storageStats: vi.fn(),
  backups: vi.fn(),
  createBackup: vi.fn(),
  deleteBackup: vi.fn(),
  previewStorageCleanup: vi.fn(),
  confirmStorageCleanup: vi.fn(),
} }));

vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

describe("MaintenancePage backup safeguards", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.storageStats.mockResolvedValue({ managed_bytes: 100, managed_files: 2, backup_bytes: 200, backup_count: 2, cache_bytes: 0, cache_files: 0 });
    apiMock.backups.mockResolvedValue([newer, older]);
    apiMock.deleteBackup.mockResolvedValue({ deleted_name: older.name, remaining_count: 1 });
  });

  it("shows an explicit Beijing creation time", async () => {
    render(<MaintenancePage />);

    expect(await screen.findByText(/2026\/08\/28 14:10:17（北京时间）/)).toBeTruthy();
  });

  it("deletes the selected backup only after confirmation and reloads inventory", async () => {
    apiMock.backups.mockResolvedValueOnce([newer, older]).mockResolvedValue([newer]);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MaintenancePage />);

    await userEvent.click(await screen.findByRole("button", { name: `删除备份 ${older.name}` }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining(older.sha256.slice(0, 12)));
    expect(apiMock.deleteBackup).toHaveBeenCalledWith(older.name);
    await waitFor(() => expect(apiMock.backups).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(`已删除备份 ${older.name}`)).toBeTruthy();
  });

  it("does not delete when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<MaintenancePage />);

    await userEvent.click(await screen.findByRole("button", { name: `删除备份 ${older.name}` }));

    expect(apiMock.deleteBackup).not.toHaveBeenCalled();
  });

  it("disables deletion when only one backup remains", async () => {
    apiMock.backups.mockResolvedValue([newer]);
    render(<MaintenancePage />);

    const button = await screen.findByRole("button", { name: `删除备份 ${newer.name}` });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("title")).toBe("至少保留一份备份");
  });
});
