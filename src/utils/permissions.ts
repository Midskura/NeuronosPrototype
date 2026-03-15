/**
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * Defines permissions for different user departments in the Neuron OS workflow
 */

export type Department = "BD" | "PD" | "Operations" | "Finance" | "Admin";

export type QuotationAction = 
  | "create_inquiry"
  | "edit_inquiry"
  | "submit_to_pricing"
  | "price_quotation"
  | "send_to_client"
  | "mark_accepted"
  | "mark_rejected"
  | "create_project"
  | "request_revision"
  | "cancel_quotation";

export type ProjectAction =
  | "view_project"
  | "edit_project"
  | "generate_invoice"
  | "assign_operations";

export type BookingAction =
  | "create_booking"
  | "edit_booking"
  | "view_booking"
  | "create_billing"
  | "create_expense";

/**
 * Check if user can perform a quotation action
 */
export function canPerformQuotationAction(
  action: QuotationAction,
  userDepartment: Department
): boolean {
  const permissions: Record<QuotationAction, Department[]> = {
    create_inquiry: ["BD"],
    edit_inquiry: ["BD"],
    submit_to_pricing: ["BD"],
    price_quotation: ["PD"],
    send_to_client: ["BD"],
    mark_accepted: ["BD"],
    mark_rejected: ["BD"],
    create_project: ["BD", "PD", "Admin"], // UPDATED: Allow PD to create projects
    request_revision: ["BD"],
    cancel_quotation: ["BD", "Admin"]
  };

  return permissions[action]?.includes(userDepartment) || false;
}

/**
 * Check if user can perform a project action
 */
export function canPerformProjectAction(
  action: ProjectAction,
  userDepartment: Department
): boolean {
  const permissions: Record<ProjectAction, Department[]> = {
    view_project: ["BD", "PD", "Operations", "Finance", "Admin"], // UPDATED: Allow PD to view projects
    edit_project: ["BD", "PD", "Admin"], // UPDATED: Allow PD to edit projects
    generate_invoice: ["BD", "Finance", "Admin"],
    assign_operations: ["BD", "PD", "Operations", "Admin"] // UPDATED: Allow PD to assign operations
  };

  return permissions[action]?.includes(userDepartment) || false;
}

/**
 * Check if user can perform a booking action
 */
export function canPerformBookingAction(
  action: BookingAction,
  userDepartment: Department
): boolean {
  const permissions: Record<BookingAction, Department[]> = {
    create_booking: ["PD", "Operations", "Admin"], // UPDATED: Allow PD to create bookings
    edit_booking: ["PD", "Operations", "Admin"], // UPDATED: Allow PD to edit bookings
    view_booking: ["BD", "PD", "Operations", "Finance", "Admin"], // UPDATED: Allow PD to view bookings
    create_billing: ["Operations", "Finance", "Admin"],
    create_expense: ["Operations", "Finance", "Admin"]
  };

  return permissions[action]?.includes(userDepartment) || false;
}

/**
 * Get human-readable action name
 */
export function getActionName(action: QuotationAction | ProjectAction | BookingAction): string {
  const names: Record<string, string> = {
    create_inquiry: "Create Inquiry",
    edit_inquiry: "Edit Inquiry",
    submit_to_pricing: "Submit to Pricing",
    price_quotation: "Price Quotation",
    send_to_client: "Send to Client",
    mark_accepted: "Mark as Accepted",
    mark_rejected: "Mark as Rejected",
    create_project: "Create Project",
    request_revision: "Request Revision",
    cancel_quotation: "Cancel Quotation",
    view_project: "View Project",
    edit_project: "Edit Project",
    generate_invoice: "Generate Invoice",
    assign_operations: "Assign to Operations",
    create_booking: "Create Booking",
    edit_booking: "Edit Booking",
    view_booking: "View Booking",
    create_billing: "Create Billing",
    create_expense: "Create Expense"
  };

  return names[action] || action;
}

/**
 * Permission error message
 */
export function getPermissionErrorMessage(
  action: string,
  userDepartment: Department
): string {
  return `Your department (${userDepartment}) does not have permission to perform this action: ${getActionName(action as any)}`;
}