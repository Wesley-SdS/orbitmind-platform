export const mainTourSteps = [
  {
    tour: "main-onboarding",
    steps: [
      {
        icon: <>📊</>,
        title: "Dashboard",
        content: <>Visão geral com métricas em tempo real: squads ativos, tasks completadas, execuções e custo estimado.</>,
        selector: "#sidebar-dashboard",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>💬</>,
        title: "Chat com agentes",
        content: <>Aqui você conversa com seus squads de agentes. Mande uma mensagem e o agente certo responde. Peça pesquisas, crie conteúdo, revise textos — tudo por chat.</>,
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🧠</>,
        title: "Arquiteto — seu assistente",
        content: <>O Arquiteto cria e gerencia seus squads. Diga o que precisa em linguagem natural e ele monta a equipe. Também edita, lista e deleta squads.</>,
        selector: "#sidebar-chat",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>📋</>,
        title: "Board Kanban",
        content: <>Organize tasks arrastando cards entre colunas. Agentes movem tasks automaticamente conforme trabalham no pipeline.</>,
        selector: "#sidebar-board",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🚀</>,
        title: "Seus squads",
        content: <>Cada squad é uma equipe de agentes especializados com pipeline automatizado. Crie squads pelo chat com o Arquiteto.</>,
        selector: "#sidebar-squads",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🤖</>,
        title: "Agentes",
        content: <>Veja todos os agentes, ajuste modelo de IA e budget de tokens. Cada agente tem personalidade e especialidade única.</>,
        selector: "#sidebar-agents",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔀</>,
        title: "Pipeline",
        content: <>Gerencie a esteira de agentes conectada ao GitHub. Ative, desative e dispare workflows direto daqui.</>,
        selector: "#sidebar-pipeline",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🛒</>,
        title: "Marketplace",
        content: <>Explore agentes e squads prontos para usar. Adquira templates e adicione à sua organização com um clique.</>,
        selector: "#sidebar-marketplace",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔗</>,
        title: "Integrações",
        content: <>Conecte GitHub, Discord, Telegram e mais de 700 plataformas. Agentes usam integrações para notificar, publicar e sincronizar.</>,
        selector: "#sidebar-integrations",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>⚙️</>,
        title: "Configurações",
        content: <>Configure organização, membros, plano, provedores de IA e skills de publicação.</>,
        selector: "#sidebar-settings",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🏢</>,
        title: "Escritório Virtual",
        content: <>Visualize seus agentes trabalhando em tempo real num escritório virtual 3D estilo Gather.</>,
        selector: "#sidebar-office",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🔑</>,
        title: "Provedores de IA — Importante!",
        content: <>Para os agentes responderem, configure pelo menos um provedor: Claude, OpenAI ou Gemini. Vá em Configurações, aba Provedores de IA, cole sua API key e teste a conexão.</>,
        selector: "#sidebar-settings",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>⌨️</>,
        title: "Comandos úteis",
        content: (
          <div className="space-y-1">
            <p>O Arquiteto entende comandos como:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>&quot;Crie um squad de marketing&quot;</li>
              <li>&quot;Listar meus squads&quot;</li>
              <li>&quot;Crie tasks para cada agente&quot;</li>
              <li>&quot;O que tem no board?&quot;</li>
              <li>&quot;Exporte a config do squad&quot;</li>
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
            <p>Próximos passos:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Configure um provedor de IA em Configurações</li>
              <li>Converse com o Arquiteto para criar seu squad</li>
              <li>Os agentes começam a trabalhar!</li>
            </ol>
            <p className="text-[10px] mt-2">Refaça este tour em Configurações {" > "} Organização.</p>
          </div>
        ),
        selector: "#sidebar-dashboard",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
    ],
  },
];
