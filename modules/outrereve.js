// Import from RdD System --> utilities & hooks
import { TMRUtility } from "/systems/foundryvtt-reve-de-dragon/module/tmr-utility.js";
import { RdDTMRDialog } from "/systems/foundryvtt-reve-de-dragon/module/rdd-tmr-dialog.js";
import { CarteTmr } from "/systems/foundryvtt-reve-de-dragon/module/tmr/carte-tmr.js";
import { EffetsDraconiques } from "/systems/foundryvtt-reve-de-dragon/module/tmr/effets-draconiques.js";
import { Draconique } from "/systems/foundryvtt-reve-de-dragon/module/tmr/draconique.js";
import { RdDActor } from "/systems/foundryvtt-reve-de-dragon/module/actor.js";
import { RdDTMRRencontreDialog } from "/systems/foundryvtt-reve-de-dragon/module/rdd-tmr-rencontre-dialog.js";

     /* gestion climat via rencontreItem (trop ambitieux du au data struct...) */
     // import { RdDRencontreItemSheet } from "/systems/foundryvtt-reve-de-dragon/module/item/sheet-rencontre.js";
     // import { EffetsRencontre } from "/systems/foundryvtt-reve-de-dragon/module/tmr/effets-rencontres.js";
     // import { RdDRencontre } from "/systems/foundryvtt-reve-de-dragon/module/item/rencontre.js";
     //   dans "init();"
     //        RdDRencontreCEF.init();
     //        await RdDItemSheet.register(CEFRencontreItemSheet)
     // import { RdDRencontreCEF } from "/modules/a-perte-de-reve/modules/rencontre-cef.js";
     // import { CEFRencontreItemSheet } from "/modules/a-perte-de-reve/modules/rencontre-cef.js";

// Import from OutreReve Module --> new classes
import "/modules/a-perte-de-reve/config/const-cef.js";
import { CarteCEF, cartesHR } from "/modules/a-perte-de-reve/modules/Carte-CEF.js";
import { RdDCEFDialog } from "/modules/a-perte-de-reve/modules/RdDCEFDialog.js";
import { OutreReveUtility } from "/modules/a-perte-de-reve/modules/outrereve-utility.js";
import { Arpenteur } from "/modules/a-perte-de-reve/modules/arpenteur.js";
import { CEFRencontres } from "/modules/a-perte-de-reve/modules/rencontre-cef.js";
import { ArpenteurUtility } from "/modules/a-perte-de-reve/modules/arpenteur-utility.js";


/*********************************
 **      INITIALIZATION         **
**********************************/
console.log(`OUTRE-REVE || Launching...`);

// CONFIG.debug.hooks = true;

Hooks.once("ready", function() {
     console.log("OUTRE-REVE || Initialization - REGISTERING Utilities");
     OutreReve.init();
});
 /** Hook pour l'ajout du "Don d'Arpentage" 
           *   [] gain de la competence "Arpentage"
           *   [] init des Flags "Arpentage" */
                                                  Hooks.on("createOwnedItem", function(...args){
                                                       console.log ("OUTRE-REVE || createOwnedItem", ...args);
                                                  });

/*****************************
 **      OUTRE-REVE         **
******************************/
export class OutreReve {
     // variable d'etat global
     static enCEF = false;

     // acces aux Classes
     static TMRUtility = TMRUtility;
     static cartesHR = cartesHR;
     static EffetsDraconiques = EffetsDraconiques;
     static CarteTmr = CarteTmr;
     static CarteCEF = CarteCEF;
     static RdDTMRDialog = RdDTMRDialog;
     static RdDCEFDialog = RdDCEFDialog;
     static Arpenteur = Arpenteur;
     static CEFRencontres = CEFRencontres;
     static RdDTMRRencontreDialog = RdDTMRRencontreDialog;
     static RdDActor = RdDActor;
     static ArpenteurUtility = ArpenteurUtility;
     // static RdDRencontreCEF = RdDRencontreCEF;
     // static RdDRencontreItemSheet = RdDRencontreItemSheet;
     // static CEFRencontreItemSheet = CEFRencontreItemSheet

