/**
 * @type: interface
 * @domain: zendesk
 * @purpose: Export all Zendesk domain interfaces
 * @solid-principle: ISP
 */

// Main client interfaces
export type { IZendeskClient } from './zendesk-client.interface';
export type { IZendeskTicketService } from './zendesk-ticket-service.interface';

// HTTP client interfaces
export type { IZendeskHttpClient, ZendeskAPIResponse } from './http-client.interface';