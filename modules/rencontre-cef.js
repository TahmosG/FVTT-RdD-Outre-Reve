import { TMRRencontres } from "/systems/foundryvtt-reve-de-dragon/module/tmr-rencontres.js";
// import { EffetsRencontre } from "/systems/foundryvtt-reve-de-dragon/module/tmr/effets-rencontres.js";
import { CompendiumTable } from "/systems/foundryvtt-reve-de-dragon/module/settings/system-compendiums.js";
import { Misc } from "/systems/foundryvtt-reve-de-dragon/module/misc.js";
import { OutreReve } from "/modules/a-perte-de-reve/modules/outrereve.js";

/** TO DO
 *  [V] Liste de Rencontre pour CEF
 *  [V] Probabilite de Rencontre selon Climat (type de rencontre ignoree selon niveau)
 *  [V] Les Rencontre influent sur le CLimat 
 *  [V] Possibilite de gerer manuellement les changement du Climat
 *  [V] Possibilite de gerer manuellement la resolution des Rencontres
 *  [V] Afficher l'effet sur le climat dans le dialog
 *  [] Afficher l'effet de la rencontre dans le dialog
 */
export class CEFRencontres extends TMRRencontres {
  static TableRencontre = { };

  static init() {
    CEFRencontres.TableRencontre = { // .table pour acceder a la table en elle-même
      TMR : new TMRRencontres(), //CEFRencontres('rencontres'),
      CEF : new CEFRencontres(`a-perte-de-reve.rencontres-cef`)
    };
    this.setTableRencontre();
  }

  constructor(compendium) {
    super();
    this.table = new CompendiumTable(compendium, 'Item', 'rencontre', Misc.ascending(it => it.system.ordreTri));
  }

  static setTableRencontre(carte = "TMR", acteur){
    game.system.rdd.rencontresTMR = this.TableRencontre[carte];
    CEFRencontres.arpenteurActif = acteur;
    // logCEF(`OUTRE-REVE || Rencontres sur la table ${carte} :`, game.system.rdd.rencontresTMR);
  }

  async getRencontreAleatoire(tmr, mauvaise) {
    //le niveau minimum de la rencontre, selon le climat
    let niveauMin = CEFRencontres.arpenteurActif.CEF.rencontreMin();
    const codeTerrain = mauvaise ? 'mauvaise' : tmr.type;
    // setup des filtres (terrain, frequence, niveauMin)
    const filtre = codeTerrain == 'mauvaise' ? it => it.system.mauvaiseRencontre : it => !it.system.mauvaiseRencontre && (it.system.ordreTri >= niveauMin ) ;
    const frequence = it => it.system.frequence[codeTerrain];
    // Affiche les Rencontres potentielles dans le tchat
    if (game.settings.get("a-perte-de-reve", "logRencontres")){
      this.table.toChatMessage(frequence, filtre); 
    }
    // Tirer la rencontre (selon les filtres)
    const row = await this.table.getRandom(frequence, filtre);

    // Appliquer les effets
    if (row) {
      const rencontre = await this.createRencontre(row.document, tmr);
      await this.$chatRolledRencontre(row, rencontre, tmr);
      return rencontre;
    }
    return undefined;
  }

  static async EffetsImmediatRencontre(arpenteur, rencontre){
    // console.log(`OUTRE-REVE || EffetsRencontreCEF - ${arpenteur.name} fait une rencontre en CEF :`, rencontre);
    let mod = undefined;
    switch (rencontre.system.ordreTri) {
        case  1 : mod = -3; break;
        case  2 : mod = -2; break;
        case  3 : mod = -1; break;
        case  4 : mod = -1; break;
        case  5 :           break;
        case  6 : mod = 0;  break;
        case  7 : mod = 1;  break;
        case  8 : mod = 1;  break;
        case  9 : mod = 2;  break;
        case 10 : mod = 3;  break;
    }
    CEFRencontres.msgRencontreClimat(mod, rencontre)
    if (game.settings.get("a-perte-de-reve", "climatManuel")) {
        ui.notifications.warn(`Gestion manuelle du CLIMAT. Cliquer sur l'Effet dans le tchat.`); 
        return;           
    }
    await arpenteur.CEF.ajusteClimat(mod);
  }
  
  static msgRencontreClimat(mod, rencontre){
    logCEF(`EffetsRencontreCEF : Climat`, mod == 0 ? "aléatoire" : (mod > 0 ? `+${mod}` : mod));
    rencontre.msgClimat = `Vous rencontrez un ${rencontre.name} de force ${rencontre.system.force}.<br>`;
    if (mod > 0){
       rencontre.msgClimat = `<i>De menacants nuages viennent assombrir un Fleuve en colère... (Climat +${mod})</i> 
                            <br><br>Un <b>${rencontre.name} de force ${rencontre.system.force}</b> apparait soudainement.<br>`;
    } else if (mod < 0){
        rencontre.msgClimat = `<i>Une légère brise dissipe les éffluves fluviales, révélant une silhouette lointaine. (Climat ${mod})</i> 
                            <br><br>Un <b>${rencontre.name} de force ${rencontre.system.force}</b> s'approche.<br>`;
    } else if (mod == undefined ){
      rencontre.msgClimat = `<i>Le climat reste stationaire mais une presence se fait resentir.</i> 
                           <br><br>Une <b>${rencontre.name} de force ${rencontre.system.force}</b> s'abat sur vous.<br>`;
   } else {
        rencontre.msgClimat = `<i>Le climat change aléatoirement.</i> 
                             <br><br>Une <b>${rencontre.name} de force ${rencontre.system.force}</b> émerge des eaux.<br>`;
    }
  }
}