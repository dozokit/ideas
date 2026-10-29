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
  nav: { boards: string; admin: string; settings: string };
  lang: { label: string };
  common: { loading: string; retry: string };
  auth: { signOut: string; noAccessTitle: string; noAccess: string };
  login: { title: string; password: string; help: string; submit: string; busy: string };
  password: { title: string; current: string; next: string; again: string; submit: string; saving: string; mismatch: string; saved: string; help: string };
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
    comments: string;
    by: string;
    membersOnly: string;
    membersOnlyProduct: string;
    similarLead: string;
    votes: string;
    suggest: string;
    close: string;
    lead: string;
    reportBug: string;
    bugLead: string;
    bugTitle: string;
    bugBody: string;
    bugExpected: string;
    bugPlace: string;
    bugScreenshot: string;
    bugSubmit: string;
    bugBadge: string;
    meToo: string;
    typeAll: string;
    typeIdeas: string;
    typeBugs: string;
    emptyIdeas: string;
    emptyBugs: string;
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
    membersOnly: string;
    official: string;
    expected: string;
    place: string;
    screenshotAlt: string;
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
    visibilityHelp: string;
    fieldLogo: string;
    logoHelp: string;
    logoRemove: string;
    fieldColor: string;
    fieldLang: string;
    langBrowser: string;
    statusesTitle: string;
    statusName: string;
    statusAdd: string;
    statusUp: string;
    statusDown: string;
    statusRemove: string;
    statusesHelp: string;
    copyLink: string;
    openLink: string;
    boardsEmpty: string;
    ideasCount: string;
    cancel: string;
    back: string;
    tabLook: string;
    tabConnect: string;
    productTitle: string;
    fieldProductName: string;
    fieldProductUrl: string;
    productHelp: string;
    connectPublicStep: string;
    connectPublicHelp: string;
    connectSignedTitle: string;
    connectStep1: string;
    connectStep1Help: string;
    connectStep2: string;
    connectStep2Help: string;
    copyInstructions: string;
    instructionsCopied: string;
    connectStep3: string;
    connectStep3Help: string;
    openAsTest: string;
    devBrief: string;
    createSubmit: string;
    save: string;
    saved: string;
    ssoSecretLabel: string;
    ssoReveal: string;
    ssoHide: string;
    ssoRotate: string;
    ssoRotateConfirm: string;
    ssoCopied: string;
    updatesTitle: string;
    updatesLead: string;
    updatesFieldLabel: string;
    updatesSubmit: string;
    updatesInvalidRepo: string;
    updatesHelp: string;
    shareLabel: string;
    shareHelp: string;
    versionLine: string;
    latestAvailable: string;
    addressTitle: string;
    addressNow: string;
    addressLead: string;
    addressHave: string;
    addressNone: string;
    addressElsewhere: string;
    addressCloudflare: string;
    addressOpenWorkers: string;
    addressNoneStep1: string;
    addressNoneStep2: string;
    addressAddToCloudflare: string;
    addressOnboard: string;
    addressNameservers: string;
    addressAddToWorker: string;
    addressTypeBelow: string;
    addressField: string;
    addressChecking: string;
    addressConnect: string;
    addressRemove: string;
    addressConnected: string;
    addressRemoved: string;
    addressHelp: string;
    statusesIdeas: string;
    statusesBugs: string;
    devTitle: string;
    devLead: string;
    devTokenName: string;
    devTokenNamePlaceholder: string;
    devTokenCreate: string;
    devTokenOnce: string;
    devAddress: string;
    devHeader: string;
    devCopy: string;
    devTokenUsed: string;
    devTokenNeverUsed: string;
    devTokenRevoke: string;
  };
  status: Record<"open" | "planned" | "in_progress" | "done" | "new" | "confirmed" | "fixing" | "fixed", string>;
  err: {
    admin_only: string;
    not_found: string;
    invalid_id: string;
    invalid_name: string;
    invalid_visibility: string;
    invalid_logo: string;
    invalid_color: string;
    invalid_statuses: string;
    board_exists: string;
    invalid_status: string;
    team_only: string;
    members_only: string;
    setup_needed: string;
    already_voted: string;
    invalid_title: string;
    invalid_body: string;
    invalid_target: string;
    different_board: string;
    cross_origin: string;
    server_error: string;
    too_many: string;
    invalid: string;
    wrong_password: string;
    wrong_current_password: string;
    password_too_short: string;
    invalid_product_name: string;
    invalid_product_url: string;
    invalid_domain: string;
    domain_no_answer: string;
    domain_elsewhere: string;
    invalid_place: string;
    invalid_screenshot: string;
  };
}

