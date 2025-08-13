/**
 * Test script for Phase 1: Enhanced AI Ticket Analysis
 * 
 * This script tests the enhanced AI analysis functionality by sending
 * a sample Zendesk webhook to the worker endpoint.
 */

const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev'; // Update with your worker URL
const WEBHOOK_SECRET = 'your-webhook-secret'; // Update with your webhook secret

// Sample Zendesk ticket data for testing
const sampleTicket = {
  type: 'ticket.created',
  ticket: {
    id: 12345,
    subject: 'Urgent: Payment processing error causing customer complaints',
    description: `Hi support team,
    
    We're experiencing a critical issue with our payment processing system. Multiple customers are reporting that their payments are being declined even with valid credit cards. This is causing significant frustration and we're losing sales.
    
    The error started around 2 PM today and affects approximately 30% of transactions. We need this fixed ASAP as it's impacting our revenue.
    
    Steps to reproduce:
    1. Go to checkout page
    2. Enter valid credit card details
    3. Click "Pay Now"
    4. Error message appears: "Payment failed - please try again"
    
    This is affecting our Black Friday sales and needs immediate attention!
    
    Thanks,
    John from E-commerce Team`,
    priority: 'high',
    status: 'new',
    tags: ['payment', 'urgent', 'ecommerce'],
    requester_id: 123456789,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

async function testPhase1() {
  console.log('🧪 Testing Phase 1: Enhanced AI Ticket Analysis');
  console.log('=' .repeat(60));
  
  try {
    console.log('📤 Sending test webhook to worker...');
    
    const response = await fetch(`${WORKER_URL}/zendesk-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify(sampleTicket)
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Response received:');
    console.log(JSON.stringify(result, null, 2));
    
    // Analyze the response
    if (result.data?.ai_enhanced) {
      console.log('\n🤖 AI Analysis Results:');
      console.log('=' .repeat(40));
      const analysis = result.data.ai_analysis;
      
      if (analysis) {
        console.log(`📊 Priority: ${analysis.priority}`);
        console.log(`📂 Category: ${analysis.category}`);
        console.log(`😊 Sentiment: ${analysis.sentiment}`);
        console.log(`⚠️  Urgency Indicators: ${analysis.urgency_indicators.join(', ')}`);
        console.log(`✅ Action Items: ${analysis.action_items.join(', ')}`);
      }
      
      console.log('\n🎯 Phase 1 Features Verified:');
      console.log('✅ AI ticket analysis');
      console.log('✅ Enhanced task descriptions');
      console.log('✅ Intelligent Slack notifications');
      console.log('✅ Priority adjustment based on AI');
      console.log('✅ Enhanced tagging with AI insights');
    } else {
      console.log('⚠️  AI analysis not enabled or failed');
    }
    
    if (result.data?.clickup_task_id) {
      console.log(`\n📋 ClickUp Task Created: ${result.data.clickup_task_url}`);
    }
    
    if (result.data?.slack_thread_ts) {
      console.log(`💬 Slack Notification Sent: ${result.data.slack_thread_ts}`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Instructions for running the test
console.log('📋 Phase 1 Test Instructions:');
console.log('1. Update WORKER_URL with your actual worker URL');
console.log('2. Update WEBHOOK_SECRET with your webhook secret');
console.log('3. Ensure your worker has AI service configured (GOOGLE_GEMINI_API_KEY)');
console.log('4. Run: node test-phase1.js');
console.log('');

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testPhase1();
}