     static async init(){
          console.log("OUTRE-REVE || Initialization - Ajout du module OutreReve");
          game.outreReve = OutreReve;
          game.outreReve.enCEF = false;
          OutreReve.initSettings();

          console.log("OUTRE-REVE || Initialization - REGISTERING TMR & CEF");
          Draconique.register(game.outreReve.cartesHR["TMR"]);
          Draconique.register(game.outreReve.cartesHR["CEF"]);
     
          console.log("OUTRE-REVE || Initialization - INITIALIZING Arpenteurs & Rencontres");
          CEFRencontres.init();
          CarteCEF.init();
          await Arpenteur.initAll();
     
          console.log("OUTRE-REVE || Initialization - REGISTERING Wrappers");
          await OutreReve.initWrapper();
     
          console.log("OUTRE-REVE || Initialization - PRELOADING HandleBars");
          OutreReve.preloadHandlebarsTemplates("CEF");
     }

     static initSettings(){
          // Create a custom config setting
          game.settings.register('a-perte-de-reve', 'fatigueImmediate', {
               name: 'Fatigue immédiate',
               hint: 'Encaissement immédiat de la fatigue en CEF.',
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: true,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Fatigue encaissée immédiatement" : "Fatigue cumulée jusque retour en TBR")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'reserveEnSecurite', {
               name: 'Réserve en Sécurité',
               hint: "Les sorts en réserve (en TMR) ne se declenchent pas automatiquement quand l'Arpenteur est en CEF.",
               scope: 'world',     
               config: true,       
               type: Boolean,      
               default: true,
               onChange: value => {
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Réserve en Sécurité dans la CEF" : "Déclanchement automatique des sorts en Réserve")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'climatManuel', {
               name: 'Gestion manuelle du Climat',
               hint: "Permet la gestion manuelle du changement de climat suite aux rencontres --> cliquer sur la macro dans les messages du tchat.",
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: false,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Climat géré manuellement" : "Climat géré automatiquement")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'basculeRencontre', {       // N/A
               name: 'Rencontre lors des Transitions',
               hint: 'Force un jet de Rencontre à chaque transition entre TMR<->CEF. NOT FUNCITONAL YET !!!!',
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: false,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Transition TMR<->CEF avec Jet de Rencontre" : "Transition TMR<->CEF sans jet de Rencontre")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'basculeFatigue', {
               name: 'Fatigue lors des Transitions',
               hint: "Prise de Fatigue à chaque transition entre TMR<->CEF. (équivalent à un déplacement)",
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: false,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Transition TMR<->CEF avec prise de Fatigue" : "Transition TMR<->CEF sans prise de Fatigue")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'rencontreManuelle', {
               name: 'Possibilité de Maitrise manuelle des Rencontres',
               hint: `Le dialogue de Rencontre propose l'option de gerer manuellement la maitrise de la rencontre.`,
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: true,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Log des probabilité de Recontre (case et climat)" : "Pas de Log des probabilité de Recontre")
               },
               requiresReload: false, 
          });
          game.settings.register('a-perte-de-reve', 'logRencontres', {
               name: 'Log des Rencontres possibles',
               hint: 'Affiche les probabiliés de rencontre, selon Climat et type de case, dans le tchat.',
               scope: 'world',     
               config: true,       
               type: Boolean,       
               default: false,
               onChange: value => { 
                    console.log(`OUTRE-REVE CONFIG ||`, value ? "Log des probabilité de Recontre (case et climat)" : "Pas de Log des probabilité de Recontre")
               },
               requiresReload: false, 
          });
          // choices: { 1: "Option Label 1", 2: "Option Label 2" },
          // range: { min: 0, step: 2, max: 10 },     /** Number settings can have a range slider, with an optional step property */
          // filePicker: "any"                        /** "audio", "image", "video", "imagevideo", "folder", "font", "graphics", "text", or "any" */
     }

