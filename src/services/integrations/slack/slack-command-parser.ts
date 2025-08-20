export interface SlackCommand {
  isCommand: boolean;
  command: string;
  args: string[];
  originalText: string;
}

export class SlackCommandParser {
  /**
   * Parse Slack command-style queries (slash commands, hashtag commands)
   */
  static parseSlackCommand(text: string): SlackCommand {
    const trimmedText = text.trim();
    
    // Check for slash commands: /help, /analyze, /status, etc.
    const slashMatch = trimmedText.match(/^\/([a-zA-Z]+)(?:\s+(.*))?$/);
    if (slashMatch) {
      const command = slashMatch[1].toLowerCase();
      const argsString = slashMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    // Check for hashtag commands: #help, #analyze, #status, etc.
    const hashMatch = trimmedText.match(/^#([a-zA-Z]+)(?:\s+(.*))?$/);
    if (hashMatch) {
      const command = hashMatch[1].toLowerCase();
      const argsString = hashMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    // Check for simple command words at the start
    const simpleMatch = trimmedText.match(/^(help|status|analytics|list|analyze|summarize|create)(?:\s+(.*))?$/i);
    if (simpleMatch) {
      const command = simpleMatch[1].toLowerCase();
      const argsString = simpleMatch[2] || '';
      const args = argsString.trim() ? argsString.split(/\s+/) : [];
      
      return {
        isCommand: true,
        command,
        args,
        originalText: trimmedText
      };
    }
    
    return {
      isCommand: false,
      command: '',
      args: [],
      originalText: trimmedText
    };
  }
}