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
  validateToken(): Promise<boolean>;
  
  /**
   * Gets the authorized user information
   */
  getAuthorizedUser(): Promise<ApiResponse<ClickUpUser>>;
  
  /**
   * Gets the teams the authorized user has access to
   */
  getAuthorizedTeams(): Promise<ApiResponse<AuthorizedTeamsResponse>>;
}

/**
 * Service for handling ClickUp authentication operations
 * Implements authentication-related functionality separated from the main client
 */
export class ClickUpAuthService implements IClickUpAuthService {
  constructor(private readonly httpClient: ClickUpHttpClient) {}

  /**
   * Validates the API token by attempting to fetch user information
   * @returns Promise<boolean> - true if token is valid, false otherwise
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getAuthorizedUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the authorized user information
   * @returns Promise<ApiResponse<ClickUpUser>> - The authorized user data
   */
  async getAuthorizedUser(): Promise<ApiResponse<ClickUpUser>> {
    const response = await this.httpClient.makeRequest<{ user: ClickUpUser }>('GET', '/user');
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
   * @returns Promise<ApiResponse<AuthorizedTeamsResponse>> - The authorized teams data
   */
  async getAuthorizedTeams(): Promise<ApiResponse<AuthorizedTeamsResponse>> {
    const response = await this.httpClient.makeRequest<{ teams: ClickUpTeam[] }>('GET', '/team');
    const validatedTeams = response.data.teams.map(team => ClickUpTeamSchema.parse(team));
    
    return {
      success: true,
      data: { teams: validatedTeams },
      statusCode: response.status,
      headers: response.headers,
    };
  }
}