/**
 * @type: services
 * @domain: zendesk
 * @purpose: Central export for all Zendesk services
 */

// HTTP Client Service
export { ZendeskHttpClient } from './zendesk-http-client.service';
export { ZendeskAPIError as ZendeskAPIErrorClass } from './zendesk-http-client.service';

// Zendesk Client Service
export { ZendeskClient } from './zendesk-client.service';

// Zendesk Ticket Service
export { ZendeskTicketService } from './zendesk-ticket.service';