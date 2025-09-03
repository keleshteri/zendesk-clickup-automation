import type { ApiResponse } from '../types/api.types';
import type {
  ClickUpUser,
  ClickUpTeam,
  AuthorizedTeamsResponse,
} from '../types/user.types';
import { ClickUpUserSchema, ClickUpTeamSchema } from '../types/user.types';
import type { ClickUpHttpClient } from './clickup-http-client.service';

/**
 * Interface for ClickUp authentication operations
 */
export interface IClickUpAuthService {
  /**
   * Validates the API token by attempting to fetch user information
   */
  validateToken(accessToken?: string): Promise<boolean>;
  
  /**
   * Gets the authorized user information
   */
  getAuthorizedUser(accessToken?: string): Promise<ApiResponse<ClickUpUser>>;
  
  /**
   * Gets the teams the authorized user has access to
   */
  getAuthorizedTeams(accessToken?: string): Promise<ApiResponse<AuthorizedTeamsResponse>>;
}

/**
 * Service for handling ClickUp authentication operations
 * Implements authentication-related functionality separated from the main client
 */
export class ClickUpAuthService implements IClickUpAuthService {
  constructor(private readonly httpClient: ClickUpHttpClient) {}

  /**
   * Validates the API token by attempting to fetch user information
   * @param accessToken - Optional access token to validate
   * @returns Promise<boolean> - true if token is valid, false otherwise
   */
  async validateToken(accessToken?: string): Promise<boolean> {
    try {
      await this.getAuthorizedUser(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the authorized user information
   * @param accessToken - Optional access token to use for the request
   * @returns Promise<ApiResponse<ClickUpUser>> - The authorized user data
   */
  async getAuthorizedUser(accessToken?: string): Promise<ApiResponse<ClickUpUser>> {
    const response = await this.httpClient.makeRequest<{ user: ClickUpUser }>('GET', '/user', undefined, accessToken);
    
    // Debug: Log the actual response to see the structure
    console.log('[ClickUpAuthService] Raw user response:', JSON.stringify(response.data, null, 2));
    
    const validatedUser = ClickUpUserSchema.parse(response.data.user);
    
    return {
      success: true,
      data: validatedUser,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  /**
   * Gets the teams the authorized user has access to
   * @param accessToken - Optional access token to use for the request
   * @returns Promise<ApiResponse<AuthorizedTeamsResponse>> - The authorized teams data
   */
  async getAuthorizedTeams(accessToken?: string): Promise<ApiResponse<AuthorizedTeamsResponse>> {
    const response = await this.httpClient.makeRequest<{ teams: ClickUpTeam[] }>('GET', '/team', undefined, accessToken);
    const validatedTeams = response.data.teams.map(team => ClickUpTeamSchema.parse(team));
    
    return {
      success: true,
      data: { teams: validatedTeams },
      statusCode: response.status,
      headers: response.headers,
    };
  }
}