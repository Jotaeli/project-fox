import type { ComponentType, ReactNode } from "react";
import {
  BadgesArt, ConnectArt, DonutArt, DragTierArt, EventArt, GraphArt, HomeShowcaseArt,
  HomeUrgentArt, HomeWelcomeArt, MoonsArt, PiggyArt, SolarArt, SortArt, StepsArt, TasksLayoutArt, TiersArt,
} from "./illustrations.js";
import {
  NotaInteractive, PlanetaInteractive, RendaInteractive, TarefaInteractive, WishInteractive,
} from "./interactive.js";

export type GuideKey = "home" | "rotina-financas" | "rotina-wishlist" | "rotina-tarefas" | "anotar" | "criar";

export interface GuideSlide {
  titulo: string;
  texto: ReactNode;
  art?: ComponentType;
  interactive?: ComponentType;
}

export interface Guide {
  titulo: string;
  slides: GuideSlide[];
}

export const GUIDES: Record<GuideKey, Guide> = {
  home: {
    titulo: "Início",
    slides: [
      {
        art: HomeWelcomeArt,
        titulo: "Bem-vindo ao Project Fox",
        texto: <>Três módulos que conversam entre si: <b>Rotina</b> cuida do seu dia a dia, <b>Anotar</b> guarda o que passa pela sua cabeça e <b>Desenvolver/Criar</b> acompanha no que você está evoluindo. Esta tela é o resumo dos três.</>,
      },
      {
        art: HomeUrgentArt,
        titulo: "A faixa de urgentes",
        texto: <>No topo ficam as tarefas e metas com prazo mais apertado, de todos os módulos juntos. A cor muda conforme o prazo se aproxima — <b style={{ color: "#4ade80" }}>verde</b> tem folga, <b style={{ color: "#ffd66e" }}>amarelo</b> é essa semana, <b style={{ color: "#f87171" }}>vermelho</b> é agora. Se estiver vazia, você está em dia.</>,
      },
      {
        art: HomeShowcaseArt,
        titulo: "A vitrine dos módulos",
        texto: <>Abaixo, cada bloco é um recorte real: quanto sobrou no cofrinho, seus planetas em órbita, o que está no topo da wishlist e as notas mais recentes. Clique em qualquer bloco para cair direto na aba correspondente.</>,
      },
    ],
  },

  "rotina-financas": {
    titulo: "Rotina · Finanças",
    slides: [
      {
        art: PiggyArt,
        titulo: "O cofrinho mostra o que sobrou",
        texto: <>A janela de vidro na barriga do porquinho enche de moedas conforme a sua renda do mês ainda está disponível. Cada gasto que você marca como pago faz moedas sumirem. Passe o mouse por cima para ver o saldo exato.</>,
      },
      {
        titulo: "Comece pela sua renda",
        texto: <>Antes de tudo, diga quanto entra no mês e de onde vem. Você pode registrar várias fontes (salário, freela, um extra que caiu) — elas somam. Vamos criar a primeira agora:</>,
        interactive: RendaInteractive,
      },
      {
        art: DonutArt,
        titulo: "Modalidades e o anel",
        texto: <>Os gastos ficam agrupados em modalidades. <b>Wishlist</b> é fixa e vem da sua tierlist; as outras você cria (comida, contas, rolê…). O anel embaixo do porquinho mostra o peso de cada uma sobre o total planejado — é ali que dá pra ver pra onde o dinheiro está indo antes de ele ir.</>,
      },
    ],
  },

  "rotina-wishlist": {
    titulo: "Rotina · Wishlist",
    slides: [
      {
        art: TiersArt,
        titulo: "Uma tierlist pro seu desejo",
        texto: <>A ideia é simples: em vez de uma lista onde tudo parece igualmente urgente, cada coisa que você quer entra numa tier. Ver um item parado em <b style={{ color: "#8fa3c8" }}>C</b> há meses costuma ser a melhor defesa contra a compra por impulso.</>,
      },
      {
        titulo: "Coloque a primeira coisa que você quer",
        texto: <>Depois dá pra adicionar foto, link de compra, descrição e até ligar o item a um planeta do Desenvolver/Criar. Por ora, o essencial:</>,
        interactive: WishInteractive,
      },
      {
        art: DragTierArt,
        titulo: "Desejo muda — arraste",
        texto: <>Arraste qualquer card para outra tier quando a vontade mudar. Quando um gasto da modalidade <b>Wishlist</b> for marcado como pago nas Finanças, o item correspondente vira <b style={{ color: "#4ade80" }}>comprado</b> aqui automaticamente.</>,
      },
    ],
  },

  "rotina-tarefas": {
    titulo: "Rotina · Tarefas",
    slides: [
      {
        art: TasksLayoutArt,
        titulo: "Seções à esquerda, pilha à direita",
        texto: <>Cada seção tem a sua própria pilha independente. O card do topo é o <b style={{ color: "#6ea8ff" }}>AGORA</b> — a ideia é você olhar pra uma coisa de cada vez, não pra uma lista de vinte. Clique numa seção para trocar o foco, ou arraste uma tarefa até outra seção para movê-la.</>,
      },
      {
        titulo: "Sua primeira tarefa",
        texto: <>Toda tarefa é feita de etapas — é o que permite avançar aos poucos em vez de encarar um bloco só. Crie a sua agora:</>,
        interactive: TarefaInteractive,
      },
      {
        art: StepsArt,
        titulo: "Avance uma etapa por vez",
        texto: <>Os dots mostram onde você está. O botão <b>Concluir etapa</b> avança um passo; se você marcou sem querer, clique num dot já concluído para desfazer — ele e os seguintes voltam. Quando a última etapa cai, a tarefa sai da pilha.</>,
      },
      {
        art: SortArt,
        titulo: "Ordem sua ou ordem do prazo",
        texto: <>Cada seção tem um toggle. Em <b>Personalizado</b> você arrasta os cards na ordem que quiser. Em <b>Data</b> a pilha se reorganiza pelo prazo — e sua ordem manual fica guardada intacta, esperando você voltar.</>,
      },
    ],
  },

  anotar: {
    titulo: "Anotar",
    slides: [
      {
        art: GraphArt,
        titulo: "Suas notas como um grafo",
        texto: <>Cada nota é um nó flutuando num espaço infinito. Arraste o fundo para navegar, use o scroll para dar zoom e arraste um nó para reposicioná-lo — a posição fica salva. É um mapa da sua cabeça, não uma lista.</>,
      },
      {
        art: BadgesArt,
        titulo: "Badges dizem “tem a ver com”",
        texto: <>Uma nota pode receber quantas badges quiser: <b style={{ color: "#4ade80" }}>wishlist</b>, <b style={{ color: "#60a5fa" }}>tarefas</b>, <b style={{ color: "#f472b6" }}>criar</b>. O núcleo pega a cor da principal e o halo mistura todas. Sem badge, a nota fica branca. Isso é escolha sua — nada é marcado automaticamente.</>,
      },
      {
        titulo: "Escreva a primeira nota",
        texto: <>Nem toda nota precisa de badge ou conexão logo de cara. Solte a ideia primeiro, organize depois:</>,
        interactive: NotaInteractive,
      },
      {
        art: ConnectArt,
        titulo: "Você é quem liga as notas",
        texto: <>Segure numa nota e solte em cima de outra para criar a conexão. O app nunca sugere ligações sozinho — a rede que aparecer ali é exatamente a que você desenhou, e é isso que a torna útil.</>,
      },
    ],
  },

  criar: {
    titulo: "Desenvolver/Criar",
    slides: [
      {
        art: SolarArt,
        titulo: "Um sistema solar de habilidades",
        texto: <>Cada planeta é uma área que você quer desenvolver: um instrumento, um idioma, um projeto. Eles orbitam, têm tipo e cor próprios, e mostram no brilho quão viva anda a sua prática.</>,
      },
      {
        titulo: "Crie o seu primeiro planeta",
        texto: <>Escolha algo que você realmente quer levar adiante. O objetivo principal é o norte — o que você quer conseguir fazer lá na frente:</>,
        interactive: PlanetaInteractive,
      },
      {
        art: MoonsArt,
        titulo: "As três luas e a saúde",
        texto: <><b style={{ color: "#8fd0ff" }}>Relatório</b> é obrigatória: é onde você registra o que praticou, e a meta semanal define quantas vezes. <b style={{ color: "#ffcf7d" }}>Recursos</b> e <b style={{ color: "#d3a6ff" }}>Fotos</b> são opcionais. A saúde do planeta acompanha o quanto da meta você cumpriu nos últimos 7 dias — e planetas novos têm uma semana de carência.</>,
      },
      {
        art: EventArt,
        titulo: "Metas dão empolgação",
        texto: <>Dentro de um planeta você cria eventos com prazo e um checklist. Cada item é comprovado anexando um relatório que você já escreveu — nada de marcar caixinha à toa. Planeta com evento ativo pulsa e orbita mais rápido; concluir tudo antes do prazo dispara uma festinha.</>,
      },
    ],
  },
};