const en: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Boards", admin: "Admin", settings: "Settings" },
  lang: { label: "Language" },
  common: { loading: "Loading…", retry: "Try again" },
  auth: {
    signOut: "Sign out",
    noAccessTitle: "No access",
    noAccess: "Open this board from the product you use.",
  },
  login: {
    title: "Sign in to the admin page",
    password: "Password",
    help: "The one you typed when you deployed, or set later on the admin page.",
    submit: "Sign in",
    busy: "Signing in",
  },
  password: {
    title: "Change password",
    current: "Current password",
    next: "New password",
    again: "New password again",
    submit: "Change password",
    saving: "Saving",
    mismatch: "The two new passwords are not the same.",
    saved: "Password changed. Your other devices are signed out.",
    help: "12 characters or more. Forgot it? In Cloudflare, open this Worker, then Settings → Variables and Secrets, and edit PASSWORD: that password works again.",
  },
  setup: {
    title: "Set a password first",
    instructions: "In Cloudflare, open Workers & Pages, then this Worker, then Settings → Variables and Secrets. Add a secret named PASSWORD with 12 characters or more (or edit it if it is there), then reload this page.",
    reload: "Reload",
  },
  boards: {
    title: "Boards",
    empty: "No boards yet.",
    visibilityTeam: "Private",
  },
  board: {
    shareIdea: "Share an idea",
    titlePlaceholder: "What would you like to see?",
    bodyPlaceholder: "Add detail (optional)",
    submit: "Add idea",
    filterAll: "All",
    sortTop: "Top",
    sortNew: "New",
    empty: "Nothing yet. Suggest an idea or report a bug.",
    vote: "Vote",
    comments: "{n} comments",
    by: "by {name} · {date}",
    membersOnly: "To vote, suggest an idea or report a bug, open this board from the product you use.",
    membersOnlyProduct: "To vote, suggest an idea or report a bug, open Ideas from {product}.",
    similarLead: "Already suggested? Vote for it instead.",
    votes: "{n} votes",
    suggest: "Suggest an idea",
    close: "Close",
    lead: "Suggest what you'd like, or report what gets in your way. Vote for the ones that matter to you: the most voted come first.",
    reportBug: "Report a bug",
    bugLead: "Tell us what went wrong. Others who hit it too vote for it (▲), so the team fixes what bothers people most.",
    bugTitle: "What went wrong?",
    bugBody: "What happened, step by step (optional)",
    bugExpected: "What did you expect? (optional)",
    bugPlace: "Where? A page or a link (optional)",
    bugScreenshot: "Screenshot (optional): PNG, JPEG, WebP or GIF, up to 5 MB",
    bugSubmit: "Report bug",
    bugBadge: "Bug",
    meToo: "Me too",
    typeAll: "All",
    typeIdeas: "Ideas",
    typeBugs: "Bugs",
    emptyIdeas: "No ideas yet. Be the first to share one.",
    emptyBugs: "No bugs reported. Something not working? Report it.",
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
    mergePlaceholder: "Choose an idea or a bug",
    mergeSubmit: "Merge",
    delete: "Delete this post",
    deleteConfirm: "Its votes and comments move or disappear, and this can't be undone.",
    deleteConfirmSubmit: "Delete",
    deleteCancel: "Keep it",
    gone: "This post was merged into another one, or removed. Search the board for it.",
    membersOnly: "To vote or comment, open this board from the product you use.",
    official: "Official answer",
    expected: "Expected",
    place: "Where",
    screenshotAlt: "Screenshot of the bug",
  },
  admin: {
    title: "Admin",
    notAdmin: "This page is for the admin only.",
    newBoardTitle: "New board",
    fieldId: "Link name",
    fieldIdHelp: "Lowercase letters, numbers and hyphens, 2 to 40 characters. Can't change later.",
    fieldName: "Name",
    fieldVisibility: "Visibility",
    visibilityPublic: "Public",
    visibilityTeam: "Private",
    visibilityHelp: "Public: anyone with the link can read it. Private: only people who open it from your product. Either way, only they can vote, suggest and comment.",
    fieldLogo: "Logo",
    logoHelp: "PNG, JPEG, SVG or WebP, up to 200 KB.",
    logoRemove: "Remove logo",
    fieldColor: "Colour",
    fieldLang: "Language",
    langBrowser: "Each visitor's browser language",
    statusesTitle: "Statuses",
    statusName: "Status name",
    statusAdd: "Add a status",
    statusUp: "Move up",
    statusDown: "Move down",
    statusRemove: "Remove",
    statusesHelp: "New ideas and bugs start in the first status of their list. Removing a status moves its posts to the first one.",
    copyLink: "Copy link",
    openLink: "Open",
    boardsEmpty: "No boards yet. Create your first one with New board.",
    ideasCount: "{n} ideas and bugs",
    cancel: "Cancel",
    back: "All boards",
    tabLook: "Look",
    tabConnect: "Connect to your product",
    productTitle: "Your product",
    fieldProductName: "Product name",
    fieldProductUrl: "Product link (optional)",
    productHelp: "People who can read this board but not vote yet are told: “To vote, suggest an idea or report a bug, open Ideas from” your product name, linked to this address. Leave both empty to keep the general sentence.",
    connectPublicStep: "Put this link behind an “Ideas” button in your app",
    connectPublicHelp: "Anyone who opens it can read the ideas, but not vote, suggest or comment.",
    connectSignedTitle: "So your signed-in users can vote too",
    connectStep1: "Add an “Ideas” button where your users are signed in",
    connectStep1Help: "For example in your app’s menu. Whoever clicks it lands on this board, already signed in with their name.",
    connectStep2: "Your server makes the link",
    connectStep2Help: "When someone clicks the button, your server makes a link that signs them in to this board and sends them there. Copy the instructions and give them to your developer: they hold everything needed, this board’s secret included, so keep them private.",
    copyInstructions: "Copy instructions for your developer",
    instructionsCopied: "Copied. Paste them to your developer.",
    connectStep3: "Check it",
    connectStep3Help: "Opens the board as a made-up member, “Test person”, so you see it exactly as your users will. You stay signed in to the admin page.",
    openAsTest: "Open as a test person",
    devBrief: "Dozokit Ideas: send our signed-in users to the \"{name}\" board for ideas and bug reports\n\nWhat it is: a board where our users suggest ideas, report bugs, vote and comment. They can only do that when our product sends them there with a signed link, which signs them in to this board. Please add an \"Ideas\" button, shown to signed-in users, that does this.\n\nBoard: {origin}/b/{id}\n\nWhen someone clicks the button, our server makes a token and sends their browser there (a normal link or redirect, never inside an iframe):\n{origin}/sso?token=<the token>&return_to=/b/{id}\n\nThe token is a JWT signed with HS256 using this board's secret:\n{secret}\n\nIts fields:\n- iss: \"{id}\" (the board's id)\n- aud: \"{origin}\" (exactly this address)\n- sub: the user's id in our product (the same every time for the same person)\n- name: the user's full name\n- email: the user's email address\n- exp: now plus 5 minutes at most, in seconds\n- jti: a unique id for each token (a token only works once)\n\nMake the token on our server, when the button is clicked. Never send the secret to the browser or put it in front-end code: keep it with the server's other secrets.\n\nExample in Node:\n{snippet}\n",
    createSubmit: "Create board",
    save: "Save",
    saved: "Saved.",
    ssoSecretLabel: "Secret",
    ssoReveal: "Reveal",
    ssoHide: "Hide",
    ssoRotate: "Rotate secret",
    ssoRotateConfirm: "Links minted with the old secret stop working. Continue?",
    ssoCopied: "Copied",
    updatesTitle: "Updates",
    updatesLead:
      "Updates run from your copy on GitHub. Cloudflare's Deploy button leaves the update button out, so add it once: paste your copy's address, press the button, then Commit changes on GitHub. From then on, Actions → Update → Run workflow installs the latest release, once it checks the release is signed by Dozokit.",
    updatesFieldLabel: "Your copy on GitHub",
    updatesSubmit: "Add the update button",
    updatesInvalidRepo: "Paste your copy's address as it shows in GitHub, like github.com/your-name/dozokit-ideas.",
    updatesHelp: "How updates work:",
    shareLabel: "Check for new versions",
    shareHelp:
      "Once a day, this admin page asks Dozokit whether a new version is out. It sends only its version number and a random number made for this copy, nothing about your boards or the people on them. Turned off, nothing is sent and you won't hear about new versions.",
    versionLine: "This copy runs Dozokit Ideas {version}.",
    latestAvailable: "Version {latest} is available.",
    addressTitle: "Your own address",
    addressNow: "Your boards are at this address:",
    addressLead: "One address of your own for all your boards, with HTTPS, like ideas.your-product.com/b/roadmap. Do you have a domain?",
    addressHave: "Do you have a domain?",
    addressNone: "No, I need one",
    addressElsewhere: "Yes, bought elsewhere",
    addressCloudflare: "Yes, on Cloudflare",
    addressOpenWorkers: "Open Workers & Pages in Cloudflare",
    addressNoneStep1: ", click **dozokit-ideas** (the name you gave it), then the **Domains** tab.",
    addressNoneStep2: "Choose **Buy a domain**. Cloudflare sells it at cost price, about $10 a year for a .com, and connects it to Dozokit Ideas by itself.",
    addressAddToCloudflare: "Add it to Cloudflare",
    addressOnboard: ": click **Onboard a domain**, type it and pick the **Free** plan.",
    addressNameservers: "Where you bought it (OVH, GoDaddy, IONOS…), replace its nameservers with the two Cloudflare shows. It takes from a few minutes to a day; Cloudflare emails you when it's done.",
    addressAddToWorker: ", click **dozokit-ideas**, then **Domains**, and add the address you want, like ideas.your-product.com, as an existing domain.",
    addressTypeBelow: "Type it below and click Check and connect.",
    addressField: "Your address",
    addressChecking: "Checking…",
    addressConnect: "Check and connect",
    addressRemove: "Remove the domain",
    addressConnected: "Your boards now open at {address}.",
    addressRemoved: "Your boards are back on this copy's own address.",
    addressHelp: "The old address keeps working, but someone signed in on one address isn't signed in on the other. Your product's “Ideas” button must now use the new address: the developer instructions in each board's Connect to your product tab already show it.",
    statusesIdeas: "Ideas",
    statusesBugs: "Bugs",
    devTitle: "For your developers",
    devLead: "Lets your developers' AI assistant (Claude Code, Cursor, ChatGPT, or any tool that speaks MCP) read this board's ideas and bug reports, with their votes, statuses and comments, to pick what to work on. Read only: it can't change anything. Make one token per person, and revoke it when they leave.",
    devTokenName: "Who it's for",
    devTokenNamePlaceholder: "e.g. Sam, backend",
    devTokenCreate: "New token",
    devTokenOnce: "Copy this now: the token won't show again. Any MCP client connects with this address and header; in Claude Code, the last line is the one command to run in a terminal. Then ask things like “what are the most voted bugs?”.",
    devAddress: "Address",
    devHeader: "Header",
    devCopy: "Copy",
    devTokenUsed: "last used {date}",
    devTokenNeverUsed: "never used",
    devTokenRevoke: "Revoke",
  },
  status: { open: "Open", planned: "Planned", in_progress: "In progress", done: "Done", new: "New", confirmed: "Confirmed", fixing: "Fixing", fixed: "Fixed" },
  err: {
    admin_only: "This is for the admin only.",
    not_found: "Not found.",
    invalid_id: "Use lowercase letters, numbers and hyphens, 2 to 40 characters.",
    invalid_name: "Enter a name.",
    invalid_visibility: "Choose a visibility.",
    invalid_logo: "Choose a PNG, JPEG, SVG or WebP image of 200 KB or less.",
    invalid_color: "Choose a colour.",
    invalid_statuses: "Give each new status a name, up to 40 characters, and keep at least one.",
    board_exists: "This address is already used by another board.",
    invalid_status: "Choose a status.",
    team_only: "Open this board from the product you use.",
    members_only: "To vote, suggest or comment, open this board from the product you use.",
    setup_needed: "This board isn't set up yet.",
    already_voted: "You already voted for this.",
    invalid_title: "Enter a title, up to 120 characters.",
    invalid_body: "Keep it under the limit, or leave it empty.",
    invalid_target: "Choose another post to merge into.",
    different_board: "Merge only posts from the same board.",
    cross_origin: "That request was blocked. Reload and try again.",
    server_error: "Something went wrong. Try again.",
    too_many: "Too many attempts. Try again in a minute.",
    invalid: "That didn't work. Try again.",
    wrong_password: "That password is not the one set for this admin page.",
    wrong_current_password: "Your current password is not that one.",
    password_too_short: "The new password needs 12 characters or more.",
    invalid_product_name: "Keep the product name to 100 characters or fewer.",
    invalid_product_url: "Enter a link that starts with https://, or leave it empty.",
    invalid_domain: "Type only the address, like ideas.your-product.com.",
    domain_no_answer: "No answer from {domain} yet. In Cloudflare, open Workers & Pages → dozokit-ideas → Domains and add it there; it can take a few minutes after that.",
    domain_elsewhere: "{domain} doesn't lead to your Dozokit Ideas yet. In Cloudflare, open Workers & Pages → dozokit-ideas → Domains and add it there.",
    invalid_place: "Keep “where” to 500 characters or fewer.",
    invalid_screenshot: "Choose a PNG, JPEG, WebP or GIF image of 5 MB or less.",
  },
};

