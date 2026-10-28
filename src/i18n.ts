import { createContext, useContext } from "react";
import { ApiError } from "./lib/api";

export type Lang = "en" | "fr" | "es" | "pt-BR";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt-BR", label: "Português (Brasil)" },
];

export interface Messages {
  app: { wordmark: string };
  nav: { boards: string; admin: string };
  lang: { label: string };
  common: { loading: string; retry: string };
  auth: {
    signIn: string;
    signOut: string;
    continueGoogle: string;
    devEmail: string;
    devName: string;
    devSubmit: string;
    signInToPost: string;
    signInToVote: string;
    signInToComment: string;
    teamOnly: string;
  };
  setup: { title: string; instructions: string; reload: string };
  boards: {
    title: string;
    empty: string;
    visibilityTeam: string;
  };
  board: {
    shareIdea: string;
    titlePlaceholder: string;
    bodyPlaceholder: string;
    submit: string;
    filterAll: string;
    sortTop: string;
    sortNew: string;
    empty: string;
    vote: string;
    voted: string;
    comments: string;
    by: string;
  };
  post: {
    back: string;
    commentsTitle: string;
    commentPlaceholder: string;
    commentSubmit: string;
    noComments: string;
    deleteComment: string;
    adminStatus: string;
    adminMerge: string;
    mergePlaceholder: string;
    mergeSubmit: string;
    delete: string;
    deleteConfirm: string;
    deleteConfirmSubmit: string;
    deleteCancel: string;
    gone: string;
  };
  admin: {
    title: string;
    notAdmin: string;
    newBoardTitle: string;
    fieldId: string;
    fieldIdHelp: string;
    fieldName: string;
    fieldVisibility: string;
    visibilityPublic: string;
    visibilityTeam: string;
    fieldDomains: string;
    domainsHelp: string;
    createSubmit: string;
    save: string;
    saved: string;
    ssoTitle: string;
    ssoSecretLabel: string;
    ssoReveal: string;
    ssoHide: string;
    ssoRotate: string;
    ssoRotateConfirm: string;
    ssoAudience: string;
    ssoSnippetTitle: string;
    ssoCopy: string;
    ssoCopied: string;
    updatesTitle: string;
    versionTitle: string;
    versionLine: string;
    latestAvailable: string;
  };
  status: { open: string; planned: string; in_progress: string; done: string };
  err: {
    admin_only: string;
    not_found: string;
    invalid_id: string;
    invalid_name: string;
    invalid_visibility: string;
    invalid_domains: string;
    board_exists: string;
    invalid_status: string;
    sign_in: string;
    team_only: string;
    turnstile_failed: string;
    setup_needed: string;
    already_voted: string;
    invalid_title: string;
    invalid_body: string;
    invalid_target: string;
    different_board: string;
    cross_origin: string;
    server_error: string;
    invalid_email: string;
    too_many: string;
    google_not_configured: string;
    invalid: string;
    google_failed: string;
  };
}

