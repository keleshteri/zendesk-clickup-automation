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
    try {
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
    } catch (error) {
      console.error('[ClickUpAuthService] getAuthorizedUser error:', error);
      
      return {
        success: false,
        data: {} as ClickUpUser,
        statusCode: error instanceof Error && error.message.includes('401') ? 401 : 500,
        headers: {},
        error: error instanceof Error ? error.message : 'Failed to get authorized user',
      };
    }
  }

  /**
   * Gets the teams the authorized user has access to
   * @param accessToken - Optional access token to use for the request
   * @returns Promise<ApiResponse<AuthorizedTeamsResponse>> - The authorized teams data
   */
  async getAuthorizedTeams(accessToken?: string): Promise<ApiResponse<AuthorizedTeamsResponse>> {
    try {
      const response = await this.httpClient.makeRequest<{ teams: ClickUpTeam[] }>('GET', '/team', undefined, accessToken);
      const validatedTeams = response.data.teams.map(team => ClickUpTeamSchema.parse(team));
      
      return {
        success: true,
        data: { teams: validatedTeams },
        statusCode: response.status,
        headers: response.headers,
      };
    } catch (error) {
      console.error('[ClickUpAuthService] getAuthorizedTeams error:', error);
      
      return {
        success: false,
        data: { teams: [] },
        statusCode: error instanceof Error && error.message.includes('401') ? 401 : 500,
        headers: {},
        error: error instanceof Error ? error.message : 'Failed to get authorized teams',
      };
    }
  }
}