const fr: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Tableaux", admin: "Admin", settings: "Réglages" },
  lang: { label: "Langue" },
  common: { loading: "Chargement…", retry: "Réessayer" },
  auth: {
    signOut: "Se déconnecter",
    noAccessTitle: "Accès impossible",
    noAccess: "Ouvrez ce tableau depuis le produit que vous utilisez.",
  },
  login: {
    title: "Connexion à la page d'admin",
    password: "Mot de passe",
    help: "Celui que vous avez saisi au déploiement, ou choisi plus tard sur la page d'admin.",
    submit: "Se connecter",
    busy: "Connexion",
  },
  password: {
    title: "Changer le mot de passe",
    current: "Mot de passe actuel",
    next: "Nouveau mot de passe",
    again: "Nouveau mot de passe, encore",
    submit: "Changer le mot de passe",
    saving: "Enregistrement",
    mismatch: "Les deux nouveaux mots de passe ne sont pas identiques.",
    saved: "Mot de passe changé. Vos autres appareils sont déconnectés.",
    help: "12 caractères ou plus. Oublié ? Dans Cloudflare, ouvrez ce Worker, puis Settings → Variables and Secrets, et modifiez PASSWORD : ce mot de passe fonctionne à nouveau.",
  },
  setup: {
    title: "Choisissez d'abord un mot de passe",
    instructions: "Dans Cloudflare, ouvrez Workers & Pages, puis ce Worker, puis Settings → Variables and Secrets. Ajoutez un secret nommé PASSWORD d'au moins 12 caractères (ou modifiez-le s'il existe), puis rechargez cette page.",
    reload: "Recharger",
  },
  boards: {
    title: "Tableaux",
    empty: "Pas encore de tableau.",
    visibilityTeam: "Privé",
  },
  board: {
    shareIdea: "Partager une idée",
    titlePlaceholder: "Qu'aimeriez-vous voir ?",
    bodyPlaceholder: "Ajoutez des détails (facultatif)",
    submit: "Ajouter l'idée",
    filterAll: "Toutes",
    sortTop: "Les mieux votées",
    sortNew: "Récentes",
    empty: "Rien pour l'instant. Proposez une idée ou signalez un bug.",
    vote: "Voter",
    comments: "{n} commentaires",
    by: "par {name} · {date}",
    membersOnly: "Pour voter, proposer une idée ou signaler un bug, ouvrez ce tableau depuis le produit que vous utilisez.",
    membersOnlyProduct: "Pour voter, proposer une idée ou signaler un bug, ouvrez Ideas depuis {product}.",
    similarLead: "Déjà proposée ? Votez plutôt pour elle.",
    votes: "{n} votes",
    suggest: "Proposer une idée",
    close: "Fermer",
    lead: "Proposez ce que vous aimeriez, ou signalez ce qui vous gêne. Votez pour ce qui compte pour vous : le plus voté passe en premier.",
    reportBug: "Signaler un bug",
    bugLead: "Dites-nous ce qui ne marche pas. Ceux qui le rencontrent aussi votent pour lui (▲), pour que l'équipe corrige d'abord ce qui gêne le plus.",
    bugTitle: "Qu'est-ce qui ne marche pas ?",
    bugBody: "Ce qui s'est passé, étape par étape (facultatif)",
    bugExpected: "Qu'attendiez-vous ? (facultatif)",
    bugPlace: "Où ? Une page ou un lien (facultatif)",
    bugScreenshot: "Capture d'écran (facultatif) : PNG, JPEG, WebP ou GIF, 5 Mo maximum",
    bugSubmit: "Signaler le bug",
    bugBadge: "Bug",
    meToo: "Moi aussi",
    typeAll: "Tout",
    typeIdeas: "Idées",
    typeBugs: "Bugs",
    emptyIdeas: "Pas encore d'idée. Soyez la première personne à en partager une.",
    emptyBugs: "Aucun bug signalé. Quelque chose ne marche pas ? Signalez-le.",
  },
  post: {
    back: "Retour au tableau",
    commentsTitle: "Commentaires",
    commentPlaceholder: "Ajoutez un commentaire",
    commentSubmit: "Commenter",
    noComments: "Pas encore de commentaire.",
    deleteComment: "Supprimer",
    adminStatus: "Statut",
    adminMerge: "Fusionner avec…",
    mergePlaceholder: "Choisissez une idée ou un bug",
    mergeSubmit: "Fusionner",
    delete: "Supprimer cette publication",
    deleteConfirm: "Ses votes et commentaires se déplacent ou disparaissent, et c'est irréversible.",
    deleteConfirmSubmit: "Supprimer",
    deleteCancel: "La garder",
    gone: "Cette publication a été fusionnée avec une autre, ou supprimée. Recherchez-la dans le tableau.",
    membersOnly: "Pour voter ou commenter, ouvrez ce tableau depuis le produit que vous utilisez.",
    official: "Réponse officielle",
    expected: "Attendu",
    place: "Où",
    screenshotAlt: "Capture d'écran du bug",
  },
  admin: {
    title: "Admin",
    notAdmin: "Cette page est réservée à l'administrateur.",
    newBoardTitle: "Nouveau tableau",
    fieldId: "Nom du lien",
    fieldIdHelp: "Lettres minuscules, chiffres et tirets, de 2 à 40 caractères. Ne pourra plus changer.",
    fieldName: "Nom",
    fieldVisibility: "Visibilité",
    visibilityPublic: "Public",
    visibilityTeam: "Privé",
    visibilityHelp: "Public : toute personne qui a le lien peut le lire. Privé : seulement les personnes qui l'ouvrent depuis votre produit. Dans les deux cas, seules elles peuvent voter, proposer et commenter.",
    fieldLogo: "Logo",
    logoHelp: "PNG, JPEG, SVG ou WebP, jusqu'à 200 Ko.",
    logoRemove: "Retirer le logo",
    fieldColor: "Couleur",
    fieldLang: "Langue",
    langBrowser: "La langue du navigateur de chaque visiteur",
    statusesTitle: "Statuts",
    statusName: "Nom du statut",
    statusAdd: "Ajouter un statut",
    statusUp: "Monter",
    statusDown: "Descendre",
    statusRemove: "Retirer",
    statusesHelp: "Les nouvelles idées et les nouveaux bugs commencent dans le premier statut de leur liste. Retirer un statut déplace ses publications dans le premier.",
    copyLink: "Copier le lien",
    openLink: "Ouvrir",
    boardsEmpty: "Pas encore de tableau. Créez le premier avec Nouveau tableau.",
    ideasCount: "{n} idées et bugs",
    cancel: "Annuler",
    back: "Tous les tableaux",
    tabLook: "Apparence",
    tabConnect: "Relier à votre produit",
    productTitle: "Votre produit",
    fieldProductName: "Nom du produit",
    fieldProductUrl: "Lien du produit (facultatif)",
    productHelp: "Les personnes qui peuvent lire ce tableau mais pas encore voter lisent : « Pour voter, proposer une idée ou signaler un bug, ouvrez Ideas depuis » le nom de votre produit, avec un lien vers cette adresse. Laissez les deux vides pour garder la phrase générale.",
    connectPublicStep: "Mettez ce lien derrière un bouton « Idées » dans votre application",
    connectPublicHelp: "Toute personne qui l’ouvre peut lire les idées, mais pas voter, proposer ni commenter.",
    connectSignedTitle: "Pour que vos utilisateurs connectés puissent aussi voter",
    connectStep1: "Ajoutez un bouton « Idées » là où vos utilisateurs sont connectés",
    connectStep1Help: "Par exemple dans le menu de votre application. La personne qui clique arrive sur ce tableau, déjà connectée avec son nom.",
    connectStep2: "Votre serveur crée le lien",
    connectStep2Help: "Quand quelqu’un clique sur le bouton, votre serveur crée un lien qui le connecte à ce tableau et l’y envoie. Copiez les instructions et donnez-les à votre développeur : elles contiennent tout ce qu’il faut, y compris le secret de ce tableau, alors gardez-les pour vous.",
    copyInstructions: "Copier les instructions pour votre développeur",
    instructionsCopied: "Copié. Collez-les à votre développeur.",
    connectStep3: "Vérifiez",
    connectStep3Help: "Ouvre le tableau en tant que membre fictif, « Test person », pour le voir exactement comme vos utilisateurs. Vous restez connecté à la page d’admin.",
    openAsTest: "Ouvrir en tant que personne test",
    devBrief: "Dozokit Ideas : envoyer nos utilisateurs connectés sur le tableau « {name} » (idées et signalements de bugs)\n\nDe quoi il s'agit : un tableau où nos utilisateurs proposent des idées, signalent des bugs, votent et commentent. Ils ne peuvent le faire que si notre produit les y envoie avec un lien signé, qui les connecte à ce tableau. Merci d'ajouter un bouton « Idées », visible des utilisateurs connectés, qui fait cela.\n\nTableau : {origin}/b/{id}\n\nQuand quelqu'un clique sur le bouton, notre serveur crée un jeton et envoie son navigateur ici (un lien normal ou une redirection, jamais dans une iframe) :\n{origin}/sso?token=<le jeton>&return_to=/b/{id}\n\nLe jeton est un JWT signé en HS256 avec le secret de ce tableau :\n{secret}\n\nSes champs :\n- iss : \"{id}\" (l'identifiant du tableau)\n- aud : \"{origin}\" (exactement cette adresse)\n- sub : l'identifiant de l'utilisateur dans notre produit (toujours le même pour une même personne)\n- name : le nom complet de l'utilisateur\n- email : l'adresse e-mail de l'utilisateur\n- exp : maintenant plus 5 minutes au plus, en secondes\n- jti : un identifiant unique pour chaque jeton (un jeton ne fonctionne qu'une fois)\n\nCréez le jeton sur notre serveur, au moment du clic. N'envoyez jamais le secret au navigateur et ne le mettez pas dans le code front-end : gardez-le avec les autres secrets du serveur.\n\nExemple en Node :\n{snippet}\n",
    createSubmit: "Créer le tableau",
    save: "Enregistrer",
    saved: "Enregistré.",
    ssoSecretLabel: "Secret",
    ssoReveal: "Révéler",
    ssoHide: "Masquer",
    ssoRotate: "Changer le secret",
    ssoRotateConfirm: "Les liens créés avec l'ancien secret ne fonctionneront plus. Continuer ?",
    ssoCopied: "Copié",
    updatesTitle: "Mises à jour",
    updatesLead:
      "Les mises à jour partent de votre copie sur GitHub. Le bouton Deploy de Cloudflare laisse ce bouton de côté, alors ajoutez-le une fois : collez l'adresse de votre copie, appuyez sur le bouton, puis Commit changes sur GitHub. Ensuite, Actions → Update → Run workflow installe la dernière version, une fois qu'elle a vérifié que la version est bien signée par Dozokit.",
    updatesFieldLabel: "Votre copie sur GitHub",
    updatesSubmit: "Ajouter le bouton de mise à jour",
    updatesInvalidRepo: "Collez l'adresse de votre copie telle qu'elle apparaît sur GitHub, par exemple github.com/votre-nom/dozokit-ideas.",
    updatesHelp: "Comment fonctionnent les mises à jour :",
    shareLabel: "Vérifier les nouvelles versions",
    shareHelp:
      "Une fois par jour, cette page d'admin demande à Dozokit si une nouvelle version est sortie. Elle n'envoie que son numéro de version et un nombre au hasard créé pour cette copie, rien sur vos tableaux ni sur les personnes qui les utilisent. Désactivé, rien n'est envoyé et aucune nouvelle version ne vous est signalée.",
    versionLine: "Cette copie utilise Dozokit Ideas {version}.",
    latestAvailable: "La version {latest} est disponible.",
    addressTitle: "Votre propre adresse",
    addressNow: "Vos tableaux sont à cette adresse :",
    addressLead: "Une adresse à vous pour tous vos tableaux, en HTTPS, comme ideas.your-product.com/b/roadmap. Avez-vous un nom de domaine ?",
    addressHave: "Avez-vous un nom de domaine ?",
    addressNone: "Non, il m’en faut un",
    addressElsewhere: "Oui, acheté ailleurs",
    addressCloudflare: "Oui, sur Cloudflare",
    addressOpenWorkers: "Ouvrez Workers & Pages dans Cloudflare",
    addressNoneStep1: ", cliquez sur **dozokit-ideas** (le nom que vous lui avez donné), puis sur l’onglet **Domains**.",
    addressNoneStep2: "Choisissez **Buy a domain**. Cloudflare le vend à prix coûtant, environ 10 $ par an pour un .com, et le relie tout seul à Dozokit Ideas.",
    addressAddToCloudflare: "Ajoutez-le à Cloudflare",
    addressOnboard: " : cliquez sur **Onboard a domain**, tapez-le et choisissez l’offre **Free**.",
    addressNameservers: "Là où vous l’avez acheté (OVH, GoDaddy, IONOS…), remplacez ses serveurs de noms (nameservers) par les deux que Cloudflare affiche. Cela prend de quelques minutes à une journée ; Cloudflare vous écrit quand c’est fait.",
    addressAddToWorker: ", cliquez sur **dozokit-ideas**, puis **Domains**, et ajoutez l’adresse voulue, comme ideas.your-product.com, comme domaine existant.",
    addressTypeBelow: "Tapez-la ci-dessous et cliquez sur Vérifier et relier.",
    addressField: "Votre adresse",
    addressChecking: "Vérification…",
    addressConnect: "Vérifier et relier",
    addressRemove: "Retirer le nom de domaine",
    addressConnected: "Vos tableaux s’ouvrent maintenant à {address}.",
    addressRemoved: "Vos tableaux sont revenus à l’adresse de cette copie.",
    addressHelp: "L’ancienne adresse fonctionne toujours, mais une personne connectée sur l’une ne l’est pas sur l’autre. Le bouton « Idées » de votre produit doit maintenant utiliser la nouvelle adresse : les instructions pour votre développeur, dans l’onglet Relier à votre produit de chaque tableau, l’indiquent déjà.",
    statusesIdeas: "Idées",
    statusesBugs: "Bugs",
    devTitle: "Pour vos développeurs",
    devLead: "Permet à l'assistant IA de vos développeurs (Claude Code, Cursor, ChatGPT, ou tout outil qui parle MCP) de lire les idées et les bugs de ce tableau, avec leurs votes, statuts et commentaires, pour choisir sur quoi travailler. En lecture seule : il ne peut rien modifier. Un jeton par personne, à révoquer quand elle part.",
    devTokenName: "Pour qui",
    devTokenNamePlaceholder: "ex. Sam, back-end",
    devTokenCreate: "Nouveau jeton",
    devTokenOnce: "Copiez-les maintenant : le jeton ne s'affichera plus. Tout client MCP se connecte avec cette adresse et cet en-tête ; dans Claude Code, la dernière ligne est la commande à lancer une fois dans un terminal. Demandez ensuite par exemple « quels sont les bugs les plus votés ? ».",
    devAddress: "Adresse",
    devHeader: "En-tête",
    devCopy: "Copier",
    devTokenUsed: "utilisé le {date}",
    devTokenNeverUsed: "jamais utilisé",
    devTokenRevoke: "Révoquer",
  },
  status: { open: "Ouvert", planned: "Prévu", in_progress: "En cours", done: "Terminé", new: "Nouveau", confirmed: "Confirmé", fixing: "En correction", fixed: "Corrigé" },
  err: {
    admin_only: "Réservé à l'administrateur.",
    not_found: "Introuvable.",
    invalid_id: "Utilisez des lettres minuscules, des chiffres et des tirets, de 2 à 40 caractères.",
    invalid_name: "Entrez un nom.",
    invalid_visibility: "Choisissez une visibilité.",
    invalid_logo: "Choisissez une image PNG, JPEG, SVG ou WebP de 200 Ko au plus.",
    invalid_color: "Choisissez une couleur.",
    invalid_statuses: "Donnez un nom à chaque nouveau statut, jusqu'à 40 caractères, et gardez-en au moins un.",
    board_exists: "Cette adresse est déjà utilisée par un autre tableau.",
    invalid_status: "Choisissez un statut.",
    team_only: "Ouvrez ce tableau depuis le produit que vous utilisez.",
    members_only: "Pour voter, proposer ou commenter, ouvrez ce tableau depuis le produit que vous utilisez.",
    setup_needed: "Ce tableau n'est pas encore configuré.",
    already_voted: "Vous avez déjà voté.",
    invalid_title: "Entrez un titre, jusqu'à 120 caractères.",
    invalid_body: "Restez sous la limite, ou laissez vide.",
    invalid_target: "Choisissez une autre publication pour la fusion.",
    different_board: "Fusionnez uniquement des publications du même tableau.",
    cross_origin: "Cette requête a été bloquée. Rechargez et réessayez.",
    server_error: "Une erreur est survenue. Réessayez.",
    too_many: "Trop de tentatives. Réessayez dans une minute.",
    invalid: "Ça n'a pas fonctionné. Réessayez.",
    wrong_password: "Ce mot de passe n'est pas celui de cette page d'admin.",
    wrong_current_password: "Votre mot de passe actuel n'est pas celui-là.",
    password_too_short: "Le nouveau mot de passe doit faire 12 caractères ou plus.",
    invalid_product_name: "Le nom du produit doit faire 100 caractères au plus.",
    invalid_product_url: "Entrez un lien qui commence par https://, ou laissez vide.",
    invalid_domain: "Tapez seulement l’adresse, comme ideas.your-product.com.",
    domain_no_answer: "Pas encore de réponse de {domain}. Dans Cloudflare, ouvrez Workers & Pages → dozokit-ideas → Domains et ajoutez-la là ; cela peut ensuite prendre quelques minutes.",
    domain_elsewhere: "{domain} ne mène pas encore à votre Dozokit Ideas. Dans Cloudflare, ouvrez Workers & Pages → dozokit-ideas → Domains et ajoutez-la là.",
    invalid_place: "Limitez « où » à 500 caractères.",
    invalid_screenshot: "Choisissez une image PNG, JPEG, WebP ou GIF de 5 Mo maximum.",
  },
};