const en: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Boards", admin: "Admin" },
  lang: { label: "Language" },
  common: { loading: "Loading…", retry: "Try again" },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    continueGoogle: "Continue with Google",
    devEmail: "Email",
    devName: "Name",
    devSubmit: "Sign in",
    signInToPost: "Sign in to share an idea.",
    signInToVote: "Sign in to vote.",
    signInToComment: "Sign in to comment.",
    teamOnly: "This board is for the team. Sign in to see it.",
  },
  setup: {
    title: "Setup needed",
    instructions: "In Cloudflare, open Workers & Pages, then this Worker, then Settings → Variables and Secrets. Add a secret named SESSION_SECRET with 32 characters or more, then reload this page.",
    reload: "Reload",
  },
  boards: {
    title: "Boards",
    empty: "No boards yet.",
    visibilityTeam: "Team",
  },
  board: {
    shareIdea: "Share an idea",
    titlePlaceholder: "What would you like to see?",
    bodyPlaceholder: "Add detail (optional)",
    submit: "Add idea",
    filterAll: "All",
    sortTop: "Top",
    sortNew: "New",
    empty: "No ideas yet. Be the first to share one.",
    vote: "Vote",
    voted: "Voted",
    comments: "{n} comments",
    by: "by {name} · {date}",
  },
  post: {
    back: "Back to board",
    commentsTitle: "Comments",
    commentPlaceholder: "Add a comment",
    commentSubmit: "Comment",
    noComments: "No comments yet.",
    deleteComment: "Delete",
    adminStatus: "Status",
    adminMerge: "Merge into…",
    mergePlaceholder: "Choose an idea",
    mergeSubmit: "Merge",
    delete: "Delete this idea",
    deleteConfirm: "Its votes and comments move or disappear, and this can't be undone.",
    deleteConfirmSubmit: "Delete idea",
    deleteCancel: "Keep it",
    gone: "This idea was merged into another one, or removed. Search the board for it.",
  },
  admin: {
    title: "Admin",
    notAdmin: "This page is for the admin only.",
    newBoardTitle: "New board",
    fieldId: "Address",
    fieldIdHelp: "Lowercase letters, numbers and hyphens, 2 to 40 characters. Can't change later.",
    fieldName: "Name",
    fieldVisibility: "Visibility",
    visibilityPublic: "Public",
    visibilityTeam: "Team only",
    fieldDomains: "Allowed email domains",
    domainsHelp: "Comma-separated, e.g. example.com, example.org. Leave empty to allow none.",
    createSubmit: "Create board",
    save: "Save",
    saved: "Saved.",
    ssoTitle: "Signed-link sign-in",
    ssoSecretLabel: "Secret",
    ssoReveal: "Reveal",
    ssoHide: "Hide",
    ssoRotate: "Rotate secret",
    ssoRotateConfirm: "Links minted with the old secret stop working. Continue?",
    ssoAudience: "Audience",
    ssoSnippetTitle: "Mint a link (Node)",
    ssoCopy: "Copy",
    ssoCopied: "Copied",
    updatesTitle: "Updates",
    versionTitle: "Version",
    versionLine: "Dozokit Ideas {version}.",
    latestAvailable: "Version {latest} is available.",
  },
  status: { open: "Open", planned: "Planned", in_progress: "In progress", done: "Done" },
  err: {
    admin_only: "This is for the admin only.",
    not_found: "Not found.",
    invalid_id: "Use lowercase letters, numbers and hyphens, 2 to 40 characters.",
    invalid_name: "Enter a name.",
    invalid_visibility: "Choose a visibility.",
    invalid_domains: "Enter valid domains, separated by commas.",
    board_exists: "This address is already used by another board.",
    invalid_status: "Choose a status.",
    sign_in: "Sign in to continue.",
    team_only: "This board is for the team. Sign in to see it.",
    turnstile_failed: "The verification didn't pass. Try again.",
    setup_needed: "This board isn't set up yet.",
    already_voted: "You already voted for this idea.",
    invalid_title: "Enter a title, up to 120 characters.",
    invalid_body: "Keep it under the limit, or leave it empty.",
    invalid_target: "Choose another idea to merge into.",
    different_board: "Merge only ideas from the same board.",
    cross_origin: "That request was blocked. Reload and try again.",
    server_error: "Something went wrong. Try again.",
    invalid_email: "Enter a valid email.",
    too_many: "Too many attempts. Try again in a minute.",
    google_not_configured: "Google sign-in isn't set up yet.",
    invalid: "That didn't work. Try again.",
    google_failed: "Google sign-in failed. Try again.",
  },
};

