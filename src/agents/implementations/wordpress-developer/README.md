# WordPress Developer Agent 🌐

This directory contains the WordPress Developer agent implementation, specialized in WordPress development, customization, and integration.

## Purpose

The WordPress Developer agent provides:
- WordPress theme and plugin development
- Custom functionality implementation
- WordPress integration with external services
- Performance optimization and security
- WordPress maintenance and troubleshooting

## Agent Capabilities

### WordPress Development
- **Theme Development**: Create custom WordPress themes from scratch
- **Plugin Development**: Build custom plugins for specific functionality
- **Child Theme Creation**: Develop child themes for safe customizations
- **Custom Post Types**: Create and manage custom post types and fields

### WordPress Customization
- **Hook Implementation**: Use WordPress actions and filters effectively
- **Custom Fields**: Implement Advanced Custom Fields (ACF) solutions
- **Widget Development**: Create custom widgets and sidebars
- **Shortcode Creation**: Develop custom shortcodes for content

### Integration Development
- **API Integration**: Connect WordPress with external APIs and services
- **Third-party Services**: Integrate payment gateways, CRMs, and tools
- **Database Integration**: Custom database operations and queries
- **REST API Development**: Create custom REST API endpoints

### Performance & Security
- **Performance Optimization**: Optimize WordPress for speed and efficiency
- **Security Hardening**: Implement WordPress security best practices
- **Caching Solutions**: Implement and configure caching strategies
- **Database Optimization**: Optimize database queries and structure

## File Structure

### `wordpress-developer.ts`
Main agent implementation containing:
- WordPress development workflows
- Theme and plugin generation logic
- Integration implementation patterns
- Performance optimization strategies

### `prompts.ts`
Agent-specific prompts for:
- WordPress code generation templates
- Theme development patterns
- Plugin architecture designs
- Integration implementation guides

### `workflows.ts`
Predefined workflows for:
- Theme development processes
- Plugin creation procedures
- Integration implementation steps
- WordPress maintenance tasks

## Key Workflows

### Theme Development Workflow
1. **Requirements Analysis**: Analyze design and functionality requirements
2. **Theme Structure**: Create theme file structure and hierarchy
3. **Template Development**: Develop template files and page layouts
4. **Styling Implementation**: Implement CSS/SCSS styling and responsiveness
5. **Functionality Integration**: Add custom functions and WordPress features
6. **Testing and Optimization**: Test across devices and optimize performance

### Plugin Development Workflow
1. **Plugin Planning**: Define plugin scope and functionality
2. **Architecture Design**: Design plugin structure and organization
3. **Core Development**: Implement main plugin functionality
4. **Admin Interface**: Create admin panels and settings pages
5. **Frontend Integration**: Implement frontend features and displays
6. **Documentation**: Create user and developer documentation

### Integration Workflow
1. **API Analysis**: Analyze external service APIs and requirements
2. **Authentication Setup**: Implement secure authentication methods
3. **Data Mapping**: Map data between WordPress and external services
4. **Sync Implementation**: Develop data synchronization mechanisms
5. **Error Handling**: Implement robust error handling and logging
6. **Testing and Validation**: Test integration thoroughly

### Maintenance Workflow
1. **Health Check**: Perform comprehensive WordPress health assessment
2. **Update Management**: Manage WordPress, theme, and plugin updates
3. **Security Audit**: Conduct security audits and vulnerability scans
4. **Performance Analysis**: Analyze and optimize site performance
5. **Backup Verification**: Ensure backup systems are working properly
6. **Issue Resolution**: Identify and resolve any issues or conflicts

## Integration Points

### ClickUp Integration
- Sync WordPress content with ClickUp tasks
- Create ClickUp tasks from WordPress forms
- Track content creation and publication progress
- Generate content reports and analytics

### Zendesk Integration
- Create support tickets from WordPress contact forms
- Display Zendesk knowledge base in WordPress
- Sync user data between WordPress and Zendesk
- Implement customer support chat widgets

### WordPress Ecosystem
- WooCommerce for e-commerce functionality
- Advanced Custom Fields for custom data
- Yoast SEO for search optimization
- Elementor/Gutenberg for page building

### External Services
- Payment gateways (Stripe, PayPal, Square)
- Email marketing (Mailchimp, ConvertKit)
- Analytics (Google Analytics, Hotjar)
- CDN services (Cloudflare, AWS CloudFront)

## Usage Examples

### Theme Development
```typescript
const wpDeveloper = new WordPressDeveloperAgent();

// Generate custom theme
const theme = await wpDeveloper.createTheme({
  name: 'Corporate Business Theme',
  style: 'modern-corporate',
  features: ['custom-header', 'custom-menu', 'post-thumbnails'],
  postTypes: ['portfolio', 'testimonials', 'services'],
  responsive: true
});

// Create custom post type
const postType = await wpDeveloper.createCustomPostType({
  name: 'portfolio',
  labels: {
    singular: 'Portfolio Item',
    plural: 'Portfolio Items'
  },
  supports: ['title', 'editor', 'thumbnail', 'custom-fields'],
  public: true
});
```