const es: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Tableros", admin: "Admin", settings: "Ajustes" },
  lang: { label: "Idioma" },
  common: { loading: "Cargando…", retry: "Reintentar" },
  auth: {
    signOut: "Cerrar sesión",
    noAccessTitle: "Sin acceso",
    noAccess: "Abre este tablero desde el producto que usas.",
  },
  login: {
    title: "Entra en la página de admin",
    password: "Contraseña",
    help: "La que escribiste al desplegar, o la que pusiste después en la página de admin.",
    submit: "Iniciar sesión",
    busy: "Iniciando sesión",
  },
  password: {
    title: "Cambiar la contraseña",
    current: "Contraseña actual",
    next: "Contraseña nueva",
    again: "Contraseña nueva otra vez",
    submit: "Cambiar la contraseña",
    saving: "Guardando",
    mismatch: "Las dos contraseñas nuevas no son iguales.",
    saved: "Contraseña cambiada. Tus otros dispositivos han cerrado sesión.",
    help: "12 caracteres o más. ¿La olvidaste? En Cloudflare, abre este Worker, luego Settings → Variables and Secrets, y edita PASSWORD: esa contraseña vuelve a funcionar.",
  },
  setup: {
    title: "Pon una contraseña primero",
    instructions: "En Cloudflare, abre Workers & Pages, luego este Worker, luego Settings → Variables and Secrets. Añade un secreto llamado PASSWORD de 12 caracteres o más (o edítalo si ya existe), y recarga esta página.",
    reload: "Recargar",
  },
  boards: {
    title: "Tableros",
    empty: "Todavía no hay tableros.",
    visibilityTeam: "Privado",
  },
  board: {
    shareIdea: "Comparte una idea",
    titlePlaceholder: "¿Qué te gustaría ver?",
    bodyPlaceholder: "Añade detalles (opcional)",
    submit: "Añadir idea",
    filterAll: "Todas",
    sortTop: "Más votadas",
    sortNew: "Recientes",
    empty: "Nada todavía. Propón una idea o reporta un error.",
    vote: "Votar",
    comments: "{n} comentarios",
    by: "por {name} · {date}",
    membersOnly: "Para votar, proponer una idea o reportar un error, abre este tablero desde el producto que usas.",
    membersOnlyProduct: "Para votar, proponer una idea o reportar un error, abre Ideas desde {product}.",
    similarLead: "¿Ya la propusieron? Vota por ella.",
    votes: "{n} votos",
    suggest: "Proponer una idea",
    close: "Cerrar",
    lead: "Propón lo que te gustaría, o reporta lo que te molesta. Vota por lo que te importa: lo más votado va primero.",
    reportBug: "Reportar un error",
    bugLead: "Cuéntanos qué falló. Quienes también se lo encuentran lo votan (▲), para que el equipo arregle primero lo que más molesta.",
    bugTitle: "¿Qué falló?",
    bugBody: "Qué pasó, paso a paso (opcional)",
    bugExpected: "¿Qué esperabas? (opcional)",
    bugPlace: "¿Dónde? Una página o un enlace (opcional)",
    bugScreenshot: "Captura de pantalla (opcional): PNG, JPEG, WebP o GIF, hasta 5 MB",
    bugSubmit: "Reportar error",
    bugBadge: "Error",
    meToo: "A mí también",
    typeAll: "Todo",
    typeIdeas: "Ideas",
    typeBugs: "Errores",
    emptyIdeas: "Todavía no hay ideas. Sé la primera persona en compartir una.",
    emptyBugs: "No hay errores reportados. ¿Algo no funciona? Repórtalo.",
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
    mergePlaceholder: "Elige una idea o un error",
    mergeSubmit: "Fusionar",
    delete: "Eliminar esta publicación",
    deleteConfirm: "Sus votos y comentarios se mueven o desaparecen, y esto no se puede deshacer.",
    deleteConfirmSubmit: "Eliminar",
    deleteCancel: "Conservarla",
    gone: "Esta publicación se fusionó con otra, o se eliminó. Búscala en el tablero.",
    membersOnly: "Para votar o comentar, abre este tablero desde el producto que usas.",
    official: "Respuesta oficial",
    expected: "Esperado",
    place: "Dónde",
    screenshotAlt: "Captura de pantalla del error",
  },
  admin: {
    title: "Admin",
    notAdmin: "Esta página es solo para el administrador.",
    newBoardTitle: "Nuevo tablero",
    fieldId: "Nombre del enlace",
    fieldIdHelp: "Letras minúsculas, números y guiones, de 2 a 40 caracteres. No podrá cambiar después.",
    fieldName: "Nombre",
    fieldVisibility: "Visibilidad",
    visibilityPublic: "Público",
    visibilityTeam: "Privado",
    visibilityHelp: "Público: cualquiera con el enlace puede leerlo. Privado: solo quienes lo abren desde tu producto. En ambos casos, solo ellos pueden votar, proponer y comentar.",
    fieldLogo: "Logo",
    logoHelp: "PNG, JPEG, SVG o WebP, hasta 200 KB.",
    logoRemove: "Quitar el logo",
    fieldColor: "Color",
    fieldLang: "Idioma",
    langBrowser: "El idioma del navegador de cada visitante",
    statusesTitle: "Estados",
    statusName: "Nombre del estado",
    statusAdd: "Añadir un estado",
    statusUp: "Subir",
    statusDown: "Bajar",
    statusRemove: "Quitar",
    statusesHelp: "Las ideas y los errores nuevos empiezan en el primer estado de su lista. Quitar un estado mueve sus publicaciones al primero.",
    copyLink: "Copiar el enlace",
    openLink: "Abrir",
    boardsEmpty: "Todavía no hay tableros. Crea el primero con Nuevo tablero.",
    ideasCount: "{n} ideas y errores",
    cancel: "Cancelar",
    back: "Todos los tableros",
    tabLook: "Aspecto",
    tabConnect: "Conectar con tu producto",
    productTitle: "Tu producto",
    fieldProductName: "Nombre del producto",
    fieldProductUrl: "Enlace del producto (opcional)",
    productHelp: "Quienes pueden leer este tablero pero aún no votar leen: «Para votar, proponer una idea o reportar un error, abre Ideas desde» el nombre de tu producto, enlazado a esta dirección. Deja ambos vacíos para mantener la frase general.",
    connectPublicStep: "Pon este enlace detrás de un botón «Ideas» en tu aplicación",
    connectPublicHelp: "Cualquiera que lo abra puede leer las ideas, pero no votar, proponer ni comentar.",
    connectSignedTitle: "Para que tus usuarios con sesión iniciada también puedan votar",
    connectStep1: "Añade un botón «Ideas» donde tus usuarios tienen la sesión iniciada",
    connectStep1Help: "Por ejemplo en el menú de tu aplicación. Quien haga clic llega a este tablero, ya con su nombre.",
    connectStep2: "Tu servidor crea el enlace",
    connectStep2Help: "Cuando alguien hace clic en el botón, tu servidor crea un enlace que le inicia sesión en este tablero y lo envía allí. Copia las instrucciones y dáselas a tu desarrollador: tienen todo lo necesario, incluido el secreto de este tablero, así que no las compartas con nadie más.",
    copyInstructions: "Copiar las instrucciones para tu desarrollador",
    instructionsCopied: "Copiado. Pégaselas a tu desarrollador.",
    connectStep3: "Compruébalo",
    connectStep3Help: "Abre el tablero como un miembro inventado, «Test person», para que lo veas exactamente como tus usuarios. Sigues con la sesión de admin iniciada.",
    openAsTest: "Abrir como persona de prueba",
    devBrief: "Dozokit Ideas: enviar a nuestros usuarios con sesión iniciada al tablero «{name}» (ideas y reportes de errores)\n\nQué es: un tablero donde nuestros usuarios proponen ideas, reportan errores, votan y comentan. Solo pueden hacerlo cuando nuestro producto los envía allí con un enlace firmado, que les inicia sesión en este tablero. Por favor, añade un botón «Ideas», visible para los usuarios con sesión iniciada, que haga esto.\n\nTablero: {origin}/b/{id}\n\nCuando alguien hace clic en el botón, nuestro servidor crea un token y envía su navegador aquí (un enlace normal o una redirección, nunca dentro de un iframe):\n{origin}/sso?token=<el token>&return_to=/b/{id}\n\nEl token es un JWT firmado con HS256 usando el secreto de este tablero:\n{secret}\n\nSus campos:\n- iss: \"{id}\" (el id del tablero)\n- aud: \"{origin}\" (exactamente esta dirección)\n- sub: el id del usuario en nuestro producto (siempre el mismo para la misma persona)\n- name: el nombre completo del usuario\n- email: el correo electrónico del usuario\n- exp: ahora más 5 minutos como máximo, en segundos\n- jti: un id único para cada token (un token solo funciona una vez)\n\nCrea el token en nuestro servidor, en el momento del clic. Nunca envíes el secreto al navegador ni lo pongas en el código front-end: guárdalo con los demás secretos del servidor.\n\nEjemplo en Node:\n{snippet}\n",
    createSubmit: "Crear tablero",
    save: "Guardar",
    saved: "Guardado.",
    ssoSecretLabel: "Secreto",
    ssoReveal: "Revelar",
    ssoHide: "Ocultar",
    ssoRotate: "Cambiar el secreto",
    ssoRotateConfirm: "Los enlaces creados con el secreto anterior dejarán de funcionar. ¿Continuar?",
    ssoCopied: "Copiado",
    updatesTitle: "Actualizaciones",
    updatesLead:
      "Las actualizaciones salen de tu copia en GitHub. El botón Deploy de Cloudflare deja fuera este botón, así que añádelo una vez: pega la dirección de tu copia, pulsa el botón y luego Commit changes en GitHub. A partir de ahí, Actions → Update → Run workflow instala la última versión, una vez que comprueba que está firmada por Dozokit.",
    updatesFieldLabel: "Tu copia en GitHub",
    updatesSubmit: "Añadir el botón de actualización",
    updatesInvalidRepo: "Pega la dirección de tu copia tal como aparece en GitHub, por ejemplo github.com/tu-nombre/dozokit-ideas.",
    updatesHelp: "Cómo funcionan las actualizaciones:",
    shareLabel: "Buscar versiones nuevas",
    shareHelp:
      "Una vez al día, esta página de admin pregunta a Dozokit si hay una versión nueva. Solo envía su número de versión y un número al azar creado para esta copia, nada sobre tus tableros ni sobre quienes los usan. Desactivado, no se envía nada y no sabrás de las versiones nuevas.",
    versionLine: "Esta copia usa Dozokit Ideas {version}.",
    latestAvailable: "La versión {latest} está disponible.",
    addressTitle: "Tu propia dirección",
    addressNow: "Tus tableros están en esta dirección:",
    addressLead: "Una dirección propia para todos tus tableros, con HTTPS, como ideas.your-product.com/b/roadmap. ¿Tienes un dominio?",
    addressHave: "¿Tienes un dominio?",
    addressNone: "No, necesito uno",
    addressElsewhere: "Sí, comprado en otro sitio",
    addressCloudflare: "Sí, en Cloudflare",
    addressOpenWorkers: "Abre Workers & Pages en Cloudflare",
    addressNoneStep1: ", haz clic en **dozokit-ideas** (el nombre que le diste) y luego en la pestaña **Domains**.",
    addressNoneStep2: "Elige **Buy a domain**. Cloudflare lo vende a precio de coste, unos 10 $ al año por un .com, y lo conecta solo a Dozokit Ideas.",
    addressAddToCloudflare: "Añádelo a Cloudflare",
    addressOnboard: ": haz clic en **Onboard a domain**, escríbelo y elige el plan **Free**.",
    addressNameservers: "Donde lo compraste (OVH, GoDaddy, IONOS…), cambia sus servidores de nombres (nameservers) por los dos que muestra Cloudflare. Tarda de unos minutos a un día; Cloudflare te escribe cuando está listo.",
    addressAddToWorker: ", haz clic en **dozokit-ideas**, luego en **Domains**, y añade la dirección que quieres, como ideas.your-product.com, como dominio existente.",
    addressTypeBelow: "Escríbela abajo y haz clic en Comprobar y conectar.",
    addressField: "Tu dirección",
    addressChecking: "Comprobando…",
    addressConnect: "Comprobar y conectar",
    addressRemove: "Quitar el dominio",
    addressConnected: "Tus tableros se abren ahora en {address}.",
    addressRemoved: "Tus tableros vuelven a estar en la dirección propia de esta copia.",
    addressHelp: "La dirección anterior sigue funcionando, pero quien inicia sesión en una no la tiene iniciada en la otra. El botón «Ideas» de tu producto debe usar ahora la nueva dirección: las instrucciones para tu desarrollador, en la pestaña Conectar con tu producto de cada tablero, ya la muestran.",
    statusesIdeas: "Ideas",
    statusesBugs: "Errores",
    devTitle: "Para tus desarrolladores",
    devLead: "Permite que el asistente de IA de sus desarrolladores (Claude Code, Cursor, ChatGPT, o cualquier herramienta que hable MCP) lea las ideas y los errores de este tablero, con sus votos, estados y comentarios, para elegir en qué trabajar. Solo lectura: no puede cambiar nada. Un token por persona; revócalo cuando se vaya.",
    devTokenName: "Para quién",
    devTokenNamePlaceholder: "p. ej. Sam, backend",
    devTokenCreate: "Nuevo token",
    devTokenOnce: "Cópialo ahora: el token no se volverá a mostrar. Cualquier cliente MCP se conecta con esta dirección y esta cabecera; en Claude Code, la última línea es el comando que se ejecuta una vez en una terminal. Luego pregunta cosas como «¿cuáles son los errores más votados?».",
    devAddress: "Dirección",
    devHeader: "Cabecera",
    devCopy: "Copiar",
    devTokenUsed: "usado el {date}",
    devTokenNeverUsed: "nunca usado",
    devTokenRevoke: "Revocar",
  },
  status: { open: "Abierto", planned: "Planificado", in_progress: "En curso", done: "Hecho", new: "Nuevo", confirmed: "Confirmado", fixing: "En corrección", fixed: "Corregido" },
  err: {
    admin_only: "Solo para el administrador.",
    not_found: "No encontrado.",
    invalid_id: "Usa letras minúsculas, números y guiones, de 2 a 40 caracteres.",
    invalid_name: "Escribe un nombre.",
    invalid_visibility: "Elige una visibilidad.",
    invalid_logo: "Elige una imagen PNG, JPEG, SVG o WebP de 200 KB o menos.",
    invalid_color: "Elige un color.",
    invalid_statuses: "Pon un nombre a cada estado nuevo, hasta 40 caracteres, y deja al menos uno.",
    board_exists: "Esta dirección ya la usa otro tablero.",
    invalid_status: "Elige un estado.",
    team_only: "Abre este tablero desde el producto que usas.",
    members_only: "Para votar, proponer o comentar, abre este tablero desde el producto que usas.",
    setup_needed: "Este tablero todavía no está configurado.",
    already_voted: "Ya votaste.",
    invalid_title: "Escribe un título, hasta 120 caracteres.",
    invalid_body: "Mantente bajo el límite, o déjalo vacío.",
    invalid_target: "Elige otra publicación para la fusión.",
    different_board: "Fusiona solo publicaciones del mismo tablero.",
    cross_origin: "Esa solicitud se bloqueó. Recarga e inténtalo de nuevo.",
    server_error: "Algo salió mal. Inténtalo de nuevo.",
    too_many: "Demasiados intentos. Inténtalo de nuevo en un minuto.",
    invalid: "Eso no funcionó. Inténtalo de nuevo.",
    wrong_password: "Esa contraseña no es la de esta página de admin.",
    wrong_current_password: "Tu contraseña actual no es esa.",
    password_too_short: "La contraseña nueva necesita 12 caracteres o más.",
    invalid_product_name: "El nombre del producto debe tener 100 caracteres o menos.",
    invalid_product_url: "Escribe un enlace que empiece por https://, o déjalo vacío.",
    invalid_domain: "Escribe solo la dirección, como ideas.your-product.com.",
    domain_no_answer: "Todavía no hay respuesta de {domain}. En Cloudflare, abre Workers & Pages → dozokit-ideas → Domains y añádela ahí; después puede tardar unos minutos.",
    domain_elsewhere: "{domain} todavía no lleva a tu Dozokit Ideas. En Cloudflare, abre Workers & Pages → dozokit-ideas → Domains y añádela ahí.",
    invalid_place: "Limita «dónde» a 500 caracteres.",
    invalid_screenshot: "Elige una imagen PNG, JPEG, WebP o GIF de 5 MB o menos.",
  },
};