const fr: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Boards", admin: "Admin" },
  lang: { label: "Langue" },
  common: { loading: "Chargement…", retry: "Réessayer" },
  auth: {
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    continueGoogle: "Continuer avec Google",
    devEmail: "E-mail",
    devName: "Nom",
    devSubmit: "Se connecter",
    signInToPost: "Connectez-vous pour partager une idée.",
    signInToVote: "Connectez-vous pour voter.",
    signInToComment: "Connectez-vous pour commenter.",
    teamOnly: "Ce board est réservé à l'équipe. Connectez-vous pour le voir.",
  },
  setup: {
    title: "Configuration nécessaire",
    instructions: "Dans Cloudflare, ouvrez Workers & Pages, puis ce Worker, puis Settings → Variables and Secrets. Ajoutez un secret nommé SESSION_SECRET d'au moins 32 caractères, puis rechargez cette page.",
    reload: "Recharger",
  },
  boards: {
    title: "Boards",
    empty: "Pas encore de board.",
    visibilityTeam: "Équipe",
  },
  board: {
    shareIdea: "Partager une idée",
    titlePlaceholder: "Qu'aimeriez-vous voir ?",
    bodyPlaceholder: "Ajoutez des détails (facultatif)",
    submit: "Ajouter l'idée",
    filterAll: "Toutes",
    sortTop: "Les mieux votées",
    sortNew: "Récentes",
    empty: "Pas encore d'idée. Soyez la première personne à en partager une.",
    vote: "Voter",
    voted: "Voté",
    comments: "{n} commentaires",
    by: "par {name} · {date}",
  },
  post: {
    back: "Retour au board",
    commentsTitle: "Commentaires",
    commentPlaceholder: "Ajoutez un commentaire",
    commentSubmit: "Commenter",
    noComments: "Pas encore de commentaire.",
    deleteComment: "Supprimer",
    adminStatus: "Statut",
    adminMerge: "Fusionner avec…",
    mergePlaceholder: "Choisissez une idée",
    mergeSubmit: "Fusionner",
    delete: "Supprimer cette idée",
    deleteConfirm: "Ses votes et commentaires se déplacent ou disparaissent, et c'est irréversible.",
    deleteConfirmSubmit: "Supprimer l'idée",
    deleteCancel: "La garder",
    gone: "Cette idée a été fusionnée avec une autre, ou supprimée. Recherchez-la dans le board.",
  },
  admin: {
    title: "Admin",
    notAdmin: "Cette page est réservée à l'administrateur.",
    newBoardTitle: "Nouveau board",
    fieldId: "Adresse",
    fieldIdHelp: "Lettres minuscules, chiffres et tirets, de 2 à 40 caractères. Ne pourra plus changer.",
    fieldName: "Nom",
    fieldVisibility: "Visibilité",
    visibilityPublic: "Public",
    visibilityTeam: "Équipe uniquement",
    fieldDomains: "Domaines e-mail autorisés",
    domainsHelp: "Séparés par des virgules, par ex. exemple.com, exemple.org. Laissez vide pour n'en autoriser aucun.",
    createSubmit: "Créer le board",
    save: "Enregistrer",
    saved: "Enregistré.",
    ssoTitle: "Connexion par lien signé",
    ssoSecretLabel: "Secret",
    ssoReveal: "Révéler",
    ssoHide: "Masquer",
    ssoRotate: "Changer le secret",
    ssoRotateConfirm: "Les liens créés avec l'ancien secret ne fonctionneront plus. Continuer ?",
    ssoAudience: "Audience",
    ssoSnippetTitle: "Créer un lien (Node)",
    ssoCopy: "Copier",
    ssoCopied: "Copié",
    updatesTitle: "Mises à jour",
    versionTitle: "Version",
    versionLine: "Dozokit Ideas {version}.",
    latestAvailable: "La version {latest} est disponible.",
  },
  status: { open: "Ouvert", planned: "Prévu", in_progress: "En cours", done: "Terminé" },
  err: {
    admin_only: "Réservé à l'administrateur.",
    not_found: "Introuvable.",
    invalid_id: "Utilisez des lettres minuscules, des chiffres et des tirets, de 2 à 40 caractères.",
    invalid_name: "Entrez un nom.",
    invalid_visibility: "Choisissez une visibilité.",
    invalid_domains: "Entrez des domaines valides, séparés par des virgules.",
    board_exists: "Cette adresse est déjà utilisée par un autre board.",
    invalid_status: "Choisissez un statut.",
    sign_in: "Connectez-vous pour continuer.",
    team_only: "Ce board est réservé à l'équipe. Connectez-vous pour le voir.",
    turnstile_failed: "La vérification n'a pas réussi. Réessayez.",
    setup_needed: "Ce board n'est pas encore configuré.",
    already_voted: "Vous avez déjà voté pour cette idée.",
    invalid_title: "Entrez un titre, jusqu'à 120 caractères.",
    invalid_body: "Restez sous la limite, ou laissez vide.",
    invalid_target: "Choisissez une autre idée pour la fusion.",
    different_board: "Fusionnez uniquement des idées du même board.",
    cross_origin: "Cette requête a été bloquée. Rechargez et réessayez.",
    server_error: "Une erreur est survenue. Réessayez.",
    invalid_email: "Entrez un e-mail valide.",
    too_many: "Trop de tentatives. Réessayez dans une minute.",
    google_not_configured: "La connexion Google n'est pas encore configurée.",
    invalid: "Ça n'a pas fonctionné. Réessayez.",
    google_failed: "La connexion Google a échoué. Réessayez.",
  },
};

