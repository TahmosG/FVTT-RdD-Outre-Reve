import { TMRUtility } from "/systems/foundryvtt-reve-de-dragon/module/tmr-utility.js";
import { Misc } from "/systems/foundryvtt-reve-de-dragon/module/misc.js";
import { CarteTmr } from "/systems/foundryvtt-reve-de-dragon/module/tmr/carte-tmr.js";
import { Grammar } from "/systems/foundryvtt-reve-de-dragon/module/grammar.js";

import { CEFRencontres } from "/modules/a-perte-de-reve/modules/rencontre-cef.js";
import { OutreReveUtility } from "/modules/a-perte-de-reve/modules/outrereve-utility.js";
import { OutreReve } from "/modules/a-perte-de-reve/modules/outrereve.js";

/** TO DO
 *  [] FIX lecture de Signe Draco en CEF --> pblm de type/name de case
 */

export class CarteCEF extends CarteTmr {
    img()  { return RDD_CEF.Image;  }
    code() { return 'cef' }

    static init(){
        // mise a jour des info Terrain de la Carte
        // game.outreReve.TMRUtility.getTMRLabel = game.outreReve.CarteCEF._getCEFLabel;
        // game.outreReve.TMRUtility.getTMRType = game.outreReve.CarteCEF._getCEFType;
        // game.outreReve.TMRUtility.typeTMRName = game.outreReve.CarteCEF._typeCEFName
    }
    
    static rencontreSelonClimat(arpenteur){
        let clim = 0; // 0 : TMR = rencontre sur 7
        if (arpenteur.getFlag(`a-perte-de-reve`, `Imago`) == true) {
            clim = arpenteur.getFlag(`a-perte-de-reve`, `Climat`);
            //ui.notifications.info(`OUTRE-REVE || ${RDD_CEF.Climat[clim].label} Rencontre sur ${RDD_CEF.Climat[clim].jetRencontre}`);
        } else {
            //ui.notifications.info(`OUTRE-REVE || ${arpenteur.name} n'est pas en Imago, Rencontre TMR sur '7'`);
        }
        return RDD_CEF.Climat[clim]; 
    }
    static async ajusteClimat(arpenteur, mod){
        await arpenteur.ajusteClimat(mod);
    }
    
    static _getCEF(coord) {
        //console.log("Coord=",coord, " ; type=", CEFMap[coord].type);
        if (OutreReve.enCEF){ 
            return coord == FLEUVE_COORD ? CEFMap['D1'] : CEFMap[coord];
        } else { 
            return TMRUtility.getTMR(coord);
        }
    }
    static _getCEFLabel(coord) {
        //console.log("Coord=",coord, " ; type=", CEFMap[coord].type);
        return CarteCEF._getCEF(coord)?.label ?? (coord + ": case inconnue");

        // version conditionelle
        if (OutreReve.enCEF){ 
            return CarteCEF._getCEF(coord)?.label ?? (coord + ": case inconnue");
        } else { 
            return TMRUtility.getTMRLabel(coord);
        }
    } 
    static _getCEFType(coord) {
        const cef = CarteCEF._getCEF(coord);
        // console.log(`_getCEFType - Coord= ${coord} ; type= ${CEFMap[coord].type} name= ${CEFType[cef.type].name}`);
        return Misc.upperFirst(CEFType[cef.type].name);

        // version conditionelle
        if (OutreReve.enCEF){         
            const cef = CarteCEF._getCEF(coord);
            // console.log(`_getCEFType - Coord= ${coord} ; type= ${CEFMap[coord].type} name= ${CEFType[cef.type].name}`);
            return Misc.upperFirst(CEFType[cef.type].name);
       } else { 
           return TMRUtility.getTMRType(coord);
       }
    }
    static _typeCEFName(type) {
        logCEF("_typeCEFName", type);
        return Misc.upperFirst(CEFType[Grammar.toLowerCaseNoAccent(type)].name);
    }
}

export const cartesHR = {
    TMR: new CarteTmr(),
    CEF: new CarteCEF()
}