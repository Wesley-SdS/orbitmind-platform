import type { PremiumIntegration } from "./types";

export const PREMIUM_INTEGRATIONS: PremiumIntegration[] = [
  // ══════════════════════════════════════
  // DEVELOPMENT
  // ══════════════════════════════════════
  {
    id: "github",
    nangoKey: "github",
    name: "GitHub",
    description: "Sincronize issues, PRs e webhooks. Code review automatizado e CI/CD.",
    icon: "github",
    category: "development",
    tier: "premium",
    capabilities: [
      { id: "create-issue", name: "Criar Issues", description: "Criar issues automaticamente", direction: "outbound" },
      { id: "create-pr", name: "Abrir PRs", description: "Criar pull requests", direction: "outbound" },
      { id: "code-review", name: "Code Review", description: "Revisao automatica de codigo", direction: "bidirectional" },
      { id: "webhooks", name: "Webhooks", description: "Receber eventos de push, PR, issues", direction: "inbound" },
      { id: "sync-issues", name: "Sincronizar Issues", description: "Sync bidirecional de issues", direction: "bidirectional" },
      { id: "workflows", name: "GitHub Actions", description: "Instalar e gerenciar workflows", direction: "outbound" },
    ],
    configFields: [
      { key: "repo", label: "Repositorio", type: "select", placeholder: "owner/repo", fetchOptions: "/api/integrations/github/repos" },
      { key: "webhookEvents", label: "Eventos de Webhook", type: "multiselect", placeholder: "Selecione eventos" },
    ],
  },
  {
    id: "gitlab",
    nangoKey: "gitlab",
    name: "GitLab",
    description: "Conecte repos do GitLab para pipelines CI/CD integrados.",
    icon: "gitlab",
    category: "development",
    tier: "premium",
    capabilities: [
      { id: "create-issue", name: "Criar Issues", description: "Criar issues", direction: "outbound" },
      { id: "create-mr", name: "Abrir MRs", description: "Criar merge requests", direction: "outbound" },
      { id: "webhooks", name: "Webhooks", description: "Receber eventos", direction: "inbound" },
      { id: "sync-issues", name: "Sincronizar Issues", description: "Sync de issues", direction: "bidirectional" },
    ],
    configFields: [
      { key: "project", label: "Projeto", type: "select", fetchOptions: "/api/integrations/gitlab/projects" },
    ],
  },
  {
    id: "bitbucket",
    nangoKey: "bitbucket",
    name: "Bitbucket",
    description: "Issues, PRs e webhooks do Bitbucket Cloud.",
    icon: "bitbucket",
    category: "development",
    tier: "premium",
    capabilities: [
      { id: "create-issue", name: "Criar Issues", description: "Criar issues", direction: "outbound" },
      { id: "create-pr", name: "Abrir PRs", description: "Criar pull requests", direction: "outbound" },
      { id: "webhooks", name: "Webhooks", description: "Receber eventos", direction: "inbound" },
    ],
    configFields: [
      { key: "repo", label: "Repositorio", type: "select", fetchOptions: "/api/integrations/bitbucket/repos" },
    ],
  },
  {
    id: "azure-devops",
    nangoKey: "azure-devops",
    name: "Azure DevOps",
    description: "Work items, boards e pipelines do Azure DevOps.",
    icon: "azure",
    category: "development",
    tier: "premium",
    capabilities: [
      { id: "create-work-item", name: "Criar Work Items", description: "Criar work items", direction: "outbound" },
      { id: "sync-boards", name: "Sincronizar Boards", description: "Sync de boards", direction: "bidirectional" },
      { id: "pipelines", name: "Pipelines CI/CD", description: "Disparar pipelines", direction: "outbound" },
    ],
    configFields: [
      { key: "organization", label: "Organizacao", type: "text", placeholder: "org-name" },
      { key: "project", label: "Projeto", type: "select", fetchOptions: "/api/integrations/azure-devops/projects" },
    ],
  },
  {
    id: "confluence",
    nangoKey: "confluence",
    name: "Confluence",
    description: "Ler e escrever paginas, sincronizar documentacao.",
    icon: "confluence",
    category: "development",
    tier: "premium",
    capabilities: [
      { id: "read-pages", name: "Ler Paginas", description: "Ler conteudo de paginas", direction: "inbound" },
      { id: "write-pages", name: "Escrever Paginas", description: "Criar e atualizar paginas", direction: "outbound" },
      { id: "search", name: "Buscar", description: "Buscar conteudo", direction: "inbound" },
    ],
    configFields: [
      { key: "space", label: "Space", type: "select", fetchOptions: "/api/integrations/confluence/spaces" },
    ],
  },

  // ══════════════════════════════════════
  // COMMUNICATION
  // ══════════════════════════════════════
  {
    id: "slack",
    nangoKey: "slack",
    name: "Slack",
    description: "Mensagens, slash commands e notificacoes de pipeline em canais.",
    icon: "slack",
    category: "communication",
    tier: "premium",
    capabilities: [
      { id: "send-message", name: "Enviar Mensagens", description: "Enviar mensagens em canais", direction: "outbound" },
      { id: "slash-commands", name: "Slash Commands", description: "Receber comandos /orbitmind", direction: "inbound" },
      { id: "pipeline-updates", name: "Updates de Pipeline", description: "Notificar status do pipeline", direction: "outbound" },
      { id: "file-upload", name: "Upload de Arquivos", description: "Enviar arquivos", direction: "outbound" },
    ],
    configFields: [
      { key: "channel", label: "Canal Padrao", type: "select", fetchOptions: "/api/integrations/slack/channels" },
    ],
  },
  {
    id: "discord",
    nangoKey: "discord",
    name: "Discord",
    description: "Notificacoes, embeds e bot integrado no Discord.",
    icon: "discord",
    category: "communication",
    tier: "premium",
    capabilities: [
      { id: "send-message", name: "Enviar Mensagens", description: "Enviar mensagens", direction: "outbound" },
      { id: "send-embed", name: "Enviar Embeds", description: "Enviar embeds ricos", direction: "outbound" },
      { id: "notifications", name: "Notificacoes", description: "Notificar eventos", direction: "outbound" },
    ],
    configFields: [
      { key: "channelId", label: "Canal", type: "select", fetchOptions: "/api/integrations/discord/channels" },
    ],
  },
  {
    id: "telegram",
    nangoKey: "telegram",
    name: "Telegram",
    description: "Alertas e chat com agentes via Telegram Bot.",
    icon: "telegram",
    category: "communication",
    tier: "premium",
    capabilities: [
      { id: "send-message", name: "Enviar Mensagens", description: "Enviar mensagens", direction: "outbound" },
      { id: "send-media", name: "Enviar Midia", description: "Enviar fotos e documentos", direction: "outbound" },
    ],
    configFields: [
      { key: "chatId", label: "Chat ID", type: "text", placeholder: "-100..." },
    ],
  },
  {
    id: "microsoft-teams",
    nangoKey: "microsoft-teams",
    name: "Microsoft Teams",
    description: "Mensagens, cards e notificacoes em canais do Teams.",
    icon: "teams",
    category: "communication",
    tier: "premium",
    capabilities: [
      { id: "send-message", name: "Enviar Mensagens", description: "Enviar mensagens", direction: "outbound" },
      { id: "send-card", name: "Enviar Cards", description: "Enviar adaptive cards", direction: "outbound" },
      { id: "notifications", name: "Notificacoes", description: "Notificar em canais", direction: "outbound" },
    ],
    configFields: [
      { key: "teamId", label: "Time", type: "select", fetchOptions: "/api/integrations/teams/teams" },
      { key: "channelId", label: "Canal", type: "select", fetchOptions: "/api/integrations/teams/channels" },
    ],
  },
  {
    id: "intercom",
    nangoKey: "intercom",
    name: "Intercom",
    description: "Conversas, tickets e bot de suporte via Intercom.",
    icon: "intercom",
    category: "communication",
    tier: "premium",
    capabilities: [
      { id: "create-conversation", name: "Criar Conversas", description: "Iniciar conversas", direction: "outbound" },
      { id: "reply", name: "Responder", description: "Responder conversas", direction: "outbound" },
      { id: "create-ticket", name: "Criar Tickets", description: "Criar tickets de suporte", direction: "outbound" },
      { id: "search-contacts", name: "Buscar Contatos", description: "Buscar contatos", direction: "inbound" },
    ],
    configFields: [],
  },

  // ══════════════════════════════════════
  // PROJECT MANAGEMENT
  // ══════════════════════════════════════
  {
    id: "jira",
    nangoKey: "jira",
    name: "Jira",
    description: "Issues, sprints e transicoes. Sync bidirecional com board.",
    icon: "jira",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-issue", name: "Criar Issues", description: "Criar issues", direction: "outbound" },
      { id: "update-issue", name: "Atualizar Issues", description: "Atualizar status e campos", direction: "outbound" },
      { id: "sync-sprints", name: "Sincronizar Sprints", description: "Sync de sprints", direction: "bidirectional" },
      { id: "webhooks", name: "Webhooks", description: "Receber eventos", direction: "inbound" },
      { id: "search-jql", name: "Busca JQL", description: "Buscar via JQL", direction: "inbound" },
    ],
    configFields: [
      { key: "project", label: "Projeto", type: "select", fetchOptions: "/api/integrations/jira/projects" },
    ],
  },
  {
    id: "linear",
    nangoKey: "linear",
    name: "Linear",
    description: "Issues, ciclos e projetos. Sync com board do OrbitMind.",
    icon: "linear",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-issue", name: "Criar Issues", description: "Criar issues", direction: "outbound" },
      { id: "update-issue", name: "Atualizar Issues", description: "Atualizar issues", direction: "outbound" },
      { id: "sync-cycles", name: "Sincronizar Ciclos", description: "Sync de ciclos", direction: "bidirectional" },
      { id: "search", name: "Buscar Issues", description: "Buscar issues", direction: "inbound" },
    ],
    configFields: [
      { key: "teamId", label: "Time", type: "select", fetchOptions: "/api/integrations/linear/teams" },
    ],
  },
  {
    id: "asana",
    nangoKey: "asana",
    name: "Asana",
    description: "Tasks, projetos e secoes. Sync com board.",
    icon: "asana",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-task", name: "Criar Tasks", description: "Criar tasks", direction: "outbound" },
      { id: "update-task", name: "Atualizar Tasks", description: "Atualizar tasks", direction: "outbound" },
      { id: "sync-projects", name: "Sincronizar Projetos", description: "Sync de projetos", direction: "bidirectional" },
    ],
    configFields: [
      { key: "workspace", label: "Workspace", type: "select", fetchOptions: "/api/integrations/asana/workspaces" },
      { key: "project", label: "Projeto", type: "select", fetchOptions: "/api/integrations/asana/projects" },
    ],
  },
  {
    id: "monday",
    nangoKey: "monday",
    name: "Monday.com",
    description: "Items, boards e grupos do Monday.com.",
    icon: "monday",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-item", name: "Criar Items", description: "Criar items", direction: "outbound" },
      { id: "update-item", name: "Atualizar Items", description: "Atualizar items", direction: "outbound" },
      { id: "sync-boards", name: "Sincronizar Boards", description: "Sync de boards", direction: "bidirectional" },
    ],
    configFields: [
      { key: "boardId", label: "Board", type: "select", fetchOptions: "/api/integrations/monday/boards" },
    ],
  },
  {
    id: "clickup",
    nangoKey: "clickup",
    name: "ClickUp",
    description: "Tasks, spaces e listas do ClickUp.",
    icon: "clickup",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-task", name: "Criar Tasks", description: "Criar tasks", direction: "outbound" },
      { id: "update-task", name: "Atualizar Tasks", description: "Atualizar tasks", direction: "outbound" },
      { id: "sync-spaces", name: "Sincronizar Spaces", description: "Sync de spaces", direction: "bidirectional" },
    ],
    configFields: [
      { key: "spaceId", label: "Space", type: "select", fetchOptions: "/api/integrations/clickup/spaces" },
      { key: "listId", label: "Lista", type: "select", fetchOptions: "/api/integrations/clickup/lists" },
    ],
  },
  {
    id: "notion",
    nangoKey: "notion",
    name: "Notion",
    description: "Paginas, databases e blocos. Query e sync.",
    icon: "notion",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-page", name: "Criar Paginas", description: "Criar paginas", direction: "outbound" },
      { id: "query-database", name: "Query Database", description: "Consultar databases", direction: "inbound" },
      { id: "search", name: "Buscar", description: "Buscar conteudo", direction: "inbound" },
      { id: "append-blocks", name: "Adicionar Blocos", description: "Adicionar blocos a paginas", direction: "outbound" },
    ],
    configFields: [
      { key: "databaseId", label: "Database", type: "select", fetchOptions: "/api/integrations/notion/databases" },
    ],
  },
  {
    id: "trello",
    nangoKey: "trello",
    name: "Trello",
    description: "Cards, boards e listas do Trello.",
    icon: "trello",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-card", name: "Criar Cards", description: "Criar cards", direction: "outbound" },
      { id: "update-card", name: "Atualizar Cards", description: "Mover e atualizar cards", direction: "outbound" },
      { id: "sync-boards", name: "Sincronizar Boards", description: "Sync de boards", direction: "bidirectional" },
    ],
    configFields: [
      { key: "boardId", label: "Board", type: "select", fetchOptions: "/api/integrations/trello/boards" },
    ],
  },
  {
    id: "basecamp",
    nangoKey: "basecamp",
    name: "Basecamp",
    description: "To-dos, mensagens e projetos do Basecamp.",
    icon: "basecamp",
    category: "project-management",
    tier: "premium",
    capabilities: [
      { id: "create-todo", name: "Criar To-dos", description: "Criar to-dos", direction: "outbound" },
      { id: "create-message", name: "Criar Mensagens", description: "Postar mensagens", direction: "outbound" },
      { id: "sync-projects", name: "Sincronizar Projetos", description: "Sync de projetos", direction: "bidirectional" },
    ],
    configFields: [
      { key: "projectId", label: "Projeto", type: "select", fetchOptions: "/api/integrations/basecamp/projects" },
    ],
  },

  // ══════════════════════════════════════
  // CRM & SALES
  // ══════════════════════════════════════
  {
    id: "hubspot",
    nangoKey: "hubspot",
    name: "HubSpot",
    description: "Contatos, deals, empresas e email marketing.",
    icon: "hubspot",
    category: "crm-sales",
    tier: "premium",
    capabilities: [
      { id: "create-contact", name: "Criar Contatos", description: "Criar contatos", direction: "outbound" },
      { id: "create-deal", name: "Criar Deals", description: "Criar deals", direction: "outbound" },
      { id: "create-company", name: "Criar Empresas", description: "Criar empresas", direction: "outbound" },
      { id: "search", name: "Buscar Contatos", description: "Buscar contatos", direction: "inbound" },
      { id: "email-marketing", name: "Email Marketing", description: "Campanhas de email", direction: "outbound" },
    ],
    configFields: [
      { key: "pipeline", label: "Pipeline", type: "select", fetchOptions: "/api/integrations/hubspot/pipelines" },
    ],
  },
  {
    id: "salesforce",
    nangoKey: "salesforce",
    name: "Salesforce",
    description: "Records, queries SOQL e triggers do Salesforce.",
    icon: "salesforce",
    category: "crm-sales",
    tier: "premium",
    capabilities: [
      { id: "create-record", name: "Criar Records", description: "Criar registros", direction: "outbound" },
      { id: "query-soql", name: "Query SOQL", description: "Consultas SOQL", direction: "inbound" },
      { id: "update-record", name: "Atualizar Records", description: "Atualizar registros", direction: "outbound" },
    ],
    configFields: [
      { key: "instanceUrl", label: "Instancia", type: "text", placeholder: "https://yourorg.salesforce.com" },
    ],
  },
  {
    id: "pipedrive",
    nangoKey: "pipedrive",
    name: "Pipedrive",
    description: "Deals, contatos e atividades do Pipedrive.",
    icon: "pipedrive",
    category: "crm-sales",
    tier: "premium",
    capabilities: [
      { id: "create-deal", name: "Criar Deals", description: "Criar deals", direction: "outbound" },
      { id: "create-person", name: "Criar Contatos", description: "Criar contatos", direction: "outbound" },
      { id: "list-pipelines", name: "Listar Pipelines", description: "Listar pipelines", direction: "inbound" },
    ],
    configFields: [],
  },
  {
    id: "zoho-crm",
    nangoKey: "zoho-crm",
    name: "Zoho CRM",
    description: "Records, workflows e modulos do Zoho CRM.",
    icon: "zoho",
    category: "crm-sales",
    tier: "premium",
    capabilities: [
      { id: "create-record", name: "Criar Records", description: "Criar registros", direction: "outbound" },
      { id: "search", name: "Buscar Records", description: "Buscar registros", direction: "inbound" },
      { id: "update-record", name: "Atualizar Records", description: "Atualizar registros", direction: "outbound" },
    ],
    configFields: [
      { key: "module", label: "Modulo", type: "select", placeholder: "Leads, Contacts, Deals..." },
    ],
  },

  // ══════════════════════════════════════
  // SUPPORT
  // ══════════════════════════════════════
  {
    id: "zendesk",
    nangoKey: "zendesk",
    name: "Zendesk",
    description: "Tickets, usuarios e triggers do Zendesk.",
    icon: "zendesk",
    category: "support",
    tier: "premium",
    capabilities: [
      { id: "create-ticket", name: "Criar Tickets", description: "Criar tickets", direction: "outbound" },
      { id: "update-ticket", name: "Atualizar Tickets", description: "Atualizar tickets", direction: "outbound" },
      { id: "search", name: "Buscar Tickets", description: "Buscar tickets", direction: "inbound" },
    ],
    configFields: [
      { key: "subdomain", label: "Subdominio", type: "text", placeholder: "suaempresa" },
    ],
  },
  {
    id: "freshdesk",
    nangoKey: "freshdesk",
    name: "Freshdesk",
    description: "Tickets, agentes e automacoes do Freshdesk.",
    icon: "freshdesk",
    category: "support",
    tier: "premium",
    capabilities: [
      { id: "create-ticket", name: "Criar Tickets", description: "Criar tickets", direction: "outbound" },
      { id: "update-ticket", name: "Atualizar Tickets", description: "Atualizar tickets", direction: "outbound" },
      { id: "list-tickets", name: "Listar Tickets", description: "Listar tickets", direction: "inbound" },
    ],
    configFields: [
      { key: "domain", label: "Dominio", type: "text", placeholder: "suaempresa.freshdesk.com" },
    ],
  },
  {
    id: "servicenow",
    nangoKey: "servicenow",
    name: "ServiceNow",
    description: "Incidents, change requests e CMDB do ServiceNow.",
    icon: "servicenow",
    category: "support",
    tier: "premium",
    capabilities: [
      { id: "create-incident", name: "Criar Incidents", description: "Criar incidents", direction: "outbound" },
      { id: "create-change", name: "Change Requests", description: "Criar change requests", direction: "outbound" },
    ],
    configFields: [
      { key: "instance", label: "Instancia", type: "text", placeholder: "suaempresa.service-now.com" },
    ],
  },

  // ══════════════════════════════════════
  // GOOGLE WORKSPACE
  // ══════════════════════════════════════
  {
    id: "google-drive",
    nangoKey: "google-drive",
    name: "Google Drive",
    description: "Ler, salvar e compartilhar arquivos no Google Drive.",
    icon: "google-drive",
    category: "google-workspace",
    tier: "premium",
    capabilities: [
      { id: "list-files", name: "Listar Arquivos", description: "Listar arquivos", direction: "inbound" },
      { id: "read-file", name: "Ler Arquivo", description: "Ler conteudo", direction: "inbound" },
      { id: "create-file", name: "Criar Arquivo", description: "Criar arquivos", direction: "outbound" },
      { id: "share-file", name: "Compartilhar", description: "Compartilhar arquivos", direction: "outbound" },
    ],
    configFields: [
      { key: "folderId", label: "Pasta Padrao", type: "text", placeholder: "ID da pasta" },
    ],
  },
  {
    id: "google-calendar",
    nangoKey: "google-calendar",
    name: "Google Calendar",
    description: "Criar e ler eventos, verificar disponibilidade.",
    icon: "google-calendar",
    category: "google-workspace",
    tier: "premium",
    capabilities: [
      { id: "create-event", name: "Criar Eventos", description: "Criar eventos", direction: "outbound" },
      { id: "list-events", name: "Listar Eventos", description: "Listar eventos", direction: "inbound" },
      { id: "free-busy", name: "Disponibilidade", description: "Verificar disponibilidade", direction: "inbound" },
    ],
    configFields: [
      { key: "calendarId", label: "Calendario", type: "text", placeholder: "primary" },
    ],
  },
  {
    id: "google-sheets",
    nangoKey: "google-sheets",
    name: "Google Sheets",
    description: "Ler e escrever dados em planilhas Google.",
    icon: "google-sheets",
    category: "google-workspace",
    tier: "premium",
    capabilities: [
      { id: "read-range", name: "Ler Dados", description: "Ler range de celulas", direction: "inbound" },
      { id: "write-range", name: "Escrever Dados", description: "Escrever em celulas", direction: "outbound" },
      { id: "append-rows", name: "Adicionar Linhas", description: "Adicionar linhas", direction: "outbound" },
      { id: "create-spreadsheet", name: "Criar Planilha", description: "Criar planilha", direction: "outbound" },
    ],
    configFields: [
      { key: "spreadsheetId", label: "Planilha", type: "text", placeholder: "ID da planilha" },
    ],
  },
  {
    id: "gmail",
    nangoKey: "gmail",
    name: "Gmail",
    description: "Enviar emails, ler inbox e gerenciar drafts.",
    icon: "gmail",
    category: "google-workspace",
    tier: "premium",
    capabilities: [
      { id: "send-email", name: "Enviar Email", description: "Enviar emails", direction: "outbound" },
      { id: "list-messages", name: "Listar Mensagens", description: "Listar emails", direction: "inbound" },
      { id: "create-draft", name: "Criar Draft", description: "Criar rascunhos", direction: "outbound" },
      { id: "search", name: "Buscar Emails", description: "Buscar emails", direction: "inbound" },
    ],
    configFields: [],
  },

  // ══════════════════════════════════════
  // MICROSOFT 365
  // ══════════════════════════════════════
  {
    id: "outlook",
    nangoKey: "outlook",
    name: "Outlook",
    description: "Emails, calendario e eventos do Microsoft 365.",
    icon: "outlook",
    category: "microsoft-365",
    tier: "premium",
    capabilities: [
      { id: "send-email", name: "Enviar Email", description: "Enviar emails", direction: "outbound" },
      { id: "list-messages", name: "Listar Mensagens", description: "Listar emails", direction: "inbound" },
      { id: "calendar", name: "Calendario", description: "Gerenciar eventos", direction: "bidirectional" },
    ],
    configFields: [],
  },
  {
    id: "onedrive",
    nangoKey: "onedrive",
    name: "OneDrive",
    description: "Ler, salvar e compartilhar arquivos no OneDrive/SharePoint.",
    icon: "onedrive",
    category: "microsoft-365",
    tier: "premium",
    capabilities: [
      { id: "list-files", name: "Listar Arquivos", description: "Listar arquivos", direction: "inbound" },
      { id: "read-file", name: "Ler Arquivo", description: "Ler conteudo", direction: "inbound" },
      { id: "upload-file", name: "Upload Arquivo", description: "Upload de arquivos", direction: "outbound" },
      { id: "share-file", name: "Compartilhar", description: "Compartilhar arquivos", direction: "outbound" },
    ],
    configFields: [],
  },

  // ══════════════════════════════════════
  // MARKETING & EMAIL
  // ══════════════════════════════════════
  {
    id: "mailchimp",
    nangoKey: "mailchimp",
    name: "Mailchimp",
    description: "Campanhas, listas e email marketing.",
    icon: "mailchimp",
    category: "marketing-email",
    tier: "premium",
    capabilities: [
      { id: "create-campaign", name: "Criar Campanhas", description: "Criar campanhas", direction: "outbound" },
      { id: "send-campaign", name: "Enviar Campanhas", description: "Enviar campanhas", direction: "outbound" },
      { id: "add-subscriber", name: "Adicionar Inscritos", description: "Adicionar inscritos", direction: "outbound" },
      { id: "get-report", name: "Relatorios", description: "Ver relatorios", direction: "inbound" },
    ],
    configFields: [
      { key: "audienceId", label: "Audiencia", type: "select", fetchOptions: "/api/integrations/mailchimp/audiences" },
    ],
  },
  {
    id: "sendgrid",
    nangoKey: "sendgrid",
    name: "SendGrid",
    description: "Emails transacionais, templates e analytics.",
    icon: "sendgrid",
    category: "marketing-email",
    tier: "premium",
    capabilities: [
      { id: "send-email", name: "Enviar Email", description: "Enviar emails", direction: "outbound" },
      { id: "create-template", name: "Criar Templates", description: "Criar templates", direction: "outbound" },
      { id: "get-stats", name: "Estatisticas", description: "Ver estatisticas", direction: "inbound" },
    ],
    configFields: [],
  },
  {
    id: "brevo",
    nangoKey: "brevo",
    name: "Brevo",
    description: "Email marketing, SMS e automacao (ex-Sendinblue).",
    icon: "brevo",
    category: "marketing-email",
    tier: "premium",
    capabilities: [
      { id: "send-email", name: "Enviar Email", description: "Enviar emails", direction: "outbound" },
      { id: "create-campaign", name: "Criar Campanhas", description: "Criar campanhas", direction: "outbound" },
      { id: "add-contact", name: "Adicionar Contatos", description: "Adicionar contatos", direction: "outbound" },
    ],
    configFields: [],
  },

  // ══════════════════════════════════════
  // STORAGE & DESIGN
  // ══════════════════════════════════════
  {
    id: "figma",
    nangoKey: "figma",
    name: "Figma",
    description: "Exportar assets, ler design tokens e comentarios.",
    icon: "figma",
    category: "storage-design",
    tier: "premium",
    capabilities: [
      { id: "get-file", name: "Ler Arquivo", description: "Ler arquivo Figma", direction: "inbound" },
      { id: "get-images", name: "Exportar Imagens", description: "Exportar assets", direction: "inbound" },
      { id: "get-comments", name: "Comentarios", description: "Ler comentarios", direction: "inbound" },
      { id: "get-components", name: "Componentes", description: "Listar componentes", direction: "inbound" },
    ],
    configFields: [
      { key: "fileKey", label: "Arquivo Figma", type: "text", placeholder: "Key do arquivo" },
    ],
  },
  {
    id: "dropbox",
    nangoKey: "dropbox",
    name: "Dropbox",
    description: "Ler, salvar e compartilhar arquivos no Dropbox.",
    icon: "dropbox",
    category: "storage-design",
    tier: "premium",
    capabilities: [
      { id: "list-files", name: "Listar Arquivos", description: "Listar arquivos", direction: "inbound" },
      { id: "read-file", name: "Ler Arquivo", description: "Ler conteudo", direction: "inbound" },
      { id: "upload-file", name: "Upload Arquivo", description: "Upload de arquivos", direction: "outbound" },
      { id: "share-link", name: "Link de Compartilhamento", description: "Gerar links", direction: "outbound" },
    ],
    configFields: [],
  },
  {
    id: "airtable",
    nangoKey: "airtable",
    name: "Airtable",
    description: "Records, bases e tabelas do Airtable.",
    icon: "airtable",
    category: "storage-design",
    tier: "premium",
    capabilities: [
      { id: "list-records", name: "Listar Records", description: "Listar registros", direction: "inbound" },
      { id: "create-record", name: "Criar Records", description: "Criar registros", direction: "outbound" },
      { id: "update-record", name: "Atualizar Records", description: "Atualizar registros", direction: "outbound" },
    ],
    configFields: [
      { key: "baseId", label: "Base", type: "select", fetchOptions: "/api/integrations/airtable/bases" },
      { key: "tableId", label: "Tabela", type: "select", fetchOptions: "/api/integrations/airtable/tables" },
    ],
  },

  // ══════════════════════════════════════
  // PAYMENTS & E-COMMERCE
  // ══════════════════════════════════════
  {
    id: "stripe",
    nangoKey: "stripe",
    name: "Stripe",
    description: "Clientes, subscriptions e invoices do Stripe.",
    icon: "stripe",
    category: "payments-ecommerce",
    tier: "premium",
    capabilities: [
      { id: "create-customer", name: "Criar Clientes", description: "Criar clientes", direction: "outbound" },
      { id: "create-subscription", name: "Criar Subscriptions", description: "Criar assinaturas", direction: "outbound" },
      { id: "list-invoices", name: "Listar Invoices", description: "Listar faturas", direction: "inbound" },
    ],
    configFields: [],
  },
  {
    id: "shopify",
    nangoKey: "shopify",
    name: "Shopify",
    description: "Produtos, pedidos e clientes do Shopify.",
    icon: "shopify",
    category: "payments-ecommerce",
    tier: "premium",
    capabilities: [
      { id: "list-products", name: "Listar Produtos", description: "Listar produtos", direction: "inbound" },
      { id: "create-product", name: "Criar Produtos", description: "Criar produtos", direction: "outbound" },
      { id: "list-orders", name: "Listar Pedidos", description: "Listar pedidos", direction: "inbound" },
      { id: "list-customers", name: "Listar Clientes", description: "Listar clientes", direction: "inbound" },
    ],
    configFields: [
      { key: "shop", label: "Loja", type: "text", placeholder: "sualoja.myshopify.com" },
    ],
  },
];

/** Busca integracao premium por ID */
export function getPremiumIntegration(id: string): PremiumIntegration | undefined {
  return PREMIUM_INTEGRATIONS.find((i) => i.id === id);
}

/** Total de integracoes premium */
export const PREMIUM_TOTAL = PREMIUM_INTEGRATIONS.length;
