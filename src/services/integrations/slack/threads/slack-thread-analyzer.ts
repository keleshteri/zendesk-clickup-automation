/**
 * @ai-metadata
 * @component: SlackThreadAnalyzer
 * @description: Analyzes Slack thread conversations for sentiment, engagement, patterns, and insights
 * @last-update: 2024-01-21
 * @last-editor: system@zendesk-clickup-automation.com
 * @changelog: ./docs/changelog/slack-thread-analyzer.md
 * @stability: stable
 * @edit-permissions: "method-specific"
 * @method-permissions: { "analyzeThread": "allow", "analyzeSentiment": "read-only", "analyzePatterns": "read-only" }
 * @dependencies: ["./slack-thread-context.ts", "../utils/slack-formatters.ts"]
 * @tests: ["./tests/slack-thread-analyzer.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Advanced thread analysis with sentiment detection and pattern recognition. Critical for conversation insights."
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { SlackThreadContext } from './slack-thread-context';
import { SlackFormatters } from '../utils/slack-formatters';

/**
 * Interface for thread analysis results
 */
export interface ThreadAnalysis {
  summary: {
    messageCount: number;
    participantCount: number;
    duration: string;
    startTime: Date;
    lastActivity: Date;
  };
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  engagement: {
    averageResponseTime: number; // in minutes
    mostActiveParticipant: string;
    participationDistribution: Record<string, number>;
    peakActivityPeriod: string;
  };
  content: {
    keyTopics: string[];
    actionItems: string[];
    decisions: string[];
    questions: string[];
    mentions: {
      users: string[];
      channels: string[];
      urls: string[];
    };
  };
  patterns: {
    conversationType: 'support' | 'discussion' | 'announcement' | 'collaboration' | 'escalation';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    resolutionStatus: 'resolved' | 'pending' | 'escalated' | 'abandoned';
    followUpRequired: boolean;
  };
  insights: {
    recommendations: string[];
    potentialIssues: string[];
    successIndicators: string[];
    nextSteps: string[];
  };
}

/**
 * Interface for sentiment analysis of individual messages
 */
export interface MessageSentiment {
  messageId: string;
  userId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
  keywords: string[];
}

/**
 * Interface for conversation patterns
 */
export interface ConversationPattern {
  type: 'question-answer' | 'problem-solution' | 'request-response' | 'discussion' | 'escalation';
  participants: string[];
  startMessageId: string;
  endMessageId?: string;
  duration: number; // in minutes
  resolved: boolean;
}

/**
 * Analyzer for Slack thread conversations and patterns
 */
export class SlackThreadAnalyzer {
  private threadContext: SlackThreadContext;

  constructor(threadContext: SlackThreadContext) {
    this.threadContext = threadContext;
  }

  /**
   * Perform comprehensive analysis of the thread
   */
  async analyzeThread(): Promise<ThreadAnalysis> {
    const messages = this.threadContext.getMessages();
    const participants = this.threadContext.getParticipants();
    const activities = this.threadContext.getActivities();

    return {
      summary: this.analyzeSummary(),
      sentiment: this.analyzeSentiment(),
      engagement: this.analyzeEngagement(),
      content: this.analyzeContent(),
      patterns: this.analyzePatterns(),
      insights: this.generateInsights()
    };
  }

  /**
   * Analyze basic thread summary metrics
   */
  private analyzeSummary(): ThreadAnalysis['summary'] {
    const messages = this.threadContext.getMessages();
    const participants = this.threadContext.getParticipants();
    const metadata = this.threadContext.getMetadata();

    const startTime = messages.length > 0 ? new Date(parseInt(messages[0].ts)) : new Date();
    const lastActivity = messages.length > 0 ? new Date(parseInt(messages[messages.length - 1].ts)) : new Date();
    const duration = this.calculateDuration(startTime, lastActivity);

    return {
      messageCount: messages.length,
      participantCount: participants.length,
      duration,
      startTime,
      lastActivity
    };
  }

