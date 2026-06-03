% ─────────────────────────────────────────────────────────────────────────────
% acadoc.pl — Base de connaissances académiques
% Serveur HTTP Prolog via library(http/thread_httpd)
% ─────────────────────────────────────────────────────────────────────────────
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).

% ── Classification ────────────────────────────────────────────────────────────
mot_cle_thematique("TCP/IP",       "RESEAUX").
mot_cle_thematique("routage",      "RESEAUX").
mot_cle_thematique("OSPF",         "RESEAUX").
mot_cle_thematique("SQL",          "BASES_DE_DONNEES").
mot_cle_thematique("postgresql",   "BASES_DE_DONNEES").
mot_cle_thematique("gradient",     "MACHINE_LEARNING").
mot_cle_thematique("regression",   "MACHINE_LEARNING").
mot_cle_thematique("probabilites", "MATHEMATIQUES").
mot_cle_thematique("matrice",      "MATHEMATIQUES").
mot_cle_thematique("neurone",      "DEEP_LEARNING").
mot_cle_thematique("transformer",  "DEEP_LEARNING").

classer_document(MotsCles, Thematiques) :-
    findall(T, (member(M, MotsCles), mot_cle_thematique(M, T)), Ts),
    sort(Ts, Thematiques).

% ── Prérequis ─────────────────────────────────────────────────────────────────
prerequis("INF532", "INF431").   % Machine Learning ← Bases de données
prerequis("INF633", "INF532").   % Deep Learning ← Machine Learning
prerequis("INF532", "MAT301").   % Machine Learning ← Probabilités
prerequis("INF452", "INF341").   % Réseaux avancés ← Réseaux

prerequis_transitif(X, Y) :- prerequis(X, Y).
prerequis_transitif(X, Y) :- prerequis(X, Z), prerequis_transitif(Z, Y).

tous_prerequis(UE, Prerequis) :-
    findall(P, prerequis_transitif(UE, P), Ps),
    sort(Ps, Prerequis).

% ── Recommandations ───────────────────────────────────────────────────────────
meme_ue(Doc1, Doc2) :-
    document_ue(Doc1, UE),
    document_ue(Doc2, UE),
    Doc1 \= Doc2.

% document_ue/2 sera alimenté dynamiquement via assert
:- dynamic document_ue/2.

recommander(DocId, Recommandations) :-
    findall(D, meme_ue(DocId, D), Ds),
    sort(Ds, Recommandations).

% ── Routes HTTP ───────────────────────────────────────────────────────────────
:- http_handler('/sante',         handle_sante,      []).
:- http_handler('/classifier',    handle_classifier, [method(post)]).
:- http_handler('/prerequis/',    handle_prerequis,  [prefix]).
:- http_handler('/recommander/',  handle_recommander, [prefix]).

handle_sante(_Request) :-
    reply_json_dict(_{status: "ok", moteur: "prolog"}).

handle_classifier(Request) :-
    http_read_json_dict(Request, Data),
    MotsCles = Data.mots_cles,
    classer_document(MotsCles, Thematiques),
    reply_json_dict(_{thematiques: Thematiques}).

handle_prerequis(Request) :-
    http_parameters(Request, [ue_code(UE, [])]),
    tous_prerequis(UE, Prerequis),
    reply_json_dict(_{ue_code: UE, prerequis: Prerequis}).

handle_recommander(Request) :-
    http_parameters(Request, [ressource_id(DocId, [])]),
    recommander(DocId, Recs),
    reply_json_dict(_{ressource_id: DocId, recommandations: Recs}).

:- server(8081).
server(Port) :-
    http_server(http_dispatch, [port(Port)]).