const es: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Boards", admin: "Admin" },
  lang: { label: "Idioma" },
  common: { loading: "Cargando…", retry: "Reintentar" },
  auth: {
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    continueGoogle: "Continuar con Google",
    devEmail: "Correo",
    devName: "Nombre",
    devSubmit: "Iniciar sesión",
    signInToPost: "Inicia sesión para compartir una idea.",
    signInToVote: "Inicia sesión para votar.",
    signInToComment: "Inicia sesión para comentar.",
    teamOnly: "Este tablero es para el equipo. Inicia sesión para verlo.",
  },
  setup: {
    title: "Falta configurar",
    instructions: "En Cloudflare, abre Workers & Pages, luego este Worker, luego Settings → Variables and Secrets. Añade un secreto llamado SESSION_SECRET de 32 caracteres o más, y recarga esta página.",
    reload: "Recargar",
  },
  boards: {
    title: "Boards",
    empty: "Todavía no hay tableros.",
    visibilityTeam: "Equipo",
  },
  board: {
    shareIdea: "Comparte una idea",
    titlePlaceholder: "¿Qué te gustaría ver?",
    bodyPlaceholder: "Añade detalles (opcional)",
    submit: "Añadir idea",
    filterAll: "Todas",
    sortTop: "Más votadas",
    sortNew: "Recientes",
    empty: "Todavía no hay ideas. Sé la primera persona en compartir una.",
    vote: "Votar",
    voted: "Votado",
    comments: "{n} comentarios",
    by: "por {name} · {date}",
  },
  post: {
    back: "Volver al tablero",
    commentsTitle: "Comentarios",
    commentPlaceholder: "Añade un comentario",
    commentSubmit: "Comentar",
    noComments: "Todavía no hay comentarios.",
    deleteComment: "Eliminar",
    adminStatus: "Estado",
    adminMerge: "Fusionar con…",
    mergePlaceholder: "Elige una idea",
    mergeSubmit: "Fusionar",
    delete: "Eliminar esta idea",
    deleteConfirm: "Sus votos y comentarios se mueven o desaparecen, y esto no se puede deshacer.",
    deleteConfirmSubmit: "Eliminar idea",
    deleteCancel: "Conservarla",
    gone: "Esta idea se fusionó con otra, o se eliminó. Búscala en el tablero.",
  },
  admin: {
    title: "Admin",
    notAdmin: "Esta página es solo para el administrador.",
    newBoardTitle: "Nuevo tablero",
    fieldId: "Dirección",
    fieldIdHelp: "Letras minúsculas, números y guiones, de 2 a 40 caracteres. No podrá cambiar después.",
    fieldName: "Nombre",
    fieldVisibility: "Visibilidad",
    visibilityPublic: "Público",
    visibilityTeam: "Solo equipo",
    fieldDomains: "Dominios de correo permitidos",
    domainsHelp: "Separados por comas, por ejemplo example.com, example.org. Déjalo vacío para no permitir ninguno.",
    createSubmit: "Crear tablero",
    save: "Guardar",
    saved: "Guardado.",
    ssoTitle: "Inicio de sesión por enlace firmado",
    ssoSecretLabel: "Secreto",
    ssoReveal: "Revelar",
    ssoHide: "Ocultar",
    ssoRotate: "Cambiar el secreto",
    ssoRotateConfirm: "Los enlaces creados con el secreto anterior dejarán de funcionar. ¿Continuar?",
    ssoAudience: "Audiencia",
    ssoSnippetTitle: "Crear un enlace (Node)",
    ssoCopy: "Copiar",
    ssoCopied: "Copiado",
    updatesTitle: "Actualizaciones",
    versionTitle: "Versión",
    versionLine: "Dozokit Ideas {version}.",
    latestAvailable: "La versión {latest} está disponible.",
  },
  status: { open: "Abierto", planned: "Planificado", in_progress: "En curso", done: "Hecho" },
  err: {
    admin_only: "Solo para el administrador.",
    not_found: "No encontrado.",
    invalid_id: "Usa letras minúsculas, números y guiones, de 2 a 40 caracteres.",
    invalid_name: "Escribe un nombre.",
    invalid_visibility: "Elige una visibilidad.",
    invalid_domains: "Escribe dominios válidos, separados por comas.",
    board_exists: "Esta dirección ya la usa otro tablero.",
    invalid_status: "Elige un estado.",
    sign_in: "Inicia sesión para continuar.",
    team_only: "Este tablero es para el equipo. Inicia sesión para verlo.",
    turnstile_failed: "La verificación no pasó. Inténtalo de nuevo.",
    setup_needed: "Este tablero todavía no está configurado.",
    already_voted: "Ya votaste por esta idea.",
    invalid_title: "Escribe un título, hasta 120 caracteres.",
    invalid_body: "Mantente bajo el límite, o déjalo vacío.",
    invalid_target: "Elige otra idea para la fusión.",
    different_board: "Fusiona solo ideas del mismo tablero.",
    cross_origin: "Esa solicitud se bloqueó. Recarga e inténtalo de nuevo.",
    server_error: "Algo salió mal. Inténtalo de nuevo.",
    invalid_email: "Escribe un correo válido.",
    too_many: "Demasiados intentos. Inténtalo de nuevo en un minuto.",
    google_not_configured: "El inicio de sesión con Google todavía no está configurado.",
    invalid: "Eso no funcionó. Inténtalo de nuevo.",
    google_failed: "El inicio de sesión con Google falló. Inténtalo de nuevo.",
  },
};