const ptBR: Messages = {
  app: { wordmark: "Dozokit Ideas" },
  nav: { boards: "Quadros", admin: "Admin", settings: "Configurações" },
  lang: { label: "Idioma" },
  common: { loading: "Carregando…", retry: "Tentar de novo" },
  auth: {
    signOut: "Sair",
    noAccessTitle: "Sem acesso",
    noAccess: "Abra este quadro pelo produto que você usa.",
  },
  login: {
    title: "Entre na página de admin",
    password: "Senha",
    help: "A que você digitou ao implantar, ou definiu depois na página de admin.",
    submit: "Entrar",
    busy: "Entrando",
  },
  password: {
    title: "Trocar a senha",
    current: "Senha atual",
    next: "Nova senha",
    again: "Nova senha de novo",
    submit: "Trocar a senha",
    saving: "Salvando",
    mismatch: "As duas novas senhas não são iguais.",
    saved: "Senha trocada. Seus outros aparelhos foram desconectados.",
    help: "12 caracteres ou mais. Esqueceu? No Cloudflare, abra este Worker, depois Settings → Variables and Secrets, e edite PASSWORD: essa senha volta a funcionar.",
  },
  setup: {
    title: "Defina uma senha primeiro",
    instructions: "No Cloudflare, abra Workers & Pages, depois este Worker, depois Settings → Variables and Secrets. Adicione um secret chamado PASSWORD com 12 caracteres ou mais (ou edite-o se já existir), depois recarregue esta página.",
    reload: "Recarregar",
  },
  boards: {
    title: "Quadros",
    empty: "Ainda não há quadros.",
    visibilityTeam: "Privado",
  },
  board: {
    shareIdea: "Compartilhe uma ideia",
    titlePlaceholder: "O que você gostaria de ver?",
    bodyPlaceholder: "Adicione detalhes (opcional)",
    submit: "Adicionar ideia",
    filterAll: "Todas",
    sortTop: "Mais votadas",
    sortNew: "Recentes",
    empty: "Nada ainda. Sugira uma ideia ou relate um bug.",
    vote: "Votar",
    comments: "{n} comentários",
    by: "por {name} · {date}",
    membersOnly: "Para votar, sugerir uma ideia ou relatar um bug, abra este quadro pelo produto que você usa.",
    membersOnlyProduct: "Para votar, sugerir uma ideia ou relatar um bug, abra o Ideas pelo {product}.",
    similarLead: "Já foi sugerida? Vote nela.",
    votes: "{n} votos",
    suggest: "Sugerir uma ideia",
    close: "Fechar",
    lead: "Sugira o que você gostaria, ou relate o que atrapalha. Vote no que importa para você: o mais votado vem primeiro.",
    reportBug: "Relatar um bug",
    bugLead: "Conte o que deu errado. Quem também passar por isso vota nele (▲), para a equipe corrigir primeiro o que mais incomoda.",
    bugTitle: "O que deu errado?",
    bugBody: "O que aconteceu, passo a passo (opcional)",
    bugExpected: "O que você esperava? (opcional)",
    bugPlace: "Onde? Uma página ou um link (opcional)",
    bugScreenshot: "Captura de tela (opcional): PNG, JPEG, WebP ou GIF, até 5 MB",
    bugSubmit: "Relatar bug",
    bugBadge: "Bug",
    meToo: "Eu também",
    typeAll: "Tudo",
    typeIdeas: "Ideias",
    typeBugs: "Bugs",
    emptyIdeas: "Ainda não há ideias. Seja a primeira pessoa a compartilhar uma.",
    emptyBugs: "Nenhum bug relatado. Algo não funciona? Relate.",
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
    mergePlaceholder: "Escolha uma ideia ou um bug",
    mergeSubmit: "Mesclar",
    delete: "Excluir esta publicação",
    deleteConfirm: "Os votos e comentários dela são movidos ou somem, e isso não pode ser desfeito.",
    deleteConfirmSubmit: "Excluir",
    deleteCancel: "Manter",
    gone: "Esta publicação foi mesclada com outra, ou removida. Procure por ela no quadro.",
    membersOnly: "Para votar ou comentar, abra este quadro pelo produto que você usa.",
    official: "Resposta oficial",
    expected: "Esperado",
    place: "Onde",
    screenshotAlt: "Captura de tela do bug",
  },
  admin: {
    title: "Admin",
    notAdmin: "Esta página é só para o administrador.",
    newBoardTitle: "Novo quadro",
    fieldId: "Nome do link",
    fieldIdHelp: "Letras minúsculas, números e hifens, de 2 a 40 caracteres. Não poderá mudar depois.",
    fieldName: "Nome",
    fieldVisibility: "Visibilidade",
    visibilityPublic: "Público",
    visibilityTeam: "Privado",
    visibilityHelp: "Público: qualquer pessoa com o link pode ler. Privado: só quem abre pelo seu produto. Nos dois casos, só essas pessoas podem votar, sugerir e comentar.",
    fieldLogo: "Logo",
    logoHelp: "PNG, JPEG, SVG ou WebP, até 200 KB.",
    logoRemove: "Remover o logo",
    fieldColor: "Cor",
    fieldLang: "Idioma",
    langBrowser: "O idioma do navegador de cada visitante",
    statusesTitle: "Status",
    statusName: "Nome do status",
    statusAdd: "Adicionar um status",
    statusUp: "Subir",
    statusDown: "Descer",
    statusRemove: "Remover",
    statusesHelp: "As ideias e os bugs novos começam no primeiro status da sua lista. Remover um status move as publicações dele para o primeiro.",
    copyLink: "Copiar o link",
    openLink: "Abrir",
    boardsEmpty: "Ainda não há quadros. Crie o primeiro com Novo quadro.",
    ideasCount: "{n} ideias e bugs",
    cancel: "Cancelar",
    back: "Todos os quadros",
    tabLook: "Aparência",
    tabConnect: "Conectar ao seu produto",
    productTitle: "Seu produto",
    fieldProductName: "Nome do produto",
    fieldProductUrl: "Link do produto (opcional)",
    productHelp: "Quem pode ler este quadro mas ainda não pode votar lê: “Para votar, sugerir uma ideia ou relatar um bug, abra o Ideas pelo” nome do seu produto, com link para este endereço. Deixe os dois vazios para manter a frase geral.",
    connectPublicStep: "Coloque este link atrás de um botão “Ideias” no seu app",
    connectPublicHelp: "Qualquer pessoa que o abrir pode ler as ideias, mas não votar, sugerir nem comentar.",
    connectSignedTitle: "Para que os seus usuários conectados também possam votar",
    connectStep1: "Adicione um botão “Ideias” onde os seus usuários estão conectados",
    connectStep1Help: "Por exemplo no menu do seu app. Quem clicar chega a este quadro, já conectado com o próprio nome.",
    connectStep2: "O seu servidor gera o link",
    connectStep2Help: "Quando alguém clica no botão, o seu servidor gera um link que conecta a pessoa a este quadro e a envia para lá. Copie as instruções e passe para o seu desenvolvedor: elas têm tudo o que é preciso, inclusive o secret deste quadro, então não as compartilhe com mais ninguém.",
    copyInstructions: "Copiar as instruções para o seu desenvolvedor",
    instructionsCopied: "Copiado. Cole para o seu desenvolvedor.",
    connectStep3: "Confira",
    connectStep3Help: "Abre o quadro como um membro inventado, “Test person”, para você ver exatamente o que os seus usuários verão. Você continua conectado à página de admin.",
    openAsTest: "Abrir como pessoa de teste",
    devBrief: "Dozokit Ideas: enviar os nossos usuários conectados para o quadro \"{name}\" (ideias e relatos de bugs)\n\nO que é: um quadro onde os nossos usuários sugerem ideias, relatam bugs, votam e comentam. Eles só podem fazer isso quando o nosso produto os envia para lá com um link assinado, que os conecta a este quadro. Por favor, adicione um botão \"Ideias\", visível para usuários conectados, que faça isso.\n\nQuadro: {origin}/b/{id}\n\nQuando alguém clica no botão, o nosso servidor gera um token e envia o navegador para cá (um link normal ou um redirecionamento, nunca dentro de um iframe):\n{origin}/sso?token=<o token>&return_to=/b/{id}\n\nO token é um JWT assinado com HS256 usando o secret deste quadro:\n{secret}\n\nOs campos dele:\n- iss: \"{id}\" (o id do quadro)\n- aud: \"{origin}\" (exatamente este endereço)\n- sub: o id do usuário no nosso produto (sempre o mesmo para a mesma pessoa)\n- name: o nome completo do usuário\n- email: o e-mail do usuário\n- exp: agora mais 5 minutos no máximo, em segundos\n- jti: um id único para cada token (um token só funciona uma vez)\n\nGere o token no nosso servidor, no momento do clique. Nunca envie o secret para o navegador nem o coloque no código front-end: guarde-o junto com os outros secrets do servidor.\n\nExemplo em Node:\n{snippet}\n",
    createSubmit: "Criar quadro",
    save: "Salvar",
    saved: "Salvo.",
    ssoSecretLabel: "Secret",
    ssoReveal: "Revelar",
    ssoHide: "Ocultar",
    ssoRotate: "Trocar o secret",
    ssoRotateConfirm: "Os links criados com o secret antigo deixam de funcionar. Continuar?",
    ssoCopied: "Copiado",
    updatesTitle: "Atualizações",
    updatesLead:
      "As atualizações partem da sua cópia no GitHub. O botão Deploy do Cloudflare deixa esse botão de fora, então adicione-o uma vez: cole o endereço da sua cópia, clique no botão e depois Commit changes no GitHub. A partir daí, Actions → Update → Run workflow instala a versão mais recente, depois de verificar que ela foi assinada pela Dozokit.",
    updatesFieldLabel: "Sua cópia no GitHub",
    updatesSubmit: "Adicionar o botão de atualização",
    updatesInvalidRepo: "Cole o endereço da sua cópia como ele aparece no GitHub, por exemplo github.com/seu-nome/dozokit-ideas.",
    updatesHelp: "Como funcionam as atualizações:",
    shareLabel: "Procurar novas versões",
    shareHelp:
      "Uma vez por dia, esta página de admin pergunta à Dozokit se saiu uma nova versão. Ela envia só o número da versão e um número aleatório criado para esta cópia, nada sobre os seus quadros nem sobre quem os usa. Desligado, nada é enviado e você não fica sabendo das novas versões.",
    versionLine: "Esta cópia usa o Dozokit Ideas {version}.",
    latestAvailable: "A versão {latest} está disponível.",
    addressTitle: "Seu próprio endereço",
    addressNow: "Seus quadros estão neste endereço:",
    addressLead: "Um endereço seu para todos os seus quadros, com HTTPS, como ideas.your-product.com/b/roadmap. Você tem um domínio?",
    addressHave: "Você tem um domínio?",
    addressNone: "Não, preciso de um",
    addressElsewhere: "Sim, comprado em outro lugar",
    addressCloudflare: "Sim, no Cloudflare",
    addressOpenWorkers: "Abra Workers & Pages no Cloudflare",
    addressNoneStep1: ", clique em **dozokit-ideas** (o nome que você deu) e depois na aba **Domains**.",
    addressNoneStep2: "Escolha **Buy a domain**. O Cloudflare vende pelo preço de custo, cerca de US$ 10 por ano para um .com, e o conecta sozinho ao Dozokit Ideas.",
    addressAddToCloudflare: "Adicione-o ao Cloudflare",
    addressOnboard: ": clique em **Onboard a domain**, digite-o e escolha o plano **Free**.",
    addressNameservers: "Onde você o comprou (GoDaddy, Registro.br, Hostinger…), troque os servidores de nomes (nameservers) pelos dois que o Cloudflare mostra. Leva de alguns minutos a um dia; o Cloudflare avisa você por e-mail quando terminar.",
    addressAddToWorker: ", clique em **dozokit-ideas**, depois em **Domains**, e adicione o endereço que você quer, como ideas.your-product.com, como domínio existente.",
    addressTypeBelow: "Digite-o abaixo e clique em Verificar e conectar.",
    addressField: "Seu endereço",
    addressChecking: "Verificando…",
    addressConnect: "Verificar e conectar",
    addressRemove: "Remover o domínio",
    addressConnected: "Seus quadros agora abrem em {address}.",
    addressRemoved: "Seus quadros voltaram para o endereço próprio desta cópia.",
    addressHelp: "O endereço antigo continua funcionando, mas quem está conectado em um não está no outro. O botão “Ideias” do seu produto agora precisa usar o novo endereço: as instruções para o seu desenvolvedor, na aba Conectar ao seu produto de cada quadro, já o mostram.",
    statusesIdeas: "Ideias",
    statusesBugs: "Bugs",
    devTitle: "Para os seus desenvolvedores",
    devLead: "Permite que o assistente de IA dos seus desenvolvedores (Claude Code, Cursor, ChatGPT, ou qualquer ferramenta que fale MCP) leia as ideias e os bugs deste quadro, com votos, status e comentários, para escolher no que trabalhar. Somente leitura: não pode mudar nada. Um token por pessoa; revogue quando ela sair.",
    devTokenName: "Para quem",
    devTokenNamePlaceholder: "ex.: Sam, backend",
    devTokenCreate: "Novo token",
    devTokenOnce: "Copie agora: o token não aparece de novo. Qualquer cliente MCP se conecta com este endereço e este cabeçalho; no Claude Code, a última linha é o comando para rodar uma vez num terminal. Depois pergunte coisas como “quais são os bugs mais votados?”.",
    devAddress: "Endereço",
    devHeader: "Cabeçalho",
    devCopy: "Copiar",
    devTokenUsed: "usado em {date}",
    devTokenNeverUsed: "nunca usado",
    devTokenRevoke: "Revogar",
  },
  status: { open: "Aberto", planned: "Planejado", in_progress: "Em andamento", done: "Concluído", new: "Novo", confirmed: "Confirmado", fixing: "Em correção", fixed: "Corrigido" },
  err: {
    admin_only: "Somente para o administrador.",
    not_found: "Não encontrado.",
    invalid_id: "Use letras minúsculas, números e hifens, de 2 a 40 caracteres.",
    invalid_name: "Digite um nome.",
    invalid_visibility: "Escolha uma visibilidade.",
    invalid_logo: "Escolha uma imagem PNG, JPEG, SVG ou WebP de até 200 KB.",
    invalid_color: "Escolha uma cor.",
    invalid_statuses: "Dê um nome a cada status novo, até 40 caracteres, e mantenha pelo menos um.",
    board_exists: "Este endereço já é usado por outro quadro.",
    invalid_status: "Escolha um status.",
    team_only: "Abra este quadro pelo produto que você usa.",
    members_only: "Para votar, sugerir ou comentar, abra este quadro pelo produto que você usa.",
    setup_needed: "Este quadro ainda não está configurado.",
    already_voted: "Você já votou.",
    invalid_title: "Digite um título, até 120 caracteres.",
    invalid_body: "Fique dentro do limite, ou deixe vazio.",
    invalid_target: "Escolha outra publicação para a mesclagem.",
    different_board: "Mescle só publicações do mesmo quadro.",
    cross_origin: "Essa requisição foi bloqueada. Recarregue e tente de novo.",
    server_error: "Algo deu errado. Tente de novo.",
    too_many: "Muitas tentativas. Tente de novo em um minuto.",
    invalid: "Isso não funcionou. Tente de novo.",
    wrong_password: "Essa senha não é a desta página de admin.",
    wrong_current_password: "A sua senha atual não é essa.",
    password_too_short: "A nova senha precisa de 12 caracteres ou mais.",
    invalid_product_name: "O nome do produto deve ter 100 caracteres ou menos.",
    invalid_product_url: "Digite um link que comece com https://, ou deixe vazio.",
    invalid_domain: "Digite só o endereço, como ideas.your-product.com.",
    domain_no_answer: "Ainda sem resposta de {domain}. No Cloudflare, abra Workers & Pages → dozokit-ideas → Domains e adicione-o lá; depois disso pode levar alguns minutos.",
    domain_elsewhere: "{domain} ainda não leva ao seu Dozokit Ideas. No Cloudflare, abra Workers & Pages → dozokit-ideas → Domains e adicione-o lá.",
    invalid_place: "Limite o “onde” a 500 caracteres.",
    invalid_screenshot: "Escolha uma imagem PNG, JPEG, WebP ou GIF de até 5 MB.",
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

// A status the admin named shows as typed; an unnamed built-in one shows its translated name.
export const statusLabel = (t: Messages, s: { id: string; label: string }) => s.label || (t.status as Record<string, string>)[s.id] || s.id;

export interface I18n {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}

export const I18nContext = createContext<I18n>({ lang: "en", t: en, setLang: () => {} });
export const useT = () => useContext(I18nContext);
