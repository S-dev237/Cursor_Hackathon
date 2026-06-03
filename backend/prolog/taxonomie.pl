% =============================================================================
% taxonomie.pl — Base de connaissances pour l'organisation multi-vues
% -----------------------------------------------------------------------------
% Prolog ne gère PAS les documents eux-mêmes : il gère la création automatique
% de structures de classement et de navigation à partir des connaissances
% extraites des documents (mots-clés, année, auteurs, laboratoire…).
%
% Ce fichier est la représentation canonique des règles. Le moteur Python
% `MoteurOrganisationProlog` (infrastructure/adapters) implémente exactement
% la même sémantique afin que la fonctionnalité reste exécutable sans serveur
% SWI-Prolog externe (cf. PrologAdapter HTTP qui reste disponible par ailleurs).
% =============================================================================

% -----------------------------------------------------------------------------
% 1. Métadonnées des catégories  categorie_meta(Code, Axe, Libelle)
%    Axe ∈ { discipline, domaine }
% -----------------------------------------------------------------------------
categorie_meta(informatique,            discipline, 'Informatique').
categorie_meta(intelligence_artificielle, discipline, 'Intelligence Artificielle').
categorie_meta(machine_learning,        discipline, 'Machine Learning').
categorie_meta(deep_learning,           discipline, 'Deep Learning').
categorie_meta(reseaux_neurones,        discipline, 'Réseaux de neurones').
categorie_meta(cnn,                     discipline, 'Réseaux convolutifs (CNN)').
categorie_meta(nlp,                     discipline, 'Traitement du langage (NLP)').
categorie_meta(vision_par_ordinateur,   discipline, 'Vision par ordinateur').
categorie_meta(data_science,            discipline, 'Data Science').
categorie_meta(big_data,                discipline, 'Big Data').
categorie_meta(securite_informatique,   discipline, 'Sécurité informatique').
categorie_meta(cryptographie,           discipline, 'Cryptographie').
categorie_meta(reseaux,                 discipline, 'Réseaux & télécoms').
categorie_meta(bases_de_donnees,        discipline, 'Bases de données').
categorie_meta(genie_logiciel,          discipline, 'Génie logiciel').

categorie_meta(sante,                   domaine, 'Santé').
categorie_meta(imagerie_medicale,       domaine, 'Imagerie médicale').
categorie_meta(oncologie,               domaine, 'Oncologie').
categorie_meta(agriculture,             domaine, 'Agriculture').
categorie_meta(finance,                 domaine, 'Finance').
categorie_meta(environnement,           domaine, 'Environnement').
categorie_meta(education,               domaine, 'Éducation').
categorie_meta(transport,               domaine, 'Transport').
categorie_meta(energie,                 domaine, 'Énergie').

% -----------------------------------------------------------------------------
% 2. Taxonomie dynamique  sous_domaine(Enfant, Parent)
% -----------------------------------------------------------------------------
sous_domaine(cnn,                    reseaux_neurones).
sous_domaine(reseaux_neurones,       deep_learning).
sous_domaine(deep_learning,          machine_learning).
sous_domaine(machine_learning,       intelligence_artificielle).
sous_domaine(nlp,                    intelligence_artificielle).
sous_domaine(vision_par_ordinateur,  intelligence_artificielle).
sous_domaine(intelligence_artificielle, informatique).
sous_domaine(data_science,           informatique).
sous_domaine(big_data,               data_science).
sous_domaine(securite_informatique,  informatique).
sous_domaine(cryptographie,          securite_informatique).
sous_domaine(reseaux,                informatique).
sous_domaine(bases_de_donnees,       informatique).
sous_domaine(genie_logiciel,         informatique).

sous_domaine(imagerie_medicale,      sante).
sous_domaine(oncologie,              sante).

% -----------------------------------------------------------------------------
% 3. Appartenance transitive  appartient(X, Z)
%    « Deep Learning » ⟹ Machine Learning ⟹ Intelligence Artificielle …
% -----------------------------------------------------------------------------
appartient(X, Y) :- sous_domaine(X, Y).
appartient(X, Z) :- sous_domaine(X, Y), appartient(Y, Z).

% -----------------------------------------------------------------------------
% 4. Faits déduits d'un document  motcle(Doc, MotCle)
%    (injectés dynamiquement à partir des métadonnées extraites par l'IA)
%    Exemple :
%       motcle(doc123, cnn).
%       motcle(doc123, oncologie).
% -----------------------------------------------------------------------------

% -----------------------------------------------------------------------------
% 5. Règle de catégorisation  categorie(Doc, Cat)
%    Un document appartient à la catégorie de chacun de ses mots-clés ET à
%    toutes les catégories ancêtres déduites par la taxonomie.
% -----------------------------------------------------------------------------
categorie(Doc, Cat) :- motcle(Doc, Cat).
categorie(Doc, Cat) :- motcle(Doc, M), appartient(M, Cat).

% Exemple de requête :
%   ?- categorie(doc123, X).
%   X = cnn ; X = reseaux_neurones ; X = deep_learning ;
%   X = machine_learning ; X = intelligence_artificielle ;
%   X = informatique ; X = oncologie ; X = sante.