const ptBR: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Boards", admin: "Admin" },
  lang: { label: "Idioma" },
  common: { loading: "Carregando…", retry: "Tentar de novo" },
  auth: {
    signIn: "Entrar",
    signOut: "Sair",
    continueGoogle: "Continuar com o Google",
    devEmail: "E-mail",
    devName: "Nome",
    devSubmit: "Entrar",
    signInToPost: "Entre para compartilhar uma ideia.",
    signInToVote: "Entre para votar.",
    signInToComment: "Entre para comentar.",
    teamOnly: "Este quadro é para a equipe. Entre para vê-lo.",
  },
  setup: {
    title: "Configuração necessária",
    instructions: "No Cloudflare, abra Workers & Pages, depois este Worker, depois Settings → Variables and Secrets. Adicione um secret chamado SESSION_SECRET com 32 caracteres ou mais, depois recarregue esta página.",
    reload: "Recarregar",
  },
  boards: {
    title: "Boards",
    empty: "Ainda não há quadros.",
    visibilityTeam: "Equipe",
  },
  board: {
    shareIdea: "Compartilhe uma ideia",
    titlePlaceholder: "O que você gostaria de ver?",
    bodyPlaceholder: "Adicione detalhes (opcional)",
    submit: "Adicionar ideia",
    filterAll: "Todas",
    sortTop: "Mais votadas",
    sortNew: "Recentes",
    empty: "Ainda não há ideias. Seja a primeira pessoa a compartilhar uma.",
    vote: "Votar",
    voted: "Votado",
    comments: "{n} comentários",
    by: "por {name} · {date}",
  },
  post: {
    back: "Voltar ao quadro",
    commentsTitle: "Comentários",
    commentPlaceholder: "Adicione um comentário",
    commentSubmit: "Comentar",
    noComments: "Ainda não há comentários.",
    deleteComment: "Excluir",
    adminStatus: "Status",
    adminMerge: "Mesclar com…",
    mergePlaceholder: "Escolha uma ideia",
    mergeSubmit: "Mesclar",
    delete: "Excluir esta ideia",
    deleteConfirm: "Os votos e comentários dela são movidos ou somem, e isso não pode ser desfeito.",
    deleteConfirmSubmit: "Excluir ideia",
    deleteCancel: "Manter",
    gone: "Esta ideia foi mesclada com outra, ou removida. Procure por ela no quadro.",
  },
  admin: {
    title: "Admin",
    notAdmin: "Esta página é só para o administrador.",
    newBoardTitle: "Novo quadro",
    fieldId: "Endereço",
    fieldIdHelp: "Letras minúsculas, números e hifens, de 2 a 40 caracteres. Não poderá mudar depois.",
    fieldName: "Nome",
    fieldVisibility: "Visibilidade",
    visibilityPublic: "Público",
    visibilityTeam: "Somente equipe",
    fieldDomains: "Domínios de e-mail permitidos",
    domainsHelp: "Separados por vírgulas, por exemplo example.com, example.org. Deixe vazio para não permitir nenhum.",
    createSubmit: "Criar quadro",
    save: "Salvar",
    saved: "Salvo.",
    ssoTitle: "Entrada por link assinado",
    ssoSecretLabel: "Secret",
    ssoReveal: "Revelar",
    ssoHide: "Ocultar",
    ssoRotate: "Trocar o secret",
    ssoRotateConfirm: "Os links criados com o secret antigo deixam de funcionar. Continuar?",
    ssoAudience: "Audiência",
    ssoSnippetTitle: "Gerar um link (Node)",
    ssoCopy: "Copiar",
    ssoCopied: "Copiado",
    updatesTitle: "Atualizações",
    versionTitle: "Versão",
    versionLine: "Dozokit Ideas {version}.",
    latestAvailable: "A versão {latest} está disponível.",
  },
  status: { open: "Aberto", planned: "Planejado", in_progress: "Em andamento", done: "Concluído" },
  err: {
    admin_only: "Somente para o administrador.",
    not_found: "Não encontrado.",
    invalid_id: "Use letras minúsculas, números e hifens, de 2 a 40 caracteres.",
    invalid_name: "Digite um nome.",
    invalid_visibility: "Escolha uma visibilidade.",
    invalid_domains: "Digite domínios válidos, separados por vírgulas.",
    board_exists: "Este endereço já é usado por outro quadro.",
    invalid_status: "Escolha um status.",
    sign_in: "Entre para continuar.",
    team_only: "Este quadro é para a equipe. Entre para vê-lo.",
    turnstile_failed: "A verificação não passou. Tente de novo.",
    setup_needed: "Este quadro ainda não está configurado.",
    already_voted: "Você já votou nesta ideia.",
    invalid_title: "Digite um título, até 120 caracteres.",
    invalid_body: "Fique dentro do limite, ou deixe vazio.",
    invalid_target: "Escolha outra ideia para a mesclagem.",
    different_board: "Mescle só ideias do mesmo quadro.",
    cross_origin: "Essa requisição foi bloqueada. Recarregue e tente de novo.",
    server_error: "Algo deu errado. Tente de novo.",
    invalid_email: "Digite um e-mail válido.",
    too_many: "Muitas tentativas. Tente de novo em um minuto.",
    google_not_configured: "O login com Google ainda não está configurado.",
    invalid: "Isso não funcionou. Tente de novo.",
    google_failed: "O login com Google falhou. Tente de novo.",
  },
};