     static async initWrapper() {
          // Hook pour la creation du TMR-Dialog 
          await libWrapper.register('a-perte-de-reve', 'game.outreReve.RdDTMRDialog.create', async function (wrapped, ...args) {
               //console.log(`OUTRE-REVE || libWrapper() - RdDTMRDialog.create kicked in`, ...args);
               const result = await game.outreReve.RdDCEFDialog.create(...args);
               return result; // RdDTMRDialog --> RdDCEFDialog
          }, );
     // -----------
          // hook des TMRUtilities (pour mapping cases)
               await libWrapper.register('a-perte-de-reve', 'game.outreReve.TMRUtility.getTMRLabel', function (wrapped, ...args) {
                    //console.log(`OUTRE-REVE || libWrapper() - TMRUtility.getTMRLabel kicked in`, ...args);
                    if (game.outreReve.enCEF){ 
                         return game.outreReve.CarteCEF._getCEFLabel(...args);
                    } else { // TMR
                         return wrapped(...args);
               }
               }, );
               // await libWrapper.register('a-perte-de-reve', 'game.outreReve.TMRUtility.getTMRType', function (wrapped, ...args) {
               //      // console.log(`OUTRE-REVE || libWrapper() - "TMRUtility.getTMRLabel" kicked in`, ...args);
               //      // console.log(`OUTRE-REVE || ==>`, args);
               //      if (game.outreReve.enCEF){ 
               //           return game.outreReve.CarteCEF._getCEFType(...args);
               //      } else { // TMR
               //           return wrapped(...args);
               // }
               // }, );
               await libWrapper.register('a-perte-de-reve', 'game.outreReve.TMRUtility.typeTmrName', function (wrapped, ...args) {
                    console.log(`OUTRE-REVE || libWrapper() - TMRUtility.typeTmrName() kicked in`, ...args);
                    if (game.outreReve.enCEF){ 
                         return game.outreReve.CarteCEF._typeCEFName(...args);
                    } else { // TMR
                         return wrapped(...args);
               }
               }, );
     // -----------
     };

 // -------------------------------------------------------------------------------------------------

     static preloadHandlebarsTemplates(carte = "CEF") {
          // from "rdd-utility.js" 
          // const templatePaths = [ list all the .hbs ]


          /** 
           *   ca marche pas vraiment...
          */
          Handlebars.unregisterHelper('caseTmr-label');
          Handlebars.unregisterHelper('caseTmr-type');
          Handlebars.unregisterHelper('typeTmr-name'); 
          Handlebars.unregisterHelper('effetRencontre-name');

          if (carte == "TMR"){
               Handlebars.registerHelper('caseTmr-label',        coord => TMRUtility.getTMRLabel(coord));
               Handlebars.registerHelper('caseTmr-type',         coord => TMRUtility.getTMRType(coord));
               Handlebars.registerHelper('typeTmr-name',         type => TMRUtility.typeTmrName(type)); 
               Handlebars.registerHelper('effetRencontre-name',  coord => TMRUtility.typeTmrName(coord));
          } else { // "CEF"
               Handlebars.registerHelper('caseTmr-label',        coord => CarteCEF._getCEFLabel(coord));
               Handlebars.registerHelper('caseTmr-type',         coord => CarteCEF._getCEFType(coord));
               Handlebars.registerHelper('typeTmr-name',         type => CarteCEF._typeCEFName(type)); 
               Handlebars.registerHelper('effetRencontre-name',  coord => CarteCEF._typeCEFName(coord));
          }
          //loadTemplates(templatePaths);
     }
          // Register Sheets (rdd-main.js - line 203)
          //   [x] Sorts --> transcription + Synthese
          //   [x] Parchemin --> lecture + synthese
          // Items.registerSheet(SYSTEM_RDD, RdDItemSheet, {
          //      types: [
          //        "competence", "competencecreature",
          //        "recettealchimique", "musique", "chant", "danse", "jeu", "race",
          //        "recettecuisine", "oeuvre", "meditation",
          //        "queue", "ombre", "souffle", "tete", "casetmr", "sort", "sortreserve",
          //        "nombreastral", "tache", "maladie", "poison", "possession",
          //        "tarot", "extraitpoetique", "empoignade"
          //      ],
          //      makeDefault: true
          // })
          /** from rdd-main.js        
          RdDItemSheet.register(RdDRencontreItemSheet)
          */
}