### Plugin Development
```typescript
// Create custom plugin
const plugin = await wpDeveloper.createPlugin({
  name: 'Zendesk Integration',
  description: 'Integrate WordPress with Zendesk support system',
  version: '1.0.0',
  features: [
    'contact-form-integration',
    'ticket-creation',
    'knowledge-base-display',
    'user-sync'
  ]
});

// Add plugin functionality
const functionality = await wpDeveloper.addPluginFeature({
  pluginId: plugin.id,
  feature: 'contact-form-integration',
  settings: {
    formSelector: '.contact-form',
    zendeskEndpoint: 'https://company.zendesk.com/api/v2',
    autoCreateTicket: true
  }
});
```

### API Integration
```typescript
// Integrate external API
const integration = await wpDeveloper.createAPIIntegration({
  service: 'ClickUp',
  endpoints: [
    { method: 'GET', path: '/team/{team_id}/task' },
    { method: 'POST', path: '/team/{team_id}/task' }
  ],
  authentication: 'bearer-token',
  syncSchedule: 'hourly'
});

// Create custom REST endpoint
const endpoint = await wpDeveloper.createRESTEndpoint({
  namespace: 'custom/v1',
  route: '/sync-tasks',
  methods: ['GET', 'POST'],
  callback: 'handle_task_sync',
  permission: 'manage_options'
});
```

## Specialized Features

### WordPress Multisite
- Network administration and management
- Site creation and configuration
- Plugin and theme management across network
- User role and permission management

### E-commerce Development
- WooCommerce store setup and customization
- Custom payment gateway integration
- Product catalog and inventory management
- Order processing and fulfillment

### Membership Sites
- User registration and authentication
- Content restriction and access control
- Subscription and payment management
- Member dashboard and profile management

### SEO and Performance
- Search engine optimization implementation
- Page speed optimization techniques
- Image optimization and lazy loading
- Database query optimization

## WordPress Development Standards

### Coding Standards
- WordPress Coding Standards compliance
- PHP best practices and conventions
- JavaScript and CSS organization
- Proper file and function naming

### Security Best Practices
- Input validation and sanitization
- Output escaping and data security
- Nonce verification for forms
- User capability and permission checks

### Performance Guidelines
- Efficient database queries
- Proper use of WordPress caching
- Image optimization and compression
- Minification of CSS and JavaScript

### Accessibility Standards
- WCAG 2.1 compliance implementation
- Keyboard navigation support
- Screen reader compatibility
- Color contrast and visual accessibility

## WordPress Ecosystem Knowledge

### Core WordPress
- WordPress hooks and filters system
- Template hierarchy and theme development
- Custom post types and taxonomies
- WordPress database structure and queries

### Popular Plugins
- Advanced Custom Fields (ACF)
- Yoast SEO optimization
- WooCommerce e-commerce
- Elementor page builder

### Development Tools
- Local development environments (Local, XAMPP)
- WordPress CLI (WP-CLI) usage
- Debugging tools and techniques
- Version control with Git

### Hosting and Deployment
- WordPress hosting requirements
- Deployment strategies and automation
- SSL certificate implementation
- CDN configuration and optimization

## Quality Assurance and Testing

### Testing Strategies
- Cross-browser compatibility testing
- Mobile responsiveness testing
- Performance testing and optimization
- Security vulnerability scanning

### Code Quality
- PHP code analysis and linting
- JavaScript code quality checks
- CSS validation and optimization
- WordPress coding standards compliance

### User Experience Testing
- Usability testing and feedback
- Accessibility testing and validation
- Load testing and performance monitoring
- SEO analysis and optimization

## Maintenance and Support

### Regular Maintenance
- WordPress core, theme, and plugin updates
- Security monitoring and hardening
- Performance optimization and monitoring
- Backup verification and restoration

### Troubleshooting
- Error diagnosis and resolution
- Plugin and theme conflict resolution
- Database optimization and repair
- Security incident response

### Documentation and Training
- User manual and guide creation
- Admin training and support
- Developer documentation
- Best practices and guidelines

## Integration Capabilities

### CRM Integration
- Customer data synchronization
- Lead capture and management
- Sales pipeline integration
- Marketing automation connectivity

### Analytics Integration
- Google Analytics implementation
- Custom event tracking
- Conversion tracking setup
- Performance metrics monitoring

### Social Media Integration
- Social sharing functionality
- Social login implementation
- Social media feed display
- Social commerce integration

### Third-party Services
- Email service provider integration
- SMS and notification services
- Cloud storage and media management
- API gateway and webhook management