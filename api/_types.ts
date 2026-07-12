export type DbAction =
  | "getDb"
  | "registerUser"
  | "addVehicle"
  | "updateVehicle"
  | "deleteVehicle"
  | "addDriver"
  | "updateDriver"
  | "deleteDriver"
  | "createTrip"
  | "dispatchTrip"
  | "completeTrip"
  | "cancelTrip"
  | "deleteTrip"
  | "addMaintenance"
  | "completeMaintenance"
  | "deleteMaintenance"
  | "addExpense"
  | "deleteExpense"
  | "updateSettings"
  | "resetDemoData";

export interface ApiRequest {
  action: DbAction;
  payload?: unknown;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
