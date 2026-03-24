export const mainTourSteps = [
  {
    tour: "main-onboarding",
    steps: [
      {
        icon: <>💬</>,
        title: "Chat com agentes",
        content: <>Aqui voce conversa com seus squads de agentes. Mande uma mensagem e o agente certo responde. Peca pesquisas, crie conteudo, revise textos — tudo por chat.</>,
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🧠</>,
        title: "Arquiteto — seu assistente",
        content: <>O Arquiteto cria e gerencia seus squads. Diga o que precisa em linguagem natural e ele monta a equipe. Tambem edita, lista e deleta squads.</>,
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>📋</>,
        title: "Board Kanban",
        content: <>Organize tasks arrastando cards entre colunas. Agentes movem tasks automaticamente conforme trabalham.</>,
        selector: "#sidebar-board",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🚀</>,
        title: "Seus squads",
        content: <>Cada squad e uma equipe de agentes especializados com pipeline automatizado. Crie squads pelo chat com o Arquiteto.</>,
        selector: "#sidebar-squads",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🤖</>,
        title: "Agentes",
        content: <>Veja todos os agentes, ajuste modelo de IA e budget de tokens. Cada agente tem personalidade e especialidade unica.</>,
        selector: "#sidebar-agents",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔗</>,
        title: "Integracoes",
        content: <>Conecte GitHub, Discord, Telegram. Agentes usam essas integracoes para notificar e publicar.</>,
        selector: "#sidebar-integrations",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>⚙️</>,
        title: "Configuracoes",
        content: <>Configure organizacao, membros, plano, provedores de IA e skills de publicacao.</>,
        selector: "#sidebar-settings",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔑</>,
        title: "Provedores de IA — Importante!",
        content: <>Para agentes responderem, configure pelo menos 1 provedor: Claude, OpenAI ou Gemini. Cole sua API key e teste a conexao.</>,
        selector: "#sidebar-settings",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>📸</>,
        title: "Skills de publicacao",
        content: <>Configure Instagram, LinkedIn e mais para publicar automaticamente. Sem skills, agentes criam conteudo mas nao publicam.</>,
        selector: "#sidebar-settings",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>⌨️</>,
        title: "Comandos uteis",
        content: (
          <div className="space-y-1">
            <p>O Arquiteto entende:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>"Crie um squad de marketing"</li>
              <li>"Listar meus squads"</li>
              <li>"Crie tasks para cada agente"</li>
              <li>"O que tem no board?"</li>
              <li>"Exporte a config do squad"</li>
              <li>"Pause o squad Dev Team"</li>
            </ul>
          </div>
        ),
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>✅</>,
        title: "Tudo pronto!",
        content: (
          <div className="space-y-2">
            <p>Proximos passos:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Configure um provedor de IA em Settings</li>
              <li>Converse com o Arquiteto para criar seu squad</li>
              <li>Agentes comecam a trabalhar!</li>
            </ol>
            <p className="text-[10px] mt-2">Refaca este tour em Settings {">"} Organizacao.</p>
          </div>
        ),
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
    ],
  },
];
