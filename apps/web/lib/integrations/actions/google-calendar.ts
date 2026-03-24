import { BaseIntegrationAction } from "./base";

export class GoogleCalendarIntegration extends BaseIntegrationAction {
  constructor(connectionId: string) {
    super("google-calendar", connectionId);
  }

  async listEvents(calendarId: string = "primary", timeMin?: string, timeMax?: string) {
    const params: Record<string, string> = { singleEvents: "true", orderBy: "startTime" };
    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;
    return this.request("GET", `/calendar/v3/calendars/${calendarId}/events`, undefined, params);
  }

  async createEvent(calendarId: string = "primary", summary: string, start: string, end: string, description?: string) {
    return this.request("POST", `/calendar/v3/calendars/${calendarId}/events`, {
      summary, description,
      start: { dateTime: start },
      end: { dateTime: end },
    });
  }

  async updateEvent(calendarId: string, eventId: string, data: Record<string, unknown>) {
    return this.request("PATCH", `/calendar/v3/calendars/${calendarId}/events/${eventId}`, data);
  }

  async deleteEvent(calendarId: string, eventId: string) {
    return this.request("DELETE", `/calendar/v3/calendars/${calendarId}/events/${eventId}`);
  }

  async getFreeBusy(timeMin: string, timeMax: string, calendarIds: string[] = ["primary"]) {
    return this.request("POST", "/calendar/v3/freeBusy", {
      timeMin, timeMax,
      items: calendarIds.map((id) => ({ id })),
    });
  }
}