  /**
   * Analyze sentiment across the thread
   */
  private analyzeSentiment(): ThreadAnalysis['sentiment'] {
    const messages = this.threadContext.getMessages();
    const sentiments = messages.map(msg => this.analyzeMessageSentiment(msg.text));
    
    const scores = sentiments.map(s => s.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const distribution = {
      positive: sentiments.filter(s => s.sentiment === 'positive').length / sentiments.length,
      neutral: sentiments.filter(s => s.sentiment === 'neutral').length / sentiments.length,
      negative: sentiments.filter(s => s.sentiment === 'negative').length / sentiments.length
    };

    const overall = averageScore > 0.1 ? 'positive' : averageScore < -0.1 ? 'negative' : 'neutral';

    return {
      overall,
      score: averageScore,
      distribution
    };
  }

  /**
   * Analyze engagement patterns
   */
  private analyzeEngagement(): ThreadAnalysis['engagement'] {
    const messages = this.threadContext.getMessages();
    const participants = this.threadContext.getParticipants();
    
    // Calculate response times
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = (new Date(parseInt(messages[i].ts)).getTime() - new Date(parseInt(messages[i-1].ts)).getTime()) / (1000 * 60);
      responseTimes.push(timeDiff);
    }
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Calculate participation distribution
    const participationCounts: Record<string, number> = {};
    messages.forEach(msg => {
      participationCounts[msg.user] = (participationCounts[msg.user] || 0) + 1;
    });

    const mostActiveParticipant = Object.entries(participationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const participationDistribution: Record<string, number> = {};
    Object.entries(participationCounts).forEach(([userId, count]) => {
      participationDistribution[userId] = count / messages.length;
    });

    // Determine peak activity period
    const peakActivityPeriod = this.findPeakActivityPeriod(messages);

    return {
      averageResponseTime,
      mostActiveParticipant,
      participationDistribution,
      peakActivityPeriod
    };
  }

  /**
   * Analyze thread content for key information
   */
  private analyzeContent(): ThreadAnalysis['content'] {
    const messages = this.threadContext.getMessages();
    const allContent = messages.map(msg => msg.text).join(' ');

    return {
      keyTopics: this.extractKeyTopics(allContent),
      actionItems: this.extractActionItems(messages),
      decisions: this.extractDecisions(messages),
      questions: this.extractQuestions(messages),
      mentions: this.extractMentions(allContent)
    };
  }

  /**
   * Analyze conversation patterns
   */
  private analyzePatterns(): ThreadAnalysis['patterns'] {
    const messages = this.threadContext.getMessages();
    const activities = this.threadContext.getActivities();
    
    const conversationType = this.determineConversationType(messages, activities);
    const urgencyLevel = this.determineUrgencyLevel(messages);
    const resolutionStatus = this.determineResolutionStatus(messages, activities);
    const followUpRequired = this.determineFollowUpRequired(messages, resolutionStatus);

    return {
      conversationType,
      urgencyLevel,
      resolutionStatus,
      followUpRequired
    };
  }

  /**
   * Generate actionable insights
   */
  private generateInsights(): ThreadAnalysis['insights'] {
    const messages = this.threadContext.getMessages();
    const sentiment = this.analyzeSentiment();
    const engagement = this.analyzeEngagement();
    const patterns = this.analyzePatterns();

    const recommendations: string[] = [];
    const potentialIssues: string[] = [];
    const successIndicators: string[] = [];
    const nextSteps: string[] = [];

    // Generate recommendations based on analysis
    if (engagement.averageResponseTime > 60) {
      recommendations.push('Consider setting up automated responses for faster initial acknowledgment');
    }

    if (sentiment.overall === 'negative') {
      recommendations.push('Schedule a follow-up call to address concerns and improve satisfaction');
      potentialIssues.push('Negative sentiment detected - customer satisfaction may be at risk');
    }

    if (patterns.urgencyLevel === 'high' || patterns.urgencyLevel === 'critical') {
      recommendations.push('Escalate to senior support team for immediate attention');
      nextSteps.push('Assign to priority queue for urgent resolution');
    }

    if (patterns.resolutionStatus === 'pending') {
      nextSteps.push('Follow up within 24 hours to check resolution progress');
    }

    if (sentiment.overall === 'positive' && patterns.resolutionStatus === 'resolved') {
      successIndicators.push('Customer satisfaction achieved with successful resolution');
    }

    if (Object.keys(engagement.participationDistribution).length === 1) {
      potentialIssues.push('Single participant conversation - may indicate lack of engagement');
    }

    return {
      recommendations,
      potentialIssues,
      successIndicators,
      nextSteps
    };
  }

  /**
   * Analyze sentiment of individual message
   */
  private analyzeMessageSentiment(content: string): MessageSentiment {
    // Simple sentiment analysis based on keywords
    const positiveKeywords = ['thank', 'great', 'excellent', 'perfect', 'love', 'amazing', 'wonderful', 'fantastic', 'good', 'happy', 'pleased', 'satisfied'];
    const negativeKeywords = ['problem', 'issue', 'error', 'bug', 'broken', 'fail', 'wrong', 'bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry', 'disappointed'];
    
    const words = content.toLowerCase().split(/\s+/);
    let score = 0;
    const foundKeywords: string[] = [];

    words.forEach(word => {
      if (positiveKeywords.some(keyword => word.includes(keyword))) {
        score += 1;
        foundKeywords.push(word);
      } else if (negativeKeywords.some(keyword => word.includes(keyword))) {
        score -= 1;
        foundKeywords.push(word);
      }
    });

    // Normalize score
    const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, words.length / 10)));
    const sentiment = normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral';
    const confidence = Math.abs(normalizedScore);

    return {
      messageId: '', // Would be set by caller
      userId: '', // Would be set by caller
      sentiment,
      score: normalizedScore,
      confidence,
      keywords: foundKeywords
    };
  }

  /**
   * Extract key topics from content
   */
  private extractKeyTopics(content: string): string[] {
    // Simple topic extraction based on common patterns
    const topics: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    // Look for technical terms, product names, etc.
    const technicalTerms = words.filter(word => 
      word.length > 4 && 
      (word.includes('api') || word.includes('database') || word.includes('server') || 
       word.includes('integration') || word.includes('ticket') || word.includes('task'))
    );
    
    topics.push(...technicalTerms.slice(0, 5)); // Limit to top 5
    
    return Array.from(new Set(topics)); // Remove duplicates
  }

  /**
   * Extract action items from messages
   */
  private extractActionItems(messages: any[]): string[] {
    const actionItems: string[] = [];
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Look for action-oriented phrases
      if (content.includes('need to') || content.includes('should') || content.includes('will')) {
        const sentences = msg.content.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes('need to') || 
              sentence.toLowerCase().includes('should') || 
              sentence.toLowerCase().includes('will')) {
            actionItems.push(sentence.trim());
          }
        });
      }
    });
    
    return actionItems.slice(0, 10); // Limit to top 10
  }

  /**
   * Extract decisions from messages
   */
  private extractDecisions(messages: any[]): string[] {
    const decisions: string[] = [];
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Look for decision-oriented phrases
      if (content.includes('decided') || content.includes('agreed') || content.includes('resolved')) {
        const sentences = msg.content.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes('decided') || 
              sentence.toLowerCase().includes('agreed') || 
              sentence.toLowerCase().includes('resolved')) {
            decisions.push(sentence.trim());
          }
        });
      }
    });
    
    return decisions.slice(0, 5); // Limit to top 5
  }

  /**
   * Extract questions from messages
   */
  private extractQuestions(messages: any[]): string[] {
    const questions: string[] = [];
    
    messages.forEach(msg => {
      const sentences = msg.content.split(/[.!?]/);
      sentences.forEach(sentence => {
        if (sentence.trim().endsWith('?') || 
            sentence.toLowerCase().includes('how') || 
            sentence.toLowerCase().includes('what') || 
            sentence.toLowerCase().includes('when') || 
            sentence.toLowerCase().includes('where') || 
            sentence.toLowerCase().includes('why')) {
          questions.push(sentence.trim());
        }
      });
    });
    
    return questions.slice(0, 10); // Limit to top 10
  }

  /**
   * Extract mentions (users, channels, URLs)
   */
  private extractMentions(content: string): ThreadAnalysis['content']['mentions'] {
    const userMentions = content.match(/<@[UW][A-Z0-9]+>/g) || [];
    const channelMentions = content.match(/<#[C][A-Z0-9]+\|[^>]+>/g) || [];
    const urlMentions = content.match(/https?:\/\/[^\s]+/g) || [];
    
    return {
      users: Array.from(new Set(userMentions)),
      channels: Array.from(new Set(channelMentions)),
      urls: Array.from(new Set(urlMentions))
    };
  }

  /**
   * Determine conversation type
   */
  private determineConversationType(messages: any[], activities: any[]): ThreadAnalysis['patterns']['conversationType'] {
    const content = messages.map(msg => msg.text.toLowerCase()).join(' ');
    
    if (content.includes('support') || content.includes('help') || content.includes('issue') || content.includes('problem')) {
      return 'support';
    }
    
    if (content.includes('announce') || content.includes('update') || content.includes('release')) {
      return 'announcement';
    }
    
    if (content.includes('escalate') || content.includes('urgent') || content.includes('critical')) {
      return 'escalation';
    }
    
    if (messages.length > 5 && activities.length > 3) {
      return 'collaboration';
    }
    
    return 'discussion';
  }

  /**
   * Determine urgency level
   */
  private determineUrgencyLevel(messages: any[]): ThreadAnalysis['patterns']['urgencyLevel'] {
    const content = messages.map(msg => msg.content.toLowerCase()).join(' ');
    
    if (content.includes('critical') || content.includes('emergency') || content.includes('urgent')) {
      return 'critical';
    }
    
    if (content.includes('asap') || content.includes('priority') || content.includes('important')) {
      return 'high';
    }
    
    if (content.includes('soon') || content.includes('quick')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Determine resolution status
   */
  private determineResolutionStatus(messages: any[], activities: any[]): ThreadAnalysis['patterns']['resolutionStatus'] {
    const recentContent = messages.slice(-3).map(msg => msg.content.toLowerCase()).join(' ');
    
    if (recentContent.includes('resolved') || recentContent.includes('fixed') || recentContent.includes('completed')) {
      return 'resolved';
    }
    
    if (recentContent.includes('escalate') || recentContent.includes('transfer')) {
      return 'escalated';
    }
    
    const lastActivity = Math.max(...activities.map(a => a.timestamp.getTime()));
    const hoursSinceLastActivity = (Date.now() - lastActivity) / (1000 * 60 * 60);
    
    if (hoursSinceLastActivity > 48) {
      return 'abandoned';
    }
    
    return 'pending';
  }

  /**
   * Determine if follow-up is required
   */
  private determineFollowUpRequired(messages: any[], resolutionStatus: string): boolean {
    if (resolutionStatus === 'resolved') {
      return false;
    }
    
    const recentContent = messages.slice(-2).map(msg => msg.content.toLowerCase()).join(' ');
    
    return recentContent.includes('follow up') || 
           recentContent.includes('check back') || 
           recentContent.includes('update') ||
           resolutionStatus === 'pending';
  }

  /**
   * Find peak activity period
   */
  private findPeakActivityPeriod(messages: any[]): string {
    const hourCounts: Record<number, number> = {};
    
    messages.forEach(msg => {
      const hour = msg.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    if (peakHour) {
      const startHour = parseInt(peakHour);
      const endHour = startHour + 1;
      return `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
    }
    
    return 'No clear peak';
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    
    return `${diffMinutes}m`;
  }

  /**
   * Get conversation patterns
   */
  getConversationPatterns(): ConversationPattern[] {
    const messages = this.threadContext.getMessages();
    const patterns: ConversationPattern[] = [];
    
    // Simple pattern detection - can be enhanced
    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];
      
      if (current.text.includes('?') && !next.text.includes('?')) {
        patterns.push({
          type: 'question-answer',
          participants: [current.user, next.user],
          startMessageId: current.ts,
          endMessageId: next.ts,
          duration: (new Date(parseInt(next.ts)).getTime() - new Date(parseInt(current.ts)).getTime()) / (1000 * 60),
          resolved: true
        });
      }
    }
    
    return patterns;
  }

  /**
   * Export analysis results
   */
  async exportAnalysis(format: 'json' | 'csv' | 'summary'): Promise<string> {
    const analysis = await this.analyzeThread();
    
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      
      case 'csv':
        return this.convertToCSV(analysis);
      
      case 'summary':
        return this.generateSummaryReport(analysis);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert analysis to CSV format
   */
  private convertToCSV(analysis: ThreadAnalysis): string {
    const rows = [
      ['Metric', 'Value'],
      ['Message Count', analysis.summary.messageCount.toString()],
      ['Participant Count', analysis.summary.participantCount.toString()],
      ['Duration', analysis.summary.duration],
      ['Overall Sentiment', analysis.sentiment.overall],
      ['Sentiment Score', analysis.sentiment.score.toFixed(2)],
      ['Conversation Type', analysis.patterns.conversationType],
      ['Urgency Level', analysis.patterns.urgencyLevel],
      ['Resolution Status', analysis.patterns.resolutionStatus],
      ['Follow-up Required', analysis.patterns.followUpRequired.toString()]
    ];
    
    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(analysis: ThreadAnalysis): string {
    return `
# Thread Analysis Summary

## Overview
- **Messages**: ${analysis.summary.messageCount}
- **Participants**: ${analysis.summary.participantCount}
- **Duration**: ${analysis.summary.duration}
- **Type**: ${analysis.patterns.conversationType}
- **Status**: ${analysis.patterns.resolutionStatus}

## Sentiment Analysis
- **Overall**: ${analysis.sentiment.overall} (${(analysis.sentiment.score * 100).toFixed(1)}%)
- **Distribution**: ${(analysis.sentiment.distribution.positive * 100).toFixed(1)}% positive, ${(analysis.sentiment.distribution.neutral * 100).toFixed(1)}% neutral, ${(analysis.sentiment.distribution.negative * 100).toFixed(1)}% negative

## Key Insights
${analysis.insights.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
${analysis.insights.nextSteps.map(step => `- ${step}`).join('\n')}
    `.trim();
  }
}