const DICTS: Record<Lang, Messages> = { en, fr, es, "pt-BR": ptBR };
export const getMessages = (lang: Lang): Messages => DICTS[lang];

const COOKIE_DAYS = 365;

export function detectLang(): Lang {
  const stored = localStorage.getItem("lang");
  if (stored && stored in DICTS) return stored as Lang;
  const nav = navigator.language ?? "en";
  if (/^fr/i.test(nav)) return "fr";
  if (/^es/i.test(nav)) return "es";
  if (/^pt/i.test(nav)) return "pt-BR";
  return "en";
}

// Sets <html lang> and a readable "lang" cookie, so the Worker can localise the /sso error page
// in the same language as the app.
export function applyLang(lang: Lang) {
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;
  document.cookie = `lang=${lang}; Path=/; Max-Age=${COOKIE_DAYS * 86400}; SameSite=Lax`;
}

export function formatDate(ms: number, lang: Lang): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(ms);
}

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

// Every API error code translated, falling back to a generic message for anything unexpected
// (there shouldn't be any: this list mirrors every {error:"<code>"} the Worker can answer).
export function errorText(t: Messages, err: unknown): string {
  const code = err instanceof ApiError ? err.code : "server_error";
  return (t.err as Record<string, string>)[code] ?? t.err.server_error;
}

export interface I18n {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}

export const I18nContext = createContext<I18n>({ lang: "en", t: en, setLang: () => {} });
export const useT = () => useContext(I18nContext);
